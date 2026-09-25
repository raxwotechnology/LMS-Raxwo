import React from 'react';
import { useStudent } from '../../context/StudentContext';

export default function PaymentsPage() {
  const { payments, showToast } = useStudent();

  const totalPaid = payments.reduce((acc, curr) => acc + (curr.amount || 0), 0);

  const handleDownloadReceipt = (payment) => {
    showToast(`Downloading official invoice receipt for ${payment.id} (PDF)...`, 'info');
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-brand-border/60">
        <div>
          <h1 className="text-2xl font-bold text-brand-text tracking-tight">
            Billing & Invoices
          </h1>
          <p className="text-sm text-brand-muted mt-1">
            Review your course enrollments, payment receipts, and billing history.
          </p>
        </div>

        <div className="p-3 px-5 rounded-[14px] bg-white border border-brand-border shadow-card self-start sm:self-center">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-brand-muted block">
            Total Investments
          </span>
          <span className="text-xl font-bold text-brand-navy">
            Rs. {totalPaid.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Payments Table */}
      {payments.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-[14px] border border-brand-border shadow-card">
          <p className="text-sm text-brand-muted">
            No payment records found. Free courses and pending invoices will appear here once processed.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-[14px] border border-brand-border bg-white shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-brand-border bg-brand-soft/60 text-xs font-semibold text-brand-muted uppercase tracking-wider">
                  <th scope="col" className="py-3.5 px-4 sm:px-6">Invoice ID</th>
                  <th scope="col" className="py-3.5 px-4">Course Description</th>
                  <th scope="col" className="py-3.5 px-4 hidden sm:table-cell">Date</th>
                  <th scope="col" className="py-3.5 px-4 hidden md:table-cell">Method</th>
                  <th scope="col" className="py-3.5 px-4 text-right">Amount</th>
                  <th scope="col" className="py-3.5 px-4 text-center">Status</th>
                  <th scope="col" className="py-3.5 px-4 sm:px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border text-brand-text">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-brand-soft/40 transition-colors">
                    <td className="py-4 px-4 sm:px-6 font-mono text-xs font-semibold text-brand-navy">
                      {p.id}
                    </td>
                    <td className="py-4 px-4 font-semibold text-brand-text">
                      {p.courseTitle}
                    </td>
                    <td className="py-4 px-4 hidden sm:table-cell text-xs text-brand-muted">
                      {p.date}
                    </td>
                    <td className="py-4 px-4 hidden md:table-cell text-xs text-brand-muted">
                      {p.method}
                    </td>
                    <td className="py-4 px-4 text-right font-bold text-brand-navy">
                      Rs. {p.amount.toLocaleString()}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-success/15 text-brand-success border border-brand-success/30">
                        {p.status || 'Paid'}
                      </span>
                    </td>
                    <td className="py-4 px-4 sm:px-6 text-right">
                      <button
                        type="button"
                        onClick={() => handleDownloadReceipt(p)}
                        className="px-3 py-1.5 rounded-full bg-brand-soft hover:bg-brand-navy hover:text-white text-brand-text text-xs font-semibold transition-colors inline-flex items-center gap-1.5"
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
