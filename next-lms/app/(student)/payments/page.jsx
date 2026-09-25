'use client';

import React from 'react';
import { useStudent } from '@/context/StudentContext';

export default function PaymentsPage() {
  const { payments, showToast } = useStudent();

  const totalPaid = payments.reduce((acc, curr) => acc + (curr.amount || 0), 0);

  const handleDownloadReceipt = (payment) => {
    showToast(`Downloading official invoice receipt for ${payment.id} (PDF)...`, 'info');
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-brand-border/60 dark:border-brand-darkBorder/60">
        <div>
          <h1 className="text-2xl font-bold text-brand-text dark:text-white tracking-tight">
            Billing & Invoices
          </h1>
          <p className="text-sm text-brand-muted dark:text-brand-darkText/70 mt-1">
            Review your course enrollments, payment receipts, and billing history.
          </p>
        </div>

        {/* Total Paid Summary Card */}
        <div className="p-3 px-5 rounded-xl bg-white dark:bg-brand-darkSoft border border-brand-border dark:border-brand-darkBorder shadow-xs self-start sm:self-center">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-brand-muted dark:text-brand-darkText/60 block">
            Total Investments
          </span>
          <span className="text-xl font-bold text-brand-navy dark:text-white">
            Rs. {totalPaid.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Payments Table */}
      {payments.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-brand-darkSoft rounded-[14px] border border-brand-border dark:border-brand-darkBorder">
          <p className="text-sm text-brand-muted dark:text-brand-darkText/70">
            No payment records found. Free courses and pending invoices will appear here once processed.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-[14px] border border-brand-border dark:border-brand-darkBorder bg-white dark:bg-brand-darkSoft shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-brand-border dark:border-brand-darkBorder bg-brand-soft/60 dark:bg-brand-darkBg/50 text-xs font-semibold text-brand-muted dark:text-brand-darkText/70 uppercase tracking-wider">
                  <th scope="col" className="py-3.5 px-4 sm:px-6">Invoice ID</th>
                  <th scope="col" className="py-3.5 px-4">Course Description</th>
                  <th scope="col" className="py-3.5 px-4 hidden sm:table-cell">Date</th>
                  <th scope="col" className="py-3.5 px-4 hidden md:table-cell">Method</th>
                  <th scope="col" className="py-3.5 px-4 text-right">Amount</th>
                  <th scope="col" className="py-3.5 px-4 text-center">Status</th>
                  <th scope="col" className="py-3.5 px-4 sm:px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border dark:divide-brand-darkBorder text-brand-text dark:text-brand-darkText">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-brand-soft/30 dark:hover:bg-brand-darkBg/30 transition-colors">
                    <td className="py-4 px-4 sm:px-6 font-mono text-xs font-semibold text-brand-navy dark:text-white">
                      {p.id}
                    </td>
                    <td className="py-4 px-4 font-semibold text-brand-text dark:text-white">
                      {p.courseTitle}
                    </td>
                    <td className="py-4 px-4 hidden sm:table-cell text-xs text-brand-muted dark:text-brand-darkText/70">
                      {p.date}
                    </td>
                    <td className="py-4 px-4 hidden md:table-cell text-xs text-brand-muted dark:text-brand-darkText/70">
                      {p.method}
                    </td>
                    <td className="py-4 px-4 text-right font-bold text-brand-navy dark:text-white">
                      Rs. {p.amount.toLocaleString()}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-success/15 text-brand-success">
                        {p.status || 'Paid'}
                      </span>
                    </td>
                    <td className="py-4 px-4 sm:px-6 text-right">
                      <button
                        type="button"
                        onClick={() => handleDownloadReceipt(p)}
                        className="px-3 py-1.5 rounded-[8px] bg-brand-soft dark:bg-brand-darkBg hover:bg-brand-navy hover:text-white border border-brand-border dark:border-brand-darkBorder text-xs font-semibold transition-colors inline-flex items-center gap-1.5"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span>Receipt</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
