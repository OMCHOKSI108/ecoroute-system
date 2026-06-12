export type Role = 'admin' | 'dispatcher' | 'driver' | 'business_user';

export interface AuthPayload {
  sub: string;
  orgId: string;
  role: Role;
  email: string;
}
