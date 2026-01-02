# 인증 관련 컴포넌트

이 문서는 인증 시스템의 핵심 컴포넌트들을 설명합니다.

---

## 1. ProtectedRoute.tsx - 라우트 보호

**위치**: `src/components/auth/ProtectedRoute.tsx`

**역할**: 인증이 필요한 페이지를 보호하고, 미인증 사용자를 로그인 페이지로 리다이렉트

### 전체 코드

```typescript
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

/**
 * ProtectedRoute 컴포넌트
 * 
 * 인증이 필요한 라우트를 보호합니다.
 * 
 * 동작 방식:
 * 1. 로그인 상태 확인
 * 2. 로그인되어 있으면 children 렌더링
 * 3. 로그인되어 있지 않으면 /auth로 리다이렉트
 * 4. 원래 가려던 페이지 경로를 state로 전달 (로그인 후 복귀용)
 * 
 * @param children - 보호할 컴포넌트
 * 
 * 사용 예시:
 * ```tsx
 * <Route path="/journal" element={
 *   <ProtectedRoute>
 *     <JournalPage />
 *   </ProtectedRoute>
 * } />
 * ```
 */
interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { state } = useAuth();
  const location = useLocation();

  // 로딩 중이면 로딩 화면 표시
  if (state.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  // 인증되지 않았으면 로그인 페이지로 리다이렉트
  if (!state.isAuthenticated) {
    // 현재 위치를 state로 전달 (로그인 후 원래 페이지로 돌아가기 위해)
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // 인증되었으면 children 렌더링
  return <>{children}</>;
};
```

### 핵심 개념

#### 1. 조건부 렌더링
```typescript
if (state.isLoading) {
  return <LoadingScreen />;
}

if (!state.isAuthenticated) {
  return <Navigate to="/auth" />;
}

return <>{children}</>;
```

#### 2. 로그인 후 원래 페이지로 복귀
```typescript
// ProtectedRoute에서
<Navigate to="/auth" state={{ from: location }} replace />

// Auth 페이지에서
const from = (location.state as any)?.from?.pathname || '/';
navigate(from, { replace: true });
```

#### 3. replace 옵션
- `replace={true}`: 브라우저 히스토리에 추가하지 않음
- 뒤로 가기 버튼으로 보호된 페이지로 돌아가지 못하게 함

---

## 2. AuthCallback.tsx - OAuth 콜백 처리

**위치**: `src/pages/AuthCallback.tsx`

**역할**: Google OAuth 로그인 후 Cognito에서 리다이렉트되는 콜백 처리

### 전체 코드

```typescript
import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * AuthCallback 컴포넌트
 * 
 * Google OAuth 로그인 후 Cognito Hosted UI에서 리다이렉트되는 콜백 페이지
 * 
 * URL 형식:
 * http://localhost:8080/auth/callback?code=AUTHORIZATION_CODE
 * 
 * 처리 과정:
 * 1. URL에서 authorization code 파싱
 * 2. URL에서 code 제거 (중복 사용 방지)
 * 3. handleGoogleCallback() 호출하여 토큰 교환
 * 4. 성공 시 원래 페이지 또는 메인 페이지로 리다이렉트
 * 5. 실패 시 로그인 페이지로 리다이렉트 (에러 메시지 포함)
 */
const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { handleGoogleCallback } = useAuth();
  const [isProcessing, setIsProcessing] = React.useState(false);

  useEffect(() => {
    // 이미 처리 중이면 중복 실행 방지
    // React Strict Mode에서 useEffect가 두 번 실행되는 것을 방지
    if (isProcessing) {
      return;
    }

    const processCallback = async () => {
      setIsProcessing(true);
      
      try {
        // 현재 URL 전체를 전달
        const currentUrl = window.location.href;
        
        // URL에 에러가 있는지 확인
        const urlParams = new URLSearchParams(window.location.search);
        const error = urlParams.get('error');
        
        if (error) {
          console.error('OAuth 에러:', error);
          const errorDescription = urlParams.get('error_description');
          console.error('에러 설명:', errorDescription);
          
          // 에러가 있으면 로그인 페이지로 리다이렉트
          navigate('/auth', { 
            replace: true,
            state: { error: errorDescription || 'Google 로그인에 실패했습니다.' }
          });
          return;
        }
        
        // 인증 코드가 있는지 확인
        const code = urlParams.get('code');
        if (!code) {
          console.error('인증 코드가 없습니다');
          navigate('/auth', { 
            replace: true,
            state: { error: '인증 코드를 찾을 수 없습니다.' }
          });
          return;
        }
        
        // ⭐ 핵심: URL에서 코드 즉시 제거 (중복 사용 방지)
        // Authorization code는 한 번만 사용 가능
        // 페이지 새로고침 시 invalid_grant 에러 방지
        window.history.replaceState({}, document.title, window.location.pathname);
        
        // 토큰 교환 처리
        await handleGoogleCallback(currentUrl);
        
        // 성공 시 원래 가려던 페이지 또는 메인 페이지로 이동
        const from = (location.state as any)?.from?.pathname || '/';
        navigate(from, { replace: true });
        
      } catch (error: any) {
        console.error('콜백 처리 실패:', error);
        
        // 실패 시 로그인 페이지로 리다이렉트
        navigate('/auth', { 
          replace: true,
          state: { error: error.message || 'Google 로그인 처리에 실패했습니다.' }
        });
      }
    };

    processCallback();
  }, []); // ⭐ 빈 의존성 배열: 한 번만 실행

  // 로딩 화면
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600"></div>
        <h2 className="mt-6 text-xl font-semibold text-gray-900">
          로그인 처리 중...
        </h2>
        <p className="mt-2 text-gray-600">
          잠시만 기다려주세요
        </p>
      </div>
    </div>
  );
};

export default AuthCallback;
```

### 핵심 개념

#### 1. Authorization Code 중복 사용 방지

**문제**:
- Authorization code는 한 번만 사용 가능
- React Strict Mode에서 useEffect가 두 번 실행됨
- 페이지 새로고침 시 같은 코드로 재시도

**해결**:
```typescript
// 1. isProcessing 상태로 중복 실행 방지
const [isProcessing, setIsProcessing] = React.useState(false);

if (isProcessing) {
  return;
}

// 2. URL에서 코드 즉시 제거
window.history.replaceState({}, document.title, window.location.pathname);

// 3. 빈 의존성 배열로 한 번만 실행
useEffect(() => {
  // ...
}, []);
```

#### 2. OAuth 에러 처리

```typescript
// URL에서 에러 확인
const error = urlParams.get('error');
const errorDescription = urlParams.get('error_description');

if (error) {
  // 로그인 페이지로 리다이렉트 (에러 메시지 포함)
  navigate('/auth', { 
    replace: true,
    state: { error: errorDescription }
  });
}
```

#### 3. 로딩 상태 표시

사용자에게 처리 중임을 알림:
- 스피너 애니메이션
- "로그인 처리 중..." 메시지
- 사용자가 기다리도록 유도

---

## 3. 로그아웃 구현 - MyPage.tsx

**위치**: `src/pages/MyPage.tsx`

**수정 부분**: 로그아웃 버튼 클릭 시 실제 로그아웃 처리

### 수정된 코드

```typescript
import { useAuth } from "@/contexts/AuthContext";

const MyPage = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth(); // ⭐ useAuth hook 추가
  
  // ... 기존 코드 ...

  /**
   * 로그아웃 확인 처리
   * 
   * 처리 과정:
   * 1. signOut() 호출하여 실제 로그아웃
   * 2. 로컬 스토리지에서 토큰 삭제
   * 3. AuthContext 상태 초기화
   * 4. 로그아웃 완료 메시지 표시
   * 5. 1초 후 로그인 페이지로 리다이렉트
   */
  const handleLogoutConfirm = async () => {
    try {
      // ⭐ 실제 로그아웃 처리
      await signOut();
      
      setIsLogoutConfirmOpen(false);
      setIsLogoutCompleteOpen(true);
      
      // 로그아웃 완료 메시지를 잠깐 보여준 후 로그인 페이지로 이동
      setTimeout(() => {
        setIsLogoutCompleteOpen(false);
        navigate('/auth'); // ⭐ 로그인 페이지로 리다이렉트
      }, 1000);
    } catch (error) {
      console.error('로그아웃 실패:', error);
      setIsLogoutConfirmOpen(false);
      // 에러가 발생해도 로그인 페이지로 이동
      navigate('/auth');
    }
  };

  // ... 나머지 코드 ...
};
```

### 변경 사항

**변경 전**:
```typescript
const handleLogoutConfirm = () => {
  setIsLogoutConfirmOpen(false);
  setIsLogoutCompleteOpen(true);
  // 실제 로그아웃 처리 없음!
};
```

**변경 후**:
```typescript
const handleLogoutConfirm = async () => {
  await signOut(); // ⭐ 실제 로그아웃
  // ... 모달 처리 ...
  navigate('/auth'); // ⭐ 리다이렉트
};
```

---

## 4. 로그아웃 구현 - LibrarySidebar.tsx

**위치**: `src/components/layout/LibrarySidebar.tsx`

**수정 부분**: 사이드바 로그아웃 버튼 클릭 시 실제 로그아웃 처리

### 수정된 코드

```typescript
import { useAuth } from "@/contexts/AuthContext";

export function LibrarySidebar({ isOpen, onClose, onToggle }: LibrarySidebarProps) {
  const navigate = useNavigate();
  const { signOut } = useAuth(); // ⭐ useAuth hook 추가
  
  // ... 기존 코드 ...

  /**
   * 로그아웃 확인 처리
   * 
   * 처리 과정:
   * 1. signOut() 호출하여 실제 로그아웃
   * 2. 모달 닫기
   * 3. 사이드바 닫기
   * 4. 로그인 페이지로 리다이렉트
   */
  const handleLogoutConfirm = async () => {
    try {
      // ⭐ 실제 로그아웃 처리
      await signOut();
      
      setIsLogoutModalOpen(false);
      onClose();
      navigate("/auth"); // ⭐ 로그인 페이지로 리다이렉트
    } catch (error) {
      console.error('로그아웃 실패:', error);
      // 에러가 발생해도 로그인 페이지로 이동
      setIsLogoutModalOpen(false);
      onClose();
      navigate("/auth");
    }
  };

  // ... 나머지 코드 ...
}
```

### 변경 사항

**변경 전**:
```typescript
const handleLogoutConfirm = () => {
  navigate("/auth"); // 단순 페이지 이동만
  setIsLogoutModalOpen(false);
  onClose();
};
```

**변경 후**:
```typescript
const handleLogoutConfirm = async () => {
  await signOut(); // ⭐ 실제 로그아웃
  setIsLogoutModalOpen(false);
  onClose();
  navigate("/auth");
};
```

---

## 핵심 개념 정리

### 1. 컴포넌트 역할 분리

```
ProtectedRoute
  ↓ (인증 확인)
보호된 페이지
  ↓ (로그아웃 버튼 클릭)
useAuth().signOut()
  ↓ (AuthContext)
cognitoService.signOut()
  ↓ (AWS Cognito)
로그아웃 완료
```

### 2. 에러 처리 패턴

```typescript
try {
  await someAsyncOperation();
  // 성공 처리
} catch (error) {
  console.error('에러:', error);
  // 실패해도 사용자 경험 유지
  navigate('/fallback-page');
}
```

### 3. 사용자 경험 (UX)

- **로딩 상태**: 처리 중임을 명확히 표시
- **에러 메시지**: 무엇이 잘못되었는지 알림
- **자동 리다이렉트**: 사용자가 다음에 할 일을 안내

---

## 다음 문서

**CODE_4_PAGES.md** - Auth.tsx 페이지 (로그인/회원가입 UI)
