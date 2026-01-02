# cognitoService.ts - AWS Cognito API 연동 서비스

이 파일은 AWS Cognito와 직접 통신하는 서비스 레이어입니다.

**위치**: `src/services/cognitoService.ts`

**역할**:
- AWS Cognito User Pool과 통신
- 회원가입, 로그인, 이메일 인증 처리
- Google OAuth URL 생성 및 토큰 교환
- 세션 관리 및 토큰 갱신

---

## 전체 코드 (주석 포함)

파일이 매우 길어서 주요 부분만 발췌합니다. 전체 코드는 실제 파일을 참고하세요.

### 1. Import 및 타입 정의

```typescript
import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
  CognitoUserAttribute,
  CognitoUserSession,
} from 'amazon-cognito-identity-js';

/**
 * Cognito 설정 인터페이스
 * AWS Cognito User Pool 연결에 필요한 정보
 */
export interface CognitoConfig {
  region: string;           // AWS 리전 (예: ap-northeast-2)
  userPoolId: string;       // User Pool ID
  clientId: string;         // App Client ID
  domain: string;           // Cognito Domain
}

/**
 * 인증 결과 인터페이스
 * 로그인 성공 시 반환되는 데이터 구조
 */
export interface AuthResult {
  accessToken: string;      // API 호출용 토큰
  idToken: string;          // 사용자 정보 포함 토큰
  refreshToken: string;     // 토큰 갱신용
  user: CognitoUserInfo;    // 사용자 정보
}

/**
 * Cognito 사용자 정보 인터페이스
 */
export interface CognitoUserInfo {
  username: string;         // 사용자명 (고유 ID)
  email: string;            // 이메일
  name: string;             // 이름
  sub: string;              // Cognito 고유 식별자
  emailVerified: boolean;   // 이메일 인증 여부
}
```

---

### 2. CognitoService 클래스 - 초기화

```typescript
/**
 * AWS Cognito 인증 서비스 클래스
 * 
 * 싱글톤 패턴으로 구현되어 앱 전체에서 하나의 인스턴스만 사용
 */
export class CognitoService {
  private config: CognitoConfig;
  private userPool: CognitoUserPool;

  constructor(config: CognitoConfig) {
    this.config = config;
    
    // Cognito User Pool 초기화
    this.userPool = new CognitoUserPool({
      UserPoolId: config.userPoolId,
      ClientId: config.clientId,
    });
  }

  /**
   * 환경 변수에서 설정 로드
   * Vite 환경에서는 VITE_ 접두사 필요
   */
  loadConfigFromEnv(): void {
    console.log('환경 변수 로드 시도:', {
      region: import.meta.env.VITE_COGNITO_REGION,
      userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID,
      clientId: import.meta.env.VITE_COGNITO_CLIENT_ID,
      domain: import.meta.env.VITE_COGNITO_DOMAIN,
    });

    const region = import.meta.env.VITE_COGNITO_REGION;
    const userPoolId = import.meta.env.VITE_COGNITO_USER_POOL_ID;
    const clientId = import.meta.env.VITE_COGNITO_CLIENT_ID;
    const domain = import.meta.env.VITE_COGNITO_DOMAIN;

    // 필수 환경 변수 검증
    if (!region || !userPoolId || !clientId || !domain) {
      const missing = [];
      if (!region) missing.push('VITE_COGNITO_REGION');
      if (!userPoolId) missing.push('VITE_COGNITO_USER_POOL_ID');
      if (!clientId) missing.push('VITE_COGNITO_CLIENT_ID');
      if (!domain) missing.push('VITE_COGNITO_DOMAIN');
      
      throw new Error(`필수 환경 변수가 누락되었습니다: ${missing.join(', ')}`);
    }

    this.config = { region, userPoolId, clientId, domain };
    
    // User Pool 재초기화
    this.userPool = new CognitoUserPool({
      UserPoolId: userPoolId,
      ClientId: clientId,
    });
  }
}
```

---

### 3. 회원가입 및 이메일 인증

```typescript
/**
 * 회원가입
 * 
 * @param email - 사용자 이메일
 * @param password - 비밀번호 (8자 이상, 특수문자 포함)
 * @param name - 사용자 이름
 * @returns Promise<void>
 * 
 * 처리 과정:
 * 1. 이메일과 이름을 Cognito 속성으로 변환
 * 2. userPool.signUp() 호출
 * 3. 성공 시 이메일로 인증 코드 전송됨
 */
async signUp(email: string, password: string, name: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // Cognito 속성 배열 생성
    const attributeList = [
      new CognitoUserAttribute({ Name: 'email', Value: email }),
      new CognitoUserAttribute({ Name: 'name', Value: name }),
    ];

    // 회원가입 API 호출
    this.userPool.signUp(
      email,              // username으로 email 사용
      password,
      attributeList,
      [],                 // validationData (선택사항)
      (err, result) => {
        if (err) {
          reject(err);
          return;
        }
        resolve();
      }
    );
  });
}

/**
 * 이메일 인증 확인
 * 
 * @param email - 사용자 이메일
 * @param code - 6자리 인증 코드
 * @returns Promise<void>
 * 
 * 처리 과정:
 * 1. 이메일로 CognitoUser 객체 생성
 * 2. confirmRegistration() 호출
 * 3. 성공 시 사용자 상태가 CONFIRMED로 변경됨
 */
async confirmSignUp(email: string, code: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const userData = {
      Username: email,
      Pool: this.userPool,
    };

    const cognitoUser = new CognitoUser(userData);

    // 인증 코드 확인
    cognitoUser.confirmRegistration(code, true, (err, result) => {
      if (err) {
        reject(err);
        return;
      }
      resolve();
    });
  });
}
```

---

### 4. 로그인

```typescript
/**
 * 로그인
 * 
 * @param email - 사용자 이메일
 * @param password - 비밀번호
 * @returns Promise<AuthResult> - 토큰 및 사용자 정보
 * 
 * 처리 과정:
 * 1. AuthenticationDetails 생성 (이메일, 비밀번호)
 * 2. CognitoUser 생성
 * 3. authenticateUser() 호출
 * 4. 성공 시 세션에서 토큰 추출
 * 5. ID 토큰에서 사용자 정보 추출
 */
async signIn(email: string, password: string): Promise<AuthResult> {
  return new Promise((resolve, reject) => {
    // 인증 정보 생성
    const authenticationDetails = new AuthenticationDetails({
      Username: email,
      Password: password,
    });

    const userData = {
      Username: email,
      Pool: this.userPool,
    };

    const cognitoUser = new CognitoUser(userData);

    // 로그인 시도
    cognitoUser.authenticateUser(authenticationDetails, {
      onSuccess: (session: CognitoUserSession) => {
        // 세션에서 토큰 추출
        const accessToken = session.getAccessToken().getJwtToken();
        const idToken = session.getIdToken().getJwtToken();
        const refreshToken = session.getRefreshToken().getToken();

        // ID 토큰에서 사용자 정보 추출
        const payload = session.getIdToken().payload;

        const authResult: AuthResult = {
          accessToken,
          idToken,
          refreshToken,
          user: {
            username: payload['cognito:username'],
            email: payload.email,
            name: payload.name,
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
```

---

### 5. Google OAuth URL 생성

```typescript
/**
 * Google 로그인 URL 생성
 * 
 * @returns string - Google OAuth 로그인 URL
 * 
 * URL 구조:
 * https://[DOMAIN]/oauth2/authorize?
 *   client_id=[CLIENT_ID]&
 *   response_type=code&
 *   scope=openid+email+phone+profile&
 *   redirect_uri=[CALLBACK_URL]&
 *   identity_provider=Google
 * 
 * 처리 과정:
 * 1. Cognito Hosted UI URL 생성
 * 2. 필요한 파라미터 추가
 * 3. 사용자를 이 URL로 리다이렉트하면 Google 로그인 시작
 */
getGoogleLoginUrl(): string {
  const redirectUri = import.meta.env.VITE_OAUTH_REDIRECT_URI;
  
  if (!redirectUri) {
    throw new Error('VITE_OAUTH_REDIRECT_URI 환경 변수가 설정되지 않았습니다');
  }

  // Cognito Hosted UI URL 생성
  const url = new URL(`https://${this.config.domain}/oauth2/authorize`);
  
  // OAuth 파라미터 추가
  url.searchParams.append('client_id', this.config.clientId);
  url.searchParams.append('response_type', 'code');
  url.searchParams.append('scope', 'openid email phone profile');
  url.searchParams.append('redirect_uri', redirectUri);
  url.searchParams.append('identity_provider', 'Google');

  return url.toString();
}
```

---

### 6. OAuth 콜백 처리 (토큰 교환)

```typescript
/**
 * OAuth 콜백에서 토큰 파싱 (재시도 로직 포함)
 * 
 * @param url - 콜백 URL (authorization code 포함)
 * @returns Promise<AuthResult> - 토큰 및 사용자 정보
 * 
 * 처리 과정:
 * 1. URL에서 authorization code 추출
 * 2. code를 토큰으로 교환 (exchangeCodeForTokens)
 * 3. ID 토큰 디코딩하여 사용자 정보 추출
 * 4. AuthResult 반환
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
      sub: idTokenPayload.sub,
      emailVerified: idTokenPayload.email_verified,
    },
  };

  return authResult;
}
```

---

### 7. 토큰 교환 (재시도 로직)

```typescript
/**
 * Authorization code를 토큰으로 교환 (재시도 로직 포함)
 * 
 * @param code - Authorization code
 * @param redirectUri - 콜백 URL
 * @param maxRetries - 최대 재시도 횟수 (기본 3회)
 * @returns Promise<any> - 토큰 객체
 * 
 * 재시도 로직:
 * - "Application is busy" 에러 발생 시 자동 재시도
 * - 지수 백오프(Exponential Backoff) 적용
 *   • 1차 재시도: 1초 대기
 *   • 2차 재시도: 2초 대기
 *   • 3차 재시도: 4초 대기
 * 
 * 처리 과정:
 * 1. Cognito 토큰 엔드포인트로 POST 요청
 * 2. 실패 시 에러 종류 확인
 * 3. "Application is busy"면 재시도
 * 4. 다른 에러면 즉시 throw
 */
private async exchangeCodeForTokens(
  code: string, 
  redirectUri: string, 
  maxRetries: number = 3
): Promise<any> {
  const tokenUrl = `https://${this.config.domain}/oauth2/token`;
  
  // URL-encoded 파라미터 생성
  const params = new URLSearchParams();
  params.append('grant_type', 'authorization_code');
  params.append('client_id', this.config.clientId);
  params.append('code', code);
  params.append('redirect_uri', redirectUri);

  let lastError: Error | null = null;

  // 최대 maxRetries번 시도
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`토큰 교환 시도 ${attempt}/${maxRetries}...`);
      
      // Cognito 토큰 엔드포인트 호출
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
          continue;  // 다음 시도로
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
 * 
 * @param ms - 대기 시간 (밀리초)
 * @returns Promise<void>
 */
private sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
```

---

### 8. JWT 토큰 디코딩

```typescript
/**
 * JWT 토큰 디코딩 (페이로드만)
 * 
 * @param token - JWT 토큰 문자열
 * @returns any - 디코딩된 페이로드 객체
 * 
 * JWT 구조: header.payload.signature
 * - header: 토큰 타입 및 알고리즘
 * - payload: 실제 데이터 (사용자 정보 등)
 * - signature: 검증용 서명
 * 
 * 이 함수는 payload만 디코딩 (검증은 하지 않음)
 */
private decodeJWT(token: string): any {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid JWT token');
  }

  // payload 부분 추출 (두 번째 부분)
  const payload = parts[1];
  
  // Base64 URL 디코딩
  // - 와 _ 를 + 와 / 로 변경 (Base64 URL → Base64)
  const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
  
  // JSON 파싱
  return JSON.parse(decoded);
}
```

---

### 9. 로그아웃

```typescript
/**
 * 로그아웃
 * 
 * @returns Promise<void>
 * 
 * 처리 과정:
 * 1. 현재 로그인된 사용자 가져오기
 * 2. cognitoUser.signOut() 호출
 * 3. 로컬 세션 정리
 * 
 * 참고: 로컬 스토리지 정리는 AuthContext에서 처리
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
```

---

### 10. 싱글톤 인스턴스

```typescript
// 싱글톤 인스턴스 생성
let cognitoServiceInstance: CognitoService | null = null;

/**
 * CognitoService 싱글톤 인스턴스 가져오기
 * 
 * @returns CognitoService - 싱글톤 인스턴스
 * 
 * 처리 과정:
 * 1. 인스턴스가 없으면 새로 생성
 * 2. 환경 변수에서 설정 로드
 * 3. 같은 인스턴스 반환 (싱글톤 패턴)
 */
export function getCognitoService(): CognitoService {
  if (!cognitoServiceInstance) {
    // 빈 설정으로 초기화 (환경 변수에서 로드할 예정)
    cognitoServiceInstance = new CognitoService({
      region: '',
      userPoolId: '',
      clientId: '',
      domain: '',
    });
    
    // 환경 변수에서 설정 로드
    cognitoServiceInstance.loadConfigFromEnv();
  }
  
  return cognitoServiceInstance;
}
```

---

## 핵심 개념 정리

### 1. 싱글톤 패턴
- 앱 전체에서 하나의 CognitoService 인스턴스만 사용
- `getCognitoService()` 함수로 인스턴스 접근
- 메모리 효율적이고 상태 일관성 유지

### 2. Promise 기반 비동기 처리
- Cognito SDK는 콜백 기반
- Promise로 래핑하여 async/await 사용 가능
- 에러 처리 간편화

### 3. 재시도 로직 (Exponential Backoff)
- 일시적인 서버 오류 대응
- 재시도 간격을 점진적으로 늘림
- 서버 부하 감소

### 4. JWT 토큰 구조
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
        ↑ header                          ↑ payload                                                                    ↑ signature
```

---

## 다음 문서

**CODE_2_AUTH_CONTEXT.md** - AuthContext.tsx 전체 코드
