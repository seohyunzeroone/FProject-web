import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * Google OAuth 로그인 후 Cognito Hosted UI에서 리다이렉트되는 콜백 페이지
 * 
 * 처리 과정:
 * 1. URL에서 인증 코드 파싱
 * 2. 토큰 교환 처리
 * 3. 성공 시 원래 페이지 또는 메인 페이지로 리다이렉트
 * 4. 실패 시 로그인 페이지로 리다이렉트
 */
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
        // 현재 URL 전체를 전달
        const currentUrl = window.location.href;
        
        // URL에 에러가 있는지 확인
        const urlParams = new URLSearchParams(window.location.search);
        const error = urlParams.get('error');
        
        if (error) {
          console.error('OAuth 에러:', error);
          const errorDescription = urlParams.get('error_description');
          console.error('에러 설명:', errorDescription);
          
          // 에러 메시지 파싱 및 개선
          let userFriendlyError = 'Google 로그인에 실패했습니다.';
          
          if (errorDescription) {
            // PreSignUp 에러 메시지 파싱
            if (errorDescription.includes('PreSignUp failed with error')) {
              const match = errorDescription.match(/PreSignUp failed with error (.+)/);
              if (match && match[1]) {
                userFriendlyError = match[1].trim();
              }
            } else {
              userFriendlyError = errorDescription;
            }
          }
          
          // 에러가 있으면 로그인 페이지로 리다이렉트
          navigate('/auth', { 
            replace: true,
            state: { error: userFriendlyError }
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
        
        // URL에서 코드 제거 (중복 사용 방지)
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
  }, []); // 빈 의존성 배열로 한 번만 실행

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
