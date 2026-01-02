# AWS Cognito 인증 시스템 - 전체 코드 레퍼런스

이 문서는 구현된 모든 파일의 전체 코드와 상세한 주석을 포함합니다.

---

## 목차

1. [cognitoService.ts - Cognito API 연동](#1-cognitoservicets)
2. [AuthContext.tsx - 인증 상태 관리](#2-authcontexttsx)
3. [ProtectedRoute.tsx - 라우트 보호](#3-protectedroutetsx)
4. [AuthCallback.tsx - OAuth 콜백 처리](#4-authcallbacktsx)
5. [Auth.tsx - 로그인/회원가입 UI](#5-authtsx)
6. [MyPage.tsx - 로그아웃 구현](#6-mypagetsx)
7. [LibrarySidebar.tsx - 사이드바 로그아웃](#7-librarysidebartsx)
8. [App.tsx - 라우팅 설정](#8-apptsx)
9. [vite.config.ts - Vite 설정](#9-viteconfigts)
10. [.env - 환경 변수](#10-env)

---

## 파일별 상세 코드는 다음 문서들을 참고하세요:

각 파일이 너무 길어서 별도 문서로 분리했습니다:

1. **`CODE_1_COGNITO_SERVICE.md`** - cognitoService.ts 전체 코드
2. **`CODE_2_AUTH_CONTEXT.md`** - AuthContext.tsx 전체 코드
3. **`CODE_3_COMPONENTS.md`** - ProtectedRoute, AuthCallback 코드
4. **`CODE_4_CONFIG.md`** - App.tsx, vite.config.ts, .env

## 배포 가이드:

5. **`DEPLOYMENT_GUIDE.md`** - 프로덕션 배포 가이드 (도메인 설정, HTTPS, 환경 변수)

---

## 빠른 참조: 핵심 개념

### 1. 3계층 아키텍처

```
┌─────────────────────────────────────────┐
│         UI Layer (Pages)                │
│  - Auth.tsx (로그인/회원가입 UI)         │
│  - AuthCallback.tsx (OAuth 콜백)        │
│  - MyPage.tsx (로그아웃 버튼)           │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│    State Management (Context)           │
│  - AuthContext.tsx                      │
│    • 전역 인증 상태 관리                 │
│    • 자동 토큰 갱신                      │
│    • 크로스 탭 동기화                    │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│      API Layer (Service)                │
│  - cognitoService.ts                    │
│    • AWS Cognito API 호출               │
│    • 토큰 교환 (재시도 로직)            │
│    • 세션 관리                          │
└─────────────────────────────────────────┘
```

### 2. 데이터 흐름

#### 로그인 흐름:
```
사용자 입력 (Auth.tsx)
    ↓
signIn() 호출 (AuthContext)
    ↓
cognitoService.signIn() (API 호출)
    ↓
토큰 받기 → 로컬 스토리지 저장
    ↓
AuthContext 상태 업데이트
    ↓
ProtectedRoute가 인증 확인
    ↓
메인 페이지로 리다이렉트
```

#### Google 로그인 흐름:
```
"Google로 로그인" 클릭 (Auth.tsx)
    ↓
signInWithGoogle() (AuthContext)
    ↓
Google 로그인 URL로 리다이렉트
    ↓
Google 인증 완료
    ↓
/auth/callback으로 리다이렉트 (code 포함)
    ↓
AuthCallback.tsx에서 code 파싱
    ↓
handleGoogleCallback() (AuthContext)
    ↓
cognitoService.parseAuthCallback()
    ↓
토큰 교환 (재시도 로직)
    ↓
토큰 저장 → 상태 업데이트
    ↓
메인 페이지로 리다이렉트
```

### 3. 주요 함수 설명

#### cognitoService.ts
- `signUp()`: 회원가입
- `confirmSignUp()`: 이메일 인증
- `signIn()`: 로그인
- `signOut()`: 로그아웃
- `getGoogleLoginUrl()`: Google OAuth URL 생성
- `parseAuthCallback()`: Authorization code → 토큰 교환
- `exchangeCodeForTokens()`: 토큰 교환 (재시도 로직)
- `getCurrentSession()`: 현재 세션 가져오기
- `refreshSession()`: 토큰 갱신

#### AuthContext.tsx
- `signUp()`: 회원가입 처리
- `confirmSignUp()`: 이메일 인증 처리
- `signIn()`: 로그인 처리
- `signInWithGoogle()`: Google 로그인 시작
- `handleGoogleCallback()`: Google 콜백 처리
- `signOut()`: 로그아웃 처리
- `forgotPassword()`: 비밀번호 재설정 요청
- `confirmPassword()`: 비밀번호 재설정 확인

### 4. 상태 관리

#### AuthState 구조:
```typescript
{
  isAuthenticated: boolean,    // 로그인 여부
  isLoading: boolean,          // 로딩 상태
  user: {                      // 사용자 정보
    username: string,
    email: string,
    name: string,
    sub: string,
    emailVerified: boolean
  } | null,
  tokens: {                    // 인증 토큰
    accessToken: string,
    idToken: string,
    refreshToken: string
  } | null,
  error: string | null         // 에러 메시지
}
```

### 5. 로컬 스토리지 구조

```javascript
// cognito_tokens
{
  "accessToken": "eyJraWQiOiI...",
  "idToken": "eyJraWQiOiJ...",
  "refreshToken": "eyJjdHkiOi...",
  "expiresAt": 1706345678000  // 만료 시간 (timestamp)
}

// cognito_user
{
  "username": "google_108508554405832861998",
  "email": "user@example.com",
  "name": "홍길동",
  "sub": "12345678-1234-1234-1234-123456789012",
  "emailVerified": true
}
```

---

## 다음 문서로 이동

각 파일의 전체 코드를 보려면 다음 문서들을 확인하세요:

1. **CODE_1_COGNITO_SERVICE.md** - cognitoService.ts
2. **CODE_2_AUTH_CONTEXT.md** - AuthContext.tsx
3. **CODE_3_COMPONENTS.md** - ProtectedRoute, AuthCallback
4. **CODE_4_CONFIG.md** - App.tsx, vite.config.ts, .env

프로덕션 배포 시:

5. **DEPLOYMENT_GUIDE.md** - 실제 도메인으로 배포하는 방법 (wildwildworld.store 예시)
