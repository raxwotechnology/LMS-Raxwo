import React from 'react';
import './PaymentMonthPicker.css';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

/**
 * PaymentMonthPicker
 * Modern multi-select pill/chip component for selecting payment months.
 *
 * @param {Array<string>} selectedMonths - Currently selected months (controlled state)
 * @param {Function} onChange - Callback invoked with new selected months array: (newMonths) => void
 * @param {number|string} monthlyFee - Current monthly fee used to compute live total
 * @param {string} currency - Currency label (defaults to 'LKR')
 * @param {boolean} disabled - Whether interactions are disabled
 * @param {string} className - Optional container class name
 */
const PaymentMonthPicker = ({
  selectedMonths = [],
  onChange,
  monthlyFee = 0,
  currency = 'LKR',
  disabled = false,
  className = ''
}) => {
  const numericFee = Math.max(0, parseFloat(monthlyFee) || 0);
  const totalAmount = Math.round(numericFee * selectedMonths.length * 100) / 100;

  const handleToggle = (month) => {
    if (disabled) return;
    const isSelected = selectedMonths.includes(month);
    let updated;
    if (isSelected) {
      updated = selectedMonths.filter((m) => m !== month);
    } else {
      updated = [...selectedMonths, month];
    }
    onChange?.(updated);
  };

  const handleSelectAll = () => {
    if (disabled) return;
    onChange?.([...MONTHS]);
  };

  const handleClear = () => {
    if (disabled) return;
    onChange?.([]);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  return (
    <div className={`payment-month-picker ${className}`}>
      {/* Quick Action Toolbar */}
      <div className="month-picker-toolbar">
        <span className="month-picker-label">Select Month(s)</span>
        <div className="month-picker-actions">
          <button
            type="button"
            className="month-toolbar-btn"
            onClick={handleSelectAll}
            disabled={disabled || selectedMonths.length === MONTHS.length}
            title="Select all 12 months"
          >
            Select all
          </button>
          <button
            type="button"
            className="month-toolbar-btn"
            onClick={handleClear}
            disabled={disabled || selectedMonths.length === 0}
            title="Clear selected months"
          >
            Clear
          </button>
        </div>
      </div>

      {/* 3-Column (Desktop) / 2-Column (Mobile) Multi-Select Chips Grid */}
      <div className="month-chips-grid" role="group" aria-label="Payment months multi-select">
        {MONTHS.map((month) => {
          const isSelected = selectedMonths.includes(month);
          return (
            <button
              key={month}
              type="button"
              className={`month-chip-btn ${isSelected ? 'selected' : ''}`}
              onClick={() => handleToggle(month)}
              disabled={disabled}
              aria-pressed={isSelected}
            >
              <span className="chip-indicator">
                {isSelected ? (
                  <svg
                    className="chip-check-icon"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <span className="chip-empty-dot" />
                )}
              </span>
              <span className="chip-text">{month}</span>
            </button>
          );
        })}
      </div>

      {/* Footer Row (separated by dashed top border) */}
      <div className="month-picker-footer">
        <div className="month-picker-count">
          <span className="count-badge">{selectedMonths.length}</span>{' '}
          {selectedMonths.length === 1 ? 'month' : 'month(s)'} selected
        </div>
        <div className="month-picker-total">
          <span className="total-label">Total:</span>{' '}
          <strong className="total-amount">
            {currency} {formatCurrency(totalAmount)}
          </strong>
        </div>
      </div>
    </div>
  );
};

export default PaymentMonthPicker;
