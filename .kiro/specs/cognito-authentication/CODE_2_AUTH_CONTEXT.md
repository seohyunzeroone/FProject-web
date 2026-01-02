# AuthContext.tsx - 인증 상태 관리

이 파일은 React Context를 사용하여 앱 전체의 인증 상태를 관리합니다.

**위치**: `src/contexts/AuthContext.tsx`

**역할**:
- 전역 인증 상태 관리 (로그인 여부, 사용자 정보, 토큰)
- cognitoService와 UI 컴포넌트 사이의 중간 계층
- 자동 토큰 갱신
- 크로스 탭 동기화 (여러 탭에서 로그인 상태 동기화)
- 세션 복원 (페이지 새로고침 시)

---

## 주요 개념

### 1. React Context 패턴
```
AuthProvider (최상위)
    ↓
  App
    ↓
  모든 컴포넌트에서 useAuth() hook으로 접근 가능
```

### 2. 상태 관리 흐름
```
UI 컴포넌트
    ↓ (signIn 호출)
AuthContext
    ↓ (cognitoService.signIn 호출)
cognitoService
    ↓ (AWS Cognito API)
AWS Cognito
    ↓ (토큰 반환)
AuthContext (상태 업데이트)
    ↓ (자동 리렌더링)
UI 컴포넌트 (로그인 상태 반영)
```

---

## 전체 코드 (주요 부분 발췌)

### 1. 타입 정의

```typescript
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { getCognitoService } from '../services/cognitoService';
import type { AuthResult, CognitoUserInfo } from '../services/cognitoService';

/**
 * 인증 상태 타입
 * 
 * 앱 전체에서 공유되는 인증 관련 상태
 */
export type AuthState = {
  isAuthenticated: boolean;    // 로그인 여부
  isLoading: boolean;          // 로딩 상태 (초기 로드, API 호출 중)
  user: CognitoUserInfo | null; // 사용자 정보
  tokens: {                    // 인증 토큰
    accessToken: string;       // API 호출용
    idToken: string;           // 사용자 정보 포함
    refreshToken: string;      // 토큰 갱신용
  } | null;
  error: string | null;        // 에러 메시지
};

/**
 * 인증 액션 타입
 * 
 * Reducer에서 처리할 수 있는 액션들
 */
export type AuthAction =
  | { type: 'AUTH_START' }                          // 인증 시작
  | { type: 'AUTH_SUCCESS'; payload: AuthResult }   // 인증 성공
  | { type: 'AUTH_FAILURE'; payload: string }       // 인증 실패
  | { type: 'AUTH_LOGOUT' }                         // 로그아웃
  | { type: 'AUTH_REFRESH'; payload: AuthResult };  // 토큰 갱신

/**
 * Context 값 인터페이스
 * 
 * useAuth() hook으로 접근 가능한 값들
 */
interface AuthContextValue {
  state: AuthState;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  confirmSignUp: (email: string, code: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => void;
  handleGoogleCallback: (url: string) => Promise<void>;
  signOut: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  confirmPassword: (email: string, code: string, newPassword: string) => Promise<void>;
  resendCode: (email: string) => Promise<void>;
}
```

---

### 2. 초기 상태 및 Reducer

```typescript
/**
 * 초기 상태
 * 
 * 앱 시작 시 기본 상태
 */
const initialState: AuthState = {
  isAuthenticated: false,
  isLoading: true,        // 초기 로드 중
  user: null,
  tokens: null,
  error: null,
};

/**
 * Reducer 함수
 * 
 * 상태 변경 로직을 중앙화
 * 
 * @param state - 현재 상태
 * @param action - 수행할 액션
 * @returns 새로운 상태
 */
function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'AUTH_START':
      // 인증 시작: 로딩 상태로 전환
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    
    case 'AUTH_SUCCESS':
      // 인증 성공: 사용자 정보 및 토큰 저장
      return {
        ...state,
        isAuthenticated: true,
        isLoading: false,
        user: action.payload.user,
        tokens: {
          accessToken: action.payload.accessToken,
          idToken: action.payload.idToken,
          refreshToken: action.payload.refreshToken,
        },
        error: null,
      };
    
    case 'AUTH_FAILURE':
      // 인증 실패: 에러 메시지 저장
      return {
        ...state,
        isAuthenticated: false,
        isLoading: false,
        user: null,
        tokens: null,
        error: action.payload,
      };
    
    case 'AUTH_LOGOUT':
      // 로그아웃: 초기 상태로 리셋
      return {
        ...initialState,
        isLoading: false,
      };
    
    case 'AUTH_REFRESH':
      // 토큰 갱신: 토큰만 업데이트
      return {
        ...state,
        tokens: {
          accessToken: action.payload.accessToken,
          idToken: action.payload.idToken,
          refreshToken: action.payload.refreshToken,
        },
        user: action.payload.user,
      };
    
    default:
      return state;
  }
}
```

---

### 3. Context 생성

```typescript
// Context 생성
const AuthContext = createContext<AuthContextValue | undefined>(undefined);
```

---

### 4. AuthProvider 컴포넌트 - 초기화

```typescript
/**
 * AuthProvider 컴포넌트
 * 
 * 앱 전체를 감싸서 인증 상태를 제공
 * 
 * @param children - 자식 컴포넌트
 */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  
  // Cognito Service 초기화 (에러 처리 포함)
  let cognitoService: any = null;
  try {
    cognitoService = getCognitoService();
  } catch (error) {
    console.error('Cognito 설정 로드 실패:', error);
    // 환경 변수가 없어도 앱은 로드되도록 함
  }

  // ... (나머지 코드는 아래에서 설명)
}
```

---

### 5. 세션 복원 (useEffect)

```typescript
/**
 * 애플리케이션 로드 시 세션 복원
 * 
 * 처리 과정:
 * 1. 로컬 스토리지에서 토큰 확인
 * 2. 토큰이 있고 만료되지 않았으면 세션 복원
 * 3. Cognito에서 현재 세션 가져오기
 * 4. 성공 시 로그인 상태로 전환
 */
useEffect(() => {
  const restoreSession = async () => {
    try {
      dispatch({ type: 'AUTH_START' });
      
      // Cognito Service가 없으면 로그아웃 상태로
      if (!cognitoService) {
        console.warn('Cognito Service를 사용할 수 없습니다. 환경 변수를 확인하세요.');
        dispatch({ type: 'AUTH_LOGOUT' });
        return;
      }
      
      // 로컬 스토리지에서 토큰 확인
      const storedTokens = localStorage.getItem('cognito_tokens');
      
      if (storedTokens) {
        const tokens = JSON.parse(storedTokens);
        
        // 토큰 만료 확인
        if (tokens.expiresAt && Date.now() < tokens.expiresAt) {
          // Cognito에서 현재 세션 가져오기
          const session = await cognitoService.getCurrentSession();
          
          if (session) {
            dispatch({ type: 'AUTH_SUCCESS', payload: session });
            return;
          }
        }
      }
      
      // 세션이 없거나 만료됨
      dispatch({ type: 'AUTH_LOGOUT' });
    } catch (error) {
      console.error('세션 복원 실패:', error);
      dispatch({ type: 'AUTH_LOGOUT' });
    }
  };

  restoreSession();
}, []); // 빈 배열: 컴포넌트 마운트 시 한 번만 실행
```

---

### 6. 자동 토큰 갱신 (useEffect)

```typescript
/**
 * 자동 토큰 갱신 로직
 * 
 * 처리 과정:
 * 1. 1분마다 토큰 만료 시간 확인
 * 2. 만료 5분 전이면 토큰 갱신
 * 3. 갱신 실패 시 로그아웃
 */
useEffect(() => {
  if (!state.isAuthenticated || !state.tokens || !cognitoService) {
    return;
  }

  // 토큰 만료 5분 전에 갱신
  const checkAndRefreshToken = async () => {
    try {
      const storedTokens = localStorage.getItem('cognito_tokens');
      if (!storedTokens) {
        return;
      }

      const tokens = JSON.parse(storedTokens);
      const timeUntilExpiry = tokens.expiresAt - Date.now();
      
      // 5분 이내에 만료되면 갱신
      if (timeUntilExpiry < 5 * 60 * 1000) {
        console.log('토큰 갱신 중...');
        const refreshedSession = await cognitoService.refreshSession();
        
        // 새 토큰 저장
        saveTokensToStorage(refreshedSession);
        
        dispatch({ type: 'AUTH_REFRESH', payload: refreshedSession });
        console.log('토큰 갱신 완료');
      }
    } catch (error) {
      console.error('토큰 갱신 실패:', error);
      // 갱신 실패 시 로그아웃
      await signOut();
    }
  };

  // 1분마다 토큰 만료 확인
  const intervalId = setInterval(checkAndRefreshToken, 60 * 1000);
  
  // 초기 확인
  checkAndRefreshToken();

  // 클린업: 컴포넌트 언마운트 시 interval 정리
  return () => {
    clearInterval(intervalId);
  };
}, [state.isAuthenticated, state.tokens]);
```

---

### 7. 크로스 탭 동기화 (useEffect)

```typescript
/**
 * 크로스 탭 동기화
 * 
 * 처리 과정:
 * 1. localStorage의 변경 감지
 * 2. 다른 탭에서 로그아웃하면 현재 탭도 로그아웃
 * 3. 다른 탭에서 로그인하면 현재 탭도 로그인
 */
useEffect(() => {
  if (!cognitoService) {
    return;
  }
  
  const handleStorageChange = (event: StorageEvent) => {
    // 다른 탭에서 로그아웃한 경우
    if (event.key === 'cognito_tokens' && event.newValue === null) {
      console.log('다른 탭에서 로그아웃 감지');
      dispatch({ type: 'AUTH_LOGOUT' });
    }
    
    // 다른 탭에서 로그인한 경우
    if (event.key === 'cognito_tokens' && event.newValue !== null && !state.isAuthenticated) {
      console.log('다른 탭에서 로그인 감지');
      // 세션 복원
      const restoreSession = async () => {
        try {
          const session = await cognitoService.getCurrentSession();
          if (session) {
            dispatch({ type: 'AUTH_SUCCESS', payload: session });
          }
        } catch (error) {
          console.error('세션 복원 실패:', error);
        }
      };
      restoreSession();
    }
  };

  // Storage 이벤트 리스너 등록
  window.addEventListener('storage', handleStorageChange);

  // 클린업
  return () => {
    window.removeEventListener('storage', handleStorageChange');
  };
}, [state.isAuthenticated]);
```

---

### 8. 인증 함수들

```typescript
/**
 * 회원가입
 * 
 * @param email - 이메일
 * @param password - 비밀번호
 * @param name - 이름
 */
const signUp = async (email: string, password: string, name: string): Promise<void> => {
  if (!cognitoService) {
    throw new Error('Cognito Service를 사용할 수 없습니다. 환경 변수를 확인하세요.');
  }
  
  try {
    dispatch({ type: 'AUTH_START' });
    await cognitoService.signUp(email, password, name);
    // 회원가입 성공 시 인증 화면으로 전환 (UI에서 처리)
    dispatch({ type: 'AUTH_LOGOUT' });
  } catch (error: any) {
    const errorMessage = error.message || '회원가입에 실패했습니다.';
    dispatch({ type: 'AUTH_FAILURE', payload: errorMessage });
    throw error;
  }
};

/**
 * 로그인
 * 
 * @param email - 이메일
 * @param password - 비밀번호
 */
const signIn = async (email: string, password: string): Promise<void> => {
  if (!cognitoService) {
    throw new Error('Cognito Service를 사용할 수 없습니다.');
  }
  
  try {
    dispatch({ type: 'AUTH_START' });
    const result = await cognitoService.signIn(email, password);
    
    // 로컬 스토리지에 토큰 저장
    saveTokensToStorage(result);
    
    dispatch({ type: 'AUTH_SUCCESS', payload: result });
  } catch (error: any) {
    const errorMessage = error.message || '로그인에 실패했습니다.';
    dispatch({ type: 'AUTH_FAILURE', payload: errorMessage });
    throw error;
  }
};

/**
 * Google 로그인 시작
 * 
 * Google OAuth URL로 리다이렉트
 */
const signInWithGoogle = (): void => {
  if (!cognitoService) {
    throw new Error('Cognito Service를 사용할 수 없습니다.');
  }
  
  try {
    const googleLoginUrl = cognitoService.getGoogleLoginUrl();
    window.location.href = googleLoginUrl;
  } catch (error: any) {
    const errorMessage = error.message || 'Google 로그인에 실패했습니다.';
    dispatch({ type: 'AUTH_FAILURE', payload: errorMessage });
    throw error;
  }
};

/**
 * Google 로그인 콜백 처리
 * 
 * @param url - 콜백 URL (authorization code 포함)
 */
const handleGoogleCallback = async (url: string): Promise<void> => {
  if (!cognitoService) {
    throw new Error('Cognito Service를 사용할 수 없습니다.');
  }
  
  try {
    dispatch({ type: 'AUTH_START' });
    const result = await cognitoService.parseAuthCallback(url);
    
    // 로컬 스토리지에 토큰 저장
    saveTokensToStorage(result);
    
    dispatch({ type: 'AUTH_SUCCESS', payload: result });
  } catch (error: any) {
    const errorMessage = error.message || 'Google 로그인 처리에 실패했습니다.';
    dispatch({ type: 'AUTH_FAILURE', payload: errorMessage });
    throw error;
  }
};

/**
 * 로그아웃
 */
const signOut = async (): Promise<void> => {
  try {
    if (cognitoService) {
      await cognitoService.signOut();
    }
    
    // 로컬 스토리지에서 토큰 삭제
    removeTokensFromStorage();
    
    dispatch({ type: 'AUTH_LOGOUT' });
  } catch (error: any) {
    console.error('로그아웃 실패:', error);
    // 로그아웃은 실패해도 로컬 상태는 초기화
    removeTokensFromStorage();
    dispatch({ type: 'AUTH_LOGOUT' });
  }
};
```

---

### 9. 로컬 스토리지 헬퍼 함수

```typescript
/**
 * 토큰을 로컬 스토리지에 저장
 * 
 * @param authResult - 인증 결과 (토큰 포함)
 */
function saveTokensToStorage(authResult: AuthResult): void {
  try {
    // 토큰 만료 시간 계산 (1시간 후)
    const expiresAt = Date.now() + 60 * 60 * 1000;
    
    const tokensData = {
      accessToken: authResult.accessToken,
      idToken: authResult.idToken,
      refreshToken: authResult.refreshToken,
      expiresAt,
    };
    
    localStorage.setItem('cognito_tokens', JSON.stringify(tokensData));
    localStorage.setItem('cognito_user', JSON.stringify(authResult.user));
  } catch (error) {
    console.error('토큰 저장 실패:', error);
  }
}

/**
 * 로컬 스토리지에서 토큰 삭제
 */
function removeTokensFromStorage(): void {
  try {
    localStorage.removeItem('cognito_tokens');
    localStorage.removeItem('cognito_user');
  } catch (error) {
    console.error('토큰 삭제 실패:', error);
  }
}
```

---

### 10. Context Provider 반환

```typescript
  // Context 값 생성
  const value: AuthContextValue = {
    state,
    signUp,
    confirmSignUp,
    signIn,
    signInWithGoogle,
    handleGoogleCallback,
    signOut,
    forgotPassword,
    confirmPassword,
    resendCode,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
```

---

### 11. useAuth Hook

```typescript
/**
 * useAuth Hook
 * 
 * 컴포넌트에서 인증 상태 및 함수에 접근
 * 
 * @returns AuthContextValue
 * 
 * 사용 예시:
 * ```typescript
 * const { state, signIn, signOut } = useAuth();
 * 
 * if (state.isAuthenticated) {
 *   console.log('로그인됨:', state.user);
 * }
 * ```
 */
export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
```

---

## 핵심 개념 정리

### 1. React Context 패턴
- **Provider**: 상태를 제공하는 컴포넌트
- **Consumer**: 상태를 사용하는 컴포넌트 (useContext hook)
- Props drilling 없이 전역 상태 공유

### 2. useReducer vs useState
- **useState**: 간단한 상태 관리
- **useReducer**: 복잡한 상태 로직, 여러 액션 타입
- AuthContext는 여러 상태(isAuthenticated, user, tokens 등)를 관리하므로 useReducer 사용

### 3. useEffect 활용
- **세션 복원**: 컴포넌트 마운트 시 한 번 실행
- **자동 토큰 갱신**: 1분마다 실행
- **크로스 탭 동기화**: storage 이벤트 리스너

### 4. 로컬 스토리지 사용
- **cognito_tokens**: 토큰 및 만료 시간
- **cognito_user**: 사용자 정보
- 페이지 새로고침 시에도 로그인 상태 유지

---

## 다음 문서

**CODE_3_COMPONENTS.md** - ProtectedRoute, AuthCallback 컴포넌트
