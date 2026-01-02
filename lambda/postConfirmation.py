"""
Cognito PostConfirmation Lambda Trigger

Automatically creates user records in PostgreSQL when a user
confirms their account in Cognito.

This Lambda is triggered after:
- Email verification
- Phone verification
- Admin confirmation

Requirements: 2.1
"""

import json
import os
import psycopg2
from psycopg2 import pool
from typing import Dict, Any

# Database connection pool
# Reused across Lambda invocations for better performance
connection_pool = None


def get_connection_pool():
    """Get or create database connection pool"""
    global connection_pool
    
    if connection_pool is None:
        connection_pool = psycopg2.pool.SimpleConnectionPool(
            1,  # minconn
            5,  # maxconn - Limit connections in Lambda
            host=os.environ.get('DB_HOST'),
            port=int(os.environ.get('DB_PORT', '5432')),
            database=os.environ.get('DB_NAME'),
            user=os.environ.get('DB_USER'),
            password=os.environ.get('DB_PASSWORD'),
            connect_timeout=5
        )
    
    return connection_pool


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    PostConfirmation Lambda Handler
    
    Creates user and user_profile records in PostgreSQL when a user
    confirms their Cognito account.
    
    Args:
        event: Cognito PostConfirmation trigger event
        context: Lambda context
        
    Returns:
        Modified event (required by Cognito)
    """
    print(f'PostConfirmation trigger event: {json.dumps(event, indent=2)}')
    
    user_pool_id = event.get('userPoolId')
    user_name = event.get('userName')
    request = event.get('request', {})
    user_attributes = request.get('userAttributes', {})
    
    # Extract user information from Cognito event
    user_id = user_attributes.get('sub')
    email = user_attributes.get('email')
    nickname = user_attributes.get('preferred_username') or email.split('@')[0]
    
    print(f'Creating user record for: {email} ({user_id})')
    
    pool = get_connection_pool()
    conn = None
    
    try:
        # Get connection from pool
        conn = pool.getconn()
        cursor = conn.cursor()
        
        # Start transaction
        cursor.execute('BEGIN')
        
        # Insert user record
        user_query = """
            INSERT INTO users (user_id, email, nickname, status, created_at, updated_at)
            VALUES (%s, %s, %s, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            ON CONFLICT (user_id) DO UPDATE
            SET email = EXCLUDED.email,
                nickname = EXCLUDED.nickname,
                updated_at = CURRENT_TIMESTAMP
            RETURNING user_id
        """
        
        cursor.execute(user_query, (user_id, email, nickname))
        user_result = cursor.fetchone()
        print(f'User record created/updated: {user_result[0]}')
        
        # Insert empty user_profile record
        profile_query = """
            INSERT INTO user_profiles (user_id, created_at, updated_at)
            VALUES (%s, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            ON CONFLICT (user_id) DO NOTHING
            RETURNING profile_id
        """
        
        cursor.execute(profile_query, (user_id,))
        profile_result = cursor.fetchone()
        
        if profile_result:
            print(f'User profile created: {profile_result[0]}')
        else:
            print('User profile already exists')
        
        # Commit transaction
        conn.commit()
        cursor.close()
        
        print('User synchronization successful')
        
        return event
        
    except Exception as error:
        # Rollback transaction on error
        if conn:
            conn.rollback()
        
        print(f'Error synchronizing user to database: {error}')
        
        # Log error but don't fail the Cognito operation
        # Database sync can be fixed manually later
        print(f'User created in Cognito but database sync failed for user: {user_id}')
        print('Manual intervention may be required')
        
        # Return event to allow Cognito signup to succeed
        return event
        
    finally:
        # Return connection to pool
        if conn:
            pool.putconn(conn)
