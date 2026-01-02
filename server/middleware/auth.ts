/**
 * Authentication Middleware
 * 
 * Verifies JWT tokens from AWS Cognito and attaches user info to request.
 * 
 * Requirements: 10.9
 */

import { Request, Response, NextFunction } from 'express';
import { getAuthService } from '../../src/services/authService';

/**
 * Extended Request interface with user info
 */
export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    nickname?: string;
  };
}

/**
 * Authentication middleware
 * 
 * Extracts and verifies JWT token from Authorization header.
 * Attaches decoded user info to request object.
 * 
 * @param req - Express request
 * @param res - Express response
 * @param next - Express next function
 */
export async function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Missing or invalid authorization header',
      });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token using AuthService
    const authService = getAuthService();
    const decodedToken = await authService.verifyToken(token);

    // Attach user info to request
    req.user = {
      userId: decodedToken.sub,
      email: decodedToken.email,
      nickname: decodedToken.preferred_username,
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or expired token',
    });
  }
}

/**
 * Optional authentication middleware
 * 
 * Similar to authMiddleware but doesn't fail if token is missing.
 * Useful for endpoints that work with or without authentication.
 * 
 * @param req - Express request
 * @param res - Express response
 * @param next - Express next function
 */
export async function optionalAuthMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const authService = getAuthService();
      const decodedToken = await authService.verifyToken(token);

      req.user = {
        userId: decodedToken.sub,
        email: decodedToken.email,
        nickname: decodedToken.preferred_username,
      };
    }

    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
}
