import Link from 'next/link';
import { APP_NAME } from '@/lib/constants';

export function LandingFooter() {
  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600">
                <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                </svg>
              </div>
              <span className="text-lg font-bold text-gray-900">{APP_NAME}</span>
            </div>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-gray-500">
              Smart waste collection routing and fleet dispatch platform for circular economy logistics.
              Optimize routes, reduce costs, and track your fleet in real time.
            </p>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-700">Product</h4>
            <ul className="space-y-2">
              <li><Link href="#capabilities" className="text-sm text-gray-500 transition-colors hover:text-emerald-600">Capabilities</Link></li>
              <li><Link href="#how-it-works" className="text-sm text-gray-500 transition-colors hover:text-emerald-600">How It Works</Link></li>
              <li><Link href="/login" className="text-sm text-gray-500 transition-colors hover:text-emerald-600">Sign In</Link></li>
              <li><Link href="/register" className="text-sm text-gray-500 transition-colors hover:text-emerald-600">Get Started</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-700">Company</h4>
            <ul className="space-y-2">
              <li><span className="text-sm text-gray-400">EcoRoute Systems</span></li>
              <li><span className="text-sm text-gray-400">contact@ecoroute.io</span></li>
            </ul>
          </div>
        </div>
        <div className="mt-10 border-t border-gray-200 pt-6">
          <p className="text-center text-xs text-gray-400">
            &copy; {new Date().getFullYear()} {APP_NAME}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
