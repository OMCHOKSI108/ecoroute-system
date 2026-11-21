export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  DISPATCH: '/dispatch',
  LIVE_TRACKING: '/live-tracking',
  PICKUPS: '/pickups',
  ROUTES: '/routes',
  DRIVERS: '/drivers',
  VEHICLES: '/vehicles',
  ORGANIZATIONS: '/organizations',
  BUSINESSES: '/businesses',
  USERS: '/users',
  AUDIT_LOGS: '/audit-logs',
  SETTINGS: '/settings',
  NOTIFICATIONS: '/notifications',
  PICKUP_LOCATIONS: '/pickup-locations',
  WASTE_CATEGORIES: '/waste-categories',
} as const;

export function getRoleLandingPage(role?: string): string {
  switch (role) {
    case 'dispatcher':
      return ROUTES.DISPATCH;
    case 'driver':
      return ROUTES.ROUTES;
    case 'business_user':
      return ROUTES.PICKUPS;
    case 'admin':
    default:
      return ROUTES.DASHBOARD;
  }
}
