import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import * as authRepo from '../repositories/auth.repository';
import { ConflictError, UnauthorizedError } from '../types/errors';
import type { AuthPayload, Role } from '../types/auth';
import type { RegisterInput, LoginInput, RefreshInput } from '../schemas/auth.schemas';
import { generateOtp } from '../otp';
import { sendPasswordResetMail, sendWelcomeMail } from './mail.service';

export interface UserResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  organizationId: string;
}

export interface OrgResponse {
  id: string;
  name: string;
  email: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

function toUserResponse(row: authRepo.UserRow): UserResponse {
  return {
    id: row.id,
    email: row.email,
    firstName: row.first_name,
    lastName: row.last_name,
    role: row.role,
    organizationId: row.organization_id,
  };
}

function toOrgResponse(row: authRepo.OrganizationRow): OrgResponse {
  return { id: row.id, name: row.name, email: row.email };
}

function generateTokens(user: authRepo.UserRow): AuthTokens {
  const payload: Omit<AuthPayload, 'iat' | 'exp'> = {
    sub: user.id,
    orgId: user.organization_id,
    role: user.role,
    email: user.email,
  };

  const accessToken = jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn as jwt.SignOptions['expiresIn'],
  });

  const refreshToken = jwt.sign(payload, config.jwtRefreshSecret, {
    expiresIn: config.jwtRefreshExpiresIn as jwt.SignOptions['expiresIn'],
  });

  return { accessToken, refreshToken };
}

export async function register(
  input: RegisterInput,
): Promise<{ user: UserResponse; organization: OrgResponse; tokens: AuthTokens }> {
  const existingUser = await authRepo.findUserByEmail(input.email);
  if (existingUser) throw new ConflictError('An account with this email already exists');

  const existingOrg = await authRepo.findOrganizationByEmail(input.orgEmail);
  if (existingOrg) throw new ConflictError('An organization with this email already exists');

  const passwordHash = await bcryptjs.hash(input.password, config.bcryptSaltRounds);

  const { org, user } = await authRepo.createOrganizationAndAdminUser({
    orgName: input.orgName,
    orgEmail: input.orgEmail,
    firstName: input.firstName,
    lastName: input.lastName,
    userEmail: input.email,
    passwordHash,
  });

  // Welcome email must be sent AFTER user creation
  try {
    await sendWelcomeMail(user.email, user.first_name);
  } catch (error) {
    console.error('Welcome mail failed:', error);
  }

  return {
    user: toUserResponse(user),
    organization: toOrgResponse(org),
    tokens: generateTokens(user),
  };
}

export async function login(
  input: LoginInput,
): Promise<{ user: UserResponse; tokens: AuthTokens }> {
  // Use the same error message for both "not found" and "wrong password" to prevent enumeration
  const invalidMsg = 'Invalid email or password';

  const user = await authRepo.findUserByEmail(input.email);
  if (!user) throw new UnauthorizedError(invalidMsg);

  const passwordMatch = await bcryptjs.compare(input.password, user.password_hash);
  if (!passwordMatch) throw new UnauthorizedError(invalidMsg);

  return { user: toUserResponse(user), tokens: generateTokens(user) };
}

export async function refresh(
  input: RefreshInput,
): Promise<{ tokens: AuthTokens }> {
  let payload: AuthPayload;
  try {
    payload = jwt.verify(input.refreshToken, config.jwtRefreshSecret) as AuthPayload;
  } catch {
    throw new UnauthorizedError('Invalid or expired refresh token');
  }

  const user = await authRepo.findUserById(payload.sub);
  if (!user || !user.is_active) throw new UnauthorizedError('User not found or inactive');

  return { tokens: generateTokens(user) };
}

export async function forgotPassword(email: string) {
  const user = await authRepo.findUserByEmail(email);

  // Important: do not reveal whether email exists
  if (!user) {
    return {
      message: 'If this email exists, a reset OTP has been sent.',
    };
  }

  const otp = generateOtp(6);
  const otpHash = await bcryptjs.hash(otp, config.bcryptSaltRounds);

  const expiresAt = new Date(
    Date.now() + config.resetOtpExpiryMinutes * 60 * 1000,
  );

  await authRepo.createPasswordResetOtp({
    userId: user.id,
    otpHash,
    expiresAt,
  });

  await sendPasswordResetMail(user.email, otp);

  return {
    message: 'If this email exists, a reset OTP has been sent.',
  };
}

export async function resetPassword(input: {
  email: string;
  otp: string;
  newPassword: string;
}) {
  const user = await authRepo.findUserByEmail(input.email);

  if (!user) {
    throw new UnauthorizedError('Invalid or expired OTP');
  }

  const resetOtp = await authRepo.findLatestValidResetOtp(user.id);

  if (!resetOtp) {
    throw new UnauthorizedError('Invalid or expired OTP');
  }

  if (resetOtp.attempts >= 5) {
    throw new UnauthorizedError('Too many invalid attempts. Request a new OTP.');
  }

  const isOtpValid = await bcryptjs.compare(input.otp, resetOtp.otp_hash);

  if (!isOtpValid) {
    await authRepo.incrementResetOtpAttempts(resetOtp.id);
    throw new UnauthorizedError('Invalid or expired OTP');
  }

  const newPasswordHash = await bcryptjs.hash(input.newPassword, config.bcryptSaltRounds);

  await authRepo.updatePassword(user.id, newPasswordHash);
  await authRepo.markResetOtpUsed(resetOtp.id);

  return {
    message: 'Password reset successfully',
  };
}
