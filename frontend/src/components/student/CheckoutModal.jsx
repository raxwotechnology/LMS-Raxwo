import React, { useState, useEffect, useRef } from 'react';

export default function CheckoutModal({ course, onClose, onSuccess }) {
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [nameOnCard, setNameOnCard] = useState('');
  const [errors, setErrors] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);

  const modalRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const formatCardNumber = (val) => {
    const digits = val.replace(/\D/g, '').slice(0, 16);
    const groups = digits.match(/.{1,4}/g);
    return groups ? groups.join(' ') : digits;
  };

  const formatExpiry = (val) => {
    const digits = val.replace(/\D/g, '').slice(0, 4);
    if (digits.length >= 3) {
      return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    }
    return digits;
  };

  const handleCardChange = (e) => {
    setCardNumber(formatCardNumber(e.target.value));
    if (errors.cardNumber) setErrors((prev) => ({ ...prev, cardNumber: null }));
  };

  const handleExpiryChange = (e) => {
    setExpiry(formatExpiry(e.target.value));
    if (errors.expiry) setErrors((prev) => ({ ...prev, expiry: null }));
  };

  const handleCvvChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 4);
    setCvv(val);
    if (errors.cvv) setErrors((prev) => ({ ...prev, cvv: null }));
  };

  const validate = () => {
    const errs = {};
    const cleanCard = cardNumber.replace(/\s+/g, '');
    if (cleanCard.length < 15) {
      errs.cardNumber = 'Enter a valid 16-digit card number';
    }
    if (expiry.length < 5) {
      errs.expiry = 'MM/YY required';
    } else {
      const [mm, yy] = expiry.split('/').map(Number);
      if (!mm || mm < 1 || mm > 12) errs.expiry = 'Invalid month (01-12)';
    }
    if (cvv.length < 3) {
      errs.cvv = '3-4 digits';
    }
    if (!nameOnCard.trim()) {
      errs.nameOnCard = 'Cardholder name required';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      onSuccess({
        cardNumber,
        expiry,
        nameOnCard,
      });
    }, 900);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-navy/60 backdrop-blur-sm animate-fadeIn"
    >
      <div
        ref={modalRef}
        className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-brand-border overflow-hidden p-6 sm:p-8 relative"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-5 right-5 p-2 rounded-lg text-brand-muted hover:text-brand-text hover:bg-brand-soft transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-success" />
            <span className="text-xs font-semibold uppercase tracking-wider text-brand-muted">
              Secure Checkout
            </span>
          </div>
          <h2 id="modal-title" className="text-xl font-bold text-brand-text">
            Enroll in {course?.title}
          </h2>
          <p className="text-xs text-brand-muted mt-1">
            Complete your enrollment payment via simulated card payment.
          </p>
        </div>

        {/* Order Summary */}
        <div className="p-4 rounded-xl bg-brand-soft border border-brand-border mb-6">
          <div className="flex justify-between items-center text-xs text-brand-muted mb-1.5">
            <span>Course Tuition Fee</span>
            <span className="font-semibold text-brand-text">
              Rs. {course?.price?.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between items-center text-xs text-brand-muted mb-2">
            <span>Certification & Access</span>
            <span className="text-brand-success font-medium">Included</span>
          </div>
          <div className="border-t border-brand-border/60 pt-2 flex justify-between items-center text-sm font-bold text-brand-navy">
            <span>Total Payable</span>
            <span className="text-base">Rs. {course?.price?.toLocaleString()}</span>
          </div>
        </div>

        {/* Payment Form */}
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-brand-text mb-1">
              Cardholder Full Name
            </label>
            <input
              type="text"
              value={nameOnCard}
              onChange={(e) => {
                setNameOnCard(e.target.value);
                if (errors.nameOnCard) setErrors((prev) => ({ ...prev, nameOnCard: null }));
              }}
              placeholder="e.g. Kasun Perera"
              className={`w-full rounded-[10px] border px-3.5 py-2.5 text-xs outline-none transition-all ${
                errors.nameOnCard
                  ? 'border-brand-error focus:ring-2 focus:ring-brand-error/20'
                  : 'border-brand-border focus:border-brand-focus focus:ring-2 focus:ring-brand-focus/20'
              }`}
            />
            {errors.nameOnCard && (
              <p className="text-[11px] text-brand-error font-medium mt-1">{errors.nameOnCard}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-brand-text mb-1">
              Card Number
            </label>
            <input
              type="text"
              value={cardNumber}
              onChange={handleCardChange}
              placeholder="4111 2222 3333 4444"
              className={`w-full rounded-[10px] border px-3.5 py-2.5 text-xs font-mono tracking-wider outline-none transition-all ${
                errors.cardNumber
                  ? 'border-brand-error focus:ring-2 focus:ring-brand-error/20'
                  : 'border-brand-border focus:border-brand-focus focus:ring-2 focus:ring-brand-focus/20'
              }`}
            />
            {errors.cardNumber && (
              <p className="text-[11px] text-brand-error font-medium mt-1">{errors.cardNumber}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-brand-text mb-1">
                Expiry (MM/YY)
              </label>
              <input
                type="text"
                value={expiry}
                onChange={handleExpiryChange}
                placeholder="09/27"
                className={`w-full rounded-[10px] border px-3.5 py-2.5 text-xs font-mono outline-none transition-all ${
                  errors.expiry
                    ? 'border-brand-error focus:ring-2 focus:ring-brand-error/20'
                    : 'border-brand-border focus:border-brand-focus focus:ring-2 focus:ring-brand-focus/20'
                }`}
              />
              {errors.expiry && (
                <p className="text-[11px] text-brand-error font-medium mt-1">{errors.expiry}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-brand-text mb-1">
                CVV / CVC
              </label>
              <input
                type="password"
                value={cvv}
                onChange={handleCvvChange}
                placeholder="•••"
                maxLength={4}
                className={`w-full rounded-[10px] border px-3.5 py-2.5 text-xs font-mono outline-none transition-all ${
                  errors.cvv
                    ? 'border-brand-error focus:ring-2 focus:ring-brand-error/20'
                    : 'border-brand-border focus:border-brand-focus focus:ring-2 focus:ring-brand-focus/20'
                }`}
              />
              {errors.cvv && (
                <p className="text-[11px] text-brand-error font-medium mt-1">{errors.cvv}</p>
              )}
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-brand-warning/10 border border-brand-warning/20 text-[11px] text-brand-warning font-medium flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <span>Demo Mode: Real card details are not charged. Only last 4 digits are saved.</span>
          </div>

          <button
            type="submit"
            disabled={isProcessing}
            className="w-full py-3 px-4 rounded-full bg-brand-navy hover:bg-brand-navyHover disabled:opacity-70 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-md mt-2"
          >
            {isProcessing ? 'Processing Payment...' : `Pay Rs. ${course?.price?.toLocaleString()}`}
          </button>
        </form>
      </div>
    </div>
  );
}
