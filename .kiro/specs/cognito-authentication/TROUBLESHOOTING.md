# AWS Cognito 인증 시스템 구현 - 문제 해결 가이드

이 문서는 AWS Cognito 인증 시스템을 구현하면서 발생한 실제 문제들과 해결 방법을 정리한 것입니다.

---

## 목차

1. [환경 설정 문제](#1-환경-설정-문제)
2. [Google OAuth 설정 문제](#2-google-oauth-설정-문제)
3. [토큰 교환 문제](#3-토큰-교환-문제)
4. [로그아웃 기능 구현](#4-로그아웃-기능-구현)
5. [최종 구현 파일 목록](#5-최종-구현-파일-목록)

---

## 1. 환경 설정 문제

### 문제 1.1: `global is not defined` 에러

**증상**:
```
Uncaught ReferenceError: global is not defined
at node_modules/buffer/index.js
```

**원인**:
- Vite는 Node.js 환경이 아니므로 `global` 객체가 없음
- `amazon-cognito-identity-js` 패키지가 Node.js의 `global` 객체를 참조

**해결 방법**:

`vite.config.ts` 파일에 polyfill 추가:

```typescript
// vite.config.ts
export default defineConfig({
  // ... 기존 설정
  define: {
    'global': 'globalThis'
  }
})
```

---

### 문제 1.2: 환경 변수 로드 실패

**증상**:
```
Cognito Service를 사용할 수 없습니다. 환경 변수를 확인하세요.
필수 환경 변수가 누락되었습니다: VITE_COGNITO_REGION, ...
```

**원인**:
- `.env` 파일이 프로젝트 루트가 아닌 잘못된 위치에 있음
- 환경 변수 이름이 `VITE_` 접두사로 시작하지 않음

**해결 방법**:

1. `.env` 파일을 `FProject-web/` 폴더 안에 생성
2. 모든 환경 변수는 `VITE_` 접두사 사용

```bash
# FProject-web/.env
VITE_COGNITO_REGION=ap-northeast-2
VITE_COGNITO_USER_POOL_ID=ap-northeast-2_xxxxxxxxx
VITE_COGNITO_CLIENT_ID=1234567890abcdefghijklmnop
VITE_COGNITO_DOMAIN=your-domain.auth.ap-northeast-2.amazoncognito.com
VITE_OAUTH_REDIRECT_URI=http://localhost:8080/auth/callback
VITE_OAUTH_LOGOUT_URI=http://localhost:8080/auth
```

3. 개발 서버 재시작 필수!

---

## 2. Google OAuth 설정 문제

### 문제 2.1: `invalid_scope` 에러

**증상**:
```
에러 설명: invalid_scope
```

**원인**:
- AWS Cognito App Client의 OAuth scope 설정과 코드에서 요청하는 scope가 불일치

**해결 방법**:

#### AWS Cognito 설정:
1. User Pool → Applications → App clients → 해당 App client 선택
2. Login pages → Edit
3. **OpenID Connect scopes** 섹션에서:
   - ✅ OpenID
   - ✅ Email
   - ✅ Phone
   - ✅ Profile (추가!)

#### 코드 수정:

`cognitoService.ts`:
```typescript
// 변경 전
url.searchParams.append('scope', 'openid email phone');

// 변경 후
url.searchParams.append('scope', 'openid email phone profile');
```

---

### 문제 2.2: Google Identity Provider 미설정

**증상**:
- Google 로그인 버튼을 눌러도 아무 반응 없음
- 또는 "Identity provider not found" 에러

**원인**:
- AWS Cognito에 Google Identity Provider가 추가되지 않음

**해결 방법**:

#### 1. Google Cloud Console 설정:

1. [Google Cloud Console](https://console.cloud.google.com) 접속
2. OAuth consent screen 설정:
   - User Type: External
   - App name, User support email, Developer contact 입력
   - Scopes: `email`, `profile`, `openid` 추가
   - Test users 추가

3. Credentials → Create OAuth 2.0 Client ID:
   - Application type: Web application
   - Authorized JavaScript origins: `http://localhost:8080`
   - Authorized redirect URIs: 
     ```
     https://[YOUR-COGNITO-DOMAIN].auth.[REGION].amazoncognito.com/oauth2/idpresponse
     ```
   - Client ID와 Client secret 복사

#### 2. AWS Cognito 설정:

1. User Pool → Authentication → Social and external providers
2. **Add identity provider** 클릭
3. Provider type: **Google** 선택
4. Google client ID와 secret 입력
5. Authorized scopes: `profile email openid` (기본값)
6. Attribute mapping:
   - `email` → `email`
   - `name` → `name`
   - `username` → `sub`

#### 3. App Client에서 Google 활성화:

1. Applications → App clients → 해당 App client
2. Login pages → Edit
3. **Identity providers** 섹션:
   - ✅ Cognito user pool
   - ✅ **Google** (추가!)

---

## 3. 토큰 교환 문제

### 문제 3.1: "Application is busy" 에러

**증상**:
```
Token exchange failed: {"error":"Application is busy, please try again in a few minutes."}
```

**원인**:
- AWS Cognito 서버가 일시적으로 과부하 상태
- Rate limiting 발생

**해결 방법**:

재시도 로직 추가 (`cognitoService.ts`):

```typescript
/**
 * Authorization code를 토큰으로 교환 (재시도 로직 포함)
 */
private async exchangeCodeForTokens(
  code: string, 
  redirectUri: string, 
  maxRetries: number = 3
): Promise<any> {
  const tokenUrl = `https://${this.config.domain}/oauth2/token`;
  
  const params = new URLSearchParams();
  params.append('grant_type', 'authorization_code');
  params.append('client_id', this.config.clientId);
  params.append('code', code);
  params.append('redirect_uri', redirectUri);

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`토큰 교환 시도 ${attempt}/${maxRetries}...`);
      
      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        
        // "Application is busy" 에러인 경우 재시도
        if (errorText.includes('Application is busy') && attempt < maxRetries) {
          console.warn(`서버가 바쁩니다. ${attempt + 1}번째 시도 전 대기 중...`);
          // 지수 백오프: 1초, 2초, 4초
          await this.sleep(1000 * Math.pow(2, attempt - 1));
          continue;
        }
        
        throw new Error(`Token exchange failed: ${errorText}`);
      }

      const tokens = await response.json();
      console.log('토큰 교환 성공!');
      return tokens;
      
    } catch (error: any) {
      lastError = error;
      
      // 마지막 시도가 아니고, 재시도 가능한 에러인 경우
      if (attempt < maxRetries && error.message.includes('Application is busy')) {
        console.warn(`재시도 ${attempt}/${maxRetries} 실패. 다시 시도합니다...`);
        await this.sleep(1000 * Math.pow(2, attempt - 1));
        continue;
      }
      
      throw error;
    }
  }

  throw lastError || new Error('Token exchange failed after all retries');
}

/**
 * 지정된 시간만큼 대기
 */
private sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
```

**핵심 개념**:
- **지수 백오프(Exponential Backoff)**: 재시도 간격을 점진적으로 늘림
- 1차 재시도: 1초 대기
- 2차 재시도: 2초 대기
- 3차 재시도: 4초 대기

---

### 문제 3.2: `invalid_grant` 에러

**증상**:
```
Token exchange failed: {"error":"invalid_grant"}
```

**원인**:
- Authorization code는 **한 번만 사용 가능**
- React Strict Mode에서 컴포넌트가 두 번 렌더링되어 중복 요청 발생
- 페이지 새로고침 시 같은 코드로 재시도

**해결 방법**:

`AuthCallback.tsx` 수정:

```typescript
const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { handleGoogleCallback } = useAuth();
  const [isProcessing, setIsProcessing] = React.useState(false);

  useEffect(() => {
    // 이미 처리 중이면 중복 실행 방지
    if (isProcessing) {
      return;
    }

    const processCallback = async () => {
      setIsProcessing(true);
      
      try {
        const currentUrl = window.location.href;
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        
        if (!code) {
          navigate('/auth', { 
            replace: true,
            state: { error: '인증 코드를 찾을 수 없습니다.' }
          });
          return;
        }
        
        // ⭐ 핵심: URL에서 코드 즉시 제거 (중복 사용 방지)
        window.history.replaceState({}, document.title, window.location.pathname);
        
        // 토큰 교환 처리
        await handleGoogleCallback(currentUrl);
        
        const from = (location.state as any)?.from?.pathname || '/';
        navigate(from, { replace: true });
        
      } catch (error: any) {
        console.error('콜백 처리 실패:', error);
        navigate('/auth', { 
          replace: true,
          state: { error: error.message }
        });
      }
    };

    processCallback();
  }, []); // ⭐ 빈 의존성 배열로 한 번만 실행

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600"></div>
        <h2 className="mt-6 text-xl font-semibold">로그인 처리 중...</h2>
      </div>
    </div>
  );
};
```

**핵심 포인트**:
1. `isProcessing` 상태로 중복 실행 방지
2. 토큰 교환 전에 URL에서 code 파라미터 제거
3. useEffect 의존성 배열을 비워서 한 번만 실행

---

## 4. 로그아웃 기능 구현

### 문제 4.1: 로그아웃 버튼이 실제 로그아웃을 하지 않음

**증상**:
- 로그아웃 버튼을 눌러도 여전히 로그인 상태
- 페이지만 이동하고 토큰이 남아있음

**원인**:
- UI에 로그아웃 버튼은 있지만 AuthContext의 `signOut` 함수와 연결되지 않음

**해결 방법**:

#### 1. MyPage.tsx 수정:

```typescript
import { useAuth } from "@/contexts/AuthContext";

const MyPage = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth(); // ⭐ useAuth hook 사용
  
  const handleLogoutConfirm = async () => {
    try {
      await signOut(); // ⭐ 실제 로그아웃 호출
      setIsLogoutConfirmOpen(false);
      setIsLogoutCompleteOpen(true);
      
      setTimeout(() => {
        setIsLogoutCompleteOpen(false);
        navigate('/auth'); // ⭐ 로그인 페이지로 이동
      }, 1000);
    } catch (error) {
      console.error('로그아웃 실패:', error);
      navigate('/auth');
    }
  };
  
  // ... 나머지 코드
};
```

#### 2. LibrarySidebar.tsx 수정:

```typescript
import { useAuth } from "@/contexts/AuthContext";

export function LibrarySidebar({ isOpen, onClose, onToggle }: LibrarySidebarProps) {
  const navigate = useNavigate();
  const { signOut } = useAuth(); // ⭐ useAuth hook 사용
  
  const handleLogoutConfirm = async () => {
    try {
      await signOut(); // ⭐ 실제 로그아웃 호출
      setIsLogoutModalOpen(false);
      onClose();
      navigate("/auth"); // ⭐ 로그인 페이지로 이동
    } catch (error) {
      console.error('로그아웃 실패:', error);
      setIsLogoutModalOpen(false);
      onClose();
      navigate("/auth");
    }
  };
  
  // ... 나머지 코드
}
```

**핵심 포인트**:
- `useAuth` hook으로 `signOut` 함수 가져오기
- 로그아웃 후 `/auth` 페이지로 리다이렉트
- 에러 발생 시에도 로그인 페이지로 이동

---

## 5. 최종 구현 파일 목록

### 5.1 핵심 파일

#### 1. 서비스 레이어
- **`src/services/cognitoService.ts`**
  - AWS Cognito API 연동
  - 회원가입, 로그인, 이메일 인증
  - Google OAuth URL 생성
  - 토큰 교환 (재시도 로직 포함)
  - 비밀번호 재설정

#### 2. 상태 관리
- **`src/contexts/AuthContext.tsx`**
  - React Context를 사용한 전역 인증 상태 관리
  - 자동 토큰 갱신
  - 크로스 탭 동기화
  - 세션 복원

#### 3. 라우팅 보호
- **`src/components/auth/ProtectedRoute.tsx`**
  - 인증이 필요한 라우트 보호
  - 미인증 사용자를 로그인 페이지로 리다이렉트

#### 4. UI 컴포넌트
- **`src/pages/Auth.tsx`**
  - 로그인/회원가입 UI
  - 이메일 인증
  - 비밀번호 재설정
  - Google 로그인 버튼

- **`src/pages/AuthCallback.tsx`**
  - Google OAuth 콜백 처리
  - Authorization code → 토큰 교환
  - 중복 요청 방지

- **`src/pages/MyPage.tsx`**
  - 마이페이지
  - 로그아웃 기능

- **`src/components/layout/LibrarySidebar.tsx`**
  - 사이드바 메뉴
  - 로그아웃 버튼

#### 5. 라우팅 설정
- **`src/App.tsx`**
  - AuthProvider로 앱 전체 감싸기
  - ProtectedRoute로 보호된 라우트 설정
  - `/auth/callback` 라우트 추가

#### 6. 설정 파일
- **`vite.config.ts`**
  - `global` polyfill 추가

- **`.env`**
  - AWS Cognito 환경 변수
  - OAuth 설정

---

### 5.2 파일 구조

```
FProject-web/
├── .env                                    # 환경 변수
├── vite.config.ts                          # Vite 설정 (global polyfill)
├── src/
│   ├── App.tsx                             # 라우팅 설정
│   ├── services/
│   │   └── cognitoService.ts               # Cognito API 연동
│   ├── contexts/
│   │   └── AuthContext.tsx                 # 인증 상태 관리
│   ├── components/
│   │   ├── auth/
│   │   │   └── ProtectedRoute.tsx          # 라우트 보호
│   │   └── layout/
│   │       ├── MainLayout.tsx              # 메인 레이아웃
│   │       └── LibrarySidebar.tsx          # 사이드바 (로그아웃)
│   └── pages/
│       ├── Auth.tsx                        # 로그인/회원가입 페이지
│       ├── AuthCallback.tsx                # OAuth 콜백 페이지
│       ├── MyPage.tsx                      # 마이페이지 (로그아웃)
│       └── Index.tsx                       # 메인 페이지
└── .kiro/
    └── specs/
        └── cognito-authentication/
            ├── HANDS_ON_GUIDE.md           # 초기 설정 가이드
            └── TROUBLESHOOTING.md          # 이 문서
```

---

## 6. 구현된 기능 목록

### ✅ 완료된 기능

1. **이메일/비밀번호 인증**
   - 회원가입
   - 이메일 인증 (6자리 코드)
   - 로그인
   - 비밀번호 재설정

2. **Google OAuth 로그인**
   - Google 계정으로 로그인
   - 자동 회원가입
   - 권한 동의 처리

3. **세션 관리**
   - 자동 토큰 갱신
   - 로컬 스토리지 저장
   - 크로스 탭 동기화
   - 세션 복원

4. **로그아웃**
   - Cognito 로그아웃
   - 로컬 스토리지 정리
   - 로그인 페이지로 리다이렉트

5. **라우트 보호**
   - 인증 필요 페이지 보호
   - 자동 리다이렉트

6. **에러 처리**
   - 재시도 로직 (Application is busy)
   - 중복 요청 방지 (invalid_grant)
   - 사용자 친화적 에러 메시지

---

## 7. 테스트 체크리스트

### 회원가입 테스트
- [ ] 이메일/비밀번호로 회원가입
- [ ] 이메일로 인증 코드 수신
- [ ] 6자리 코드 입력하여 인증 완료
- [ ] 로그인 화면으로 이동

### 로그인 테스트
- [ ] 이메일/비밀번호로 로그인
- [ ] 메인 페이지로 리다이렉트
- [ ] 사용자 정보 표시 확인

### Google 로그인 테스트
- [ ] "Google로 로그인" 버튼 클릭
- [ ] Google 로그인 페이지로 이동
- [ ] Google 계정 선택
- [ ] 권한 동의
- [ ] 앱으로 돌아와서 자동 로그인
- [ ] 메인 페이지로 이동

### 로그아웃 테스트
- [ ] 사이드바에서 로그아웃 버튼 클릭
- [ ] 확인 모달 표시
- [ ] 로그아웃 완료 메시지
- [ ] 로그인 페이지로 리다이렉트
- [ ] 보호된 페이지 접근 시 로그인 페이지로 이동

### 비밀번호 재설정 테스트
- [ ] "비밀번호를 잊으셨나요?" 클릭
- [ ] 이메일 입력
- [ ] 재설정 코드 수신
- [ ] 코드와 새 비밀번호 입력
- [ ] 새 비밀번호로 로그인 성공

---

## 8. 주요 학습 포인트

### 8.1 Vite + React 환경에서 Node.js 패키지 사용

**문제**: Vite는 브라우저 환경이므로 Node.js 전역 객체가 없음

**해결**: `vite.config.ts`에서 polyfill 설정
```typescript
define: {
  'global': 'globalThis'
}
```

### 8.2 OAuth Authorization Code Flow

**핵심 개념**:
1. 사용자가 "Google로 로그인" 클릭
2. Google 로그인 페이지로 리다이렉트
3. 사용자 인증 및 권한 동의
4. Cognito 콜백 URL로 리다이렉트 (Authorization code 포함)
5. Authorization code를 토큰으로 교환
6. 토큰으로 사용자 정보 가져오기

**주의사항**:
- Authorization code는 **한 번만 사용 가능**
- 사용 후 즉시 URL에서 제거해야 함
- 중복 요청 방지 필수

### 8.3 재시도 로직 (Exponential Backoff)

**개념**: 일시적인 서버 오류 시 점진적으로 재시도 간격을 늘림

**구현**:
```typescript
for (let attempt = 1; attempt <= maxRetries; attempt++) {
  try {
    // 요청 시도
  } catch (error) {
    if (attempt < maxRetries) {
      // 지수 백오프: 1초, 2초, 4초
      await sleep(1000 * Math.pow(2, attempt - 1));
      continue;
    }
    throw error;
  }
}
```

### 8.4 React Context를 사용한 전역 상태 관리

**장점**:
- Props drilling 방지
- 컴포넌트 간 상태 공유 용이
- 인증 상태를 앱 전체에서 접근 가능

**구현**:
```typescript
// Context 생성
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// Provider로 앱 감싸기
<AuthProvider>
  <App />
</AuthProvider>

// Hook으로 사용
const { signIn, signOut, state } = useAuth();
```

---

## 9. 추가 개선 사항 (선택사항)

### 9.1 보안 강화
- [ ] PKCE (Proof Key for Code Exchange) 구현
- [ ] CSRF 토큰 추가
- [ ] Rate limiting 구현

### 9.2 사용자 경험 개선
- [ ] 로딩 스피너 개선
- [ ] 에러 메시지 다국어 지원
- [ ] "로그인 상태 유지" 옵션

### 9.3 기능 추가
- [ ] 소셜 로그인 추가 (Facebook, Apple)
- [ ] 2단계 인증 (MFA)
- [ ] 프로필 사진 업로드

---

## 10. 참고 자료

- [AWS Cognito 공식 문서](https://docs.aws.amazon.com/cognito/)
- [amazon-cognito-identity-js GitHub](https://github.com/aws-amplify/amplify-js/tree/main/packages/amazon-cognito-identity-js)
- [Google OAuth 2.0 문서](https://developers.google.com/identity/protocols/oauth2)
- [OAuth 2.0 Authorization Code Flow](https://oauth.net/2/grant-types/authorization-code/)

---

## 마무리

이 문서는 실제 구현 과정에서 발생한 문제들과 해결 방법을 정리한 것입니다. 
같은 문제를 겪는 다른 개발자들에게 도움이 되기를 바랍니다.

**구현 완료 날짜**: 2025년 1월 27일

**주요 성과**:
- ✅ 완전히 작동하는 AWS Cognito 인증 시스템
- ✅ Google OAuth 로그인 통합
- ✅ 재시도 로직으로 안정성 향상
- ✅ 중복 요청 방지로 보안 강화

**다음 단계**: 프로덕션 배포 준비 (HTTPS, 도메인 설정, 환경 변수 관리)
