import { useState, useEffect, createContext, useContext } from 'react';
import { CognitoUserSession, CognitoUser } from 'amazon-cognito-identity-js';
import { AuthService, SignUpData, SignInData } from '../services/authService';

interface AuthContextType {
  user: CognitoUser | null;
  session: CognitoUserSession | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signUp: (data: SignUpData) => Promise<CognitoUser>;
  confirmSignUp: (email: string, code: string) => Promise<string>;
  signIn: (data: SignInData) => Promise<CognitoUserSession>;
  signOut: () => Promise<void>;
  forgotPassword: (email: string) => Promise<any>;
  confirmPassword: (email: string, code: string, newPassword: string) => Promise<string>;
  refreshSession: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const useAuthState = () => {
  const [user, setUser] = useState<CognitoUser | null>(null);
  const [session, setSession] = useState<CognitoUserSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!session && session.isValid();

  // 세션 새로고침
  const refreshSession = async () => {
    try {
      setIsLoading(true);
      const currentSession = await AuthService.getCurrentSession();
      const currentUser = AuthService.getCurrentUser();
      
      setSession(currentSession);
      setUser(currentUser);
    } catch (error) {
      setSession(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  // 회원가입
  const signUp = async (data: SignUpData): Promise<CognitoUser> => {
    try {
      const user = await AuthService.signUp(data);
      return user;
    } catch (error) {
      throw error;
    }
  };

  // 이메일 인증
  const confirmSignUp = async (email: string, code: string): Promise<string> => {
    try {
      const result = await AuthService.confirmSignUp(email, code);
      return result;
    } catch (error) {
      throw error;
    }
  };

  // 로그인
  const signIn = async (data: SignInData): Promise<CognitoUserSession> => {
    try {
      const session = await AuthService.signIn(data);
      const user = AuthService.getCurrentUser();
      
      setSession(session);
      setUser(user);
      
      return session;
    } catch (error) {
      throw error;
    }
  };

  // 로그아웃
  const signOut = async (): Promise<void> => {
    try {
      await AuthService.signOut();
      setSession(null);
      setUser(null);
    } catch (error) {
      throw error;
    }
  };

  // 비밀번호 재설정 요청
  const forgotPassword = async (email: string): Promise<any> => {
    try {
      return await AuthService.forgotPassword(email);
    } catch (error) {
      throw error;
    }
  };

  // 비밀번호 재설정 확인
  const confirmPassword = async (email: string, code: string, newPassword: string): Promise<string> => {
    try {
      return await AuthService.confirmPassword(email, code, newPassword);
    } catch (error) {
      throw error;
    }
  };

  // 초기 세션 확인
  useEffect(() => {
    refreshSession();
  }, []);

  return {
    user,
    session,
    isLoading,
    isAuthenticated,
    signUp,
    confirmSignUp,
    signIn,
    signOut,
    forgotPassword,
    confirmPassword,
    refreshSession,
  };
};