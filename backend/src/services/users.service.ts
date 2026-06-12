import * as userRepo from '../repositories/users.repository';
import { NotFoundError } from '../types/errors';
import type { Role } from '../types/auth';
import type { UpdateUserRoleInput, UpdateUserStatusInput, ListUsersQuery } from '../schemas/users.schemas';
import type { UserRow } from '../repositories/auth.repository';

export interface UserResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  isActive: boolean;
  organizationId: string;
  driverStatus: string | null;
  createdAt: string;
  updatedAt: string;
}

function toUserResponse(row: UserRow): UserResponse {
  return {
    id: row.id,
    email: row.email,
    firstName: row.first_name,
    lastName: row.last_name,
    role: row.role,
    isActive: row.is_active,
    organizationId: row.organization_id,
    driverStatus: (row as { driver_status?: string }).driver_status ?? null,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

export async function getMe(userId: string): Promise<UserResponse> {
  const row = await userRepo.findUserById(userId);
  if (!row) throw new NotFoundError('User not found');
  return toUserResponse(row);
}

export async function listUsers(
  orgId: string,
  queryParams: ListUsersQuery,
): Promise<{ data: UserResponse[]; total: number; page: number; limit: number }> {
  const isActive = queryParams.isActive === undefined ? undefined : queryParams.isActive === 'true';
  const { data, total } = await userRepo.findUsersByOrg(orgId, {
    page: queryParams.page,
    limit: queryParams.limit,
    role: queryParams.role,
    isActive,
  });
  return {
    data: data.map(toUserResponse),
    total,
    page: queryParams.page,
    limit: queryParams.limit,
  };
}

export async function getUserById(id: string, orgId: string): Promise<UserResponse> {
  const row = await userRepo.findUserById(id);
  if (!row || row.organization_id !== orgId) throw new NotFoundError('User not found');
  return toUserResponse(row);
}

export async function updateUserRole(
  id: string,
  orgId: string,
  input: UpdateUserRoleInput,
): Promise<UserResponse> {
  const row = await userRepo.updateUserRole(id, orgId, input.role);
  if (!row) throw new NotFoundError('User not found');
  return toUserResponse(row);
}

export async function updateUserStatus(
  id: string,
  orgId: string,
  input: UpdateUserStatusInput,
): Promise<UserResponse> {
  const row = await userRepo.updateUserStatus(id, orgId, input.isActive);
  if (!row) throw new NotFoundError('User not found');
  return toUserResponse(row);
}
