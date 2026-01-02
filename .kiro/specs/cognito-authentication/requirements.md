# Requirements Document

## Introduction

이 문서는 FProject 웹 애플리케이션에 AWS Cognito를 이용한 사용자 인증 시스템을 구현하기 위한 요구사항을 정의합니다. 테스트 환경에서 Google 소셜 로그인을 포함한 완전한 인증 플로우를 구현하며, 학습 목적으로 상세한 핸즈온 가이드를 제공합니다.

## Glossary

- **Cognito_Service**: AWS Cognito를 이용한 사용자 인증 및 관리 서비스
- **Auth_Context**: React Context API를 통해 애플리케이션 전역에서 인증 상태를 관리하는 컨텍스트
- **User_Pool**: AWS Cognito에서 사용자 정보를 저장하고 관리하는 사용자 디렉토리
- **Identity_Provider**: Google과 같은 외부 소셜 로그인 제공자
- **Auth_Token**: 사용자 인증 후 발급되는 JWT 토큰 (ID Token, Access Token, Refresh Token)
- **Protected_Route**: 인증된 사용자만 접근할 수 있는 라우트
- **Test_Environment**: 개발 및 학습을 위한 테스트용 AWS 환경

## Requirements

### Requirement 1: AWS Cognito 설정 및 구성

**User Story:** 개발자로서, AWS Cognito User Pool을 설정하고 Google 소셜 로그인을 구성하여, 사용자 인증 인프라를 준비하고 싶습니다.

#### Acceptance Criteria

1. WHEN AWS 콘솔에서 Cognito User Pool을 생성할 때, THE System SHALL 이메일 기반 로그인과 Google OAuth 2.0 제공자를 지원하도록 구성되어야 합니다
2. WHEN Google Identity Provider를 설정할 때, THE System SHALL Google Cloud Console에서 OAuth 2.0 클라이언트 ID를 생성하고 Cognito에 연동해야 합니다
3. WHEN User Pool을 구성할 때, THE System SHALL 테스트 환경에 적합한 보안 정책(비밀번호 요구사항, MFA 비활성화)을 적용해야 합니다
4. WHEN App Client를 생성할 때, THE System SHALL 웹 애플리케이션에서 사용할 수 있는 클라이언트 ID와 도메인을 설정해야 합니다
5. WHEN Hosted UI를 구성할 때, THE System SHALL 로그인 후 리다이렉트될 콜백 URL과 로그아웃 URL을 설정해야 합니다

### Requirement 2: 이메일/비밀번호 회원가입

**User Story:** 사용자로서, 이메일과 비밀번호를 사용하여 새 계정을 만들고, 이메일 인증을 완료하여 서비스를 이용하고 싶습니다.

#### Acceptance Criteria

1. WHEN 사용자가 이메일, 비밀번호, 이름을 입력하고 회원가입 버튼을 클릭할 때, THE Cognito_Service SHALL 새로운 사용자 계정을 생성하고 인증 코드를 이메일로 전송해야 합니다
2. WHEN 비밀번호가 정책 요구사항(8자 이상, 특수문자 포함)을 충족하지 않을 때, THE System SHALL 회원가입을 거부하고 명확한 오류 메시지를 표시해야 합니다
3. WHEN 이미 존재하는 이메일로 회원가입을 시도할 때, THE System SHALL 적절한 오류 메시지를 표시해야 합니다
4. WHEN 회원가입이 성공할 때, THE System SHALL 사용자를 이메일 인증 화면으로 자동 전환해야 합니다
5. WHEN 사용자가 6자리 인증 코드를 입력할 때, THE Cognito_Service SHALL 코드를 검증하고 계정을 활성화해야 합니다

### Requirement 3: 이메일/비밀번호 로그인

**User Story:** 사용자로서, 등록된 이메일과 비밀번호로 로그인하여 내 계정에 접근하고 싶습니다.

#### Acceptance Criteria

1. WHEN 사용자가 올바른 이메일과 비밀번호를 입력하고 로그인 버튼을 클릭할 때, THE Cognito_Service SHALL 사용자를 인증하고 Auth_Token을 발급해야 합니다
2. WHEN 로그인이 성공할 때, THE Auth_Context SHALL 사용자 정보와 토큰을 저장하고 메인 페이지로 리다이렉트해야 합니다
3. WHEN 잘못된 이메일 또는 비밀번호를 입력할 때, THE System SHALL 로그인을 거부하고 명확한 오류 메시지를 표시해야 합니다
4. WHEN 이메일 인증이 완료되지 않은 계정으로 로그인을 시도할 때, THE System SHALL 인증 화면으로 리다이렉트하고 코드 재전송 옵션을 제공해야 합니다
5. WHEN 로그인 세션이 유효할 때, THE System SHALL 페이지 새로고침 후에도 로그인 상태를 유지해야 합니다

### Requirement 4: Google 소셜 로그인

**User Story:** 사용자로서, Google 계정을 사용하여 빠르고 안전하게 로그인하고 싶습니다.

#### Acceptance Criteria

1. WHEN 사용자가 "Google로 로그인" 버튼을 클릭할 때, THE System SHALL Cognito Hosted UI를 통해 Google 로그인 페이지로 리다이렉트해야 합니다
2. WHEN Google 인증이 성공할 때, THE Cognito_Service SHALL 사용자를 콜백 URL로 리다이렉트하고 인증 코드를 전달해야 합니다
3. WHEN 콜백 URL에서 인증 코드를 받을 때, THE System SHALL 코드를 토큰으로 교환하고 사용자 정보를 가져와야 합니다
4. WHEN Google 로그인이 처음 사용될 때, THE System SHALL 자동으로 새 사용자 계정을 생성하고 Google 프로필 정보를 저장해야 합니다
5. WHEN Google 로그인이 완료될 때, THE Auth_Context SHALL 사용자를 인증된 상태로 설정하고 메인 페이지로 리다이렉트해야 합니다

### Requirement 5: 비밀번호 재설정

**User Story:** 사용자로서, 비밀번호를 잊어버렸을 때 이메일을 통해 비밀번호를 재설정하고 싶습니다.

#### Acceptance Criteria

1. WHEN 사용자가 "비밀번호를 잊으셨나요?" 링크를 클릭하고 이메일을 입력할 때, THE Cognito_Service SHALL 비밀번호 재설정 코드를 이메일로 전송해야 합니다
2. WHEN 사용자가 재설정 코드와 새 비밀번호를 입력할 때, THE Cognito_Service SHALL 코드를 검증하고 비밀번호를 업데이트해야 합니다
3. WHEN 새 비밀번호가 정책 요구사항을 충족하지 않을 때, THE System SHALL 비밀번호 변경을 거부하고 오류 메시지를 표시해야 합니다
4. WHEN 비밀번호 재설정이 성공할 때, THE System SHALL 사용자를 로그인 화면으로 리다이렉트하고 성공 메시지를 표시해야 합니다
5. WHEN 재설정 코드가 만료되었을 때, THE System SHALL 코드 재전송 옵션을 제공해야 합니다

### Requirement 6: 로그아웃 및 세션 관리

**User Story:** 사용자로서, 안전하게 로그아웃하고 내 세션을 종료하고 싶습니다.

#### Acceptance Criteria

1. WHEN 사용자가 로그아웃 버튼을 클릭할 때, THE Cognito_Service SHALL 현재 세션을 무효화하고 모든 토큰을 삭제해야 합니다
2. WHEN 로그아웃이 완료될 때, THE Auth_Context SHALL 사용자 상태를 초기화하고 로그인 페이지로 리다이렉트해야 합니다
3. WHEN Access Token이 만료될 때, THE System SHALL Refresh Token을 사용하여 자동으로 새 토큰을 발급받아야 합니다
4. WHEN Refresh Token도 만료되었을 때, THE System SHALL 사용자를 로그아웃 처리하고 로그인 페이지로 리다이렉트해야 합니다
5. WHEN 여러 탭에서 로그아웃할 때, THE System SHALL 모든 탭에서 로그아웃 상태를 동기화해야 합니다

### Requirement 7: 보호된 라우트 및 인증 상태 관리

**User Story:** 개발자로서, 인증이 필요한 페이지를 보호하고 인증되지 않은 사용자의 접근을 제한하고 싶습니다.

#### Acceptance Criteria

1. WHEN 인증되지 않은 사용자가 Protected_Route에 접근을 시도할 때, THE System SHALL 사용자를 로그인 페이지로 리다이렉트해야 합니다
2. WHEN 인증된 사용자가 Protected_Route에 접근할 때, THE System SHALL 요청된 페이지를 정상적으로 표시해야 합니다
3. WHEN 애플리케이션이 로드될 때, THE Auth_Context SHALL 로컬 스토리지에서 토큰을 확인하고 세션을 복원해야 합니다
4. WHEN 토큰이 유효하지 않을 때, THE System SHALL 자동으로 로그아웃 처리하고 로그인 페이지로 리다이렉트해야 합니다
5. WHEN 인증 상태가 변경될 때, THE System SHALL 모든 컴포넌트에 변경사항을 즉시 반영해야 합니다

### Requirement 8: 환경 변수 및 설정 관리

**User Story:** 개발자로서, AWS Cognito 설정을 환경 변수로 관리하여 보안을 유지하고 배포 환경별로 다른 설정을 사용하고 싶습니다.

#### Acceptance Criteria

1. WHEN 애플리케이션이 시작될 때, THE System SHALL 환경 변수 파일(.env)에서 Cognito 설정을 로드해야 합니다
2. WHEN 필수 환경 변수가 누락되었을 때, THE System SHALL 명확한 오류 메시지를 표시하고 애플리케이션 시작을 중단해야 합니다
3. WHEN 환경 변수 파일을 생성할 때, THE System SHALL .gitignore에 포함되어 민감한 정보가 버전 관리에 포함되지 않아야 합니다
4. WHEN 테스트 환경을 설정할 때, THE System SHALL 개발용 Cognito User Pool 설정을 사용해야 합니다
5. WHERE 프로덕션 환경에서, THE System SHALL 별도의 프로덕션 User Pool 설정을 사용할 수 있어야 합니다

### Requirement 9: 핸즈온 가이드 문서

**User Story:** 개발자로서, AWS Cognito 설정부터 코드 구현까지 단계별로 따라할 수 있는 상세한 가이드를 통해 학습하고 싶습니다.

#### Acceptance Criteria

1. THE Documentation SHALL AWS 콘솔에서 Cognito User Pool을 생성하는 단계별 스크린샷과 설명을 포함해야 합니다
2. THE Documentation SHALL Google Cloud Console에서 OAuth 2.0 클라이언트를 설정하는 과정을 상세히 설명해야 합니다
3. THE Documentation SHALL 각 코드 파일의 역할과 구현 방법을 예제 코드와 함께 설명해야 합니다
4. THE Documentation SHALL 일반적인 오류 상황과 해결 방법을 포함해야 합니다
5. THE Documentation SHALL 테스트 방법과 검증 절차를 단계별로 설명해야 합니다

### Requirement 10: 에러 처리 및 사용자 피드백

**User Story:** 사용자로서, 인증 과정에서 발생하는 오류를 이해하기 쉬운 메시지로 확인하고 적절한 조치를 취하고 싶습니다.

#### Acceptance Criteria

1. WHEN Cognito API 호출이 실패할 때, THE System SHALL 사용자 친화적인 한국어 오류 메시지를 표시해야 합니다
2. WHEN 네트워크 오류가 발생할 때, THE System SHALL 재시도 옵션을 제공해야 합니다
3. WHEN 로딩 중일 때, THE System SHALL 로딩 인디케이터를 표시하여 사용자에게 진행 상황을 알려야 합니다
4. WHEN 인증 작업이 성공할 때, THE System SHALL 성공 메시지를 토스트로 표시해야 합니다
5. WHEN 예상치 못한 오류가 발생할 때, THE System SHALL 오류를 콘솔에 로깅하고 일반적인 오류 메시지를 사용자에게 표시해야 합니다
