import React from 'react';
import { Link } from 'react-router-dom';

export default function StatCard({ title, value, subtitle, icon, to }) {
  const content = (
    <div className="relative overflow-hidden rounded-[14px] bg-brand-soft border border-brand-border p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md group h-full">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-brand-muted mb-1">
            {title}
          </p>
          <h3 className="text-2xl sm:text-3xl font-bold text-brand-text tracking-tight font-poppins">
            {value}
          </h3>
          {subtitle && (
            <p className="text-xs text-brand-muted mt-1.5 flex items-center gap-1">
              <span>{subtitle}</span>
            </p>
          )}
        </div>

        {icon && (
          <div className="w-10 h-10 rounded-xl bg-brand-navy/10 text-brand-navy flex items-center justify-center shrink-0 transition-colors group-hover:bg-brand-navy group-hover:text-white">
            {icon}
          </div>
        )}
      </div>
    </div>
  );

  if (to) {
    return <Link to={to} className="block no-underline">{content}</Link>;
  }

  return content;
}
