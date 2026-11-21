import Link from 'next/link';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { APP_NAME } from '@/lib/constants';
import { ROUTES } from '@/lib/routes';

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <LandingHeader />

      {/* ──────────────── HERO ──────────────── */}
      <section className="relative overflow-hidden bg-white pt-20">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] bg-[length:24px_24px] opacity-30" />

        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-5 lg:gap-16">

            {/* Hero copy */}
            <div className="animate-fade-in-up lg:col-span-2">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1.5 text-xs font-medium text-emerald-700">
                <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
                Smart Fleet Routing Platform
              </div>

              <h1 className="text-4xl font-extrabold leading-[1.1] tracking-tight text-gray-900 sm:text-5xl xl:text-6xl">
                One Command Center for{' '}
                <span className="text-emerald-600">Smarter Waste Collection</span>
              </h1>

              <p className="mt-5 max-w-lg text-base leading-relaxed text-gray-500 sm:text-lg">
                See pickup demand, assign drivers and vehicles, preview optimized routes,
                track route progress in real time, and improve circular economy logistics —
                all from a single enterprise-grade dashboard.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/register"
                  className="group inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-700 hover:shadow-md"
                >
                  Start Free Trial
                  <svg className="h-4 w-4 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </Link>
                <Link
                  href={ROUTES.LOGIN}
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-700 shadow-sm transition-all hover:bg-gray-50 hover:border-gray-400"
                >
                  Sign In
                </Link>
                <a
                  href="#capabilities"
                  className="inline-flex items-center gap-2 rounded-lg px-5 py-3 text-sm font-medium text-gray-400 transition-colors hover:text-gray-600"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                  Explore Capabilities
                </a>
              </div>

              {/* Trusted by */}
              <div className="mt-10 border-t border-gray-200 pt-6">
                <p className="text-xs font-medium uppercase tracking-widest text-gray-400">Trusted by operations teams at</p>
                <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold text-gray-400">
                  <span>GreenWaste</span>
                  <span>Recology</span>
                  <span>Waste Connections</span>
                  <span>Republic Services</span>
                </div>
              </div>
            </div>

            {/* Dashboard mockup */}
            <div className="animate-fade-in-up animation-delay-200 lg:col-span-3">
              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg shadow-gray-200/50">
                {/* Mockup toolbar */}
                <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-600">
                      <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                      </svg>
                    </div>
                    <span className="text-sm font-bold text-gray-900">{APP_NAME}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                      <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      Live
                    </span>
                    <div className="flex -space-x-1">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-gray-200 text-[10px] font-bold text-gray-600">
                          {['JD', 'AK', 'MR'][i - 1]}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Mockup body */}
                <div className="grid grid-cols-12 gap-3 p-4">
                  {/* KPI row */}
                  <div className="col-span-12 grid grid-cols-4 gap-3">
                    {[
                      { label: 'Active Pickups', value: '234', change: '+12%', up: true },
                      { label: 'Total Routes', value: '18', change: '3 active', up: null },
                      { label: 'Fleet Utilization', value: '87%', change: '+5%', up: true },
                      { label: 'On-Time Rate', value: '94%', change: '+2%', up: true },
                    ].map((kpi) => (
                      <div key={kpi.label} className="rounded-lg border border-gray-100 bg-gray-50/50 p-3">
                        <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400">{kpi.label}</p>
                        <p className="mt-1 text-lg font-bold text-gray-900">{kpi.value}</p>
                        {kpi.change && (
                          <p className={`text-[11px] font-medium ${kpi.up === true ? 'text-emerald-600' : kpi.up === false ? 'text-red-500' : 'text-gray-400'}`}>
                            {kpi.change}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Map + Routes split */}
                  <div className="col-span-12 grid grid-cols-12 gap-3">
                    {/* Map area */}
                    <div className="col-span-7 overflow-hidden rounded-lg border border-gray-100 bg-gray-50">
                      <div className="flex items-center justify-between border-b border-gray-100 px-3 py-2">
                        <span className="text-xs font-semibold text-gray-700">Live Map</span>
                        <span className="text-[10px] text-gray-400">6 vehicles active</span>
                      </div>
                      <div className="relative flex aspect-[3/2] items-center justify-center bg-gray-50">
                        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 400 250" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <line x1="50" y1="0" x2="50" y2="250" stroke="#d1d5db" strokeWidth="0.5" strokeDasharray="4 4" />
                          <line x1="150" y1="0" x2="150" y2="250" stroke="#d1d5db" strokeWidth="0.5" strokeDasharray="4 4" />
                          <line x1="250" y1="0" x2="250" y2="250" stroke="#d1d5db" strokeWidth="0.5" strokeDasharray="4 4" />
                          <line x1="350" y1="0" x2="350" y2="250" stroke="#d1d5db" strokeWidth="0.5" strokeDasharray="4 4" />
                          <line x1="0" y1="50" x2="400" y2="50" stroke="#d1d5db" strokeWidth="0.5" strokeDasharray="4 4" />
                          <line x1="0" y1="125" x2="400" y2="125" stroke="#d1d5db" strokeWidth="0.5" strokeDasharray="4 4" />
                          <line x1="0" y1="200" x2="400" y2="200" stroke="#d1d5db" strokeWidth="0.5" strokeDasharray="4 4" />
                          <path d="M60 200 Q100 150 150 180 Q200 120 250 150 Q300 80 350 100" stroke="#059669" strokeWidth="2" fill="none" className="opacity-50" />
                          <circle cx="60" cy="200" r="4" fill="#059669" />
                          <circle cx="350" cy="100" r="4" fill="#ef4444" />
                          <circle cx="150" cy="180" r="3" fill="#eab308" />
                          <circle cx="200" cy="120" r="3" fill="#eab308" />
                          <circle cx="300" cy="80" r="3" fill="#eab308" />
                          <circle cx="230" cy="112" r="5" fill="#059669" stroke="#fff" strokeWidth="1.5" />
                        </svg>
                        <div className="relative z-10 rounded-lg border border-emerald-200 bg-white px-4 py-1.5 text-xs font-medium text-emerald-700 shadow-sm">
                          Route #103 — 4 stops · 12 km · ETA 22 min
                        </div>
                      </div>
                    </div>

                    {/* Active routes list */}
                    <div className="col-span-5 rounded-lg border border-gray-100 bg-white">
                      <div className="flex items-center justify-between border-b border-gray-100 px-3 py-2">
                        <span className="text-xs font-semibold text-gray-700">Active Routes</span>
                        <span className="text-[10px] font-medium text-emerald-600">View all &rarr;</span>
                      </div>
                      <div className="divide-y divide-gray-100">
                        {[
                          { route: 'Route #103', driver: 'James D.', stops: 4, status: 'In Progress', pct: 65 },
                          { route: 'Route #089', driver: 'Aisha K.', stops: 6, status: 'En Route', pct: 30 },
                          { route: 'Route #112', driver: 'Marcus R.', stops: 3, status: 'Completed', pct: 100 },
                        ].map((r) => (
                          <div key={r.route} className="px-3 py-2.5 hover:bg-gray-50">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-gray-900">{r.route}</span>
                              <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                                r.status === 'Completed' ? 'bg-emerald-50 text-emerald-700' :
                                r.status === 'In Progress' ? 'bg-blue-50 text-blue-700' :
                                'bg-amber-50 text-amber-700'
                              }`}>
                                {r.status}
                              </span>
                            </div>
                            <div className="mt-1 flex items-center justify-between text-xs text-gray-400">
                              <span>{r.driver} · {r.stops} stops</span>
                              <span>{r.pct}%</span>
                            </div>
                            <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-gray-100">
                              <div className={`h-full rounded-full ${
                                r.status === 'Completed' ? 'bg-emerald-500' :
                                r.status === 'In Progress' ? 'bg-blue-500' : 'bg-amber-500'
                              }`} style={{ width: `${r.pct}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────── CAPABILITIES ──────────────── */}
      <section id="capabilities" className="bg-gray-50 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">
              Platform Capabilities
            </span>
            <h2 className="mt-3 text-3xl font-bold text-gray-900 sm:text-4xl">
              Everything You Need to Run Fleet Operations
            </h2>
            <p className="mt-3 text-gray-500">
              A complete operations platform — from receiving pickup requests to dispatching drivers
              and tracking every route in real time.
            </p>
          </div>

          <div className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: 'Dispatch Control Room',
                desc: 'View all unassigned pickups, preview optimized routes, check vehicle capacity and driver availability, then dispatch with one click.',
                tag: '1-click dispatch',
                icon: (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                  </svg>
                ),
              },
              {
                title: 'Route Optimization',
                desc: 'OSRM-powered route generation that minimizes distance, fuel consumption, and drive time while maximizing stops per route.',
                tag: 'OSRM powered',
                icon: (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
              },
              {
                title: 'Live Fleet Tracking',
                desc: 'Real-time GPS tracking with vehicle markers, route progress bars, driver status indicators, and live ETA updates on every active route.',
                tag: 'Real-time GPS',
                icon: (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
                  </svg>
                ),
              },
              {
                title: 'Pickup Management',
                desc: 'Track every pickup from request through completion. Status badges, scheduling, driver assignment, cancellation, and full history.',
                tag: 'Full lifecycle',
                icon: (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
              },
              {
                title: 'Analytics & Reporting',
                desc: 'Dashboard KPIs, daily volume trends, fleet utilization reports, driver performance metrics, and operational cost analysis.',
                tag: 'Real-time KPIs',
                icon: (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                  </svg>
                ),
              },
              {
                title: 'Audit & Compliance',
                desc: 'Immutable audit trail of all operations — dispatches, route changes, driver assignments, and system events — for full visibility.',
                tag: 'Full audit trail',
                icon: (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                ),
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="group rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:border-emerald-200 hover:shadow-md"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100">
                  {feature.icon}
                </div>
                <h3 className="mt-4 text-lg font-semibold text-gray-900">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-500">{feature.desc}</p>
                <div className="mt-4 flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                  <span>{feature.tag}</span>
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ──────────────── DASHBOARD PREVIEW ──────────────── */}
      <section className="bg-white py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">
              Operations Dashboard
            </span>
            <h2 className="mt-3 text-3xl font-bold text-gray-900 sm:text-4xl">
              See Everything at a Glance
            </h2>
            <p className="mt-3 text-gray-500">
              Your command center shows real-time KPIs, active routes, fleet status, and
              pending pickups — so you always know what needs attention.
            </p>
          </div>

          <div className="mt-14 grid grid-cols-1 gap-4 lg:grid-cols-12 lg:grid-rows-2">
            {/* KPI row */}
            <div className="lg:col-span-12 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                { label: 'Today\'s Pickups', value: 78, unit: 'requests', change: '+14% vs yesterday', up: true },
                { label: 'Active Routes', value: 12, unit: 'en route', change: '3 queued for dispatch', up: null },
                { label: 'Drivers Online', value: 14, unit: 'of 18 total', change: '4 off duty', up: false },
                { label: 'Avg Response Time', value: '18', unit: 'minutes', change: '-4 min vs last week', up: true },
              ].map((kpi) => (
                <div key={kpi.label} className="rounded-xl border border-gray-200 bg-gray-50/50 p-5">
                  <p className="text-xs font-medium uppercase tracking-wider text-gray-400">{kpi.label}</p>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-gray-900">{kpi.value}</span>
                    <span className="text-sm text-gray-400">{kpi.unit}</span>
                  </div>
                  {kpi.change && (
                    <p className={`mt-1 text-xs font-medium ${kpi.up === true ? 'text-emerald-600' : kpi.up === false ? 'text-red-500' : 'text-gray-400'}`}>
                      {kpi.change}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* Map card */}
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-gray-50 lg:col-span-7 lg:row-span-2">
              <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3">
                <span className="text-sm font-semibold text-gray-900">Live Fleet Map</span>
                <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                  <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
                  6 vehicles active
                </span>
              </div>
              <div className="relative flex aspect-video items-center justify-center bg-gray-50">
                <svg className="absolute inset-0 h-full w-full" viewBox="0 0 600 350" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <line x1="80" y1="0" x2="80" y2="350" stroke="#d1d5db" strokeWidth="0.5" strokeDasharray="5 5" />
                  <line x1="200" y1="0" x2="200" y2="350" stroke="#d1d5db" strokeWidth="0.5" strokeDasharray="5 5" />
                  <line x1="320" y1="0" x2="320" y2="350" stroke="#d1d5db" strokeWidth="0.5" strokeDasharray="5 5" />
                  <line x1="440" y1="0" x2="440" y2="350" stroke="#d1d5db" strokeWidth="0.5" strokeDasharray="5 5" />
                  <line x1="0" y1="70" x2="600" y2="70" stroke="#d1d5db" strokeWidth="0.5" strokeDasharray="5 5" />
                  <line x1="0" y1="175" x2="600" y2="175" stroke="#d1d5db" strokeWidth="0.5" strokeDasharray="5 5" />
                  <line x1="0" y1="280" x2="600" y2="280" stroke="#d1d5db" strokeWidth="0.5" strokeDasharray="5 5" />
                  <path d="M100 300 Q180 230 260 260 Q340 200 420 240" stroke="#059669" strokeWidth="2.5" fill="none" className="opacity-50" />
                  <path d="M80 100 Q180 140 280 110 Q380 170 500 120" stroke="#3b82f6" strokeWidth="2.5" fill="none" className="opacity-40" strokeDasharray="6 4" />
                  <circle cx="180" cy="245" r="6" fill="#059669" stroke="#fff" strokeWidth="1.5" />
                  <circle cx="320" cy="170" r="6" fill="#3b82f6" stroke="#fff" strokeWidth="1.5" />
                  <circle cx="440" cy="240" r="6" fill="#059669" stroke="#fff" strokeWidth="1.5" />
                  <circle cx="260" cy="120" r="6" fill="#eab308" stroke="#fff" strokeWidth="1.5" />
                  <circle cx="130" cy="100" r="6" fill="#059669" stroke="#fff" strokeWidth="1.5" />
                  <circle cx="480" cy="140" r="6" fill="#eab308" stroke="#fff" strokeWidth="1.5" />
                  <rect x="168" y="258" rx="3" width="32" height="16" fill="#05966915" />
                  <text x="176" y="269" fill="#059669" fontSize="8" fontWeight="600">V-01</text>
                  <rect x="308" y="183" rx="3" width="32" height="16" fill="#3b82f615" />
                  <text x="316" y="194" fill="#3b82f6" fontSize="8" fontWeight="600">V-04</text>
                </svg>
                <div className="relative z-10 rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-center shadow-sm">
                  <p className="text-sm font-semibold text-gray-900">Route #103 — In Progress</p>
                  <p className="text-xs text-gray-500">4 of 6 stops completed · ETA 18 min</p>
                </div>
              </div>
            </div>

            {/* Activity feed */}
            <div className="rounded-xl border border-gray-200 bg-white lg:col-span-5 lg:row-span-2">
              <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3">
                <span className="text-sm font-semibold text-gray-900">Recent Activity</span>
                <span className="text-xs font-medium text-emerald-600">View all &rarr;</span>
              </div>
              <div className="divide-y divide-gray-100">
                {[
                  { time: '2 min ago', event: 'Route #112 dispatched to Marcus R.', type: 'dispatch' },
                  { time: '8 min ago', event: 'Pickup #4823 completed at GreenLeaf HQ', type: 'pickup' },
                  { time: '14 min ago', event: 'Vehicle V-04 arrived at stop 3/6', type: 'tracking' },
                  { time: '27 min ago', event: 'Route #089 optimized — saved 3.2 km', type: 'optimization' },
                  { time: '45 min ago', event: 'Driver Aisha K. marked en route', type: 'status' },
                ].map((activity, i) => {
                  const typeStyles: Record<string, string> = {
                    dispatch: 'bg-emerald-50 text-emerald-600',
                    pickup: 'bg-green-50 text-green-600',
                    tracking: 'bg-blue-50 text-blue-600',
                    optimization: 'bg-amber-50 text-amber-600',
                    status: 'bg-gray-100 text-gray-500',
                  };
                  return (
                    <div key={i} className="flex items-start gap-3 px-5 py-3 hover:bg-gray-50">
                      <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${typeStyles[activity.type] || typeStyles.status}`}>
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          {activity.type === 'dispatch' && <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />}
                          {activity.type === 'pickup' && <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />}
                          {activity.type === 'tracking' && <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />}
                          {activity.type === 'optimization' && <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />}
                          {activity.type === 'status' && <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />}
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-700 truncate">{activity.event}</p>
                        <p className="text-xs text-gray-400">{activity.time}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────── HOW IT WORKS ──────────────── */}
      <section id="how-it-works" className="bg-gray-50 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">
              How It Works
            </span>
            <h2 className="mt-3 text-3xl font-bold text-gray-900 sm:text-4xl">
              From Request to Route Completion
            </h2>
            <p className="mt-3 text-gray-500">
              A simple workflow that gets your fleet from incoming pickup requests to completed routes
              with full visibility at every step.
            </p>
          </div>
          <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { step: '01', title: 'Receive Pickups', desc: 'Pickup requests flow in from businesses. Your dispatch board shows every unassigned request with location, priority, and waste type.', color: 'bg-emerald-600' },
              { step: '02', title: 'Optimize & Assign', desc: 'Preview the optimal route with OSRM. Check vehicle capacity and driver availability, then assign with one click.', color: 'bg-blue-600' },
              { step: '03', title: 'Dispatch Fleet', desc: 'Drivers receive the route on their mobile device instantly. ETAs, stop-by-stop directions, and customer details are all pre-loaded.', color: 'bg-amber-500' },
              { step: '04', title: 'Track & Complete', desc: 'Watch route progress in real time on the live map. Monitor stop completions, update ETAs, and verify pickups.', color: 'bg-emerald-600' },
            ].map((item, i) => (
              <div key={item.step} className="group relative">
                {i < 3 && (
                  <div className="absolute top-7 left-[calc(50%+1.75rem)] hidden h-px w-[calc(100%-3.5rem)] bg-gray-200 lg:block" />
                )}
                <div className="relative rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all group-hover:border-emerald-200 group-hover:shadow-md">
                  <div className={`flex h-14 w-14 items-center justify-center rounded-xl ${item.color} text-lg font-bold text-white shadow-sm`}>
                    {item.step}
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-gray-900">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-500">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ──────────────── STATS ──────────────── */}
      <section className="border-y border-gray-200 bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {[
              { value: '15,000+', label: 'Routes Optimized' },
              { value: '40%', label: 'Average Cost Reduction' },
              { value: '99.9%', label: 'Platform Uptime' },
              { value: '2.5M+', label: 'Pickups Completed' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-3xl font-extrabold text-gray-900 sm:text-4xl">{stat.value}</p>
                <p className="mt-1 text-sm text-gray-500">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ──────────────── CTA ──────────────── */}
      <section className="bg-gray-50 py-24">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            Ready to Transform Your Fleet Operations?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-gray-500">
            Join the operations teams using {APP_NAME} to optimize routes, reduce fuel costs,
            improve on-time pickup rates, and build a greener, more efficient fleet.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/register"
              className="group inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-8 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-700 hover:shadow-md"
            >
              Start Free Trial
              <svg className="h-4 w-4 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
            <Link
              href={ROUTES.LOGIN}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-8 py-3 text-sm font-semibold text-gray-700 shadow-sm transition-all hover:bg-gray-50 hover:border-gray-400"
            >
              Sign In
            </Link>
          </div>
          <p className="mt-6 text-xs text-gray-400">
            No credit card required. Free 14-day trial with full platform access.
          </p>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
