/**
 * Report Service Module
 * 
 * Handles user report operations including:
 * - Creating user reports
 * - Checking for duplicate reports
 * - Validating report data
 * 
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6
 */

import { getDatabaseService } from './database';
import { keysToCamelCase } from './databaseUtils';
import type { UserReport, CreateUserReportData } from '../types/database';

/**
 * Report reason types
 */
export type ReportReason = 'spam' | 'harassment' | 'inappropriate_content' | 'other';

/**
 * Valid report reasons
 */
export const VALID_REPORT_REASONS: ReportReason[] = [
  'spam',
  'harassment',
  'inappropriate_content',
  'other',
];

/**
 * Report Service Error Types
 */
export class SelfReportError extends Error {
  constructor() {
    super('Users cannot report themselves');
    this.name = 'SelfReportError';
  }
}

export class DuplicateReportError extends Error {
  constructor() {
    super('A report for this user already exists within the last 24 hours');
    this.name = 'DuplicateReportError';
  }
}

export class InvalidReportReasonError extends Error {
  constructor(reason: string) {
    super(`Invalid report reason: ${reason}. Must be one of: ${VALID_REPORT_REASONS.join(', ')}`);
    this.name = 'InvalidReportReasonError';
  }
}

export class ReportValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ReportValidationError';
  }
}

/**
 * Report Service Class
 */
export class ReportService {
  /**
   * Create a new user report
   * 
   * Creates a report for inappropriate user behavior.
   * Validates that:
   * - Reporter and reported user are different
   * - Reason is valid
   * - Description length is within limits
   * - No duplicate report exists within 24 hours
   * 
   * @param reportData - Report data
   * @returns Created report
   * @throws SelfReportError if reporter_id equals reported_user_id
   * @throws InvalidReportReasonError if reason is invalid
   * @throws ReportValidationError if validation fails
   * @throws DuplicateReportError if duplicate report exists
   * 
   * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6
   */
  async createReport(reportData: CreateUserReportData): Promise<UserReport> {
    const db = getDatabaseService();

    // Validate reporter_id != reported_user_id (Requirement 7.1)
    if (reportData.reporter_id === reportData.reported_user_id) {
      throw new SelfReportError();
    }

    // Validate reason (Requirement 7.2)
    if (!VALID_REPORT_REASONS.includes(reportData.reason as ReportReason)) {
      throw new InvalidReportReasonError(reportData.reason);
    }

    // Validate description length (Requirement 7.4)
    if (reportData.description && reportData.description.length > 1000) {
      throw new ReportValidationError('Description must not exceed 1000 characters');
    }

    // Check for duplicate report within 24 hours (Requirement 7.6)
    const hasDuplicate = await this.checkDuplicateReport(
      reportData.reporter_id,
      reportData.reported_user_id
    );

    if (hasDuplicate) {
      throw new DuplicateReportError();
    }

    // Insert report (Requirement 7.3, 7.5)
    const query = `
      INSERT INTO user_reports (reporter_id, reported_user_id, reason, description, status)
      VALUES ($1, $2, $3, $4, 'pending')
      RETURNING *
    `;

    const values = [
      reportData.reporter_id,
      reportData.reported_user_id,
      reportData.reason,
      reportData.description || null,
    ];

    const result = await db.query(query, values);

    return keysToCamelCase<UserReport>(result.rows[0]);
  }

  /**
   * Check for duplicate report
   * 
   * Checks if a report from the same reporter for the same reported user
   * exists within the last 24 hours.
   * 
   * @param reporterId - Reporter user ID
   * @param reportedUserId - Reported user ID
   * @returns true if duplicate exists, false otherwise
   * 
   * Requirements: 7.6
   */
  async checkDuplicateReport(
    reporterId: string,
    reportedUserId: string
  ): Promise<boolean> {
    const db = getDatabaseService();

    const query = `
      SELECT report_id
      FROM user_reports
      WHERE reporter_id = $1
        AND reported_user_id = $2
        AND status = 'pending'
        AND created_at > NOW() - INTERVAL '24 hours'
      LIMIT 1
    `;

    const result = await db.query(query, [reporterId, reportedUserId]);

    return result.rows.length > 0;
  }

  /**
   * Get reports by reporter
   * 
   * Retrieves all reports submitted by a specific user.
   * 
   * @param reporterId - Reporter user ID
   * @returns Array of reports
   */
  async getReportsByReporter(reporterId: string): Promise<UserReport[]> {
    const db = getDatabaseService();

    const query = `
      SELECT *
      FROM user_reports
      WHERE reporter_id = $1
      ORDER BY created_at DESC
    `;

    const result = await db.query(query, [reporterId]);

    return result.rows.map(row => keysToCamelCase<UserReport>(row));
  }

  /**
   * Get reports for a user
   * 
   * Retrieves all reports filed against a specific user.
   * 
   * @param reportedUserId - Reported user ID
   * @returns Array of reports
   */
  async getReportsForUser(reportedUserId: string): Promise<UserReport[]> {
    const db = getDatabaseService();

    const query = `
      SELECT *
      FROM user_reports
      WHERE reported_user_id = $1
      ORDER BY created_at DESC
    `;

    const result = await db.query(query, [reportedUserId]);

    return result.rows.map(row => keysToCamelCase<UserReport>(row));
  }

  /**
   * Get report by ID
   * 
   * Retrieves a specific report by its ID.
   * 
   * @param reportId - Report ID
   * @returns Report or null if not found
   */
  async getReportById(reportId: number): Promise<UserReport | null> {
    const db = getDatabaseService();

    const query = `
      SELECT *
      FROM user_reports
      WHERE report_id = $1
    `;

    const result = await db.query(query, [reportId]);

    if (result.rows.length === 0) {
      return null;
    }

    return keysToCamelCase<UserReport>(result.rows[0]);
  }

  /**
   * Update report status
   * 
   * Updates the status of a report (e.g., from 'pending' to 'reviewed').
   * 
   * @param reportId - Report ID
   * @param status - New status
   * @returns Updated report
   */
  async updateReportStatus(
    reportId: number,
    status: 'pending' | 'reviewed' | 'resolved'
  ): Promise<UserReport> {
    const db = getDatabaseService();

    const query = `
      UPDATE user_reports
      SET status = $1, reviewed_at = CURRENT_TIMESTAMP
      WHERE report_id = $2
      RETURNING *
    `;

    const result = await db.query(query, [status, reportId]);

    if (result.rows.length === 0) {
      throw new Error(`Report not found: ${reportId}`);
    }

    return keysToCamelCase<UserReport>(result.rows[0]);
  }

  /**
   * Get pending reports
   * 
   * Retrieves all reports with 'pending' status.
   * Useful for admin review.
   * 
   * @param limit - Maximum number of reports to return
   * @param offset - Number of reports to skip
   * @returns Array of pending reports
   */
  async getPendingReports(limit: number = 50, offset: number = 0): Promise<UserReport[]> {
    const db = getDatabaseService();

    const query = `
      SELECT *
      FROM user_reports
      WHERE status = 'pending'
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2
    `;

    const result = await db.query(query, [limit, offset]);

    return result.rows.map(row => keysToCamelCase<UserReport>(row));
  }

  /**
   * Get report count for user
   * 
   * Gets the total number of reports filed against a user.
   * 
   * @param reportedUserId - Reported user ID
   * @returns Report count
   */
  async getReportCountForUser(reportedUserId: string): Promise<number> {
    const db = getDatabaseService();

    const query = `
      SELECT COUNT(*) as count
      FROM user_reports
      WHERE reported_user_id = $1
    `;

    const result = await db.query(query, [reportedUserId]);

    return parseInt(result.rows[0].count, 10);
  }
}

/**
 * Singleton instance
 */
let reportServiceInstance: ReportService | null = null;

/**
 * Get ReportService instance
 */
export function getReportService(): ReportService {
  if (!reportServiceInstance) {
    reportServiceInstance = new ReportService();
  }
  return reportServiceInstance;
}
