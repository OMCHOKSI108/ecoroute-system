'use client';

import { useState } from 'react';
import Link from 'next/link';
import { APP_NAME } from '@/lib/constants';
import { ROUTES } from '@/lib/routes';

export function LandingHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600">
            <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
            </svg>
          </div>
          <span className="text-lg font-bold text-gray-900">{APP_NAME}</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          <Link href="#capabilities" className="text-sm font-medium text-gray-500 transition-colors hover:text-emerald-600">
            Capabilities
          </Link>
          <Link href="#how-it-works" className="text-sm font-medium text-gray-500 transition-colors hover:text-emerald-600">
            How It Works
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href={ROUTES.LOGIN}
              className="rounded-md px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:text-gray-900"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
            >
              Get Started
            </Link>
          </div>
        </nav>

        <button
          className="text-gray-500 md:hidden"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            {menuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {menuOpen && (
        <div className="border-t border-gray-200 bg-white px-4 pb-4 pt-2 md:hidden">
          <nav className="flex flex-col gap-2">
            <Link href="#capabilities" className="rounded-md px-3 py-2 text-sm text-gray-600 hover:bg-gray-50" onClick={() => setMenuOpen(false)}>
              Capabilities
            </Link>
            <Link href="#how-it-works" className="rounded-md px-3 py-2 text-sm text-gray-600 hover:bg-gray-50" onClick={() => setMenuOpen(false)}>
              How It Works
            </Link>
            <Link href={ROUTES.LOGIN} className="rounded-md px-3 py-2 text-sm text-gray-600 hover:bg-gray-50" onClick={() => setMenuOpen(false)}>
              Sign In
            </Link>
            <Link href="/register" className="rounded-md bg-emerald-600 px-3 py-2 text-sm text-white text-center hover:bg-emerald-700" onClick={() => setMenuOpen(false)}>
              Get Started
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
