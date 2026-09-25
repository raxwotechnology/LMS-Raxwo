import React from 'react';

export default function ResultsTable({ results = [] }) {
  if (!results || results.length === 0) {
    return (
      <div className="p-8 text-center bg-brand-soft rounded-[14px] border border-brand-border">
        <p className="text-sm text-brand-muted">
          No assessment results published yet. Complete quizzes and assignments to see your grades here.
        </p>
      </div>
    );
  }

  const totalScorePct = results.reduce((acc, curr) => acc + (curr.score / curr.maxScore) * 100, 0);
  const averagePct = Math.round(totalScorePct / results.length);

  const getGradeBadge = (percentage) => {
    if (percentage >= 75) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-success/15 text-brand-success border border-brand-success/30">
          Distinction ({percentage}%)
        </span>
      );
    }
    if (percentage >= 60) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-warning/15 text-brand-warning border border-brand-warning/30">
          Merit ({percentage}%)
        </span>
      );
    }
    if (percentage >= 40) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-focus/15 text-brand-focus border border-brand-focus/30">
          Pass ({percentage}%)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-error/15 text-brand-error border border-brand-error/30">
        Re-take ({percentage}%)
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-[14px] bg-brand-soft border border-brand-border shadow-card">
          <p className="text-xs font-medium uppercase tracking-wider text-brand-muted mb-1">
            Overall Average
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-brand-text">
              {averagePct}%
            </span>
            <span className="text-xs text-brand-success font-medium">Good Standing</span>
          </div>
        </div>

        <div className="p-5 rounded-[14px] bg-brand-soft border border-brand-border shadow-card">
          <p className="text-xs font-medium uppercase tracking-wider text-brand-muted mb-1">
            Assessments Taken
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-brand-text">
              {results.length}
            </span>
            <span className="text-xs text-brand-muted">Completed</span>
          </div>
        </div>

        <div className="p-5 rounded-[14px] bg-brand-soft border border-brand-border shadow-card">
          <p className="text-xs font-medium uppercase tracking-wider text-brand-muted mb-1">
            Highest Score
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-brand-navy">
              {Math.max(...results.map((r) => Math.round((r.score / r.maxScore) * 100)))}%
            </span>
            <span className="text-xs text-brand-success font-medium">Peak Grade</span>
          </div>
        </div>
      </div>

      {/* Results Table */}
      <div className="overflow-hidden rounded-[14px] border border-brand-border bg-white shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-brand-border bg-brand-soft/60 text-xs font-semibold text-brand-muted uppercase tracking-wider">
                <th scope="col" className="py-3.5 px-4 sm:px-6">Course / Assessment</th>
                <th scope="col" className="py-3.5 px-4 hidden sm:table-cell">Type</th>
                <th scope="col" className="py-3.5 px-4 hidden md:table-cell">Date</th>
                <th scope="col" className="py-3.5 px-4 text-center">Score</th>
                <th scope="col" className="py-3.5 px-4 sm:px-6 text-right">Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border text-brand-text">
              {results.map((item) => {
                const pct = Math.round((item.score / item.maxScore) * 100);
                return (
                  <tr key={item.id} className="hover:bg-brand-soft/40 transition-colors">
                    <td className="py-4 px-4 sm:px-6">
                      <div className="font-semibold text-brand-text">
                        {item.courseTitle}
                      </div>
                      <div className="text-xs text-brand-muted mt-0.5">
                        {item.title}
                      </div>
                    </td>
                    <td className="py-4 px-4 hidden sm:table-cell">
                      <span className="text-xs px-2.5 py-1 rounded-full bg-brand-soft border border-brand-border font-medium text-brand-text">
                        {item.type || 'Quiz'}
                      </span>
                    </td>
                    <td className="py-4 px-4 hidden md:table-cell text-xs text-brand-muted">
                      {item.date}
                    </td>
                    <td className="py-4 px-4 text-center font-medium">
                      {item.score} <span className="text-brand-muted text-xs">/ {item.maxScore}</span>
                    </td>
                    <td className="py-4 px-4 sm:px-6 text-right">
                      {getGradeBadge(pct)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
