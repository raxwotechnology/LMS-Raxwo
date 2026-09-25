'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useStudent } from '@/context/StudentContext';

export default function CheckoutModal({ isOpen, onClose, course }) {
  const router = useRouter();
  const { processPaymentAndEnroll } = useStudent();

  const [formData, setFormData] = useState({
    nameOnCard: '',
    cardNumber: '',
    expiry: '',
    cvv: '',
  });

  const [errors, setErrors] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [receipt, setReceipt] = useState(null);

  const modalRef = useRef(null);
  const firstInputRef = useRef(null);

  // Close on Escape key & trap focus
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    // Focus first field on open
    setTimeout(() => {
      firstInputRef.current?.focus();
    }, 100);

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !course) return null;

  // Auto-format card number into groups of 4: "#### #### #### ####"
  const handleCardNumberChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 16);
    const formatted = raw.match(/.{1,4}/g)?.join(' ') || raw;
    setFormData((prev) => ({ ...prev, cardNumber: formatted }));
    if (errors.cardNumber) setErrors((prev) => ({ ...prev, cardNumber: null }));
  };

  // Auto-format expiry to MM/YY
  const handleExpiryChange = (e) => {
    let raw = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (raw.length >= 3) {
      raw = raw.slice(0, 2) + '/' + raw.slice(2);
    }
    setFormData((prev) => ({ ...prev, expiry: raw }));
    if (errors.expiry) setErrors((prev) => ({ ...prev, expiry: null }));
  };

  const handleCvvChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 4);
    setFormData((prev) => ({ ...prev, cvv: raw }));
    if (errors.cvv) setErrors((prev) => ({ ...prev, cvv: null }));
  };

  const handleNameChange = (e) => {
    setFormData((prev) => ({ ...prev, nameOnCard: e.target.value }));
    if (errors.nameOnCard) setErrors((prev) => ({ ...prev, nameOnCard: null }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.nameOnCard.trim()) {
      newErrors.nameOnCard = 'Name on card is required';
    }

    const cleanNumber = formData.cardNumber.replace(/\s+/g, '');
    if (cleanNumber.length < 16) {
      newErrors.cardNumber = 'Enter a valid 16-digit card number';
    }

    if (!formData.expiry || formData.expiry.length < 5) {
      newErrors.expiry = 'Valid MM/YY required';
    }

    if (!formData.cvv || formData.cvv.length < 3) {
      newErrors.cvv = 'Valid CVV required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsProcessing(true);

    // Simulate payment processing delay (600ms)
    setTimeout(async () => {
      const generatedReceipt = await processPaymentAndEnroll(course.id, formData);
      setReceipt(generatedReceipt);
      setIsProcessing(false);
      setIsSuccess(true);
    }, 600);
  };

  const handleStartLearning = () => {
    onClose();
    router.push(`/courses/${course.id}`);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="checkout-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        className="w-full max-w-md bg-white dark:bg-brand-darkSoft border border-brand-border dark:border-brand-darkBorder rounded-2xl shadow-2xl overflow-hidden p-6 animate-scaleUp"
      >
        {isSuccess ? (
          /* Payment Successful View */
          <div className="text-center py-4">
            <div className="w-16 h-16 rounded-full bg-brand-success/15 text-brand-success mx-auto flex items-center justify-center mb-4">
              <svg className="w-9 h-9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>

            <h3 id="checkout-title" className="text-xl font-bold text-brand-text dark:text-brand-darkText mb-1">
              Payment Successful!
            </h3>
            <p className="text-xs text-brand-muted dark:text-brand-darkText/70 mb-4">
              Your enrollment in <span className="font-semibold text-brand-text dark:text-white">{course.title}</span> is confirmed.
            </p>

            {receipt && (
              <div className="bg-brand-soft dark:bg-brand-darkBg/60 p-4 rounded-xl text-left text-xs mb-6 border border-brand-border dark:border-brand-darkBorder space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-brand-muted">Invoice No:</span>
                  <span className="font-bold text-brand-navy dark:text-brand-focus">{receipt.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-brand-muted">Amount Paid:</span>
                  <span className="font-bold text-brand-text dark:text-white">Rs. {receipt.amount?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-brand-muted">Payment Method:</span>
                  <span className="text-brand-text dark:text-white">Card ({receipt.maskedCard})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-brand-muted">Date:</span>
                  <span className="text-brand-text dark:text-white">{receipt.date}</span>
                </div>
              </div>
            )}

            <button
              onClick={handleStartLearning}
              className="w-full py-3 px-4 rounded-[10px] bg-brand-navy hover:bg-brand-navyHover text-white text-sm font-semibold transition-all shadow-md"
            >
              Start Learning Now
            </button>
          </div>
        ) : (
          /* Checkout Form View */
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-brand-border dark:border-brand-darkBorder mb-4">
              <h3 id="checkout-title" className="text-base font-bold text-brand-text dark:text-brand-darkText">
                Course Enrollment Checkout
              </h3>
              <button
                onClick={onClose}
                aria-label="Close modal"
                className="text-brand-muted hover:text-brand-text dark:hover:text-white p-1 rounded-md"
              >
                ✕
              </button>
            </div>

            {/* Order Summary */}
            <div className="bg-brand-soft/70 dark:bg-brand-darkBg/50 p-3.5 rounded-xl border border-brand-border dark:border-brand-darkBorder mb-4 text-xs">
              <div className="flex justify-between items-start mb-1">
                <div>
                  <h4 className="font-bold text-brand-text dark:text-white text-sm">{course.title}</h4>
                  <p className="text-brand-muted text-[11px]">Instructor: {course.teacher.name}</p>
                </div>
                <span className="font-bold text-sm text-brand-navy dark:text-brand-focus">
                  Rs. {course.price?.toLocaleString()}
                </span>
              </div>
              <div className="pt-2 mt-2 border-t border-brand-border/60 dark:border-brand-darkBorder/60 flex justify-between font-bold text-brand-text dark:text-white">
                <span>Total Due:</span>
                <span>Rs. {course.price?.toLocaleString()}</span>
              </div>
            </div>

            {/* Demo Notice */}
            <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-[11px] mb-4">
              ℹ️ <strong>Demo only:</strong> No real payment is taken. Test with any 16-digit card number.
            </div>

            <form onSubmit={handleSubmit} className="space-y-3" noValidate>
              {/* Name on Card */}
              <div>
                <label className="block text-xs font-semibold text-brand-text dark:text-brand-darkText mb-1">
                  Name on Card
                </label>
                <input
                  ref={firstInputRef}
                  type="text"
                  placeholder="Kasun Perera"
                  value={formData.nameOnCard}
                  onChange={handleNameChange}
                  className="w-full rounded-[10px] border-[1.5px] border-brand-border dark:border-brand-darkBorder py-2.5 px-3 text-xs bg-white dark:bg-brand-darkBg text-brand-text dark:text-white focus:border-brand-focus focus:ring-4 focus:ring-brand-focus/20 outline-none transition-all"
                />
                {errors.nameOnCard && (
                  <p role="alert" className="text-[11px] text-brand-error mt-1">
                    {errors.nameOnCard}
                  </p>
                )}
              </div>

              {/* Card Number */}
              <div>
                <label className="block text-xs font-semibold text-brand-text dark:text-brand-darkText mb-1">
                  Card Number
                </label>
                <input
                  type="text"
                  placeholder="4242 •••• •••• 4242"
                  value={formData.cardNumber}
                  onChange={handleCardNumberChange}
                  className="w-full rounded-[10px] border-[1.5px] border-brand-border dark:border-brand-darkBorder py-2.5 px-3 text-xs bg-white dark:bg-brand-darkBg text-brand-text dark:text-white focus:border-brand-focus focus:ring-4 focus:ring-brand-focus/20 outline-none transition-all tracking-wider font-mono"
                />
                {errors.cardNumber && (
                  <p role="alert" className="text-[11px] text-brand-error mt-1">
                    {errors.cardNumber}
                  </p>
                )}
              </div>

              {/* Expiry & CVV Row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-brand-text dark:text-brand-darkText mb-1">
                    Expiry Date
                  </label>
                  <input
                    type="text"
                    placeholder="MM/YY"
                    value={formData.expiry}
                    onChange={handleExpiryChange}
                    className="w-full rounded-[10px] border-[1.5px] border-brand-border dark:border-brand-darkBorder py-2.5 px-3 text-xs bg-white dark:bg-brand-darkBg text-brand-text dark:text-white focus:border-brand-focus focus:ring-4 focus:ring-brand-focus/20 outline-none transition-all font-mono"
                  />
                  {errors.expiry && (
                    <p role="alert" className="text-[11px] text-brand-error mt-1">
                      {errors.expiry}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-brand-text dark:text-brand-darkText mb-1">
                    CVV / CVC
                  </label>
                  <input
                    type="password"
                    placeholder="•••"
                    maxLength={4}
                    value={formData.cvv}
                    onChange={handleCvvChange}
                    className="w-full rounded-[10px] border-[1.5px] border-brand-border dark:border-brand-darkBorder py-2.5 px-3 text-xs bg-white dark:bg-brand-darkBg text-brand-text dark:text-white focus:border-brand-focus focus:ring-4 focus:ring-brand-focus/20 outline-none transition-all font-mono"
                  />
                  {errors.cvv && (
                    <p role="alert" className="text-[11px] text-brand-error mt-1">
                      {errors.cvv}
                    </p>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isProcessing}
                className="w-full mt-2 py-3 px-4 rounded-[10px] bg-brand-navy hover:bg-brand-navyHover disabled:opacity-70 text-white text-xs font-semibold transition-all shadow-sm flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Processing Payment...</span>
                  </>
                ) : (
                  <span>Pay Rs. {course.price?.toLocaleString()} & Enroll</span>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
