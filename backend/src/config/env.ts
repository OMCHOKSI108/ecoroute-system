import dotenv from 'dotenv';
import path from 'path';

// Prefer the backend working directory .env for local backend commands.
dotenv.config();
// Fallback: project root .env, if present. Existing values are not overwritten.
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

export interface AppConfig {
  port: number;
  nodeEnv: string;
  appName: string;
  apiPrefix: string;
  db: {
    host: string;
    port: number;
    name: string;
    user: string;
    password: string;
    url: string;
  };
  jwtSecret: string;
  jwtExpiresIn: string;
  jwtRefreshSecret: string;
  jwtRefreshExpiresIn: string;
  osrm: {
    baseUrl: string;
    timeoutMs: number;
  };
  offline: {
    offlineMode: boolean;
    enableExternalApis: boolean;
    enableNotifications: boolean;
    enableEmail: boolean;
    enableSms: boolean;
    enableQueue: boolean;
  };
  frontendUrl: string;
  logLevel: string;
  enableRequestLogging: boolean;
  bcryptSaltRounds: number;
  rateLimitWindowMs: number;
  rateLimitMaxRequests: number;

  resendApiKey: string;
  mailFrom: string;
  resetOtpExpiryMinutes: number;
  
}

function requireEnv(key: string): string {
  const value = process.env[key];
  if (value === undefined || value === '') {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function requireInt(key: string, fallback?: number): number {
  const raw = process.env[key];
  if (raw === undefined || raw === '') {
    if (fallback !== undefined) return fallback;
    throw new Error(`Missing required environment variable: ${key}`);
  }
  const parsed = parseInt(raw, 10);
  if (isNaN(parsed)) {
    throw new Error(`Environment variable ${key} must be an integer, got: ${raw}`);
  }
  return parsed;
}

function parseBool(key: string, fallback: boolean): boolean {
  const raw = process.env[key];
  if (raw === undefined || raw === '') return fallback;
  return raw.toLowerCase() === 'true';
}

const config: AppConfig = {
  port: requireInt('PORT'),
  nodeEnv: requireEnv('NODE_ENV'),
  appName: requireEnv('APP_NAME'),
  apiPrefix: requireEnv('API_PREFIX'),
  db: {
    host: requireEnv('DATABASE_HOST'),
    port: requireInt('DATABASE_PORT'),
    name: requireEnv('DATABASE_NAME'),
    user: requireEnv('DATABASE_USER'),
    password: requireEnv('DATABASE_PASSWORD'),
    url: requireEnv('DATABASE_URL'),
  },
  jwtSecret: requireEnv('JWT_SECRET'),
  jwtExpiresIn: process.env['JWT_EXPIRES_IN'] ?? '7d',
  jwtRefreshSecret: requireEnv('JWT_REFRESH_SECRET'),
  jwtRefreshExpiresIn: process.env['JWT_REFRESH_EXPIRES_IN'] ?? '30d',
  osrm: {
    baseUrl: requireEnv('OSRM_BASE_URL'),
    timeoutMs: requireInt('OSRM_TIMEOUT_MS'),
  },
  offline: {
    offlineMode: parseBool('OFFLINE_MODE', false),
    enableExternalApis: parseBool('ENABLE_EXTERNAL_APIS', false),
    enableNotifications: parseBool('ENABLE_NOTIFICATIONS', false),
    enableEmail: parseBool('ENABLE_EMAIL', false),
    enableSms: parseBool('ENABLE_SMS', false),
    enableQueue: parseBool('ENABLE_QUEUE', false),
  },
  frontendUrl: requireEnv('FRONTEND_URL'),
  logLevel: process.env['LOG_LEVEL'] ?? 'info',
  enableRequestLogging: parseBool('ENABLE_REQUEST_LOGGING', true),
  bcryptSaltRounds: requireInt('BCRYPT_SALT_ROUNDS', 10),
  rateLimitWindowMs: requireInt('RATE_LIMIT_WINDOW_MS', 900000),
  rateLimitMaxRequests: requireInt('RATE_LIMIT_MAX_REQUESTS', 1000),
  resendApiKey: process.env.RESEND_API_KEY || '',
  mailFrom: process.env.MAIL_FROM || 'EcoRoute <noreply@omchoksi.codes>',
  resetOtpExpiryMinutes: Number(process.env.RESET_OTP_EXPIRY_MINUTES || 10),
};

Object.freeze(config);
Object.freeze(config.db);
Object.freeze(config.osrm);
Object.freeze(config.offline);

export { config };
