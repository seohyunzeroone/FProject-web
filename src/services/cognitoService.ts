import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
  CognitoUserAttribute,
  CognitoUserSession,
} from 'amazon-cognito-identity-js';

// Cognito 설정 인터페이스
export interface CognitoConfig {
  userPoolId: string;
  clientId: string;
  region: string;
  domain: string;
}

// 사용자 정보 인터페이스
export interface CognitoUserInfo {
  username: string;
  email: string;
  name?: string;
  nickname?: string;
  sub: string;
  emailVerified: boolean;
}

// 인증 결과 인터페이스
export interface AuthResult {
  accessToken: string;
  idToken: string;
  refreshToken: string;
  user: CognitoUserInfo;
}

class CognitoService {
  private userPool: CognitoUserPool;
  private config: CognitoConfig;

  constructor(config: CognitoConfig) {
    this.config = config;
    
    // User Pool 초기화
    this.userPool = new CognitoUserPool({
      UserPoolId: config.userPoolId,
      ClientId: config.clientId,
    });
  }

  /**
   * 환경 변수에서 Cognito 설정을 로드하고 검증합니다
   */
  static loadConfigFromEnv(): CognitoConfig {
    const region = import.meta.env.VITE_COGNITO_REGION;
    const userPoolId = import.meta.env.VITE_COGNITO_USER_POOL_ID;
    const clientId = import.meta.env.VITE_COGNITO_CLIENT_ID;
    const domain = import.meta.env.VITE_COGNITO_DOMAIN;

    // 디버깅: 환경 변수 로드 확인
    console.log('환경 변수 로드 시도:', {
      region,
      userPoolId,
      clientId,
      domain,
      allEnv: import.meta.env
    });

    // 필수 환경 변수 검증
    if (!region || !userPoolId || !clientId || !domain) {
      const missing = [];
      if (!region) missing.push('VITE_COGNITO_REGION');
      if (!userPoolId) missing.push('VITE_COGNITO_USER_POOL_ID');
      if (!clientId) missing.push('VITE_COGNITO_CLIENT_ID');
      if (!domain) missing.push('VITE_COGNITO_DOMAIN');
      
      throw new Error(
        `필수 환경 변수가 누락되었습니다: ${missing.join(', ')}`
      );
    }

    return {
      region,
      userPoolId,
      clientId,
      domain,
    };
  }

  /**
   * 회원가입
   */
  async signUp(email: string, password: string, name: string, nickname: string): Promise<void> {
    console.log('🔵 회원가입 시도:', { email, name, nickname });
    
    return new Promise((resolve, reject) => {
      const attributeList = [
        new CognitoUserAttribute({
          Name: 'email',
          Value: email,
        }),
        new CognitoUserAttribute({
          Name: 'name',
          Value: name,
        }),
        new CognitoUserAttribute({
          Name: 'preferred_username',
          Value: nickname,
        }),
      ];

      console.log('🔵 Cognito signUp 호출 중...');

      this.userPool.signUp(
        email,
        password,
        attributeList,
        [],
        (err, result) => {
          if (err) {
            console.error('🔴 회원가입 실패:', err);
            console.error('🔴 에러 코드:', (err as any).code);
            console.error('🔴 에러 메시지:', err.message);
            reject(err);
            return;
          }
          console.log('✅ 회원가입 성공:', result);
          console.log('✅ 사용자 확인 필요:', result?.userConfirmed);
          console.log('✅ CodeDeliveryDetails:', result?.codeDeliveryDetails);
          resolve();
        }
      );
    });
  }

  /**
   * 이메일 인증
   */
  async confirmSignUp(email: string, code: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const userData = {
        Username: email,
        Pool: this.userPool,
      };

      const cognitoUser = new CognitoUser(userData);

      cognitoUser.confirmRegistration(code, true, (err) => {
        if (err) {
          reject(err);
          return;
        }
        resolve();
      });
    });
  }

  /**
   * 인증 코드 재전송
   */
  async resendConfirmationCode(email: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const userData = {
        Username: email,
        Pool: this.userPool,
      };

      const cognitoUser = new CognitoUser(userData);

      cognitoUser.resendConfirmationCode((err, result) => {
        if (err) {
          console.error('인증 코드 재전송 에러:', err);
          reject(err);
          return;
        }
        console.log('인증 코드 재전송 성공:', result);
        resolve();
      });
    });
  }

  /**
   * 로그인
   */
  async signIn(email: string, password: string): Promise<AuthResult> {
    return new Promise((resolve, reject) => {
      const authenticationDetails = new AuthenticationDetails({
        Username: email,
        Password: password,
      });

      const userData = {
        Username: email,
        Pool: this.userPool,
      };

      const cognitoUser = new CognitoUser(userData);

      cognitoUser.authenticateUser(authenticationDetails, {
        onSuccess: (session: CognitoUserSession) => {
          const idToken = session.getIdToken();
          const accessToken = session.getAccessToken();
          const refreshToken = session.getRefreshToken();

          // ID 토큰에서 사용자 정보 추출
          const payload = idToken.payload;

          const authResult: AuthResult = {
            accessToken: accessToken.getJwtToken(),
            idToken: idToken.getJwtToken(),
            refreshToken: refreshToken.getToken(),
            user: {
              username: payload['cognito:username'],
              email: payload.email,
              name: payload.name,
              nickname: payload['preferred_username'],
              sub: payload.sub,
              emailVerified: payload.email_verified,
            },
          };

          resolve(authResult);
        },
        onFailure: (err) => {
          reject(err);
        },
      });
    });
  }

  /**
   * 현재 세션 가져오기
   */
  async getCurrentSession(): Promise<AuthResult | null> {
    return new Promise((resolve) => {
      const cognitoUser = this.userPool.getCurrentUser();

      if (!cognitoUser) {
        resolve(null);
        return;
      }

      cognitoUser.getSession((err: Error | null, session: CognitoUserSession | null) => {
        if (err || !session || !session.isValid()) {
          resolve(null);
          return;
        }

        const idToken = session.getIdToken();
        const accessToken = session.getAccessToken();
        const refreshToken = session.getRefreshToken();
        const payload = idToken.payload;

        const authResult: AuthResult = {
          accessToken: accessToken.getJwtToken(),
          idToken: idToken.getJwtToken(),
          refreshToken: refreshToken.getToken(),
          user: {
            username: payload['cognito:username'],
            email: payload.email,
            name: payload.name,
            nickname: payload['preferred_username'],
            sub: payload.sub,
            emailVerified: payload.email_verified,
          },
        };

        resolve(authResult);
      });
    });
  }

  /**
   * 토큰 갱신
   */
  async refreshSession(): Promise<AuthResult> {
    return new Promise((resolve, reject) => {
      const cognitoUser = this.userPool.getCurrentUser();

      if (!cognitoUser) {
        reject(new Error('No current user'));
        return;
      }

      cognitoUser.getSession((err: Error | null, session: CognitoUserSession | null) => {
        if (err || !session) {
          reject(err || new Error('No session'));
          return;
        }

        const refreshTokenObj = session.getRefreshToken();

        cognitoUser.refreshSession(refreshTokenObj, (err, session) => {
          if (err) {
            reject(err);
            return;
          }

          const idToken = session.getIdToken();
          const accessToken = session.getAccessToken();
          const refreshToken = session.getRefreshToken();
          const payload = idToken.payload;

          const authResult: AuthResult = {
            accessToken: accessToken.getJwtToken(),
            idToken: idToken.getJwtToken(),
            refreshToken: refreshToken.getToken(),
            user: {
              username: payload['cognito:username'],
              email: payload.email,
              name: payload.name,
              nickname: payload['preferred_username'],
              sub: payload.sub,
              emailVerified: payload.email_verified,
            },
          };

          resolve(authResult);
        });
      });
    });
  }

  /**
   * Google 로그인 URL 생성
   */
  getGoogleLoginUrl(): string {
    const redirectUri = import.meta.env.VITE_OAUTH_REDIRECT_URI;
    
    if (!redirectUri) {
      throw new Error('VITE_OAUTH_REDIRECT_URI 환경 변수가 설정되지 않았습니다');
    }

    const url = new URL(`https://${this.config.domain}/oauth2/authorize`);
    url.searchParams.append('client_id', this.config.clientId);
    url.searchParams.append('response_type', 'code');
    url.searchParams.append('scope', 'openid email profile');
    url.searchParams.append('redirect_uri', redirectUri);
    url.searchParams.append('identity_provider', 'Google');

    return url.toString();
  }

  /**
   * OAuth 콜백에서 토큰 파싱 (재시도 로직 포함)
   */
  async parseAuthCallback(url: string): Promise<AuthResult> {
    const urlObj = new URL(url);
    const code = urlObj.searchParams.get('code');

    if (!code) {
      throw new Error('Authorization code not found in callback URL');
    }

    const redirectUri = import.meta.env.VITE_OAUTH_REDIRECT_URI;
    
    if (!redirectUri) {
      throw new Error('VITE_OAUTH_REDIRECT_URI 환경 변수가 설정되지 않았습니다');
    }

    // 토큰 교환 (재시도 로직 포함)
    const tokens = await this.exchangeCodeForTokens(code, redirectUri);

    // ID 토큰 디코딩하여 사용자 정보 추출
    const idTokenPayload = this.decodeJWT(tokens.id_token);

    const authResult: AuthResult = {
      accessToken: tokens.access_token,
      idToken: tokens.id_token,
      refreshToken: tokens.refresh_token,
      user: {
        username: idTokenPayload['cognito:username'],
        email: idTokenPayload.email,
        name: idTokenPayload.name,
        nickname: idTokenPayload['preferred_username'],
        sub: idTokenPayload.sub,
        emailVerified: idTokenPayload.email_verified,
      },
    };

    return authResult;
  }

  /**
   * Authorization code를 토큰으로 교환 (재시도 로직 포함)
   */
  private async exchangeCodeForTokens(
    code: string, 
    redirectUri: string, 
    maxRetries: number = 3
  ): Promise<any> {
    const tokenUrl = `https://${this.config.domain}/oauth2/token`;
    
    const params = new URLSearchParams();
    params.append('grant_type', 'authorization_code');
    params.append('client_id', this.config.clientId);
    params.append('code', code);
    params.append('redirect_uri', redirectUri);

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`토큰 교환 시도 ${attempt}/${maxRetries}...`);
        
        const response = await fetch(tokenUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: params.toString(),
        });

        if (!response.ok) {
          const errorText = await response.text();
          
          // "Application is busy" 에러인 경우 재시도
          if (errorText.includes('Application is busy') && attempt < maxRetries) {
            console.warn(`서버가 바쁩니다. ${attempt + 1}번째 시도 전 대기 중...`);
            // 지수 백오프: 1초, 2초, 4초
            await this.sleep(1000 * Math.pow(2, attempt - 1));
            continue;
          }
          
          throw new Error(`Token exchange failed: ${errorText}`);
        }

        const tokens = await response.json();
        console.log('토큰 교환 성공!');
        return tokens;
        
      } catch (error: any) {
        lastError = error;
        
        // 마지막 시도가 아니고, 재시도 가능한 에러인 경우
        if (attempt < maxRetries && error.message.includes('Application is busy')) {
          console.warn(`재시도 ${attempt}/${maxRetries} 실패. 다시 시도합니다...`);
          await this.sleep(1000 * Math.pow(2, attempt - 1));
          continue;
        }
        
        // 재시도 불가능한 에러이거나 마지막 시도인 경우
        throw error;
      }
    }

    // 모든 재시도 실패
    throw lastError || new Error('Token exchange failed after all retries');
  }

  /**
   * 지정된 시간만큼 대기
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * JWT 토큰 디코딩 (페이로드만)
   */
  private decodeJWT(token: string): any {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT token');
    }

    const payload = parts[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded);
  }

  /**
   * 비밀번호 재설정 요청
   */
  async forgotPassword(email: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const userData = {
        Username: email,
        Pool: this.userPool,
      };

      const cognitoUser = new CognitoUser(userData);

      cognitoUser.forgotPassword({
        onSuccess: () => {
          resolve();
        },
        onFailure: (err) => {
          reject(err);
        },
      });
    });
  }

  /**
   * 비밀번호 재설정 확인
   */
  async confirmPassword(
    email: string,
    code: string,
    newPassword: string
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const userData = {
        Username: email,
        Pool: this.userPool,
      };

      const cognitoUser = new CognitoUser(userData);

      cognitoUser.confirmPassword(code, newPassword, {
        onSuccess: () => {
          resolve();
        },
        onFailure: (err) => {
          reject(err);
        },
      });
    });
  }

  /**
   * 로그아웃
   */
  async signOut(): Promise<void> {
    return new Promise((resolve) => {
      const cognitoUser = this.userPool.getCurrentUser();

      if (cognitoUser) {
        cognitoUser.signOut();
      }

      resolve();
    });
  }
}

// 싱글톤 인스턴스 생성
let cognitoServiceInstance: CognitoService | null = null;

export function getCognitoService(): CognitoService {
  if (!cognitoServiceInstance) {
    const config = CognitoService.loadConfigFromEnv();
    cognitoServiceInstance = new CognitoService(config);
  }
  return cognitoServiceInstance;
}

export default CognitoService;
