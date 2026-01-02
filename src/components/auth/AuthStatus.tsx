import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';

export const AuthStatus: React.FC = () => {
  const { user, session, isLoading, isAuthenticated, signOut } = useAuth();

  if (isLoading) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="pt-6">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!isAuthenticated) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>로그인이 필요합니다</CardTitle>
          <CardDescription>서비스를 이용하려면 로그인해주세요.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>로그인됨</CardTitle>
        <CardDescription>
          {user?.getUsername && `사용자: ${user.getUsername()}`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-sm text-gray-600">
            <p>세션 상태: {session?.isValid() ? '유효' : '무효'}</p>
          </div>
          <Button onClick={signOut} variant="outline" className="w-full">
            로그아웃
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};