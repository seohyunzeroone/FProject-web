# Implementation Plan: AWS Cognito Authentication

## Overview

이 구현 계획은 FProject 웹 애플리케이션에 AWS Cognito 기반 인증 시스템을 단계별로 구현하는 방법을 설명합니다. 각 태스크는 이전 단계를 기반으로 하며, 점진적으로 기능을 추가합니다.

## Tasks

- [ ] 1. AWS Cognito 인프라 설정 및 환경 구성
  - AWS 콘솔에서 Cognito User Pool 생성
  - Google OAuth 2.0 클라이언트 설정
  - 환경 변수 파일 생성 및 설정
  - 필요한 npm 패키지 설치
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 8.1, 8.2, 8.3_

- [x] 2. Cognito Service Layer 구현
  - [x] 2.1 CognitoService 클래스 기본 구조 및 설정 로드
    - TypeScript 인터페이스 정의 (CognitoConfig, CognitoUser, AuthResult)
    - CognitoService 클래스 생성 및 User Pool 초기화
    - 환경 변수에서 설정 로드 및 검증
    - _Requirements: 8.1, 8.2, 8.4_

  - [x] 2.2 회원가입 및 이메일 인증 메서드 구현
    - signUp() 메서드 구현
    - confirmSignUp() 메서드 구현
    - resendConfirmationCode() 메서드 구현
    - _Requirements: 2.1, 2.2, 2.3, 2.5_

  - [ ]* 2.3 회원가입 property test 작성
    - **Property 1: 유효한 회원가입 데이터는 항상 성공해야 함**
    - **Validates: Requirements 2.1, 2.4**

  - [ ]* 2.4 비밀번호 정책 property test 작성
    - **Property 2: 정책 위반 비밀번호는 항상 거부되어야 함**
    - **Validates: Requirements 2.2**

  - [ ]* 2.5 인증 코드 검증 property test 작성
    - **Property 6: 인증 코드 검증은 올바른 코드에 대해 성공해야 함**
    - **Validates: Requirements 2.5**

  - [x] 2.6 로그인 메서드 구현
    - signIn() 메서드 구현
    - getCurrentSession() 메서드 구현
    - refreshSession() 메서드 구현
    - _Requirements: 3.1, 3.2, 3.3, 6.3_

  - [ ]* 2.7 로그인 property test 작성
    - **Property 3: 유효한 자격 증명으로 로그인 시 토큰과 사용자 정보를 반환해야 함**
    - **Validates: Requirements 3.1, 3.2**

  - [ ]* 2.8 잘못된 자격 증명 property test 작성
    - **Property 4: 잘못된 자격 증명은 항상 거부되어야 함**
    - **Validates: Requirements 3.3**

  - [x] 2.9 Google 소셜 로그인 메서드 구현
    - getGoogleLoginUrl() 메서드 구현
    - parseAuthCallback() 메서드 구현
    - _Requirements: 4.1, 4.3, 4.5_

  - [ ]* 2.10 OAuth 콜백 property test 작성
    - **Property 7: 콜백 URL의 인증 코드는 토큰으로 교환 가능해야 함**
    - **Validates: Requirements 4.3, 4.5**

  - [x] 2.11 비밀번호 재설정 메서드 구현
    - forgotPassword() 메서드 구현
    - confirmPassword() 메서드 구현
    - _Requirements: 5.1, 5.2, 5.3_

  - [ ]* 2.12 비밀번호 재설정 property tests 작성
    - **Property 8: 비밀번호 재설정 요청은 유효한 이메일에 대해 성공해야 함**
    - **Property 9: 유효한 재설정 코드와 새 비밀번호로 비밀번호 변경 가능해야 함**
    - **Property 10: 정책 위반 새 비밀번호는 재설정 시 거부되어야 함**
    - **Validates: Requirements 5.1, 5.2, 5.3**

  - [x] 2.13 로그아웃 메서드 구현
    - signOut() 메서드 구현
    - _Requirements: 6.1_

  - [ ]* 2.14 로그아웃 property test 작성
    - **Property 11: 로그아웃은 모든 토큰과 세션을 제거해야 함**
    - **Validates: Requirements 6.1, 6.2**

  - [ ]* 2.15 에러 처리 unit tests 작성
    - Cognito 에러 코드 변환 테스트
    - 중복 이메일 에러 테스트
    - 만료된 코드 에러 테스트
    - _Requirements: 2.3, 10.1_

- [x] 3. Checkpoint - CognitoService 테스트 확인
  - 모든 CognitoService 테스트가 통과하는지 확인
  - 사용자에게 질문이 있으면 물어보기

- [ ] 4. Auth Context 구현
  - [x] 4.1 AuthContext 기본 구조 및 상태 관리
    - AuthState, AuthAction 타입 정의
    - authReducer 함수 구현
    - AuthProvider 컴포넌트 생성
    - useAuth hook 생성
    - _Requirements: 3.2, 7.5_

  - [x] 4.2 로컬 스토리지 토큰 관리
    - 토큰 저장 함수 구현
    - 토큰 로드 함수 구현
    - 토큰 삭제 함수 구현
    - _Requirements: 3.5, 6.1, 7.3_

  - [ ]* 4.3 세션 지속성 property test 작성
    - **Property 5: 세션 지속성 - 토큰 저장 후 복원 가능해야 함**
    - **Validates: Requirements 3.5, 7.3**

  - [x] 4.4 AuthContext 액션 메서드 구현
    - signUp, confirmSignUp, signIn 메서드 구현
    - signInWithGoogle, signOut 메서드 구현
    - forgotPassword, confirmPassword 메서드 구현
    - resendCode 메서드 구현
    - _Requirements: 2.1, 2.5, 3.1, 4.1, 5.1, 5.2, 6.1_

  - [x] 4.5 자동 토큰 갱신 로직 구현
    - 토큰 만료 감지
    - Refresh Token을 사용한 자동 갱신
    - 갱신 실패 시 로그아웃 처리
    - _Requirements: 6.3, 6.4_

  - [ ]* 4.6 토큰 갱신 property test 작성
    - **Property 12: 만료된 액세스 토큰은 자동으로 갱신되어야 함**
    - **Validates: Requirements 6.3**

  - [x] 4.7 크로스 탭 동기화 구현
    - Storage 이벤트 리스너 추가
    - 다른 탭의 로그아웃 감지 및 동기화
    - _Requirements: 6.5_

  - [ ]* 4.8 크로스 탭 동기화 property test 작성
    - **Property 13: 크로스 탭 로그아웃 동기화**
    - **Validates: Requirements 6.5**

  - [ ]* 4.9 AuthContext unit tests 작성
    - 초기 상태 테스트
    - 액션 디스패치 테스트
    - 에러 상태 처리 테스트
    - _Requirements: 3.2, 7.5_

- [x] 5. Checkpoint - AuthContext 테스트 확인
  - 모든 AuthContext 테스트가 통과하는지 확인
  - 사용자에게 질문이 있으면 물어보기

- [ ] 6. Protected Route 컴포넌트 구현
  - [x] 6.1 ProtectedRoute 컴포넌트 생성
    - 인증 상태 확인 로직
    - 로딩 상태 처리
    - 미인증 사용자 리다이렉트
    - 원래 위치 저장 (로그인 후 복귀용)
    - _Requirements: 7.1, 7.2, 7.4_

  - [ ]* 6.2 ProtectedRoute unit tests 작성
    - 인증된 사용자 접근 허용 테스트
    - 미인증 사용자 리다이렉트 테스트
    - 로딩 상태 표시 테스트
    - _Requirements: 7.1, 7.2_

- [ ] 7. OAuth Callback Handler 구현
  - [x] 7.1 AuthCallback 페이지 생성
    - URL에서 인증 코드 파싱
    - 토큰 교환 처리
    - 성공 시 원래 페이지로 리다이렉트
    - 실패 시 로그인 페이지로 리다이렉트
    - _Requirements: 4.3, 4.5_

  - [ ]* 7.2 AuthCallback unit tests 작성
    - 성공적인 콜백 처리 테스트
    - 에러 처리 테스트
    - _Requirements: 4.3, 4.5_

- [ ] 8. Auth 페이지 업데이트
  - [x] 8.1 기존 Auth.tsx에 실제 Cognito 연동
    - useAuth hook 통합
    - 회원가입 폼 핸들러 업데이트
    - 로그인 폼 핸들러 업데이트
    - 이메일 인증 폼 핸들러 업데이트
    - 비밀번호 재설정 폼 핸들러 업데이트
    - _Requirements: 2.1, 2.5, 3.1, 5.1, 5.2_

  - [x] 8.2 Google 로그인 버튼 추가
    - "Google로 로그인" 버튼 UI 추가
    - Google 로그인 핸들러 연결
    - _Requirements: 4.1_

  - [x] 8.3 에러 처리 및 사용자 피드백 개선
    - 에러 메시지 표시 로직 업데이트
    - 로딩 상태 관리 개선
    - 성공 메시지 토스트 추가
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

  - [ ]* 8.4 에러 메시지 변환 property test 작성
    - **Property 14: Cognito 에러 코드는 한국어 메시지로 변환되어야 함**
    - **Validates: Requirements 10.1**

  - [ ]* 8.5 Auth 페이지 integration tests 작성
    - 회원가입 플로우 end-to-end 테스트
    - 로그인 플로우 end-to-end 테스트
    - 비밀번호 재설정 플로우 테스트
    - _Requirements: 2.1, 2.5, 3.1, 5.1, 5.2_

- [ ] 9. 라우팅 설정 업데이트
  - [x] 9.1 App.tsx 또는 라우터 파일 수정
    - AuthProvider로 앱 래핑
    - /auth/callback 라우트 추가
    - 기존 라우트들을 ProtectedRoute로 래핑
    - _Requirements: 7.1, 7.2, 4.3_

  - [ ]* 9.2 라우팅 integration tests 작성
    - 보호된 라우트 접근 테스트
    - 콜백 라우트 처리 테스트
    - _Requirements: 7.1, 7.2_

- [x] 10. Checkpoint - 전체 통합 테스트
  - 모든 테스트가 통과하는지 확인
  - 실제 브라우저에서 수동 테스트
  - 사용자에게 질문이 있으면 물어보기

- [ ] 11. 핸즈온 가이드 문서 작성
  - [ ] 11.1 AWS Cognito User Pool 설정 가이드
    - 스크린샷과 함께 단계별 설명
    - User Pool 생성 과정
    - App Client 설정
    - Hosted UI 도메인 설정
    - _Requirements: 9.1_

  - [ ] 11.2 Google OAuth 2.0 설정 가이드
    - Google Cloud Console 프로젝트 생성
    - OAuth 2.0 클라이언트 ID 생성
    - 승인된 리다이렉트 URI 설정
    - Cognito에 Google Identity Provider 연동
    - _Requirements: 9.2_

  - [ ] 11.3 코드 구현 가이드
    - 각 파일의 역할 설명
    - 주요 코드 블록 설명
    - 예제 코드와 주석
    - _Requirements: 9.3_

  - [ ] 11.4 테스트 및 검증 가이드
    - 로컬 환경에서 테스트 방법
    - 일반적인 오류 및 해결 방법
    - 디버깅 팁
    - _Requirements: 9.4, 9.5_

  - [ ] 11.5 환경 변수 설정 가이드
    - .env 파일 생성 방법
    - 각 환경 변수 설명
    - 보안 주의사항
    - _Requirements: 8.1, 8.2, 8.3_

- [ ] 12. 최종 검증 및 문서화
  - [ ] 12.1 전체 기능 테스트
    - 회원가입 → 이메일 인증 → 로그인 플로우
    - Google 소셜 로그인 플로우
    - 비밀번호 재설정 플로우
    - 로그아웃 및 세션 관리
    - 보호된 라우트 접근

  - [ ] 12.2 README 업데이트
    - 프로젝트 설명에 인증 기능 추가
    - 설치 및 설정 방법 업데이트
    - 환경 변수 설정 안내

  - [ ] 12.3 코드 정리 및 최적화
    - 불필요한 코드 제거
    - 주석 추가
    - 타입 안정성 확인

## Notes

- `*` 표시가 있는 태스크는 선택적(optional)이며, 빠른 MVP를 위해 건너뛸 수 있습니다
- 각 태스크는 특정 요구사항을 참조하여 추적 가능성을 보장합니다
- Checkpoint 태스크는 점진적 검증을 보장합니다
- Property tests는 보편적 정확성 속성을 검증합니다
- Unit tests는 특정 예제 및 엣지 케이스를 검증합니다
- 태스크 1은 AWS 콘솔에서 수동으로 수행해야 하며, 핸즈온 가이드를 참조하세요
