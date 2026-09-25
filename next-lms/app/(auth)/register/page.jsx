import SignUpForm from '@/components/auth/SignUpForm';

export const metadata = {
  title: 'Create Account | Wisdom Institute Student Portal',
  description: 'Join Wisdom Institute as a student to access class materials, marks, and schedules.',
};

export default function RegisterPage() {
  return <SignUpForm />;
}
