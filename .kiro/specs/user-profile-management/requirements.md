# Requirements Document

## Introduction

사용자가 마이페이지에서 자신의 회원 정보를 관리하고, Cognito 인증 데이터를 PostgreSQL 데이터베이스와 동기화하여 확장된 사용자 정보를 저장하고 관리할 수 있는 시스템입니다. 회원탈퇴, 비밀번호 재설정, 정보 수정, 회원 신고, 문의 기능을 포함합니다.

## Glossary

- **System**: 사용자 프로필 관리 시스템
- **Cognito**: AWS Cognito 사용자 인증 서비스
- **User_Database**: PostgreSQL 데이터베이스
- **User_Profile**: 사용자의 확장 프로필 정보 (Cognito + 추가 정보)
- **My_Page**: 사용자 프로필 관리 페이지
- **Auth_Service**: Cognito 인증 서비스 연동 모듈
- **Database_Service**: PostgreSQL 데이터베이스 연동 모듈
- **Sync_Handler**: Cognito와 PostgreSQL 간 데이터 동기화 핸들러

## Requirements

### Requirement 1: 데이터베이스 스키마 및 연동

**User Story:** As a system architect, I want to design and implement a PostgreSQL database schema that stores user profile information synchronized with Cognito, so that we can extend user data beyond what Cognito provides.

#### Acceptance Criteria

1. THE System SHALL create a users table with columns for user_id (Cognito sub), email, nickname, created_at, updated_at, and status
2. THE System SHALL create a user_profiles table with columns for user_id (foreign key), profile_image_url, bio, phone_number, and additional_info (JSONB)
3. THE System SHALL create a user_reports table with columns for report_id, reporter_id, reported_user_id, reason, description, status, and created_at
4. THE System SHALL create a user_inquiries table with columns for inquiry_id, user_id, subject, message, status, response, and timestamps
5. THE System SHALL establish foreign key relationships between tables to maintain referential integrity
6. THE System SHALL create indexes on frequently queried columns (user_id, email, status)

### Requirement 2: Cognito와 PostgreSQL 동기화

**User Story:** As a developer, I want to automatically synchronize user data between Cognito and PostgreSQL, so that user information is consistent across both systems.

#### Acceptance Criteria

1. WHEN a user signs up through Cognito THEN the System SHALL create a corresponding record in the User_Database
2. WHEN a user's Cognito attributes are updated THEN the System SHALL update the corresponding User_Database record
3. WHEN a user is deleted from Cognito THEN the System SHALL mark the user as inactive in the User_Database (soft delete)
4. THE Sync_Handler SHALL use Cognito Lambda triggers (PostConfirmation, PostAuthentication) to synchronize data
5. IF synchronization fails THEN the System SHALL log the error and retry with exponential backoff

### Requirement 3: 마이페이지 정보 조회

**User Story:** As a user, I want to view my profile information on the My Page, so that I can see my current account details.

#### Acceptance Criteria

1. WHEN a user accesses the My_Page THEN the System SHALL display the user's email, nickname, profile image, bio, and phone number
2. WHEN a user accesses the My_Page THEN the System SHALL display the account creation date and last updated date
3. THE System SHALL fetch user data from both Cognito and the User_Database
4. IF the user data is not found THEN the System SHALL display an error message
5. THE System SHALL display loading states while fetching user data

### Requirement 4: 회원 정보 수정

**User Story:** As a user, I want to update my profile information, so that I can keep my account details current.

#### Acceptance Criteria

1. WHEN a user updates their nickname THEN the System SHALL validate the nickname (3-20 characters, unique) and update both Cognito and User_Database
2. WHEN a user updates their profile image THEN the System SHALL upload the image to storage and update the profile_image_url in User_Database
3. WHEN a user updates their bio THEN the System SHALL validate the bio (max 500 characters) and update User_Database
4. WHEN a user updates their phone number THEN the System SHALL validate the format and update User_Database
5. IF an update fails THEN the System SHALL display a specific error message and maintain the previous state
6. WHEN an update succeeds THEN the System SHALL display a success message and refresh the displayed data

### Requirement 5: 비밀번호 재설정

**User Story:** As a user, I want to reset my password, so that I can regain access to my account if I forget my password.

#### Acceptance Criteria

1. WHEN a user requests a password reset THEN the System SHALL send a verification code to the user's email via Cognito
2. WHEN a user submits a verification code and new password THEN the System SHALL validate the code through Cognito
3. WHEN a new password is submitted THEN the System SHALL validate password strength (min 8 characters, uppercase, lowercase, number, special character)
4. IF the verification code is invalid or expired THEN the System SHALL display an error message
5. WHEN password reset succeeds THEN the System SHALL display a success message and redirect to login

### Requirement 6: 회원 탈퇴

**User Story:** As a user, I want to delete my account, so that I can remove my personal information from the system.

#### Acceptance Criteria

1. WHEN a user requests account deletion THEN the System SHALL display a confirmation dialog with warnings about data loss
2. WHEN a user confirms account deletion THEN the System SHALL require password re-authentication
3. WHEN account deletion is confirmed THEN the System SHALL delete the user from Cognito
4. WHEN account deletion is confirmed THEN the System SHALL soft-delete the user in User_Database (set status to 'deleted')
5. WHEN account deletion succeeds THEN the System SHALL log out the user and redirect to the home page
6. THE System SHALL retain user data for 30 days before permanent deletion for recovery purposes

### Requirement 7: 회원 신고

**User Story:** As a user, I want to report other users for inappropriate behavior, so that the platform can maintain a safe community.

#### Acceptance Criteria

1. WHEN a user submits a report THEN the System SHALL validate that reporter_id and reported_user_id are different
2. WHEN a user submits a report THEN the System SHALL require a reason (predefined categories) and optional description
3. WHEN a report is submitted THEN the System SHALL create a record in the user_reports table with status 'pending'
4. THE System SHALL validate that the description does not exceed 1000 characters
5. WHEN a report is successfully submitted THEN the System SHALL display a confirmation message
6. THE System SHALL prevent duplicate reports from the same user for the same reported user within 24 hours

### Requirement 8: 문의 기능

**User Story:** As a user, I want to submit inquiries to customer support, so that I can get help with issues or questions.

#### Acceptance Criteria

1. WHEN a user submits an inquiry THEN the System SHALL require a subject (max 200 characters) and message (max 2000 characters)
2. WHEN an inquiry is submitted THEN the System SHALL create a record in the user_inquiries table with status 'pending'
3. WHEN an inquiry is successfully submitted THEN the System SHALL display a confirmation message with an inquiry ID
4. THE System SHALL allow users to view their inquiry history on the My_Page
5. WHEN an admin responds to an inquiry THEN the System SHALL update the status to 'answered' and store the response
6. THE System SHALL display the response on the user's inquiry history page

### Requirement 9: 데이터베이스 연결 및 보안

**User Story:** As a system administrator, I want secure database connections with proper error handling, so that user data is protected and the system is reliable.

#### Acceptance Criteria

1. THE Database_Service SHALL use connection pooling to manage PostgreSQL connections efficiently
2. THE Database_Service SHALL use parameterized queries to prevent SQL injection attacks
3. THE Database_Service SHALL encrypt sensitive data (phone numbers) at rest in the database
4. THE Database_Service SHALL use environment variables for database credentials
5. IF a database connection fails THEN the System SHALL retry with exponential backoff up to 3 times
6. IF all connection attempts fail THEN the System SHALL return a user-friendly error message without exposing internal details

### Requirement 10: API 엔드포인트

**User Story:** As a frontend developer, I want well-defined API endpoints for user profile management, so that I can integrate the My Page functionality.

#### Acceptance Criteria

1. THE System SHALL provide a GET /api/user/profile endpoint that returns the authenticated user's profile data
2. THE System SHALL provide a PUT /api/user/profile endpoint that updates the authenticated user's profile data
3. THE System SHALL provide a POST /api/user/password-reset endpoint that initiates password reset
4. THE System SHALL provide a POST /api/user/password-reset/confirm endpoint that confirms password reset
5. THE System SHALL provide a DELETE /api/user/account endpoint that deletes the authenticated user's account
6. THE System SHALL provide a POST /api/user/report endpoint that creates a user report
7. THE System SHALL provide a POST /api/user/inquiry endpoint that creates a user inquiry
8. THE System SHALL provide a GET /api/user/inquiries endpoint that returns the authenticated user's inquiry history
9. THE System SHALL require authentication tokens (Cognito JWT) for all endpoints
10. THE System SHALL return appropriate HTTP status codes (200, 400, 401, 404, 500) with error messages
