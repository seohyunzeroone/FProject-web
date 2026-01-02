# AWS Cognito 인증 시스템 핸즈온 가이드

이 가이드는 AWS Cognito를 이용한 사용자 인증 시스템을 처음부터 끝까지 구축하는 방법을 단계별로 설명합니다. 각 단계를 따라하면서 실제로 동작하는 인증 시스템을 만들 수 있습니다.

## 목차

1. [사전 준비](#1-사전-준비)
2. [AWS Cognito User Pool 생성](#2-aws-cognito-user-pool-생성)
3. [Google OAuth 2.0 설정](#3-google-oauth-20-설정)
4. [Cognito에 Google 연동](#4-cognito에-google-연동)
5. [환경 변수 설정](#5-환경-변수-설정)
6. [필요한 패키지 설치](#6-필요한-패키지-설치)
7. [코드 구현](#7-코드-구현)
8. [테스트 및 검증](#8-테스트-및-검증)
9. [문제 해결](#9-문제-해결)

---

## 1. 사전 준비

### 필요한 것들

- ✅ AWS 계정 (없으면 [aws.amazon.com](https://aws.amazon.com)에서 생성)
- ✅ Google Cloud 계정 (없으면 [console.cloud.google.com](https://console.cloud.google.com)에서 생성)
- ✅ Node.js 18+ 설치
- ✅ 프로젝트가 로컬에서 실행 가능한 상태

### 예상 소요 시간
- AWS Cognito 설정: 15-20분
- Google OAuth 설정: 10-15분
- 코드 구현: 30-40분
- 총 약 1시간

---

## 2. AWS Cognito User Pool 생성 (2025 최신 간소화 UI)

> 🆕 **2025년 최신 UI**: AWS Cognito가 한 페이지에서 모든 설정을 완료하는 간소화된 UI로 업데이트되었습니다!

### Step 2.1: AWS Cognito 콘솔 접속

1. [AWS Management Console](https://console.aws.amazon.com) 로그인
2. 상단 검색창에 **"Cognito"** 입력
3. **Amazon Cognito** 서비스 선택

### Step 2.2: User Pool 생성 시작

메인 페이지에서:
- **"Create user pool"** 버튼 클릭

> 💡 한 페이지에 모든 설정 옵션이 표시됩니다!

---

### 📋 User Pool 설정 (한 페이지에서 모두 설정)

아래 설정들을 순서대로 입력하세요:

---

### Section 1: Define your application

#### Application type

애플리케이션 유형 선택:
- ⚪ **Single-page application (SPA)** ← **✅ 선택!**
- ⚪ Traditional web application
- ⚪ Mobile application
- ⚪ Machine-to-machine application

> 💡 React + Vite 프로젝트는 SPA입니다

#### Name your application

- 입력: `FProject Web App` (원하는 이름)

---

### Section 2: Configure options

#### Options for sign-in identifiers

사용자 로그인 방법:
- ✅ **Email** 체크
- ⬜ Username 체크 해제
- ⬜ Phone number 체크 해제
- ⬜ Preferred username 체크 해제

#### Required attributes for sign-up

회원가입 시 필수 정보:
- ✅ **name** 체크
- ⬜ 다른 속성 체크 해제

> 💡 email은 로그인 식별자로 선택했기 때문에 자동으로 필수입니다

#### Enable self-registration

- ✅ **Enable self-registration** 체크

> ⚠️ **매우 중요!** 이 옵션을 체크해야 사용자가 직접 회원가입할 수 있습니다!

---

### Section 3: Add a return URL

#### Return URL (Callback URL)

- 입력: `http://localhost:8080/auth/callback`

> ⚠️ **정확히 입력하세요!**
> - 포트 번호: 8080 (프로젝트 설정)
> - 경로: /auth/callback
> - 오타가 있으면 로그인 후 오류 발생

---

### Step 2.3: User Pool 생성

페이지 하단:
- **"Create user directory"** 버튼 클릭
- 약 30초 대기

> 🎉 User Pool과 App Client가 자동으로 생성됩니다!

---

### Step 2.4: 생성된 정보 확인 및 저장

**메모장을 열고** 다음 정보를 복사합니다:

#### ✅ User Pool ID

- 위치: User pool overview 페이지 상단
- 예: `ap-northeast-2_xxxxxxxxx`
- 📋 복사하여 메모장에 저장

#### ✅ AWS Region

- User Pool ID의 앞부분 (언더스코어 앞)
- 예: `ap-northeast-2` (서울)
- 📋 복사하여 메모장에 저장

#### ✅ App Client ID

1. 좌측 메뉴 **"App integration"** 탭 클릭
2. 페이지 하단으로 스크롤
3. **"App clients and analytics"** 섹션 찾기
4. 생성된 App client 이름 클릭
5. **Client ID** 복사
   - 예: `1a2b3c4d5e6f7g8h9i0j1k2l3m`
   - 📋 복사하여 메모장에 저장

---

### Step 2.5: Cognito Domain 생성

여전히 **"App integration"** 탭에 있는 상태에서:

1. 페이지 상단으로 스크롤
2. **"Domain"** 섹션 찾기
3. **"Actions"** 드롭다운 클릭
4. **"Create Cognito domain"** 선택

#### Domain 설정

**Domain prefix** 입력:
- 입력: `fproject-auth-test-20250127`
- 또는: `fproject-auth-[your-name]-[random]`

> ⚠️ **중요**:
> - 전 세계적으로 고유해야 합니다
> - `aws`, `amazon`, `cognito` 단어 사용 불가
> - 이미 사용 중이면 다른 이름 시도

**"Create Cognito domain"** 버튼 클릭

#### ✅ Cognito Domain 확인

생성 완료 후:
- 도메인 확인: `fproject-auth-test-20250127.auth.ap-northeast-2.amazoncognito.com`
- 📋 복사하여 메모장에 저장 (https:// 제외)

---

### 📝 메모장 정리

```
✅ User Pool ID: ap-northeast-2_xxxxxxxxx
✅ Region: ap-northeast-2
✅ App Client ID: 1a2b3c4d5e6f7g8h9i0j1k2l3m
✅ Cognito Domain: fproject-auth-test-20250127.auth.ap-northeast-2.amazoncognito.com
```

이 정보들은 나중에 환경 변수 설정에 사용됩니다!

---

## 3. Google OAuth 2.0 설정

### Step 3.1: Google Cloud Console 접속

1. [Google Cloud Console](https://console.cloud.google.com) 접속
2. 로그인

### Step 3.2: 프로젝트 생성 (없는 경우)

1. 상단의 프로젝트 선택 드롭다운 클릭
2. **"NEW PROJECT"** 클릭
3. **Project name**: `FProject Auth` 입력
4. **"CREATE"** 클릭
5. 생성된 프로젝트 선택

### Step 3.3: OAuth Consent Screen 설정

1. 좌측 메뉴에서 **"APIs & Services"** > **"OAuth consent screen"** 선택

2. **User Type** 선택:
   - ⚪ **External** 선택 (테스트용)
   - **"CREATE"** 클릭

3. **OAuth consent screen** 정보 입력:
   - **App name**: `FProject` 입력
   - **User support email**: 본인 이메일 선택
   - **Developer contact information**: 본인 이메일 입력
   - 나머지는 선택사항 (비워둬도 됨)
   - **"SAVE AND CONTINUE"** 클릭

4. **Scopes** 페이지:
   - **"ADD OR REMOVE SCOPES"** 클릭
   - 다음 스코프 선택:
     - ✅ `.../auth/userinfo.email`
     - ✅ `.../auth/userinfo.profile`
     - ✅ `openid`
   - **"UPDATE"** 클릭
   - **"SAVE AND CONTINUE"** 클릭

5. **Test users** 페이지:
   - **"ADD USERS"** 클릭
   - 테스트에 사용할 Google 계정 이메일 입력
   - **"ADD"** 클릭
   - **"SAVE AND CONTINUE"** 클릭

6. **Summary** 페이지:
   - 설정 확인
   - **"BACK TO DASHBOARD"** 클릭

### Step 3.4: OAuth 2.0 Client ID 생성

1. 좌측 메뉴에서 **"Credentials"** 선택

2. 상단의 **"+ CREATE CREDENTIALS"** 클릭

3. **"OAuth client ID"** 선택

4. **Application type**:
   - **Web application** 선택

5. **Name**: 
   - `FProject Web Client` 입력

6. **Authorized JavaScript origins**:
   - **"+ ADD URI"** 클릭
   - 입력: `http://localhost:8080` (로컬 개발용)
   - 나중에 프로덕션 URL도 추가 가능

7. **Authorized redirect URIs**:
   - **"+ ADD URI"** 클릭
   - 입력: `https://[YOUR-COGNITO-DOMAIN].auth.[REGION].amazoncognito.com/oauth2/idpresponse`
   - 예: `https://fproject-auth-test.auth.ap-northeast-2.amazoncognito.com/oauth2/idpresponse`
   
> ⚠️ **중요**: 
> - `[YOUR-COGNITO-DOMAIN]`을 Step 2.9에서 메모한 도메인으로 교체
> - `/oauth2/idpresponse`는 정확히 입력해야 합니다

8. **"CREATE"** 클릭

### Step 3.5: Client ID와 Secret 복사

팝업 창이 나타나면:

1. **Client ID** 복사 (메모장에 저장)
   - 예: `123456789012-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com`

2. **Client secret** 복사 (메모장에 저장)
   - 예: `GOCSPX-abcdefghijklmnopqrstuvwxyz`

3. **"OK"** 클릭

> 💡 **나중에 다시 확인하려면**: Credentials 페이지에서 생성한 OAuth 2.0 Client를 클릭하면 됩니다

---

## 4. Cognito에 Google 연동

### Step 4.1: Cognito User Pool로 돌아가기

1. AWS Cognito 콘솔로 돌아갑니다
2. 생성한 User Pool 선택

### Step 4.2: Identity Provider 추가

1. 좌측 메뉴에서 **"Sign-in experience"** 탭 클릭

2. **"Federated identity provider sign-in"** 섹션에서:
   - **"Add identity provider"** 버튼 클릭

3. **Provider type**:
   - **Google** 선택

4. **Google client ID**:
   - Step 3.5에서 복사한 Google Client ID 붙여넣기

5. **Google client secret**:
   - Step 3.5에서 복사한 Google Client secret 붙여넣기

6. **Authorized scopes**:
   - 기본값 유지: `profile email openid`

7. **Map attributes between Google and your user pool**:
   - 기본 매핑 유지:
     - `email` → `email`
     - `name` → `name`

8. **"Add identity provider"** 클릭

### Step 4.3: App Client 설정 업데이트

1. 좌측 메뉴에서 **"App integration"** 탭 클릭

2. 하단 **"App clients and analytics"** 섹션에서:
   - 생성한 App client 클릭

3. **Hosted UI** 섹션에서 **"Edit"** 버튼 클릭

#### Allowed callback URLs

- 이미 `http://localhost:8080/auth/callback`이 있는지 확인
- 없으면 **"Add another URL"** 클릭하여 추가

#### Allowed sign-out URLs

- **"Add another URL"** 클릭
- 입력: `http://localhost:8080/auth`

#### Identity providers

- ✅ **Google** 체크
- ✅ **Cognito user pool** 체크 (이미 선택됨)

> 💡 두 가지 로그인 방법을 모두 사용할 수 있습니다

#### OAuth 2.0 grant types

- ✅ **Authorization code grant** 체크
- ⬜ Implicit grant 체크 해제

> 💡 Authorization code grant가 더 안전합니다

#### OpenID Connect scopes

- ✅ **OpenID** 체크
- ✅ **Email** 체크
- ✅ **Profile** 체크
- ⬜ Phone 체크 해제
- ⬜ aws.cognito.signin.user.admin 체크 해제

**"Save changes"** 클릭

---

## 5. 환경 변수 설정

### Step 5.1: .env 파일 생성

프로젝트 루트 디렉토리(`FProject-web/`)에 `.env` 파일을 생성합니다:

```bash
# FProject-web/.env
```

### Step 5.2: 환경 변수 입력

`.env` 파일에 다음 내용을 입력합니다 (Step 2.4에서 메모한 정보 사용):

```env
# AWS Cognito Configuration
VITE_COGNITO_REGION=ap-northeast-2
VITE_COGNITO_USER_POOL_ID=ap-northeast-2_xxxxxxxxx
VITE_COGNITO_CLIENT_ID=1234567890abcdefghijklmnop
VITE_COGNITO_DOMAIN=fproject-auth-test.auth.ap-northeast-2.amazoncognito.com

# OAuth Configuration
VITE_OAUTH_REDIRECT_URI=http://localhost:8080/auth/callback
VITE_OAUTH_LOGOUT_URI=http://localhost:8080/auth
```

> ⚠️ **주의사항**:
> - `VITE_COGNITO_USER_POOL_ID`: Step 2.9의 User Pool ID
> - `VITE_COGNITO_CLIENT_ID`: Step 2.9의 App Client ID
> - `VITE_COGNITO_DOMAIN`: https:// 없이 도메인만 입력
> - Region은 User Pool을 생성한 리전 (서울은 `ap-northeast-2`)

### Step 5.3: .env.example 파일 생성

다른 개발자를 위한 템플릿 파일을 생성합니다:

```bash
# FProject-web/.env.example
```

내용:

```env
# AWS Cognito Configuration
VITE_COGNITO_REGION=
VITE_COGNITO_USER_POOL_ID=
VITE_COGNITO_CLIENT_ID=
VITE_COGNITO_DOMAIN=

# OAuth Configuration  
VITE_OAUTH_REDIRECT_URI=http://localhost:8080/auth/callback
VITE_OAUTH_LOGOUT_URI=http://localhost:8080/auth
```

### Step 5.4: .gitignore 확인

`.gitignore` 파일에 `.env`가 포함되어 있는지 확인합니다:

```bash
# FProject-web/.gitignore
```

다음 줄이 있어야 합니다:

```
.env
.env.local
.env.*.local
```

없으면 추가하세요!

---

## 6. 필요한 패키지 설치

### Step 6.1: 터미널 열기

프로젝트 디렉토리에서 터미널을 엽니다:

```bash
cd FProject-web
```

### Step 6.2: Cognito SDK 설치

```bash
npm install amazon-cognito-identity-js
```

이 패키지는 AWS Cognito와 통신하는 JavaScript SDK입니다.

### Step 6.3: 설치 확인

`package.json` 파일을 열어 다음이 추가되었는지 확인:

```json
{
  "dependencies": {
    "amazon-cognito-identity-js": "^6.3.12",
    // ... 기타 의존성
  }
}
```

---

## 7. 코드 구현

이제 실제 코드를 작성할 차례입니다! 다음 순서로 진행합니다:

1. ✅ Cognito Service Layer
2. ✅ Auth Context
3. ✅ Protected Route
4. ✅ OAuth Callback Handler
5. ✅ Auth 페이지 업데이트
6. ✅ 라우팅 설정

각 단계는 별도의 태스크로 진행하면 됩니다. 

**다음 단계**: `tasks.md` 파일을 열고 **Task 2 (Cognito Service Layer 구현)**부터 시작하세요!

---

## 8. 테스트 및 검증

### Step 8.1: 개발 서버 시작

```bash
npm run dev
```

브라우저에서 `http://localhost:8080` 접속

### Step 8.2: 회원가입 테스트

1. 로그인 페이지에서 **"가입하기"** 클릭
2. 이름, 이메일, 비밀번호 입력
3. **"회원 등록"** 버튼 클릭
4. 이메일로 인증 코드 수신 확인
5. 6자리 코드 입력
6. **"인증 확인"** 버튼 클릭

### Step 8.3: 로그인 테스트

1. 이메일과 비밀번호 입력
2. **"기록실 입장"** 버튼 클릭
3. 메인 페이지로 리다이렉트 확인

### Step 8.4: Google 로그인 테스트

1. **"Google로 로그인"** 버튼 클릭
2. Google 로그인 페이지로 리다이렉트 확인
3. Google 계정으로 로그인
4. 앱으로 돌아와서 인증 완료 확인

### Step 8.5: 로그아웃 테스트

1. 로그아웃 버튼 클릭
2. 로그인 페이지로 리다이렉트 확인
3. 보호된 페이지 접근 시 로그인 페이지로 리다이렉트 확인

### Step 8.6: 비밀번호 재설정 테스트

1. 로그인 페이지에서 **"비밀번호를 잊으셨나요?"** 클릭
2. 이메일 입력
3. **"코드 전송"** 버튼 클릭
4. 이메일로 재설정 코드 수신
5. 코드와 새 비밀번호 입력
6. 새 비밀번호로 로그인 확인

---

## 9. 문제 해결

### 문제 1: "User pool domain already exists"

**증상**: Cognito 도메인 생성 시 이미 사용 중이라는 오류

**해결**:
- 다른 고유한 도메인 이름 시도
- 예: `fproject-auth-test-20240127` (날짜 추가)

### 문제 2: Google 로그인 후 "redirect_uri_mismatch" 오류

**증상**: Google 로그인 시 리다이렉트 URI 불일치 오류

**해결**:
1. Google Cloud Console > Credentials 확인
2. Authorized redirect URIs에 정확한 Cognito 콜백 URL 추가:
   ```
   https://[YOUR-DOMAIN].auth.[REGION].amazoncognito.com/oauth2/idpresponse
   ```
3. Authorized JavaScript origins에 `http://localhost:8080` 추가
4. 오타 확인 (특히 `/oauth2/idpresponse`)

### 문제 3: 환경 변수가 로드되지 않음

**증상**: `undefined` 오류 또는 설정을 찾을 수 없음

**해결**:
1. `.env` 파일이 프로젝트 루트에 있는지 확인
2. 환경 변수 이름이 `VITE_`로 시작하는지 확인
3. 개발 서버 재시작:
   ```bash
   # Ctrl+C로 서버 중지 후
   npm run dev
   ```

### 문제 4: "NotAuthorizedException" 오류

**증상**: 로그인 시 인증 실패

**해결**:
1. 이메일 인증이 완료되었는지 확인
2. 비밀번호가 정책을 만족하는지 확인 (8자 이상, 특수문자 포함)
3. Cognito User Pool에서 사용자 상태 확인:
   - AWS Console > Cognito > User Pool > Users
   - Status가 "CONFIRMED"인지 확인

### 문제 5: 이메일이 오지 않음

**증상**: 인증 코드 또는 비밀번호 재설정 이메일 미수신

**해결**:
1. 스팸 폴더 확인
2. AWS Cognito 이메일 전송 제한 확인 (하루 50개)
3. 이메일 주소가 올바른지 확인
4. Cognito 콘솔에서 이메일 전송 로그 확인

### 문제 6: CORS 오류

**증상**: 브라우저 콘솔에 CORS 관련 오류

**해결**:
1. Cognito App Client 설정에서 Allowed callback URLs 확인
2. `http://localhost:8080/auth/callback` 정확히 입력되었는지 확인
3. 프로토콜(http/https) 일치 확인
4. 포트 번호 확인 (이 프로젝트는 8080 사용)

### 문제 7: "Invalid client_id" 오류

**증상**: Google 로그인 시 client_id 오류

**해결**:
1. `.env` 파일의 `VITE_COGNITO_CLIENT_ID` 확인
2. Cognito App Client ID가 정확한지 확인
3. Google OAuth Client ID와 혼동하지 않았는지 확인

---

## 추가 리소스

### 공식 문서

- [AWS Cognito 문서](https://docs.aws.amazon.com/cognito/)
- [amazon-cognito-identity-js GitHub](https://github.com/aws-amplify/amplify-js/tree/main/packages/amazon-cognito-identity-js)
- [Google OAuth 2.0 문서](https://developers.google.com/identity/protocols/oauth2)

### 유용한 도구

- [JWT.io](https://jwt.io/) - JWT 토큰 디코딩
- [Cognito User Pool 테스트](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-pools-testing.html)

---

## 다음 단계

✅ AWS Cognito User Pool 생성 완료
✅ Google OAuth 설정 완료
✅ 환경 변수 설정 완료
✅ 패키지 설치 완료

**이제 코드 구현을 시작하세요!**

`tasks.md` 파일을 열고 **Task 2: Cognito Service Layer 구현**부터 진행하면 됩니다.

각 태스크를 하나씩 완료하면서 실제 동작하는 인증 시스템을 만들어보세요! 🚀

---

## 질문이 있으신가요?

이 가이드를 따라하다가 막히는 부분이 있으면 언제든지 물어보세요!
