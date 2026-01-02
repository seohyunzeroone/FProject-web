/**
 * Database Utility Functions
 * 
 * Helper functions for common database operations and query building.
 */

import { QueryResult } from 'pg';

/**
 * Build WHERE clause for SQL queries
 */
export function buildWhereClause(
  conditions: Record<string, any>,
  startIndex: number = 1
): { clause: string; values: any[] } {
  const entries = Object.entries(conditions).filter(([_, value]) => value !== undefined);
  
  if (entries.length === 0) {
    return { clause: '', values: [] };
  }

  const clauses = entries.map(([key], index) => `${key} = $${startIndex + index}`);
  const values = entries.map(([_, value]) => value);

  return {
    clause: `WHERE ${clauses.join(' AND ')}`,
    values,
  };
}

/**
 * Build UPDATE SET clause for SQL queries
 */
export function buildUpdateClause(
  updates: Record<string, any>,
  startIndex: number = 1
): { clause: string; values: any[] } {
  const entries = Object.entries(updates).filter(([_, value]) => value !== undefined);
  
  if (entries.length === 0) {
    throw new Error('No fields to update');
  }

  const clauses = entries.map(([key], index) => `${key} = $${startIndex + index}`);
  const values = entries.map(([_, value]) => value);

  return {
    clause: `SET ${clauses.join(', ')}`,
    values,
  };
}

/**
 * Build INSERT clause for SQL queries
 */
export function buildInsertClause(
  data: Record<string, any>
): { columns: string; placeholders: string; values: any[] } {
  const entries = Object.entries(data).filter(([_, value]) => value !== undefined);
  
  if (entries.length === 0) {
    throw new Error('No data to insert');
  }

  const columns = entries.map(([key]) => key).join(', ');
  const placeholders = entries.map((_, index) => `$${index + 1}`).join(', ');
  const values = entries.map(([_, value]) => value);

  return { columns, placeholders, values };
}

/**
 * Extract single row from query result
 */
export function extractSingleRow<T>(result: QueryResult<T>): T | null {
  return result.rows.length > 0 ? result.rows[0] : null;
}

/**
 * Extract all rows from query result
 */
export function extractRows<T>(result: QueryResult<T>): T[] {
  return result.rows;
}

/**
 * Check if query result has rows
 */
export function hasRows(result: QueryResult): boolean {
  return result.rowCount !== null && result.rowCount > 0;
}

/**
 * Sanitize user input for LIKE queries
 */
export function sanitizeLikePattern(input: string): string {
  return input.replace(/[%_\\]/g, '\\$&');
}

/**
 * Convert camelCase to snake_case
 */
export function toSnakeCase(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

/**
 * Convert snake_case to camelCase
 */
export function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Convert object keys from snake_case to camelCase
 */
export function keysToCamelCase<T = any>(obj: Record<string, any>): T {
  const result: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = toCamelCase(key);
    result[camelKey] = value;
  }
  
  return result as T;
}

/**
 * Convert object keys from camelCase to snake_case
 */
export function keysToSnakeCase(obj: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = toSnakeCase(key);
    result[snakeKey] = value;
  }
  
  return result;
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone number format (international format)
 */
export function isValidPhoneNumber(phone: string): boolean {
  if (!phone || phone.trim() === '') {
    return true; // Empty phone number is valid (optional field)
  }
  
  // Remove spaces and hyphens for validation
  const cleanPhone = phone.replace(/[\s-]/g, '');
  
  // Accept various formats:
  // - International: +1234567890, +12-345-678-90
  // - Korean: 01012345678, 010-1234-5678
  // - General: 10-15 digits with optional + prefix
  const phoneRegex = /^(\+?[1-9]\d{9,14}|0\d{9,10})$/;
  
  return phoneRegex.test(cleanPhone);
}

/**
 * Validate nickname format
 * - 2-20 characters
 * - Allowed: Korean (한글), English (a-z, A-Z), Numbers (0-9), Underscore (_)
 * - Not allowed: Special characters except underscore, spaces
 */
export function isValidNickname(nickname: string): boolean {
  // 한글, 영문, 숫자, 언더스코어만 허용 (2-20자)
  const nicknameRegex = /^[가-힣a-zA-Z0-9_]{2,20}$/;
  return nicknameRegex.test(nickname);
}

/**
 * Validate password strength
 */
export function isValidPassword(password: string): boolean {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
}

/**
 * Create pagination parameters
 */
export interface PaginationParams {
  limit: number;
  offset: number;
}

export function createPaginationParams(
  page: number = 1,
  pageSize: number = 10
): PaginationParams {
  const limit = Math.max(1, Math.min(pageSize, 100)); // Max 100 items per page
  const offset = (Math.max(1, page) - 1) * limit;
  
  return { limit, offset };
}

/**
 * Create pagination response
 */
export interface PaginationResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

export function createPaginationResponse<T>(
  data: T[],
  totalItems: number,
  page: number,
  pageSize: number
): PaginationResponse<T> {
  const totalPages = Math.ceil(totalItems / pageSize);
  
  return {
    data,
    pagination: {
      page,
      pageSize,
      totalItems,
      totalPages,
      hasNext: page < totalPages,
      hasPrevious: page > 1,
    },
  };
}
