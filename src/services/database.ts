/**
 * Database Connection Service
 * 
 * Provides connection pooling and query execution for PostgreSQL database.
 * Implements retry logic with exponential backoff for connection failures.
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 9.1, 9.4
 */

import { Pool, PoolClient, PoolConfig, QueryResult } from 'pg';

/**
 * Database configuration interface
 */
export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  max: number;  // Maximum number of connections in pool
  idleTimeoutMillis: number;  // How long a client can remain idle before being closed
  connectionTimeoutMillis: number;  // How long to wait for a connection
  ssl?: boolean | { rejectUnauthorized: boolean };
}

/**
 * Query parameters type
 */
export type QueryParams = any[];

/**
 * Transaction callback type
 */
export type TransactionCallback<T> = (client: PoolClient) => Promise<T>;

/**
 * Database service class with connection pooling
 */
export class DatabaseService {
  private pool: Pool | null = null;
  private config: DatabaseConfig;
  private maxRetries: number = 3;
  private retryDelay: number = 1000; // Initial retry delay in ms

  constructor(config: DatabaseConfig) {
    this.config = config;
  }

  /**
   * Initialize the connection pool
   */
  public async connect(): Promise<void> {
    if (this.pool) {
      console.warn('Database pool already initialized');
      return;
    }

    const poolConfig: PoolConfig = {
      host: this.config.host,
      port: this.config.port,
      database: this.config.database,
      user: this.config.user,
      password: this.config.password,
      max: this.config.max,
      idleTimeoutMillis: this.config.idleTimeoutMillis,
      connectionTimeoutMillis: this.config.connectionTimeoutMillis,
      ssl: this.config.ssl,
    };

    this.pool = new Pool(poolConfig);

    // Handle pool errors
    this.pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
    });

    // Test connection with retry logic
    await this.testConnection();

    console.log('Database connection pool initialized successfully');
  }

  /**
   * Test database connection with retry logic
   */
  private async testConnection(): Promise<void> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const client = await this.pool!.connect();
        await client.query('SELECT NOW()');
        client.release();
        console.log('Database connection test successful');
        return;
      } catch (error) {
        lastError = error as Error;
        console.error(`Connection attempt ${attempt} failed:`, error);

        if (attempt < this.maxRetries) {
          const delay = this.retryDelay * Math.pow(2, attempt - 1); // Exponential backoff
          console.log(`Retrying in ${delay}ms...`);
          await this.sleep(delay);
        }
      }
    }

    throw new Error(
      `Failed to connect to database after ${this.maxRetries} attempts: ${lastError?.message}`
    );
  }

  /**
   * Execute a query with parameterized values
   * 
   * @param sql - SQL query string with $1, $2, etc. placeholders
   * @param params - Array of parameter values
   * @returns Query result
   */
  public async query<T = any>(
    sql: string,
    params: QueryParams = []
  ): Promise<QueryResult<T>> {
    if (!this.pool) {
      throw new Error('Database pool not initialized. Call connect() first.');
    }

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const result = await this.pool.query<T>(sql, params);
        return result;
      } catch (error) {
        lastError = error as Error;
        console.error(`Query attempt ${attempt} failed:`, error);

        // Don't retry on syntax errors or constraint violations
        if (this.isNonRetryableError(error as Error)) {
          throw error;
        }

        if (attempt < this.maxRetries) {
          const delay = this.retryDelay * Math.pow(2, attempt - 1);
          console.log(`Retrying query in ${delay}ms...`);
          await this.sleep(delay);
        }
      }
    }

    throw new Error(
      `Query failed after ${this.maxRetries} attempts: ${lastError?.message}`
    );
  }

  /**
   * Execute a transaction
   * 
   * @param callback - Function that performs database operations within transaction
   * @returns Result from callback
   */
  public async transaction<T>(
    callback: TransactionCallback<T>
  ): Promise<T> {
    if (!this.pool) {
      throw new Error('Database pool not initialized. Call connect() first.');
    }

    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Close the connection pool
   */
  public async close(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
      console.log('Database connection pool closed');
    }
  }

  /**
   * Get pool statistics
   */
  public getPoolStats() {
    if (!this.pool) {
      return null;
    }

    return {
      totalCount: this.pool.totalCount,
      idleCount: this.pool.idleCount,
      waitingCount: this.pool.waitingCount,
    };
  }

  /**
   * Check if error is non-retryable (syntax error, constraint violation, etc.)
   */
  private isNonRetryableError(error: Error): boolean {
    const nonRetryableCodes = [
      '23505', // unique_violation
      '23503', // foreign_key_violation
      '23502', // not_null_violation
      '23514', // check_violation
      '42601', // syntax_error
      '42501', // insufficient_privilege
      '42P01', // undefined_table
    ];

    const pgError = error as any;
    return nonRetryableCodes.includes(pgError.code);
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Create database configuration from environment variables
 */
export function createDatabaseConfig(): DatabaseConfig {
  const config: DatabaseConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME || 'fproject_db',
    user: process.env.DB_USER || 'fproject_user',
    password: process.env.DB_PASSWORD || '',
    max: parseInt(process.env.DB_MAX_CONNECTIONS || '20', 10),
    idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000', 10),
    connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '5000', 10),
  };

  // Enable SSL in production
  if (process.env.NODE_ENV === 'production') {
    config.ssl = {
      rejectUnauthorized: false, // Set to true with proper certificates in production
    };
  }

  return config;
}

/**
 * Singleton database service instance
 */
let dbInstance: DatabaseService | null = null;

/**
 * Get or create database service instance
 */
export function getDatabaseService(): DatabaseService {
  if (!dbInstance) {
    const config = createDatabaseConfig();
    dbInstance = new DatabaseService(config);
  }
  return dbInstance;
}

/**
 * Initialize database connection
 */
export async function initializeDatabase(): Promise<DatabaseService> {
  const db = getDatabaseService();
  await db.connect();
  return db;
}

/**
 * Close database connection
 */
export async function closeDatabaseConnection(): Promise<void> {
  if (dbInstance) {
    await dbInstance.close();
    dbInstance = null;
  }
}
