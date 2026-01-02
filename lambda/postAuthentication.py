"""
Cognito PostAuthentication Lambda Trigger

Updates the last_login timestamp in PostgreSQL when a user
successfully authenticates with Cognito.

This Lambda is triggered after:
- Successful password authentication
- Successful OAuth authentication (Google, etc.)
- Successful refresh token authentication

Requirements: 2.2
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
    PostAuthentication Lambda Handler
    
    Updates the last_login timestamp in PostgreSQL when a user
    successfully authenticates.
    
    Args:
        event: Cognito PostAuthentication trigger event
        context: Lambda context
        
    Returns:
        Modified event (required by Cognito)
    """
    print(f'PostAuthentication trigger event: {json.dumps(event, indent=2)}')
    
    user_pool_id = event.get('userPoolId')
    user_name = event.get('userName')
    request = event.get('request', {})
    user_attributes = request.get('userAttributes', {})
    
    # Extract user ID from Cognito event
    user_id = user_attributes.get('sub')
    
    print(f'Updating last_login for user: {user_id}')
    
    pool = get_connection_pool()
    conn = None
    
    try:
        # Get connection from pool
        conn = pool.getconn()
        cursor = conn.cursor()
        
        # Update last_login timestamp
        query = """
            UPDATE users
            SET last_login = CURRENT_TIMESTAMP
            WHERE user_id = %s
            RETURNING user_id, last_login
        """
        
        cursor.execute(query, (user_id,))
        result = cursor.fetchone()
        
        if result:
            print(f'Last login updated: {result[1]}')
        else:
            print(f'User not found in database: {user_id}')
            # User might not be synced yet, but don't fail authentication
        
        conn.commit()
        cursor.close()
        
        return event
        
    except Exception as error:
        print(f'Error updating last_login: {error}')
        
        # Don't fail authentication even if database update fails
        # This is a non-critical operation
        return event
        
    finally:
        # Return connection to pool
        if conn:
            pool.putconn(conn)
