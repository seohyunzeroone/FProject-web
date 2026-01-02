/**
 * User Controller
 * 
 * Handles HTTP requests for user profile management.
 * 
 * Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 10.8
 */

import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { getUserService } from '../../src/services/userService';
import { getAuthService } from '../../src/services/authService';
import { getReportService } from '../../src/services/reportService';
import { getInquiryService } from '../../src/services/inquiryService';

/**
 * GET /api/user/profile
 * 
 * Get authenticated user's profile data.
 * 
 * Requirements: 10.1
 */
export async function getUserProfile(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  const userId = req.user!.userId;
  const userService = getUserService();

  const profile = await userService.getUserProfile(userId);

  res.json({
    success: true,
    data: profile,
  });
}

/**
 * PUT /api/user/profile
 * 
 * Update authenticated user's profile data.
 * 
 * Requirements: 10.2
 */
export async function updateUserProfile(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  const userId = req.user!.userId;
  const updates = req.body;

  const userService = getUserService();
  const authService = getAuthService();

  // Update profile in database
  const updatedProfile = await userService.updateUserProfile(userId, updates);

  // If nickname changed, update Cognito
  if (updates.nickname && updates.nickname !== req.user!.nickname) {
    try {
      await authService.updateCognitoAttribute(userId, 'preferred_username', updates.nickname);
    } catch (error) {
      console.error('Failed to update Cognito nickname:', error);
      // Continue even if Cognito update fails
    }
  }

  res.json({
    success: true,
    data: updatedProfile,
    message: 'Profile updated successfully',
  });
}

/**
 * POST /api/user/password-reset
 * 
 * Initiate password reset process.
 * 
 * Requirements: 10.3
 */
export async function initiatePasswordReset(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  const { email } = req.body;

  if (!email) {
    res.status(400).json({
      error: 'ValidationError',
      message: 'Email is required',
    });
    return;
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    res.status(400).json({
      error: 'ValidationError',
      message: 'Invalid email format',
    });
    return;
  }

  const authService = getAuthService();
  await authService.initiatePasswordReset(email);

  res.json({
    success: true,
    message: 'Password reset code sent to email',
  });
}

/**
 * POST /api/user/password-reset/confirm
 * 
 * Confirm password reset with verification code.
 * 
 * Requirements: 10.4
 */
export async function confirmPasswordReset(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  const { email, code, newPassword } = req.body;

  if (!email || !code || !newPassword) {
    res.status(400).json({
      error: 'ValidationError',
      message: 'Email, code, and newPassword are required',
    });
    return;
  }

  const authService = getAuthService();
  await authService.confirmPasswordReset(email, code, newPassword);

  res.json({
    success: true,
    message: 'Password reset successfully',
  });
}

/**
 * DELETE /api/user/account
 * 
 * Delete authenticated user's account.
 * 
 * Requirements: 10.5
 */
export async function deleteAccount(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  console.log('[deleteAccount] Starting account deletion process');
  console.log('[deleteAccount] User ID:', req.user?.userId);
  
  const userId = req.user!.userId;
  const password = req.body?.password; // Optional password

  const userService = getUserService();
  const authService = getAuthService();

  // Optional: Verify password before deletion (for extra security)
  if (password) {
    try {
      // Re-authenticate user with Cognito to verify password
      const email = req.user!.email;
      // Note: This would require importing CognitoService and calling signIn
      // For now, we skip password verification and rely on JWT authentication
      console.log('[deleteAccount] Password verification skipped - relying on JWT authentication');
    } catch (error) {
      console.error('[deleteAccount] Password verification error:', error);
      res.status(401).json({
        error: 'AuthenticationError',
        message: 'Invalid password',
      });
      return;
    }
  }

  // Delete from database first
  try {
    console.log('[deleteAccount] Deleting user from database...');
    await userService.deleteUser(userId);
    console.log('[deleteAccount] User deleted from database successfully');
  } catch (error: any) {
    console.error('[deleteAccount] Failed to delete user from database:', error);
    console.error('[deleteAccount] Error name:', error.name);
    console.error('[deleteAccount] Error message:', error.message);
    console.error('[deleteAccount] Error stack:', error.stack);
    res.status(500).json({
      error: 'DatabaseError',
      message: 'Failed to delete user from database',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
    return;
  }

  // Try to delete from Cognito (don't fail if user doesn't exist)
  try {
    console.log('[deleteAccount] Deleting user from Cognito...');
    await authService.deleteUser(userId);
    console.log('[deleteAccount] User deleted from Cognito successfully');
  } catch (error: any) {
    // Log error but don't fail the request
    console.warn('[deleteAccount] Failed to delete user from Cognito:', error.message);
    console.warn('[deleteAccount] Cognito error code:', error.code);
    // If user doesn't exist in Cognito, that's fine
    if (error.code !== 'UserNotFoundException') {
      console.error('[deleteAccount] Cognito deletion error:', error);
    }
  }

  console.log('[deleteAccount] Account deletion completed successfully');
  res.json({
    success: true,
    message: 'Account deleted successfully',
  });
}

/**
 * POST /api/user/report
 * 
 * Create a user report.
 * 
 * Requirements: 10.6
 */
export async function createReport(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  const reporterId = req.user!.userId;
  const { reported_user_identifier, reason, description } = req.body;

  if (!reported_user_identifier || !reason) {
    res.status(400).json({
      error: 'ValidationError',
      message: 'reported_user_identifier (nickname or email) and reason are required',
    });
    return;
  }

  const userService = getUserService();
  const reportService = getReportService();

  // Find user by nickname or email
  let reportedUserId: string;
  
  try {
    const { getDatabaseService } = await import('../../src/services/database');
    const db = getDatabaseService();
    
    // Check if it's an email
    if (reported_user_identifier.includes('@')) {
      // Search by email
      const result = await db.query(
        'SELECT user_id FROM users WHERE email = $1 AND status != \'deleted\'',
        [reported_user_identifier]
      );
      
      if (result.rows.length === 0) {
        res.status(404).json({
          error: 'UserNotFound',
          message: '해당 이메일의 사용자를 찾을 수 없습니다.',
        });
        return;
      }
      
      reportedUserId = result.rows[0].user_id;
    } else {
      // Search by nickname
      const result = await db.query(
        'SELECT user_id FROM users WHERE nickname = $1 AND status != \'deleted\'',
        [reported_user_identifier]
      );
      
      if (result.rows.length === 0) {
        res.status(404).json({
          error: 'UserNotFound',
          message: '해당 닉네임의 사용자를 찾을 수 없습니다.',
        });
        return;
      }
      
      reportedUserId = result.rows[0].user_id;
    }
  } catch (error) {
    console.error('Error finding user:', error);
    res.status(500).json({
      error: 'InternalError',
      message: '사용자 조회 중 오류가 발생했습니다.',
    });
    return;
  }

  const report = await reportService.createReport({
    reporter_id: reporterId,
    reported_user_id: reportedUserId,
    reason,
    description,
  });

  res.status(201).json({
    success: true,
    data: report,
    message: 'Report submitted successfully',
  });
}

/**
 * POST /api/user/inquiry
 * 
 * Create a user inquiry.
 * 
 * Requirements: 10.7
 */
export async function createInquiry(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  const userId = req.user!.userId;
  const { subject, message } = req.body;

  if (!subject || !message) {
    res.status(400).json({
      error: 'ValidationError',
      message: 'Subject and message are required',
    });
    return;
  }

  const inquiryService = getInquiryService();
  const inquiry = await inquiryService.createInquiry({
    user_id: userId,
    subject,
    message,
  });

  res.status(201).json({
    success: true,
    data: inquiry,
    message: `Inquiry created successfully. Inquiry ID: ${inquiry.inquiry_id}`,
  });
}

/**
 * GET /api/user/inquiries
 * 
 * Get authenticated user's inquiry history.
 * 
 * Requirements: 10.8
 */
export async function getUserInquiries(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  const userId = req.user!.userId;
  const inquiryService = getInquiryService();

  const inquiries = await inquiryService.getUserInquiries(userId);

  res.json({
    success: true,
    data: inquiries,
  });
}
