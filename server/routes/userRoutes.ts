/**
 * User Routes
 * 
 * API routes for user profile management, authentication, reports, and inquiries.
 * 
 * Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 10.8
 */

import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import * as userController from '../controllers/userController';

const router = Router();

// Profile endpoints
router.get('/profile', authMiddleware, asyncHandler(userController.getUserProfile));
router.put('/profile', authMiddleware, asyncHandler(userController.updateUserProfile));

// Password reset endpoints
router.post('/password-reset', asyncHandler(userController.initiatePasswordReset));
router.post('/password-reset/confirm', asyncHandler(userController.confirmPasswordReset));

// Account deletion endpoint
router.delete('/account', authMiddleware, asyncHandler(userController.deleteAccount));

// Report endpoint
router.post('/report', authMiddleware, asyncHandler(userController.createReport));

// Inquiry endpoints
router.post('/inquiry', authMiddleware, asyncHandler(userController.createInquiry));
router.get('/inquiries', authMiddleware, asyncHandler(userController.getUserInquiries));

export default router;
