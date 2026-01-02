declare module 'amazon-cognito-identity-js' {
  export interface CognitoUserPoolConfig {
    UserPoolId: string;
    ClientId: string;
  }

  export class CognitoUserPool {
    constructor(config: CognitoUserPoolConfig);
    signUp(
      username: string,
      password: string,
      attributeList: CognitoUserAttribute[],
      validationData: any[],
      callback: (err: any, result?: { user: CognitoUser }) => void
    ): void;
    getCurrentUser(): CognitoUser | null;
  }

  export class CognitoUser {
    constructor(data: { Username: string; Pool: CognitoUserPool });
    confirmRegistration(
      code: string,
      forceAliasCreation: boolean,
      callback: (err: any, result?: string) => void
    ): void;
    authenticateUser(
      authenticationDetails: AuthenticationDetails,
      callbacks: {
        onSuccess: (session: CognitoUserSession) => void;
        onFailure: (err: any) => void;
      }
    ): void;
    signOut(): void;
    getSession(callback: (err: any, session: CognitoUserSession) => void): void;
    forgotPassword(callbacks: {
      onSuccess: (data: any) => void;
      onFailure: (err: any) => void;
    }): void;
    confirmPassword(
      code: string,
      newPassword: string,
      callbacks: {
        onSuccess: () => void;
        onFailure: (err: any) => void;
      }
    ): void;
  }

  export class CognitoUserAttribute {
    constructor(data: { Name: string; Value: string });
  }

  export class AuthenticationDetails {
    constructor(data: { Username: string; Password: string });
  }

  export class CognitoUserSession {
    isValid(): boolean;
    getIdToken(): CognitoIdToken;
    getAccessToken(): CognitoAccessToken;
    getRefreshToken(): CognitoRefreshToken;
  }

  export class CognitoIdToken {
    getJwtToken(): string;
  }

  export class CognitoAccessToken {
    getJwtToken(): string;
  }

  export class CognitoRefreshToken {
    getToken(): string;
  }
}