import React, { useState } from 'react';
import { SignInForm } from '../components/auth/SignInForm';
import { SignUpForm } from '../components/auth/SignUpForm';
import { ConfirmSignUpForm } from '../components/auth/ConfirmSignUpForm';
import { Button } from '../components/ui/button';

type AuthMode = 'signin' | 'signup' | 'confirm';

export const AuthPage: React.FC = () => {
  const [mode, setMode] = useState<AuthMode>('signin');
  const [emailToConfirm, setEmailToConfirm] = useState('');

  const handleSignUpSuccess = (email: string) => {
    setEmailToConfirm(email);
    setMode('confirm');
  };

  const handleConfirmSuccess = () => {
    setMode('signin');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {mode === 'signin' && (
          <>
            <SignInForm />
            <div className="text-center">
              <Button
                variant="link"
                onClick={() => setMode('signup')}
              >
                계정이 없으신가요? 회원가입
              </Button>
            </div>
          </>
        )}
        
        {mode === 'signup' && (
          <>
            <SignUpForm />
            <div className="text-center">
              <Button
                variant="link"
                onClick={() => setMode('signin')}
              >
                이미 계정이 있으신가요? 로그인
              </Button>
            </div>
          </>
        )}
        
        {mode === 'confirm' && (
          <>
            <ConfirmSignUpForm
              email={emailToConfirm}
              onSuccess={handleConfirmSuccess}
            />
            <div className="text-center">
              <Button
                variant="link"
                onClick={() => setMode('signin')}
              >
                로그인으로 돌아가기
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};