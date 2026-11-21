'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, ApiError } from '@/lib/api';
import { setToken, extractToken } from '@/lib/auth';
import { Button } from '@/components/ui/Button';
import { ROUTES } from '@/lib/routes';
import { APP_NAME } from '@/lib/constants';

interface RegisterPayload {
  orgName: string;
  orgEmail: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

interface RegisterResponse {
  success: boolean;
  token?: string;
  tokens?: {
    accessToken: string;
    refreshToken: string;
  };
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
  organization: {
    id: string;
    name: string;
    email: string;
  };
}

export function RegisterForm() {
  const router = useRouter();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [orgName, setOrgName] = useState('');
  const [orgEmail, setOrgEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const payload: RegisterPayload = {
        firstName,
        lastName,
        email,
        password,
        orgName,
        orgEmail,
      };
      const res = await api.post<RegisterResponse>('/auth/register', payload);
      const token = extractToken(res);
      if (token) setToken(token);
      router.push(ROUTES.DASHBOARD);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && (
        <div className="animate-fade-in rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="animate-fade-in-up animation-delay-100">
          <label htmlFor="firstName" className="mb-1 block text-sm font-medium text-gray-700">
            First Name
          </label>
          <input
            id="firstName"
            type="text"
            required
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            placeholder="Om"
          />
        </div>
        <div className="animate-fade-in-up animation-delay-100">
          <label htmlFor="lastName" className="mb-1 block text-sm font-medium text-gray-700">
            Last Name
          </label>
          <input
            id="lastName"
            type="text"
            required
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            placeholder="Choksi"
          />
        </div>
      </div>

      <div className="animate-fade-in-up animation-delay-200">
        <label htmlFor="reg-email" className="mb-1 block text-sm font-medium text-gray-700">
          Email
        </label>
        <input
          id="reg-email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          placeholder="you@company.com"
        />
      </div>

      <div className="animate-fade-in-up animation-delay-200">
        <label htmlFor="reg-password" className="mb-1 block text-sm font-medium text-gray-700">
          Password
        </label>
        <input
          id="reg-password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          placeholder="Min. 8 characters"
        />
        <p className="mt-1 text-[11px] text-gray-400">Must contain uppercase, lowercase, and a number</p>
      </div>

      <hr className="border-gray-200" />

      <div className="grid grid-cols-2 gap-3">
        <div className="animate-fade-in-up animation-delay-300">
          <label htmlFor="orgName" className="mb-1 block text-sm font-medium text-gray-700">
            Organization
          </label>
          <input
            id="orgName"
            type="text"
            required
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            placeholder="My Company"
          />
        </div>
        <div className="animate-fade-in-up animation-delay-300">
          <label htmlFor="orgEmail" className="mb-1 block text-sm font-medium text-gray-700">
            Org Email
          </label>
          <input
            id="orgEmail"
            type="email"
            required
            value={orgEmail}
            onChange={(e) => setOrgEmail(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            placeholder="admin@company.com"
          />
        </div>
      </div>

      <div className="animate-fade-in-up animation-delay-400">
        <Button type="submit" loading={loading} className="mt-1 w-full">
          Create Account
        </Button>
      </div>

      <p className="animate-fade-in animation-delay-500 text-center text-xs text-gray-400">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-emerald-600 hover:text-emerald-700">
          Sign in
        </Link>
      </p>
    </form>
  );
}
