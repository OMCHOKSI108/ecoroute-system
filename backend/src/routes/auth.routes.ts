import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { config } from '../config/env';
import { 
  register, 
  login, 
  refresh, 
  resetPassword, 
  forgotPassword 
} from '../controllers/auth.controller';

const authLimiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { 
    success: false, 
    error: 'TOO_MANY_REQUESTS', 
    message: 'Too many requests, please try again later' 
  },
});

export const authRouter = Router();

authRouter.post('/register', authLimiter, register);
authRouter.post('/login', authLimiter, login);
authRouter.post('/refresh', authLimiter, refresh);
authRouter.post('/forgot-password', authLimiter, forgotPassword);
authRouter.post('/reset-password', authLimiter, resetPassword);