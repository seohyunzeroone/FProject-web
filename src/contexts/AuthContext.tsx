import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { getCognitoService } from '../services/cognitoService';
import type { AuthResult, CognitoUserInfo } from '../services/cognitoService';

// 인증 상태 타입
export type AuthState = {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: CognitoUserInfo | null;
  tokens: {
    accessToken: string;
    idToken: string;
    refreshToken: string;
  } | null;
  error: string | null;
};

// 인증 액션 타입
export type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: AuthResult }
  | { type: 'AUTH_FAILURE'; payload: string }
  | { type: 'AUTH_LOGOUT' }
  | { type: 'AUTH_REFRESH'; payload: AuthResult };

// Context 값 인터페이스
interface AuthContextValue {
  state: AuthState;
  signUp: (params: { email: string; password: string; name: string; nickname?: string }) => Promise<void>;
  confirmSignUp: (email: string, code: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => void;
  handleGoogleCallback: (url: string) => Promise<void>;
  signOut: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  confirmPassword: (email: string, code: string, newPassword: string) => Promise<void>;
  resendCode: (email: string) => Promise<void>;
}

// 초기 상태
const initialState: AuthState = {
  isAuthenticated: false,
  isLoading: true,
  user: null,
  tokens: null,
  error: null,
};

// Reducer 함수
function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    
    case 'AUTH_SUCCESS':
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
      return {
        ...state,
        isAuthenticated: false,
        isLoading: false,
        user: null,
        tokens: null,
        error: action.payload,
      };
    
    case 'AUTH_LOGOUT':
      return {
        ...initialState,
        isLoading: false,
      };
    
    case 'AUTH_REFRESH':
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

// Context 생성
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// Provider 컴포넌트
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

  // 애플리케이션 로드 시 세션 복원
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
  }, []);

  // 자동 토큰 갱신 로직
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

    return () => {
      clearInterval(intervalId);
    };
  }, [state.isAuthenticated, state.tokens]);

  // 크로스 탭 동기화
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

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [state.isAuthenticated]);

  // 회원가입
  const signUp = async (params: { email: string; password: string; name: string; nickname?: string }): Promise<void> => {
    if (!cognitoService) {
      throw new Error('Cognito Service를 사용할 수 없습니다. 환경 변수를 확인하세요.');
    }
    
    try {
      dispatch({ type: 'AUTH_START' });
      // nickname이 없으면 email의 로컬 부분을 사용
      const nickname = params.nickname || params.email.split('@')[0];
      await cognitoService.signUp(params.email, params.password, params.name, nickname);
      // 회원가입 성공 시 인증 화면으로 전환 (UI에서 처리)
      dispatch({ type: 'AUTH_LOGOUT' });
    } catch (error: any) {
      const errorMessage = error.message || '회원가입에 실패했습니다.';
      dispatch({ type: 'AUTH_FAILURE', payload: errorMessage });
      throw error;
    }
  };

  // 이메일 인증
  const confirmSignUp = async (email: string, code: string): Promise<void> => {
    if (!cognitoService) {
      throw new Error('Cognito Service를 사용할 수 없습니다.');
    }
    
    try {
      dispatch({ type: 'AUTH_START' });
      await cognitoService.confirmSignUp(email, code);
      // 인증 성공 시 로그인 화면으로 전환 (UI에서 처리)
      dispatch({ type: 'AUTH_LOGOUT' });
    } catch (error: any) {
      const errorMessage = error.message || '이메일 인증에 실패했습니다.';
      dispatch({ type: 'AUTH_FAILURE', payload: errorMessage });
      throw error;
    }
  };

  // 로그인
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

  // Google 로그인 시작
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

  // Google 로그인 콜백 처리
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

  // 로그아웃
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

  // 비밀번호 재설정 요청
  const forgotPassword = async (email: string): Promise<void> => {
    if (!cognitoService) {
      throw new Error('Cognito Service를 사용할 수 없습니다.');
    }
    
    try {
      dispatch({ type: 'AUTH_START' });
      await cognitoService.forgotPassword(email);
      dispatch({ type: 'AUTH_LOGOUT' });
    } catch (error: any) {
      const errorMessage = error.message || '비밀번호 재설정 요청에 실패했습니다.';
      dispatch({ type: 'AUTH_FAILURE', payload: errorMessage });
      throw error;
    }
  };

  // 비밀번호 재설정 확인
  const confirmPassword = async (
    email: string,
    code: string,
    newPassword: string
  ): Promise<void> => {
    if (!cognitoService) {
      throw new Error('Cognito Service를 사용할 수 없습니다.');
    }
    
    try {
      dispatch({ type: 'AUTH_START' });
      await cognitoService.confirmPassword(email, code, newPassword);
      dispatch({ type: 'AUTH_LOGOUT' });
    } catch (error: any) {
      const errorMessage = error.message || '비밀번호 재설정에 실패했습니다.';
      dispatch({ type: 'AUTH_FAILURE', payload: errorMessage });
      throw error;
    }
  };

  // 인증 코드 재전송
  const resendCode = async (email: string): Promise<void> => {
    if (!cognitoService) {
      throw new Error('Cognito Service를 사용할 수 없습니다.');
    }
    
    try {
      await cognitoService.resendConfirmationCode(email);
    } catch (error: any) {
      const errorMessage = error.message || '인증 코드 재전송에 실패했습니다.';
      throw new Error(errorMessage);
    }
  };

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

// Hook
export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// 로컬 스토리지 헬퍼 함수들

/**
 * 토큰을 로컬 스토리지에 저장
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
 * 로컬 스토리지에서 토큰 로드
 */
function loadTokensFromStorage(): { tokens: any; user: CognitoUserInfo } | null {
  try {
    const tokensStr = localStorage.getItem('cognito_tokens');
    const userStr = localStorage.getItem('cognito_user');
    
    if (!tokensStr || !userStr) {
      return null;
    }
    
    const tokens = JSON.parse(tokensStr);
    const user = JSON.parse(userStr);
    
    // 토큰 만료 확인
    if (tokens.expiresAt && Date.now() >= tokens.expiresAt) {
      // 만료된 토큰 삭제
      removeTokensFromStorage();
      return null;
    }
    
    return { tokens, user };
  } catch (error) {
    console.error('토큰 로드 실패:', error);
    return null;
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
