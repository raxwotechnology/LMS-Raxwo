import React from 'react';
import { Link } from 'react-router-dom';
import { useStudent } from '../../context/StudentContext';
import CertificateCard from '../../components/student/CertificateCard';

export default function CertificatesPage() {
  const { enrolledCourses, certificates, showToast } = useStudent();

  const handleDownload = (cert) => {
    showToast(`Downloading verified certificate for "${cert.courseTitle}" (PDF)...`, 'success');
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="pb-2 border-b border-brand-border/60">
        <h1 className="text-2xl font-bold text-brand-text tracking-tight">
          Verified Certificates
        </h1>
        <p className="text-sm text-brand-muted mt-1">
          Earn industry-recognized certificates of completion from Wisdom Institute. Complete 100% of course lessons and quizzes to unlock.
        </p>
      </div>

      {enrolledCourses.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-[14px] border border-brand-border space-y-4">
          <p className="text-sm text-brand-muted">
            You haven't enrolled in any courses yet. Enroll in courses to start earning certificates.
          </p>
          <Link
            to="/courses"
            className="inline-block px-5 py-2.5 rounded-full bg-brand-navy hover:bg-brand-navyHover text-white text-xs font-semibold transition-colors"
          >
            Explore Courses
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {enrolledCourses.map((course) => {
            const cert = certificates.find((c) => c.courseId === course.id);
            return (
              <CertificateCard
                key={course.id}
                course={course}
                certificate={cert}
                onDownload={handleDownload}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
