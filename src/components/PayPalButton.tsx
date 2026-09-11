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
    <footer className="support-card">
      <h3 className="support-card__title">
        <span aria-hidden="true">☕</span>
        <span>Buy Me a Coffee</span>
      </h3>
      <p className="support-card__text">
        If this beach safety tool has been helpful, consider supporting its
        development! Your contribution helps keep this service free and up-to-date.
      </p>

      <button className="support-card__button" onClick={handleDonateClick}>
        <span className="heart">❤️</span>
        <span>Donate with PayPal</span>
      </button>

      <span className="support-card__caption">
        Secure payment powered by PayPal
      </span>
    </footer>
  );
};

export default PayPalButton;