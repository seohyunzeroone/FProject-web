import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';

export const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get('code');
        const error = searchParams.get('error');

        if (error) {
          setStatus('error');
          setMessage(`인증 오류: ${error}`);
          return;
        }

        if (code) {
          // OAuth 코드를 처리하고 토큰을 교환하는 로직
          // 실제 구현에서는 백엔드 API를 호출하여 토큰을 교환해야 합니다
          setStatus('success');
          setMessage('로그인이 완료되었습니다.');
          
          // 메인 페이지로 리다이렉트
          setTimeout(() => {
            navigate('/');
          }, 2000);
        } else {
          setStatus('error');
          setMessage('인증 코드가 없습니다.');
        }
      } catch (err) {
        setStatus('error');
        setMessage('인증 처리 중 오류가 발생했습니다.');
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>
            {status === 'loading' && '인증 처리 중...'}
            {status === 'success' && '로그인 성공'}
            {status === 'error' && '로그인 실패'}
          </CardTitle>
          <CardDescription>{message}</CardDescription>
        </CardHeader>
        <CardContent>
          {status === 'loading' && (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          )}
          {status === 'success' && (
            <p className="text-green-600">잠시 후 메인 페이지로 이동합니다...</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};