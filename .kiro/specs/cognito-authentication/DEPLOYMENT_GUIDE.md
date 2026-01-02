# AWS Cognito 인증 시스템 - 프로덕션 배포 가이드

이 문서는 로컬 개발 환경(`localhost:8080`)에서 실제 도메인(`wildwildworld.store`)으로 배포할 때 필요한 모든 설정 변경 사항을 정리한 것입니다.

---

## 목차

1. [환경 변수 수정](#1-환경-변수-수정)
2. [AWS Cognito 설정 변경](#2-aws-cognito-설정-변경)
3. [Google Cloud Console 설정 변경](#3-google-cloud-console-설정-변경)
4. [HTTPS 필수 설정](#4-https-필수-설정)
5. [배포 체크리스트](#5-배포-체크리스트)

---

## 1. 환경 변수 수정

### 1.1 로컬 환경 (.env)

**현재 설정** (`FProject-web/.env`):
```bash
VITE_COGNITO_REGION=ap-northeast-2
VITE_COGNITO_USER_POOL_ID=ap-northeast-2_ZWofNPLa4
VITE_COGNITO_CLIENT_ID=7vrhk1253iv78o61h0qcocu320
VITE_COGNITO_DOMAIN=ap-northeast-2zwofnpla4.auth.ap-northeast-2.amazoncognito.com
VITE_OAUTH_REDIRECT_URI=http://localhost:8080/auth/callback
VITE_OAUTH_LOGOUT_URI=http://localhost:8080/auth
```

### 1.2 프로덕션 환경 (.env.production)

**새로 생성** (`FProject-web/.env.production`):
```bash
VITE_COGNITO_REGION=ap-northeast-2
VITE_COGNITO_USER_POOL_ID=ap-northeast-2_ZWofNPLa4
VITE_COGNITO_CLIENT_ID=7vrhk1253iv78o61h0qcocu320
VITE_COGNITO_DOMAIN=ap-northeast-2zwofnpla4.auth.ap-northeast-2.amazoncognito.com

# ⭐ 변경 필요: localhost → 실제 도메인 (HTTPS 필수!)
VITE_OAUTH_REDIRECT_URI=https://wildwildworld.store/auth/callback
VITE_OAUTH_LOGOUT_URI=https://wildwildworld.store/auth
```

**중요 포인트**:
- ✅ `http://` → `https://` (HTTPS 필수!)
- ✅ `localhost:8080` → `wildwildworld.store`
- ✅ 포트 번호 제거 (80/443은 기본 포트)

---

## 2. AWS Cognito 설정 변경

### 2.1 App Client 설정 업데이트

AWS Cognito Console에서 다음 설정을 변경해야 합니다:

#### 경로:
```
AWS Cognito Console
→ User pools
→ ap-northeast-2_ZWofNPLa4
→ Applications
→ App clients
→ 해당 App client 선택
→ Login pages
→ Edit
```

#### 변경 사항:

**1) Allowed callback URLs**

현재:
```
http://localhost:8080/auth/callback
```

변경 후 (둘 다 추가):
```
http://localhost:8080/auth/callback          ← 로컬 개발용 (유지)
https://wildwildworld.store/auth/callback    ← 프로덕션용 (추가)
```

**2) Allowed sign-out URLs**

현재:
```
http://localhost:8080/auth
```

변경 후 (둘 다 추가):
```
http://localhost:8080/auth                   ← 로컬 개발용 (유지)
https://wildwildworld.store/auth             ← 프로덕션용 (추가)
```

**💡 팁**: 로컬과 프로덕션 URL을 모두 추가하면 개발과 배포를 동시에 사용할 수 있습니다!

---

## 3. Google Cloud Console 설정 변경

### 3.1 OAuth 2.0 Client ID 설정 업데이트

#### 경로:
```
Google Cloud Console
→ APIs & Services
→ Credentials
→ OAuth 2.0 Client IDs
→ 해당 Client ID 선택
```

#### 변경 사항:

**1) Authorized JavaScript origins**

현재:
```
http://localhost:8080
```

변경 후 (둘 다 추가):
```
http://localhost:8080                        ← 로컬 개발용 (유지)
https://wildwildworld.store                  ← 프로덕션용 (추가)
```

**2) Authorized redirect URIs**

현재:
```
https://ap-northeast-2zwofnpla4.auth.ap-northeast-2.amazoncognito.com/oauth2/idpresponse
```

변경 후 (그대로 유지):
```
https://ap-northeast-2zwofnpla4.auth.ap-northeast-2.amazoncognito.com/oauth2/idpresponse
```

**💡 참고**: Cognito의 redirect URI는 변경할 필요 없습니다. Google → Cognito → 앱 순서로 리다이렉트되기 때문입니다.

---

## 4. HTTPS 필수 설정

### 4.1 왜 HTTPS가 필수인가?

**AWS Cognito 요구사항**:
- OAuth 2.0 보안 표준에 따라 프로덕션 환경에서는 **HTTPS 필수**
- `localhost`는 예외적으로 HTTP 허용 (개발 목적)
- 실제 도메인에서는 반드시 HTTPS 사용

### 4.2 SSL 인증서 설정 방법

#### 옵션 1: Let's Encrypt (무료, 추천)

**Certbot 사용**:
```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx

# SSL 인증서 발급
sudo certbot --nginx -d wildwildworld.store
```

#### 옵션 2: AWS Certificate Manager (ACM)

**CloudFront + S3 배포 시**:
1. AWS Certificate Manager에서 인증서 요청
2. 도메인 소유권 검증 (DNS 또는 이메일)
3. CloudFront에 인증서 연결

#### 옵션 3: Cloudflare (무료 SSL)

1. Cloudflare에 도메인 추가
2. DNS 설정 변경
3. 자동으로 SSL 적용

---

## 5. 배포 체크리스트

### 5.1 배포 전 체크리스트

- [ ] **환경 변수 파일 생성**
  - [ ] `.env.production` 파일 생성
  - [ ] 모든 URL을 `https://wildwildworld.store`로 변경
  - [ ] 환경 변수 값 확인

- [ ] **AWS Cognito 설정**
  - [ ] Allowed callback URLs에 프로덕션 URL 추가
  - [ ] Allowed sign-out URLs에 프로덕션 URL 추가
  - [ ] 설정 저장 확인

- [ ] **Google Cloud Console 설정**
  - [ ] Authorized JavaScript origins에 프로덕션 도메인 추가
  - [ ] OAuth consent screen 상태 확인 (Testing → Production)

- [ ] **SSL 인증서**
  - [ ] SSL 인증서 발급 완료
  - [ ] HTTPS 접속 테스트
  - [ ] 인증서 자동 갱신 설정

- [ ] **DNS 설정**
  - [ ] A 레코드 또는 CNAME 레코드 설정
  - [ ] DNS 전파 확인 (최대 48시간 소요)

### 5.2 빌드 및 배포

#### 프로덕션 빌드:
```bash
cd FProject-web

# 프로덕션 환경 변수로 빌드
npm run build
# 또는
yarn build
```

#### 빌드 결과:
- `FProject-web/dist/` 폴더에 정적 파일 생성
- 이 폴더를 웹 서버에 배포

#### 배포 옵션:

**1) Nginx 서버**:
```nginx
server {
    listen 443 ssl;
    server_name wildwildworld.store;

    ssl_certificate /etc/letsencrypt/live/wildwildworld.store/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/wildwildworld.store/privkey.pem;

    root /var/www/wildwildworld.store/dist;
    index index.html;

    # SPA 라우팅 지원
    location / {
        try_files $uri $uri/ /index.html;
    }
}

# HTTP → HTTPS 리다이렉트
server {
    listen 80;
    server_name wildwildworld.store;
    return 301 https://$server_name$request_uri;
}
```

**2) AWS S3 + CloudFront**:
```bash
# S3 버킷 생성 및 업로드
aws s3 sync dist/ s3://wildwildworld.store --delete

# CloudFront 배포 생성
# - Origin: S3 버킷
# - SSL Certificate: ACM 인증서
# - Custom Domain: wildwildworld.store
```

**3) Vercel (간편 배포)**:
```bash
# Vercel CLI 설치
npm i -g vercel

# 배포
vercel --prod
```

### 5.3 배포 후 테스트

- [ ] **기본 접속 테스트**
  - [ ] `https://wildwildworld.store` 접속 확인
  - [ ] HTTPS 인증서 유효성 확인 (자물쇠 아이콘)

- [ ] **인증 기능 테스트**
  - [ ] 이메일/비밀번호 회원가입
  - [ ] 이메일 인증
  - [ ] 로그인
  - [ ] Google 로그인
  - [ ] 로그아웃
  - [ ] 비밀번호 재설정

- [ ] **리다이렉트 테스트**
  - [ ] Google 로그인 후 콜백 URL 확인
  - [ ] 로그아웃 후 리다이렉트 확인

- [ ] **크로스 브라우저 테스트**
  - [ ] Chrome
  - [ ] Firefox
  - [ ] Safari
  - [ ] Edge

---

## 6. 환경별 설정 요약

### 6.1 로컬 개발 환경

| 항목 | 값 |
|------|-----|
| 도메인 | `http://localhost:8080` |
| Callback URL | `http://localhost:8080/auth/callback` |
| Logout URL | `http://localhost:8080/auth` |
| SSL | 불필요 (HTTP 허용) |
| 환경 변수 파일 | `.env` |

### 6.2 프로덕션 환경

| 항목 | 값 |
|------|-----|
| 도메인 | `https://wildwildworld.store` |
| Callback URL | `https://wildwildworld.store/auth/callback` |
| Logout URL | `https://wildwildworld.store/auth` |
| SSL | **필수** (HTTPS) |
| 환경 변수 파일 | `.env.production` |

---

## 7. 트러블슈팅

### 7.1 "redirect_uri_mismatch" 에러

**증상**:
```
Error: redirect_uri_mismatch
```

**원인**:
- AWS Cognito의 Allowed callback URLs에 프로덕션 URL이 없음
- URL이 정확히 일치하지 않음 (대소문자, 슬래시 등)

**해결**:
1. AWS Cognito Console에서 Allowed callback URLs 확인
2. `https://wildwildworld.store/auth/callback` 정확히 추가
3. 설정 저장 후 5분 정도 대기

### 7.2 "Origin not allowed" 에러

**증상**:
```
Error: Origin not allowed
```

**원인**:
- Google Cloud Console의 Authorized JavaScript origins에 도메인이 없음

**해결**:
1. Google Cloud Console → Credentials
2. Authorized JavaScript origins에 `https://wildwildworld.store` 추가
3. 설정 저장

### 7.3 SSL 인증서 에러

**증상**:
```
NET::ERR_CERT_AUTHORITY_INVALID
```

**원인**:
- SSL 인증서가 유효하지 않음
- 인증서가 만료됨

**해결**:
1. SSL 인증서 재발급
2. 인증서 자동 갱신 설정 확인
3. 브라우저 캐시 삭제

---

## 8. 보안 권장 사항

### 8.1 환경 변수 관리

**❌ 하지 말아야 할 것**:
- `.env.production` 파일을 Git에 커밋
- 환경 변수를 코드에 하드코딩

**✅ 해야 할 것**:
- `.env.production`을 `.gitignore`에 추가
- CI/CD 파이프라인에서 환경 변수 주입
- AWS Secrets Manager 또는 환경 변수 관리 도구 사용

### 8.2 CORS 설정

프로덕션 환경에서는 CORS 설정을 엄격하게 관리:

```typescript
// 백엔드 API가 있는 경우
const allowedOrigins = [
  'https://wildwildworld.store',
  'http://localhost:8080' // 개발 환경
];
```

### 8.3 Content Security Policy (CSP)

HTML에 CSP 헤더 추가:

```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               connect-src 'self' https://*.amazoncognito.com https://accounts.google.com; 
               script-src 'self' 'unsafe-inline';">
```

---

## 9. 비용 최적화

### 9.1 AWS Cognito 요금

**무료 티어**:
- 월 50,000 MAU (Monthly Active Users) 무료
- 이후 MAU당 $0.0055

**프로덕션 예상 비용**:
- 1,000명 사용자: 무료
- 10,000명 사용자: 무료
- 100,000명 사용자: ~$275/월

### 9.2 CloudFront 요금 (선택사항)

**무료 티어** (12개월):
- 50GB 데이터 전송 무료
- 2,000,000 HTTP/HTTPS 요청 무료

---

## 10. 참고 자료

- [AWS Cognito 도메인 설정](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-pools-assign-domain.html)
- [Let's Encrypt 설치 가이드](https://letsencrypt.org/getting-started/)
- [Google OAuth 2.0 설정](https://developers.google.com/identity/protocols/oauth2)
- [Vite 환경 변수 가이드](https://vitejs.dev/guide/env-and-mode.html)

---

## 마무리

이 가이드를 따라하면 로컬 개발 환경에서 프로덕션 환경으로 안전하게 배포할 수 있습니다.

**핵심 요약**:
1. ✅ `.env.production` 파일 생성 (HTTPS URL 사용)
2. ✅ AWS Cognito에 프로덕션 URL 추가
3. ✅ Google Cloud Console에 프로덕션 도메인 추가
4. ✅ SSL 인증서 설정 (HTTPS 필수)
5. ✅ 배포 후 전체 기능 테스트

**배포 완료 날짜**: 2025년 1월 27일

**다음 단계**: 모니터링 및 로그 설정, 에러 추적 (Sentry 등)
