import { RegisterForm } from '@/components/auth/RegisterForm';
import { APP_NAME } from '@/lib/constants';

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      {/* Simple header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600">
              <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
              </svg>
            </div>
            <span className="text-lg font-bold text-gray-900">{APP_NAME}</span>
          </div>
        </div>
      </header>

      {/* Register form */}
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg">
          <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
            <h1 className="mb-1 text-xl font-bold text-gray-900">Create your account</h1>
            <p className="mb-6 text-sm text-gray-500">
              Set up your organization and get started with {APP_NAME}.
            </p>
            <RegisterForm />
          </div>
        </div>
      </div>
    </div>
  );
}
