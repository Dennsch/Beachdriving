import React, { useEffect, useRef, useState } from 'react';

interface PayPalButtonProps {
  amount?: string;
  currency?: string;
  description?: string;
}

declare global {
  interface Window {
    paypal?: any;
  }
}

const PayPalButton: React.FC<PayPalButtonProps> = ({
  amount = "5.00",
  currency = "USD",
  description = "Buy me a coffee ☕"
}) => {
  const paypalRef = useRef<HTMLDivElement>(null);
  const scriptLoaded = useRef(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>("");

  const clientId = process.env.REACT_APP_PAYPAL_CLIENT_ID;

  useEffect(() => {
    // Check if PayPal client ID is configured
    if (!clientId || clientId === 'your-paypal-client-id-here' || clientId === 'test') {
      setError("PayPal client ID not configured");
      setIsLoading(false);
      return;
    }

    // Check if PayPal script is already loaded
    if (window.paypal && paypalRef.current) {
      renderPayPalButton();
      return;
    }

    // Load PayPal script if not already loaded
    if (!scriptLoaded.current) {
      const script = document.createElement('script');
      script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=${currency}&intent=capture`;
      script.async = true;
      script.onload = () => {
        scriptLoaded.current = true;
        if (paypalRef.current) {
          renderPayPalButton();
        }
      };
      script.onerror = () => {
        console.error('Failed to load PayPal SDK');
        setError("Failed to load PayPal SDK");
        setIsLoading(false);
      };
      document.body.appendChild(script);
    }

    return () => {
      // Cleanup: remove script if component unmounts
      const existingScript = document.querySelector('script[src*="paypal.com/sdk/js"]');
      if (existingScript && existingScript.parentNode) {
        existingScript.parentNode.removeChild(existingScript);
      }
    };
  }, [currency, clientId]);

  const renderPayPalButton = () => {
    if (!window.paypal || !paypalRef.current) return;

    // Clear any existing buttons
    if (paypalRef.current) {
      paypalRef.current.innerHTML = '';
    }

    setIsLoading(false);

    window.paypal.Buttons({
      createOrder: (data: any, actions: any) => {
        return actions.order.create({
          purchase_units: [{
            amount: {
              value: amount,
              currency_code: currency
            },
            description: description
          }]
        });
      },
      onApprove: async (data: any, actions: any) => {
        try {
          const details = await actions.order.capture();
          console.log('Payment completed successfully:', details);
          
          // Show success message
          alert(`Thank you for your support! ☕\nTransaction ID: ${details.id}`);
        } catch (error) {
          console.error('Payment capture failed:', error);
          alert('Payment processing failed. Please try again.');
        }
      },
      onError: (err: any) => {
        console.error('PayPal error:', err);
        alert('Payment failed. Please try again.');
      },
      onCancel: (data: any) => {
        console.log('Payment cancelled:', data);
        // User cancelled the payment
      },
      style: {
        layout: 'vertical',
        color: 'blue',
        shape: 'rect',
        label: 'donate',
        height: 40
      }
    }).render(paypalRef.current);
  };

  // Don't render the component if there's a configuration error
  if (error) {
    return (
      <div 
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          padding: '20px',
          borderRadius: '15px',
          textAlign: 'center',
          boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1)',
          marginTop: '30px',
          border: '2px solid #e74c3c',
        }}
      >
        <div style={{ marginBottom: '15px' }}>
          <h3 style={{ 
            color: '#e74c3c', 
            margin: '0 0 10px 0',
            fontSize: '1.2rem'
          }}>
            ☕ Support This App
          </h3>
          <p style={{ 
            color: '#7f8c8d', 
            margin: '0',
            fontSize: '14px',
            lineHeight: '1.5'
          }}>
            PayPal donation button is not configured yet.
            <br />
            <small>
              To enable donations, please configure your PayPal Client ID in the environment variables.
              <br />
              See the README.md for setup instructions.
            </small>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div 
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        padding: '25px',
        borderRadius: '15px',
        textAlign: 'center',
        boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1)',
        marginTop: '30px',
        border: '2px solid #f39c12',
      }}
    >
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ 
          color: '#2c3e50', 
          margin: '0 0 10px 0',
          fontSize: '1.4rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px'
        }}>
          ☕ Buy Me a Coffee
        </h3>
        <p style={{ 
          color: '#7f8c8d', 
          margin: '0 0 15px 0',
          fontSize: '14px',
          lineHeight: '1.5'
        }}>
          If this beach safety tool has been helpful, consider supporting its development!
          <br />
          Your contribution helps keep this service free and up-to-date.
        </p>
      </div>
      
      <div 
        ref={paypalRef}
        style={{
          minHeight: '50px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}
      >
        {/* PayPal button will be rendered here */}
        {isLoading && (
          <div style={{ 
            color: '#7f8c8d', 
            fontSize: '14px',
            fontStyle: 'italic'
          }}>
            Loading PayPal button...
          </div>
        )}
      </div>
      
      <div style={{ 
        marginTop: '15px',
        fontSize: '12px',
        color: '#95a5a6',
        fontStyle: 'italic'
      }}>
        Secure payment powered by PayPal
      </div>
    </div>
  );
};

export default PayPalButton;