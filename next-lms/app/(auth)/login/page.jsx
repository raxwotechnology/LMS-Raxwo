import SignInForm from '@/components/auth/SignInForm';

export const metadata = {
  title: 'Sign In | Wisdom Institute Student Portal',
  description: 'Sign in to access your student classes, results, and lecture schedules.',
};

export default function LoginPage() {
  return <SignInForm />;
}
