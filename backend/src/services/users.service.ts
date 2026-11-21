import bcryptjs from 'bcryptjs';
import { config } from '../config/env';
import * as userRepo from '../repositories/users.repository';
import * as businessRepo from '../repositories/businesses.repository';
import * as vehiclesRepo from '../repositories/vehicles.repository';
import { ConflictError, NotFoundError, ValidationError } from '../types/errors';
import type { Role } from '../types/auth';
import type {
  CreateUserInput,
  UpdateUserInput,
  UpdateUserRoleInput,
  UpdateUserStatusInput,
  ListUsersQuery,
} from '../schemas/users.schemas';

export interface UserResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  isActive: boolean;
  organizationId: string;
  businessId: string | null;
  businessName: string | null;
  phone: string | null;
  driverStatus: string | null;
  createdAt: string;
  updatedAt: string;
}

function toUserResponse(row: userRepo.UserWithBusinessRow): UserResponse {
  return {
    id: row.id,
    email: row.email,
    firstName: row.first_name,
    lastName: row.last_name,
    role: row.role as Role,
    isActive: row.is_active,
    organizationId: row.organization_id,
    businessId: row.business_id ?? null,
    businessName: row.business_name ?? null,
    phone: row.phone ?? null,
    driverStatus: row.driver_status ?? null,
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

export async function createUser(orgId: string, input: CreateUserInput): Promise<UserResponse> {
  const existing = await userRepo.findUserByEmail(input.email);
  if (existing) {
    throw new ConflictError('An account with this email already exists');
  }

  if (input.role === 'business_user') {
    if (!input.businessId) {
      throw new ValidationError('businessId is required when creating a business_user');
    }
    const business = await businessRepo.findBusinessByIdAndOrg(input.businessId, orgId);
    if (!business) {
      throw new NotFoundError('Business not found in this organization');
    }
  }

  if (input.vehicleId && input.role === 'driver') {
    const vehicle = await vehiclesRepo.findVehicleByIdAndOrg(input.vehicleId, orgId);
    if (!vehicle) {
      throw new NotFoundError('Vehicle not found in this organization');
    }
  }

  const passwordHash = await bcryptjs.hash(input.password, config.bcryptSaltRounds);

  const user = await userRepo.createUser(orgId, {
    email: input.email,
    passwordHash,
    firstName: input.firstName,
    lastName: input.lastName,
    role: input.role,
    phone: input.phone,
    businessId: input.role === 'business_user' ? input.businessId : null,
    driverStatus: input.role === 'driver' ? (input.driverStatus ?? 'available') : null,
  });

  if (input.role === 'driver' && input.vehicleId) {
    await vehiclesRepo.assignDriver(input.vehicleId, orgId, user.id);
  }

  return toUserResponse(user);
}

export async function updateUser(
  id: string,
  orgId: string,
  input: UpdateUserInput,
): Promise<UserResponse> {
  const existing = await userRepo.findUserById(id);
  if (!existing || existing.organization_id !== orgId) {
    throw new NotFoundError('User not found');
  }

  if (input.businessId) {
    const business = await businessRepo.findBusinessByIdAndOrg(input.businessId, orgId);
    if (!business) {
      throw new NotFoundError('Business not found in this organization');
    }
  }

  const fieldsToUpdate: Record<string, unknown> = {};
  if (input.firstName !== undefined) fieldsToUpdate['first_name'] = input.firstName;
  if (input.lastName !== undefined) fieldsToUpdate['last_name'] = input.lastName;
  if (input.email !== undefined) fieldsToUpdate['email'] = input.email;
  if (input.role !== undefined) fieldsToUpdate['role'] = input.role;
  if (input.phone !== undefined) fieldsToUpdate['phone'] = input.phone;
  if (input.businessId !== undefined) fieldsToUpdate['business_id'] = input.businessId;
  if (input.driverStatus !== undefined) fieldsToUpdate['driver_status'] = input.driverStatus;
  if (input.isActive !== undefined) fieldsToUpdate['is_active'] = input.isActive;
  if (input.password) {
    fieldsToUpdate['password_hash'] = await bcryptjs.hash(input.password, config.bcryptSaltRounds);
  }

  const updated = await userRepo.updateUser(id, fieldsToUpdate, orgId);
  if (!updated) throw new NotFoundError('User not found');

  if (input.vehicleId !== undefined && (input.role === 'driver' || existing.role === 'driver')) {
    if (input.vehicleId) {
      await vehiclesRepo.assignDriver(input.vehicleId, orgId, id);
    }
  }

  return toUserResponse(updated);
}

export async function updateUserRole(
  id: string,
  orgId: string,
  input: UpdateUserRoleInput,
): Promise<UserResponse> {
  const existing = await userRepo.findUserById(id);
  if (!existing || existing.organization_id !== orgId) {
    throw new NotFoundError('User not found');
  }

  if (input.role === 'business_user' && input.businessId) {
    const business = await businessRepo.findBusinessByIdAndOrg(input.businessId, orgId);
    if (!business) {
      throw new NotFoundError('Business not found in this organization');
    }
  }

  const row = await userRepo.updateUserRole(id, orgId, input.role, input.businessId);
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

export async function deleteUser(id: string, orgId: string): Promise<{ success: boolean }> {
  const existing = await userRepo.findUserById(id);
  if (!existing || existing.organization_id !== orgId) {
    throw new NotFoundError('User not found');
  }
  const deleted = await userRepo.deleteUser(id, orgId);
  return { success: deleted };
}
