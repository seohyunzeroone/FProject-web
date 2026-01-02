/**
 * Inquiry Service Module
 * 
 * Handles user inquiry operations including:
 * - Creating user inquiries
 * - Retrieving user inquiry history
 * - Validating inquiry data
 * 
 * Requirements: 8.1, 8.2, 8.3, 8.4
 */

import { getDatabaseService } from './database';
import { keysToCamelCase } from './databaseUtils';
import type { UserInquiry, CreateUserInquiryData } from '../types/database';

/**
 * Inquiry Service Error Types
 */
export class InquiryValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InquiryValidationError';
  }
}

/**
 * Inquiry Service Class
 */
export class InquiryService {
  /**
   * Create a new user inquiry
   * 
   * Creates an inquiry for customer support.
   * Validates that:
   * - Subject length is within limits (max 200 characters)
   * - Message length is within limits (max 2000 characters)
   * 
   * @param inquiryData - Inquiry data
   * @returns Created inquiry with inquiry_id
   * @throws InquiryValidationError if validation fails
   * 
   * Requirements: 8.1, 8.2, 8.3
   */
  async createInquiry(inquiryData: CreateUserInquiryData): Promise<UserInquiry> {
    const db = getDatabaseService();

    // Validate subject length (Requirement 8.1)
    if (!inquiryData.subject || inquiryData.subject.trim().length === 0) {
      throw new InquiryValidationError('Subject is required');
    }

    if (inquiryData.subject.length > 200) {
      throw new InquiryValidationError('Subject must not exceed 200 characters');
    }

    // Validate message length (Requirement 8.1)
    if (!inquiryData.message || inquiryData.message.trim().length === 0) {
      throw new InquiryValidationError('Message is required');
    }

    if (inquiryData.message.length > 2000) {
      throw new InquiryValidationError('Message must not exceed 2000 characters');
    }

    // Insert inquiry (Requirement 8.2, 8.3)
    const query = `
      INSERT INTO user_inquiries (user_id, subject, message, status)
      VALUES ($1, $2, $3, 'pending')
      RETURNING *
    `;

    const values = [
      inquiryData.user_id,
      inquiryData.subject.trim(),
      inquiryData.message.trim(),
    ];

    const result = await db.query(query, values);

    return keysToCamelCase<UserInquiry>(result.rows[0]);
  }

  /**
   * Get user inquiries
   * 
   * Retrieves all inquiries submitted by a specific user,
   * ordered by creation date (most recent first).
   * 
   * @param userId - User ID
   * @returns Array of inquiries
   * 
   * Requirements: 8.4
   */
  async getUserInquiries(userId: string): Promise<UserInquiry[]> {
    const db = getDatabaseService();

    const query = `
      SELECT *
      FROM user_inquiries
      WHERE user_id = $1
      ORDER BY created_at DESC
    `;

    const result = await db.query(query, [userId]);

    return result.rows.map(row => keysToCamelCase<UserInquiry>(row));
  }

  /**
   * Get inquiry by ID
   * 
   * Retrieves a specific inquiry by its ID.
   * 
   * @param inquiryId - Inquiry ID
   * @returns Inquiry or null if not found
   */
  async getInquiryById(inquiryId: number): Promise<UserInquiry | null> {
    const db = getDatabaseService();

    const query = `
      SELECT *
      FROM user_inquiries
      WHERE inquiry_id = $1
    `;

    const result = await db.query(query, [inquiryId]);

    if (result.rows.length === 0) {
      return null;
    }

    return keysToCamelCase<UserInquiry>(result.rows[0]);
  }

  /**
   * Update inquiry status
   * 
   * Updates the status of an inquiry and optionally adds a response.
   * 
   * @param inquiryId - Inquiry ID
   * @param status - New status
   * @param response - Optional response message
   * @returns Updated inquiry
   */
  async updateInquiryStatus(
    inquiryId: number,
    status: 'pending' | 'answered' | 'closed',
    response?: string
  ): Promise<UserInquiry> {
    const db = getDatabaseService();

    const query = `
      UPDATE user_inquiries
      SET status = $1,
          response = $2,
          answered_at = CASE WHEN $1 = 'answered' THEN CURRENT_TIMESTAMP ELSE answered_at END
      WHERE inquiry_id = $3
      RETURNING *
    `;

    const result = await db.query(query, [status, response || null, inquiryId]);

    if (result.rows.length === 0) {
      throw new Error(`Inquiry not found: ${inquiryId}`);
    }

    return keysToCamelCase<UserInquiry>(result.rows[0]);
  }

  /**
   * Get pending inquiries
   * 
   * Retrieves all inquiries with 'pending' status.
   * Useful for admin review.
   * 
   * @param limit - Maximum number of inquiries to return
   * @param offset - Number of inquiries to skip
   * @returns Array of pending inquiries
   */
  async getPendingInquiries(limit: number = 50, offset: number = 0): Promise<UserInquiry[]> {
    const db = getDatabaseService();

    const query = `
      SELECT *
      FROM user_inquiries
      WHERE status = 'pending'
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2
    `;

    const result = await db.query(query, [limit, offset]);

    return result.rows.map(row => keysToCamelCase<UserInquiry>(row));
  }

  /**
   * Get inquiry count for user
   * 
   * Gets the total number of inquiries submitted by a user.
   * 
   * @param userId - User ID
   * @returns Inquiry count
   */
  async getInquiryCountForUser(userId: string): Promise<number> {
    const db = getDatabaseService();

    const query = `
      SELECT COUNT(*) as count
      FROM user_inquiries
      WHERE user_id = $1
    `;

    const result = await db.query(query, [userId]);

    return parseInt(result.rows[0].count, 10);
  }

  /**
   * Get answered inquiries for user
   * 
   * Retrieves all answered inquiries for a specific user.
   * 
   * @param userId - User ID
   * @returns Array of answered inquiries
   */
  async getAnsweredInquiries(userId: string): Promise<UserInquiry[]> {
    const db = getDatabaseService();

    const query = `
      SELECT *
      FROM user_inquiries
      WHERE user_id = $1 AND status = 'answered'
      ORDER BY answered_at DESC
    `;

    const result = await db.query(query, [userId]);

    return result.rows.map(row => keysToCamelCase<UserInquiry>(row));
  }
}

/**
 * Singleton instance
 */
let inquiryServiceInstance: InquiryService | null = null;

/**
 * Get InquiryService instance
 */
export function getInquiryService(): InquiryService {
  if (!inquiryServiceInstance) {
    inquiryServiceInstance = new InquiryService();
  }
  return inquiryServiceInstance;
}
