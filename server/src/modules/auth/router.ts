import { Router } from 'express';
import * as authController from './controller';
import { authenticate } from '../../middleware/auth';
import { authRateLimiter } from '../../middleware/rateLimiter';

const router = Router();

// Public routes
router.post('/register', authRateLimiter, authController.register);
router.get('/verify-email', authController.verifyEmail);
router.post('/login', authRateLimiter, authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);
router.post('/forgot-password', authRateLimiter, authController.forgotPassword);
router.post('/reset-password', authRateLimiter, authController.resetPassword);

// Protected routes
router.get('/me', authenticate, authController.getMe);

export default router;
