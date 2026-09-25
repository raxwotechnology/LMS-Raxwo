import React from 'react';
import { useStudent } from '../../context/StudentContext';
import ResultsTable from '../../components/student/ResultsTable';

export default function ResultsPage() {
  const { results } = useStudent();

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="pb-2 border-b border-brand-border/60">
        <h1 className="text-2xl font-bold text-brand-text tracking-tight">
          Academic Results & Transcripts
        </h1>
        <p className="text-sm text-brand-muted mt-1">
          Review your grades, quiz scores, and academic progress across all enrolled subjects.
        </p>
      </div>

      <ResultsTable results={results} />
    </div>
  );
}
