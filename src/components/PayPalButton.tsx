import React from 'react';

interface PayPalButtonProps {
  amount?: string;
  currency?: string;
  description?: string;
}

const PayPalButton: React.FC<PayPalButtonProps> = ({
  amount = "5.00",
  currency = "USD",
  description = "Buy me a coffee ☕"
}) => {
  const handleDonateClick = () => {
    // Open PayPal.me link in a new tab
    window.open('https://paypal.me/DennisSchall?locale.x=en_AU&country.x=AU', '_blank');
  };

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
        style={{
          minHeight: '50px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}
      >
        <button
          onClick={handleDonateClick}
          style={{
            backgroundColor: '#0070ba',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '12px 24px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 8px rgba(0, 112, 186, 0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = '#005ea6';
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 12px rgba(0, 112, 186, 0.4)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = '#0070ba';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 112, 186, 0.3)';
          }}
        >
          💝 Donate with PayPal
        </button>
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