/**
 * User Service Module
 * 
 * Handles user profile management operations including:
 * - Fetching user profiles
 * - Updating user profiles
 * - Deleting users (soft delete)
 * - Nickname availability checking
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 4.3, 4.4, 6.3, 6.4
 */

import { getDatabaseService } from './database';
import { 
  isValidNickname, 
  isValidPhoneNumber,
  keysToCamelCase,
  keysToSnakeCase 
} from './databaseUtils';
import type { 
  User, 
  UserProfile, 
  FullUserProfile,
  UpdateUserProfileData 
} from '../types/database';

/**
 * User Service Error Types
 */
export class UserNotFoundError extends Error {
  constructor(userId: string) {
    super(`User not found: ${userId}`);
    this.name = 'UserNotFoundError';
  }
}

export class NicknameAlreadyExistsError extends Error {
  constructor(nickname: string) {
    super(`Nickname already exists: ${nickname}`);
    this.name = 'NicknameAlreadyExistsError';
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * User Service Class
 */
export class UserService {
  /**
   * Get user profile by user ID
   * 
   * Fetches user data from both users and user_profiles tables
   * and combines them into a single profile object.
   * 
   * @param userId - Cognito user ID (sub)
   * @returns Full user profile
   * @throws UserNotFoundError if user doesn't exist
   * 
   * Requirements: 3.1, 3.2, 3.3, 3.4
   */
  async getUserProfile(userId: string): Promise<FullUserProfile> {
    const db = getDatabaseService();

    // Query to join users and user_profiles tables
    const query = `
      SELECT 
        u.user_id,
        u.email,
        u.nickname,
        u.status,
        u.created_at,
        u.updated_at,
        p.profile_image_url,
        p.bio,
        p.phone_number
      FROM users u
      LEFT JOIN user_profiles p ON u.user_id = p.user_id
      WHERE u.user_id = $1 AND u.status != 'deleted'
    `;

    const result = await db.query(query, [userId]);

    if (result.rows.length === 0) {
      throw new UserNotFoundError(userId);
    }

    const row = result.rows[0];

    // Convert snake_case to camelCase and return
    return keysToCamelCase<FullUserProfile>(row);
  }

  /**
   * Update user profile
   * 
   * Updates user profile information with validation.
   * Supports updating: nickname, profile_image_url, bio, phone_number
   * 
   * @param userId - Cognito user ID (sub)
   * @param updates - Profile fields to update
   * @returns Updated user profile
   * @throws UserNotFoundError if user doesn't exist
   * @throws NicknameAlreadyExistsError if nickname is taken
   * @throws ValidationError if validation fails
   * 
   * Requirements: 4.1, 4.2, 4.3, 4.4
   */
  async updateUserProfile(
    userId: string,
    updates: UpdateUserProfileData
  ): Promise<FullUserProfile> {
    const db = getDatabaseService();

    // Validate inputs
    if (updates.nickname !== undefined) {
      // Validate nickname format (2-20 characters, Korean/English/Numbers/Underscore)
      if (updates.nickname.length < 2 || updates.nickname.length > 20) {
        throw new ValidationError('Nickname must be between 2 and 20 characters');
      }

      if (!isValidNickname(updates.nickname)) {
        throw new ValidationError('Nickname can only contain Korean, English letters, numbers, and underscores');
      }

      // Check nickname uniqueness
      const isAvailable = await this.checkNicknameAvailability(updates.nickname, userId);
      if (!isAvailable) {
        throw new NicknameAlreadyExistsError(updates.nickname);
      }
    }

    if (updates.bio !== undefined && updates.bio.length > 500) {
      throw new ValidationError('Bio must not exceed 500 characters');
    }

    if (updates.phone_number !== undefined && updates.phone_number !== null && updates.phone_number !== '') {
      if (!isValidPhoneNumber(updates.phone_number)) {
        throw new ValidationError('Invalid phone number format');
      }
    }

    // Use transaction to ensure atomicity
    return await db.transaction(async (client) => {
      // Update users table if nickname is being changed
      if (updates.nickname !== undefined) {
        await client.query(
          'UPDATE users SET nickname = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2',
          [updates.nickname, userId]
        );
      }

      // Update user_profiles table
      const profileUpdates: any = {};
      if (updates.profile_image_url !== undefined) {
        profileUpdates.profile_image_url = updates.profile_image_url;
      }
      if (updates.bio !== undefined) {
        profileUpdates.bio = updates.bio;
      }
      if (updates.phone_number !== undefined) {
        profileUpdates.phone_number = updates.phone_number;
      }

      if (Object.keys(profileUpdates).length > 0) {
        const setClause = Object.keys(profileUpdates)
          .map((key, index) => `${key} = $${index + 1}`)
          .join(', ');
        
        const values = Object.values(profileUpdates);
        values.push(userId);

        await client.query(
          `UPDATE user_profiles SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE user_id = $${values.length}`,
          values
        );
      }

      // Fetch and return updated profile
      const result = await client.query(`
        SELECT 
          u.user_id,
          u.email,
          u.nickname,
          u.status,
          u.created_at,
          u.updated_at,
          p.profile_image_url,
          p.bio,
          p.phone_number
        FROM users u
        LEFT JOIN user_profiles p ON u.user_id = p.user_id
        WHERE u.user_id = $1
      `, [userId]);

      if (result.rows.length === 0) {
        throw new UserNotFoundError(userId);
      }

      return keysToCamelCase<FullUserProfile>(result.rows[0]);
    });
  }

  /**
   * Delete user (hard delete)
   * 
   * Permanently deletes user and related data from the database.
   * This includes user_profiles, user_reports, and user_inquiries.
   * 
   * @param userId - Cognito user ID (sub)
   * @throws UserNotFoundError if user doesn't exist
   * 
   * Requirements: 6.3, 6.4
   */
  async deleteUser(userId: string): Promise<void> {
    console.log('[UserService.deleteUser] Starting deletion for user:', userId);
    const db = getDatabaseService();

    return await db.transaction(async (client) => {
      // Check if user exists
      console.log('[UserService.deleteUser] Checking if user exists...');
      const checkResult = await client.query(
        'SELECT user_id FROM users WHERE user_id = $1',
        [userId]
      );

      if (checkResult.rows.length === 0) {
        console.error('[UserService.deleteUser] User not found:', userId);
        throw new UserNotFoundError(userId);
      }
      console.log('[UserService.deleteUser] User exists, proceeding with deletion');

      // Delete related records first (foreign key constraints)
      
      // Delete user_reports where user is reporter or reported
      console.log('[UserService.deleteUser] Deleting user_reports...');
      try {
        const reportsResult = await client.query(
          'DELETE FROM user_reports WHERE reporter_id = $1 OR reported_user_id = $1',
          [userId]
        );
        console.log('[UserService.deleteUser] Deleted', reportsResult.rowCount, 'reports');
      } catch (error: any) {
        console.error('[UserService.deleteUser] Error deleting reports:', error.message);
        // Continue even if table doesn't exist
        if (error.code !== '42P01') { // undefined_table
          throw error;
        }
      }

      // Delete user_inquiries
      console.log('[UserService.deleteUser] Deleting user_inquiries...');
      try {
        const inquiriesResult = await client.query(
          'DELETE FROM user_inquiries WHERE user_id = $1',
          [userId]
        );
        console.log('[UserService.deleteUser] Deleted', inquiriesResult.rowCount, 'inquiries');
      } catch (error: any) {
        console.error('[UserService.deleteUser] Error deleting inquiries:', error.message);
        // Continue even if table doesn't exist
        if (error.code !== '42P01') { // undefined_table
          throw error;
        }
      }

      // Delete user_profiles (has ON DELETE CASCADE, but delete explicitly for clarity)
      console.log('[UserService.deleteUser] Deleting user_profiles...');
      const profilesResult = await client.query(
        'DELETE FROM user_profiles WHERE user_id = $1',
        [userId]
      );
      console.log('[UserService.deleteUser] Deleted', profilesResult.rowCount, 'profiles');

      // Finally, delete user
      console.log('[UserService.deleteUser] Deleting user record...');
      const userResult = await client.query(
        'DELETE FROM users WHERE user_id = $1',
        [userId]
      );
      console.log('[UserService.deleteUser] Deleted', userResult.rowCount, 'user records');
      
      console.log('[UserService.deleteUser] Deletion completed successfully');
    });
  }

  /**
   * Check if nickname is available
   * 
   * Checks if a nickname is already taken by another user.
   * 
   * @param nickname - Nickname to check
   * @param excludeUserId - Optional user ID to exclude from check (for updates)
   * @returns true if nickname is available, false otherwise
   * 
   * Requirements: 4.1
   */
  async checkNicknameAvailability(
    nickname: string,
    excludeUserId?: string
  ): Promise<boolean> {
    const db = getDatabaseService();

    let query = 'SELECT user_id FROM users WHERE nickname = $1 AND status != \'deleted\'';
    const params: any[] = [nickname];

    if (excludeUserId) {
      query += ' AND user_id != $2';
      params.push(excludeUserId);
    }

    const result = await db.query(query, params);
    return result.rows.length === 0;
  }

  /**
   * Create new user
   * 
   * Creates a new user record in both users and user_profiles tables.
   * This is typically called by Lambda triggers after Cognito signup.
   * 
   * @param userId - Cognito user ID (sub)
   * @param email - User email
   * @param nickname - User nickname
   * @returns Created user profile
   * 
   * Requirements: 2.1
   */
  async createUser(
    userId: string,
    email: string,
    nickname: string
  ): Promise<FullUserProfile> {
    const db = getDatabaseService();

    return await db.transaction(async (client) => {
      // Insert into users table
      await client.query(
        `INSERT INTO users (user_id, email, nickname, status)
         VALUES ($1, $2, $3, 'active')`,
        [userId, email, nickname]
      );

      // Insert into user_profiles table
      await client.query(
        `INSERT INTO user_profiles (user_id)
         VALUES ($1)`,
        [userId]
      );

      // Fetch and return created profile
      const result = await client.query(`
        SELECT 
          u.user_id,
          u.email,
          u.nickname,
          u.status,
          u.created_at,
          u.updated_at,
          p.profile_image_url,
          p.bio,
          p.phone_number
        FROM users u
        LEFT JOIN user_profiles p ON u.user_id = p.user_id
        WHERE u.user_id = $1
      `, [userId]);

      return keysToCamelCase<FullUserProfile>(result.rows[0]);
    });
  }

  /**
   * Update last login timestamp
   * 
   * Updates the user's last login time.
   * This is typically called by Lambda triggers after authentication.
   * 
   * @param userId - Cognito user ID (sub)
   * 
   * Requirements: 2.2
   */
  async updateLastLogin(userId: string): Promise<void> {
    const db = getDatabaseService();

    await db.query(
      'UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE user_id = $1',
      [userId]
    );
  }
}

/**
 * Singleton instance
 */
let userServiceInstance: UserService | null = null;

/**
 * Get UserService instance
 */
export function getUserService(): UserService {
  if (!userServiceInstance) {
    userServiceInstance = new UserService();
  }
  return userServiceInstance;
}
