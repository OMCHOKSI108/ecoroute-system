import { LoginForm } from '@/components/auth/LoginForm';
import { APP_NAME } from '@/lib/constants';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        <h1 className="mb-1 text-xl font-bold text-gray-900">{APP_NAME}</h1>
        <p className="mb-6 text-sm text-gray-500">Sign in to continue</p>
        <LoginForm />
      </div>
    </div>
  );
}
