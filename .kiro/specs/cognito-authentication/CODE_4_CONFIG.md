# 설정 파일 및 라우팅

이 문서는 프로젝트 설정 파일들을 설명합니다.

---

## 1. App.tsx - 라우팅 설정

**위치**: `src/App.tsx`

**역할**: 앱의 라우팅 구조 정의 및 AuthProvider로 앱 전체 감싸기

### 주요 수정 사항

```typescript
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext'; // ⭐ AuthProvider import
import { ProtectedRoute } from './components/auth/ProtectedRoute'; // ⭐ ProtectedRoute import
import Auth from './pages/Auth';
import AuthCallback from './pages/AuthCallback'; // ⭐ AuthCallback import
import Index from './pages/Index';
import MyPage from './pages/MyPage';
// ... 기타 import

function App() {
  return (
    // ⭐ AuthProvider로 전체 앱 감싸기
    // 모든 컴포넌트에서 useAuth() hook 사용 가능
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* 공개 라우트 */}
          <Route path="/auth" element={<Auth />} />
          
          {/* ⭐ OAuth 콜백 라우트 */}
          <Route path="/auth/callback" element={<AuthCallback />} />
          
          {/* ⭐ 보호된 라우트 (인증 필요) */}
          <Route path="/journal" element={
            <ProtectedRoute>
              <Index />
            </ProtectedRoute>
          } />
          
          <Route path="/mypage" element={
            <ProtectedRoute>
              <MyPage />
            </ProtectedRoute>
          } />
          
          {/* 기타 보호된 라우트들 */}
          <Route path="/history" element={
            <ProtectedRoute>
              <HistoryPage />
            </ProtectedRoute>
          } />
          
          {/* 루트 경로 */}
          <Route path="/" element={<MainPage />} />
          
          {/* 404 페이지 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
```

### 핵심 개념

#### 1. AuthProvider 위치
```
AuthProvider (최상위)
  ↓
BrowserRouter
  ↓
Routes
  ↓
모든 Route 컴포넌트
```

**중요**: AuthProvider는 BrowserRouter보다 상위에 있어야 함!

#### 2. 라우트 종류

**공개 라우트**:
```typescript
<Route path="/auth" element={<Auth />} />
```
- 누구나 접근 가능
- 로그인 페이지, 회원가입 페이지 등

**보호된 라우트**:
```typescript
<Route path="/journal" element={
  <ProtectedRoute>
    <Index />
  </ProtectedRoute>
} />
```
- 인증 필요
- 미인증 시 `/auth`로 리다이렉트

**OAuth 콜백 라우트**:
```typescript
<Route path="/auth/callback" element={<AuthCallback />} />
```
- Google 로그인 후 리다이렉트되는 페이지
- Authorization code 처리

#### 3. 라우트 순서

```typescript
<Routes>
  {/* 1. 공개 라우트 */}
  <Route path="/auth" ... />
  <Route path="/auth/callback" ... />
  
  {/* 2. 보호된 라우트 */}
  <Route path="/journal" ... />
  <Route path="/mypage" ... />
  
  {/* 3. 기본 라우트 */}
  <Route path="/" ... />
  
  {/* 4. 404 처리 (마지막에 위치) */}
  <Route path="*" element={<Navigate to="/" />} />
</Routes>
```

---

## 2. vite.config.ts - Vite 설정

**위치**: `vite.config.ts`

**역할**: Vite 빌드 도구 설정

### 전체 코드

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  
  // ⭐ 경로 별칭 설정
  // @/components/... 형식으로 import 가능
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  
  // ⭐ 개발 서버 설정
  server: {
    port: 8080, // 포트 8080 사용
  },
  
  // ⭐ 전역 변수 polyfill
  // amazon-cognito-identity-js가 Node.js의 global 객체를 참조
  // 브라우저 환경에서는 global이 없으므로 globalThis로 대체
  define: {
    'global': 'globalThis'
  }
})
```

### 핵심 개념

#### 1. global polyfill

**문제**:
```
Uncaught ReferenceError: global is not defined
```

**원인**:
- `amazon-cognito-identity-js` 패키지가 Node.js의 `global` 객체 사용
- 브라우저 환경에는 `global` 객체가 없음

**해결**:
```typescript
define: {
  'global': 'globalThis'
}
```
- `global`을 `globalThis`로 대체
- `globalThis`는 브라우저와 Node.js 모두에서 사용 가능한 전역 객체

#### 2. 경로 별칭

**설정 전**:
```typescript
import { Button } from '../../../components/ui/Button';
```

**설정 후**:
```typescript
import { Button } from '@/components/ui/Button';
```

**장점**:
- 상대 경로 계산 불필요
- 파일 이동 시 import 경로 수정 최소화
- 코드 가독성 향상

#### 3. 포트 설정

```typescript
server: {
  port: 8080
}
```

**중요**: AWS Cognito 설정의 Callback URL과 일치해야 함!
```
http://localhost:8080/auth/callback
```

---

## 3. .env - 환경 변수

**위치**: `FProject-web/.env`

**역할**: AWS Cognito 설정 정보 저장

### 전체 코드

```bash
# AWS Cognito Configuration
# AWS Cognito User Pool 연결 정보

# AWS 리전 (서울: ap-northeast-2)
VITE_COGNITO_REGION=ap-northeast-2

# User Pool ID
# AWS Cognito Console → User pools → 해당 Pool 선택 → User pool overview
# 형식: ap-northeast-2_xxxxxxxxx
VITE_COGNITO_USER_POOL_ID=ap-northeast-2_ZWofNPLa4

# App Client ID
# AWS Cognito Console → User pools → App integration → App clients
# 형식: 26자 영숫자
VITE_COGNITO_CLIENT_ID=7vrhk1253iv78o61h0qcocu320

# Cognito Domain
# AWS Cognito Console → User pools → App integration → Domain
# 형식: [domain-prefix].auth.[region].amazoncognito.com
# ⚠️ https:// 없이 도메인만 입력!
VITE_COGNITO_DOMAIN=ap-northeast-2zwofnpla4.auth.ap-northeast-2.amazoncognito.com

# OAuth Configuration
# OAuth 로그인 후 리다이렉트될 URL

# 콜백 URL (Google 로그인 후 돌아올 주소)
# ⚠️ AWS Cognito와 Google Cloud Console에 등록된 URL과 정확히 일치해야 함!
VITE_OAUTH_REDIRECT_URI=http://localhost:8080/auth/callback

# 로그아웃 URL (로그아웃 후 돌아올 주소)
VITE_OAUTH_LOGOUT_URI=http://localhost:8080/auth
```

### 핵심 개념

#### 1. VITE_ 접두사

**Vite 규칙**:
- 환경 변수는 `VITE_` 접두사 필요
- 접두사 없는 변수는 클라이언트에 노출되지 않음

**사용 방법**:
```typescript
const region = import.meta.env.VITE_COGNITO_REGION;
```

#### 2. 환경 변수 위치

**올바른 위치**:
```
FProject-web/
  ├── .env          ← 여기!
  ├── src/
  ├── package.json
  └── vite.config.ts
```

**잘못된 위치**:
```
project-root/
  ├── .env          ← 여기 아님!
  └── FProject-web/
```

#### 3. 환경 변수 변경 시

**중요**: 환경 변수 변경 후 **반드시 개발 서버 재시작**!

```bash
# Ctrl+C로 서버 중지
npm run dev  # 서버 재시작
```

#### 4. 보안 주의사항

**절대 Git에 커밋하지 말 것**:
```bash
# .gitignore에 추가
.env
.env.local
.env.*.local
```

**공유용 템플릿**:
```bash
# .env.example (Git에 커밋 가능)
VITE_COGNITO_REGION=
VITE_COGNITO_USER_POOL_ID=
VITE_COGNITO_CLIENT_ID=
VITE_COGNITO_DOMAIN=
VITE_OAUTH_REDIRECT_URI=http://localhost:8080/auth/callback
VITE_OAUTH_LOGOUT_URI=http://localhost:8080/auth
```

---

## 4. .env.example - 환경 변수 템플릿

**위치**: `FProject-web/.env.example`

**역할**: 다른 개발자를 위한 환경 변수 템플릿

### 전체 코드

```bash
# AWS Cognito Configuration
# 실제 값을 입력하여 .env 파일로 복사하세요

VITE_COGNITO_REGION=
VITE_COGNITO_USER_POOL_ID=
VITE_COGNITO_CLIENT_ID=
VITE_COGNITO_DOMAIN=

# OAuth Configuration  
VITE_OAUTH_REDIRECT_URI=http://localhost:8080/auth/callback
VITE_OAUTH_LOGOUT_URI=http://localhost:8080/auth
```

### 사용 방법

```bash
# 1. .env.example을 .env로 복사
cp .env.example .env

# 2. .env 파일 열어서 실제 값 입력
# VITE_COGNITO_REGION=ap-northeast-2
# VITE_COGNITO_USER_POOL_ID=ap-northeast-2_xxxxxxxxx
# ...

# 3. 개발 서버 시작
npm run dev
```

---

## 5. .gitignore - Git 제외 파일

**위치**: `FProject-web/.gitignore`

**추가할 내용**:

```bash
# 환경 변수 파일 (민감한 정보 포함)
.env
.env.local
.env.*.local

# 의존성
node_modules/

# 빌드 결과물
dist/
build/

# 로그
*.log
npm-debug.log*

# IDE 설정
.vscode/
.idea/

# OS 파일
.DS_Store
Thumbs.db
```

---

## 전체 설정 체크리스트

### 1. 파일 생성 확인
- [ ] `src/services/cognitoService.ts`
- [ ] `src/contexts/AuthContext.tsx`
- [ ] `src/components/auth/ProtectedRoute.tsx`
- [ ] `src/pages/AuthCallback.tsx`
- [ ] `FProject-web/.env`
- [ ] `FProject-web/.env.example`

### 2. App.tsx 수정 확인
- [ ] AuthProvider로 앱 감싸기
- [ ] `/auth/callback` 라우트 추가
- [ ] ProtectedRoute로 보호된 라우트 설정

### 3. vite.config.ts 수정 확인
- [ ] `define: { 'global': 'globalThis' }` 추가
- [ ] 포트 8080 설정

### 4. 환경 변수 설정 확인
- [ ] `.env` 파일이 `FProject-web/` 폴더 안에 있음
- [ ] 모든 환경 변수가 `VITE_` 접두사로 시작
- [ ] AWS Cognito 정보가 정확히 입력됨
- [ ] 개발 서버 재시작함

### 5. .gitignore 확인
- [ ] `.env` 파일이 Git에서 제외됨
- [ ] `.env.example`은 Git에 포함됨

---

## 문제 해결

### 환경 변수가 로드되지 않음

**증상**:
```
Cognito Service를 사용할 수 없습니다. 환경 변수를 확인하세요.
```

**해결**:
1. `.env` 파일 위치 확인 (`FProject-web/` 폴더 안)
2. 환경 변수 이름에 `VITE_` 접두사 확인
3. 개발 서버 재시작

### global is not defined 에러

**증상**:
```
Uncaught ReferenceError: global is not defined
```

**해결**:
`vite.config.ts`에 추가:
```typescript
define: {
  'global': 'globalThis'
}
```

### 포트 충돌

**증상**:
```
Port 8080 is already in use
```

**해결**:
1. 다른 프로세스 종료
2. 또는 다른 포트 사용 (AWS Cognito 설정도 함께 변경 필요)

---

## 다음 단계

모든 설정이 완료되었습니다! 이제:

1. **개발 서버 시작**:
   ```bash
   cd FProject-web
   npm run dev
   ```

2. **테스트**:
   - 회원가입
   - 로그인
   - Google 로그인
   - 로그아웃

3. **프로덕션 배포 준비**:
   - HTTPS 설정
   - 도메인 설정
   - 환경 변수 관리 (프로덕션용)

---

## 참고 문서

- **TROUBLESHOOTING.md** - 문제 해결 가이드
- **CODE_1_COGNITO_SERVICE.md** - cognitoService.ts 상세 설명
- **CODE_2_AUTH_CONTEXT.md** - AuthContext.tsx 상세 설명
- **CODE_3_COMPONENTS.md** - 컴포넌트 상세 설명
