import { CognitoUserPool, CognitoUserPoolConfig } from 'amazon-cognito-identity-js';

// Cognito 설정
export const cognitoConfig: CognitoUserPoolConfig = {
  UserPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID || import.meta.env.VITE_AWS_USER_POOL_ID,
  ClientId: import.meta.env.VITE_COGNITO_CLIENT_ID || import.meta.env.VITE_AWS_USER_POOL_WEB_CLIENT_ID,
};

// User Pool 인스턴스
export const userPool = new CognitoUserPool(cognitoConfig);

// AWS 설정
export const awsConfig = {
  region: import.meta.env.VITE_COGNITO_REGION || import.meta.env.VITE_AWS_REGION,
  userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID || import.meta.env.VITE_AWS_USER_POOL_ID,
  userPoolWebClientId: import.meta.env.VITE_COGNITO_CLIENT_ID || import.meta.env.VITE_AWS_USER_POOL_WEB_CLIENT_ID,
  cognitoDomain: import.meta.env.VITE_COGNITO_DOMAIN || import.meta.env.VITE_AWS_COGNITO_DOMAIN,
  googleClientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
  googleClientSecret: import.meta.env.VITE_GOOGLE_CLIENT_SECRET,
};

// OAuth 설정
export const oauthConfig = {
  domain: import.meta.env.VITE_COGNITO_DOMAIN || import.meta.env.VITE_AWS_COGNITO_DOMAIN,
  scope: ['email', 'openid', 'profile'],
  redirectSignIn: window.location.origin + '/auth/callback',
  redirectSignOut: window.location.origin + '/auth/signout',
  responseType: 'code',
};