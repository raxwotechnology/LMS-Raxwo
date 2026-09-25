import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Student Portal & Pages
import StudentLayout from './pages/student/StudentLayout';
import DashboardPage from './pages/student/DashboardPage';
import StudentCoursesPage from './pages/student/CoursesPage';
import CourseDetailPage from './pages/student/CourseDetailPage';
import MyLearningPage from './pages/student/MyLearningPage';
import StudentClassesPage from './pages/student/ClassesPage';
import ResultsPage from './pages/student/ResultsPage';
import CertificatesPage from './pages/student/CertificatesPage';
import ExamsPage from './pages/student/ExamsPage';
import ExamPapersPage from './pages/student/ExamPapersPage';
import PaymentsPage from './pages/student/PaymentsPage';
import NotificationsPage from './pages/student/NotificationsPage';

// Auth & Protection
import ProfilePage from './pages/student/ProfilePage';
import StudentAuthPage from './pages/client/StudentAuthPage';
import StudentProtectedRoute from './components/StudentProtectedRoute';

// Legacy Client Pages
import ExamRegistrationPage from './pages/client/ExamRegistrationPage';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import LoginPage from './pages/admin/LoginPage';
import SubjectsPage from './pages/admin/SubjectsPage';
import EmployeePage from './pages/admin/EmployeePage';
import StudentsPage from './pages/admin/StudentsPage';
import SalaryPage from './pages/admin/SalaryPage';
import ClassPage from './pages/admin/ClassPage';
import ClassesViewPage from './pages/admin/ClassesViewPage';
import ExpensesPage from './pages/admin/ExpensesPage';
import IncomePage from './pages/admin/IncomePage';
import ExtraIncomePage from './pages/admin/ExtraIncomePage';
import MarksPage from './pages/admin/MarksPage';
import PaymentPage from './pages/admin/PaymentPage';
import ExamPage from './pages/admin/ExamPage';
import StudentActivitiesPage from './pages/admin/StudentActivitiesPage';
import ProtectedRoute from './components/ProtectedRoute';
import { NotificationProvider } from './context/NotificationContext';

import './App.css';

const App = () => {
  return (
    <NotificationProvider>
      <Router>
        <div className="app">
        <Routes>
          {/* Student Authentication Routes */}
          <Route path="/student/login" element={<StudentAuthPage initialMode="signin" />} />
          <Route path="/student/register" element={<StudentAuthPage initialMode="signup" />} />
          <Route path="/login" element={<Navigate to="/student/login" replace />} />
          <Route path="/register" element={<Navigate to="/student/register" replace />} />

          {/* Root redirect: Goes to Dashboard if authenticated, else Student Login */}
          <Route
            path="/"
            element={
              <StudentProtectedRoute>
                <Navigate to="/dashboard" replace />
              </StudentProtectedRoute>
            }
          />

          {/* Student Portal Routes (All wrapped with Sidebar & StudentProvider) */}
          <Route
            element={
              <StudentProtectedRoute>
                <StudentLayout />
              </StudentProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/courses" element={<StudentCoursesPage />} />
            <Route path="/subjects" element={<Navigate to="/courses" replace />} />
            <Route path="/courses/:id" element={<CourseDetailPage />} />
            <Route path="/my-learning" element={<MyLearningPage />} />
            <Route path="/classes" element={<StudentClassesPage />} />
            <Route path="/results" element={<ResultsPage />} />
            <Route path="/exams" element={<ExamsPage />} />
            <Route path="/exam-papers" element={<ExamPapersPage />} />
            <Route path="/certificates" element={<Navigate to="/exams" replace />} />
            <Route path="/payments" element={<PaymentsPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/exam-registration" element={<ExamRegistrationPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>

          {/* Admin Authentication */}
          <Route path="/admin/login" element={<LoginPage />} />

          {/* Protected Admin Routes */}
          <Route
            path="/admin/Dashboard"
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/subjects"
            element={
              <ProtectedRoute>
                <SubjectsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/class"
            element={
              <ProtectedRoute>
                <ClassPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/classes/view"
            element={
              <ProtectedRoute>
                <ClassesViewPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/employee"
            element={
              <ProtectedRoute>
                <EmployeePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/students"
            element={
              <ProtectedRoute>
                <StudentsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/salary"
            element={
              <ProtectedRoute>
                <SalaryPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/expenses"
            element={
              <ProtectedRoute>
                <ExpensesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/income"
            element={
              <ProtectedRoute>
                <IncomePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/extra-income"
            element={
              <ProtectedRoute>
                <ExtraIncomePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/payment"
            element={
              <ProtectedRoute>
                <PaymentPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/student-activities"
            element={
              <ProtectedRoute>
                <StudentActivitiesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/marks"
            element={
              <ProtectedRoute>
                <MarksPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/exam"
            element={
              <ProtectedRoute>
                <ExamPage />
              </ProtectedRoute>
            }
          />
          <Route path="/admin" element={<Navigate to="/admin/Dashboard" replace />} />
          <Route path="/admin/*" element={<Navigate to="/admin/Dashboard" replace />} />
        </Routes>
      </div>
    </Router>
  </NotificationProvider>
);
};

export default App;
