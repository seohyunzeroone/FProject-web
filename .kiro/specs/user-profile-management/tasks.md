# 구현 계획: 사용자 프로필 관리 시스템

## 개요

이 구현 계획은 사용자 프로필 관리 시스템을 개별적이고 점진적인 작업으로 나눕니다. 각 작업은 이전 작업을 기반으로 하며, 데이터베이스 설정부터 시작하여 백엔드 서비스, Lambda 함수, 마지막으로 프론트엔드 컴포넌트 순으로 진행됩니다.

## 작업 목록

- [x] 1. PostgreSQL 데이터베이스 스키마 및 연결 설정
  - 모든 테이블(users, user_profiles, user_reports, user_inquiries)에 대한 데이터베이스 마이그레이션 스크립트 생성
  - 쿼리 최적화를 위한 인덱스 생성
  - 연결 풀링을 사용하는 데이터베이스 연결 서비스 구현
  - 데이터베이스 설정을 위한 환경 변수 추가
  - _요구사항: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 9.1, 9.4_

- [ ]* 1.1 데이터베이스 연결 풀링에 대한 속성 테스트 작성
  - **속성 10: 연결 풀 효율성**
  - **검증: 요구사항 9.1**

- [x] 2. User Service 모듈 구현
  - [x] 2.1 getUserProfile 메서드를 가진 UserService 클래스 생성
    - PostgreSQL users 및 user_profiles 테이블에서 사용자 데이터 가져오기
    - 사용자를 찾을 수 없는 경우 에러 처리
    - _요구사항: 3.1, 3.2, 3.3, 3.4_

  - [ ]* 2.2 사용자 프로필 조회에 대한 속성 테스트 작성
    - **속성 1: 사용자 동기화 일관성**
    - **검증: 요구사항 2.1**

  - [x] 2.3 updateUserProfile 메서드 구현
    - 입력 데이터 검증 (닉네임 길이, bio 길이, 전화번호 형식)
    - 닉네임 중복 확인
    - PostgreSQL 데이터베이스 업데이트
    - _요구사항: 4.1, 4.2, 4.3, 4.4_

  - [ ]* 2.4 프로필 업데이트 원자성에 대한 속성 테스트 작성
    - **속성 2: 프로필 업데이트 원자성**
    - **검증: 요구사항 4.1, 4.2, 4.3, 4.4**

  - [ ]* 2.5 닉네임 유일성에 대한 속성 테스트 작성
    - **속성 3: 닉네임 유일성**
    - **검증: 요구사항 4.1**

  - [x] 2.6 소프트 삭제를 사용하는 deleteUser 메서드 구현
    - status를 'deleted'로 설정하고 deleted_at 타임스탬프 설정
    - _요구사항: 6.3, 6.4_

  - [ ]* 2.7 소프트 삭제 보존에 대한 속성 테스트 작성
    - **속성 4: 소프트 삭제 보존**
    - **검증: 요구사항 6.3, 6.4**

  - [ ]* 2.8 입력 검증에 대한 단위 테스트 작성
    - 닉네임 검증 테스트 (3-20자)
    - bio 검증 테스트 (최대 500자)
    - 전화번호 형식 검증 테스트
    - _요구사항: 4.1, 4.3, 4.4_

- [x] 3. Auth Service 모듈 구현
  - [x] 3.1 verifyToken 메서드를 가진 AuthService 클래스 생성
    - AWS SDK를 사용하여 Cognito JWT 토큰 검증
    - 토큰에서 사용자 정보 추출
    - 토큰 만료 및 유효하지 않은 토큰 처리
    - _요구사항: 10.9_

  - [ ]* 3.2 인증 요구사항에 대한 속성 테스트 작성
    - **속성 8: 인증 요구사항**
    - **검증: 요구사항 10.9**

  - [x] 3.3 updateCognitoAttribute 메서드 구현
    - Cognito에서 사용자 속성 업데이트 (preferred_username)
    - Cognito API 에러 처리
    - _요구사항: 4.1_

  - [x] 3.4 initiatePasswordReset 및 confirmPasswordReset 메서드 구현
    - Cognito forgotPassword 및 confirmPassword API 사용
    - 비밀번호 강도 검증
    - _요구사항: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [x] 3.5 Cognito용 deleteUser 메서드 구현
    - Cognito User Pool에서 사용자 삭제
    - _요구사항: 6.3_

  - [ ]* 3.6 비밀번호 검증에 대한 단위 테스트 작성
    - 비밀번호 강도 요구사항 테스트 (최소 8자, 대문자, 소문자, 숫자, 특수문자)
    - _요구사항: 5.3_

- [x] 4. 체크포인트 - 모든 테스트 통과 확인
  - 모든 테스트가 통과하는지 확인하고, 질문이 있으면 사용자에게 문의하세요.

- [x] 5. Report Service 모듈 구현
  - [x] 5.1 createReport 메서드를 가진 ReportService 클래스 생성
    - reporter_id != reported_user_id 검증
    - reason 및 description 검증
    - 24시간 이내 중복 신고 확인
    - user_reports 테이블에 신고 삽입
    - _요구사항: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

  - [ ]* 5.2 자기 신고 방지에 대한 속성 테스트 작성
    - **속성 5: 자기 신고 방지**
    - **검증: 요구사항 7.1**

  - [ ]* 5.3 중복 신고 방지에 대한 속성 테스트 작성
    - **속성 6: 중복 신고 방지**
    - **검증: 요구사항 7.6**

  - [ ]* 5.4 신고 검증에 대한 단위 테스트 작성
    - description 길이 검증 테스트 (최대 1000자)
    - reason 검증 테스트 (유효한 카테고리)
    - _요구사항: 7.2, 7.4_

- [x] 6. Inquiry Service 모듈 구현
  - [x] 6.1 createInquiry 메서드를 가진 InquiryService 클래스 생성
    - subject 및 message 길이 검증
    - user_inquiries 테이블에 문의 삽입
    - inquiry ID 반환
    - _요구사항: 8.1, 8.2, 8.3_

  - [x] 6.2 getUserInquiries 메서드 구현
    - 사용자의 모든 문의 가져오기
    - created_at 내림차순 정렬
    - _요구사항: 8.4_

  - [ ]* 6.3 입력 검증 일관성에 대한 속성 테스트 작성
    - **속성 7: 입력 검증 일관성**
    - **검증: 요구사항 4.1, 4.3, 7.2, 7.4, 8.1**

  - [ ]* 6.4 문의 검증에 대한 단위 테스트 작성
    - subject 길이 검증 테스트 (최대 200자)
    - message 길이 검증 테스트 (최대 2000자)
    - _요구사항: 8.1_

- [x] 7. API 엔드포인트 구현
  - [x] 7.1 Express API 서버 설정 생성
    - Express 앱 초기화
    - 미들웨어 설정 (CORS, body-parser, error handler)
    - AuthService를 사용하는 인증 미들웨어 설정
    - _요구사항: 10.9_

  - [x] 7.2 GET /api/user/profile 엔드포인트 구현
    - JWT 토큰 검증
    - UserService.getUserProfile 호출
    - 프로필 데이터 또는 에러 반환
    - _요구사항: 10.1_

  - [x] 7.3 PUT /api/user/profile 엔드포인트 구현
    - JWT 토큰 검증
    - 요청 본문 검증
    - UserService.updateUserProfile 호출
    - 닉네임이 변경된 경우 Cognito 속성 업데이트
    - 업데이트된 프로필 또는 에러 반환
    - _요구사항: 10.2_

  - [x] 7.4 POST /api/user/password-reset 엔드포인트 구현
    - 이메일 형식 검증
    - AuthService.initiatePasswordReset 호출
    - 성공 메시지 반환
    - _요구사항: 10.3_

  - [x] 7.5 POST /api/user/password-reset/confirm 엔드포인트 구현
    - 요청 본문 검증 (email, code, newPassword)
    - AuthService.confirmPasswordReset 호출
    - 성공 메시지 반환
    - _요구사항: 10.4_

  - [x] 7.6 DELETE /api/user/account 엔드포인트 구현
    - JWT 토큰 검증
    - 비밀번호 재인증 요구
    - AuthService.deleteUser 호출 (Cognito)
    - UserService.deleteUser 호출 (PostgreSQL 소프트 삭제)
    - 성공 메시지 반환
    - _요구사항: 10.5_

  - [x] 7.7 POST /api/user/report 엔드포인트 구현
    - JWT 토큰 검증
    - 요청 본문 검증
    - ReportService.createReport 호출
    - 성공 메시지 반환
    - _요구사항: 10.6_

  - [x] 7.8 POST /api/user/inquiry 엔드포인트 구현
    - JWT 토큰 검증
    - 요청 본문 검증
    - InquiryService.createInquiry 호출
    - inquiry ID 반환
    - _요구사항: 10.7_

  - [x] 7.9 GET /api/user/inquiries 엔드포인트 구현
    - JWT 토큰 검증
    - InquiryService.getUserInquiries 호출
    - 문의 목록 반환
    - _요구사항: 10.8_

  - [ ]* 7.10 에러 메시지 안전성에 대한 속성 테스트 작성
    - **속성 9: 에러 메시지 안전성**
    - **검증: 요구사항 9.6**

  - [ ]* 7.11 API 엔드포인트에 대한 통합 테스트 작성
    - 유효한 토큰과 유효하지 않은 토큰으로 GET /api/user/profile 테스트
    - 다양한 입력 조합으로 PUT /api/user/profile 테스트
    - 비밀번호 재설정 플로우 테스트
    - 계정 삭제 플로우 테스트
    - 신고 및 문의 제출 테스트
    - _요구사항: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 10.8_

- [x] 8. 체크포인트 - 모든 백엔드 테스트 통과 확인
  - 모든 테스트가 통과하는지 확인하고, 질문이 있으면 사용자에게 문의하세요.

- [x] 9. Lambda 동기화 함수 구현
  - [x] 9.1 PostConfirmation Lambda 트리거 생성
    - Cognito 이벤트에서 사용자 속성 추출
    - PostgreSQL users 테이블에 사용자 삽입
    - 빈 user_profiles 레코드 생성
    - 에러 처리 및 재시도 로직 처리
    - _요구사항: 2.1_

  - [x] 9.2 PostAuthentication Lambda 트리거 생성
    - Cognito 이벤트에서 user_id 추출
    - PostgreSQL에서 last_login 타임스탬프 업데이트
    - _요구사항: 2.2_

  - [x] 9.3 Lambda IAM 역할 및 권한 설정
    - Lambda에 PostgreSQL 액세스 권한 부여 (VPC 설정)
    - Lambda에 CloudWatch Logs 액세스 권한 부여
    - _요구사항: 9.5_

  - [ ]* 9.4 Lambda 함수에 대한 단위 테스트 작성
    - 유효한 Cognito 이벤트로 PostConfirmation 테스트
    - 유효한 Cognito 이벤트로 PostAuthentication 테스트
    - 에러 처리 및 재시도 로직 테스트
    - _요구사항: 2.1, 2.2, 2.5_

- [x] 10. 프론트엔드 MyPage 컴포넌트 구현
  - [x] 10.1 MyPage 컴포넌트 구조 생성
    - 컴포넌트 상태 설정 (profile, isLoading, isEditing, error)
    - 마운트 시 프로필 데이터를 가져오는 useEffect 구현
    - 가져오는 동안 로딩 상태 표시
    - 가져오기 실패 시 에러 상태 표시
    - _요구사항: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [x] 10.2 프로필 표시 섹션 구현
    - 사용자 이메일, 닉네임, 프로필 이미지, bio, 전화번호 표시
    - 계정 생성 날짜 및 마지막 업데이트 날짜 표시
    - "프로필 수정" 버튼 추가
    - _요구사항: 3.1, 3.2_

  - [x] 10.3 비밀번호 재설정 섹션 추가
    - "비밀번호 재설정" 버튼 추가
    - 비밀번호 재설정 모달/다이얼로그 구현
    - 비밀번호 재설정 API 엔드포인트 호출
    - 성공/에러 메시지 표시
    - _요구사항: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [x] 10.4 계정 삭제 섹션 추가
    - 데이터 손실에 대한 경고와 함께 "계정 삭제" 버튼 추가
    - 확인 다이얼로그 구현
    - 비밀번호 재인증 요구
    - 계정 삭제 API 엔드포인트 호출
    - 성공 시 홈 페이지로 리다이렉트
    - _요구사항: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [x] 10.5 문의 내역 섹션 추가
    - 사용자 문의 목록 표시
    - 문의 상태 및 응답 표시
    - "새 문의" 버튼 추가
    - _요구사항: 8.4, 8.5_

- [x] 11. ProfileEditForm 컴포넌트 구현
  - [x] 11.1 ProfileEditForm 컴포넌트 구조 생성
    - react-hook-form으로 폼 상태 설정
    - 현재 프로필 데이터로 폼 초기화
    - _요구사항: 4.1, 4.2, 4.3, 4.4_

  - [x] 11.2 검증이 포함된 닉네임 필드 구현
    - 닉네임 입력 필드 추가
    - 길이 검증 (3-20자)
    - blur 시 닉네임 사용 가능 여부 확인
    - 검증 에러 표시
    - _요구사항: 4.1_

  - [x] 11.3 프로필 이미지 업로드 구현
    - 프로필 이미지용 파일 입력 추가
    - 선택한 이미지 미리보기
    - 스토리지에 이미지 업로드 (S3 또는 유사)
    - profile_image_url 업데이트
    - _요구사항: 4.2_

  - [x] 11.4 검증이 포함된 bio 필드 구현
    - bio용 textarea 추가
    - 길이 검증 (최대 500자)
    - 문자 수 표시
    - _요구사항: 4.3_

  - [x] 11.5 검증이 포함된 전화번호 필드 구현
    - 전화번호 입력 필드 추가
    - 전화번호 형식 검증
    - 검증 에러 표시
    - _요구사항: 4.4_

  - [x] 11.6 폼 제출 구현
    - PUT /api/user/profile 엔드포인트 호출
    - 성공 처리 (메시지 표시, 프로필 새로고침)
    - 에러 처리 (에러 메시지 표시, 폼 상태 유지)
    - _요구사항: 4.5, 4.6_

- [x] 12. ReportUserDialog 컴포넌트 구현
  - [x] 12.1 ReportUserDialog 컴포넌트 구조 생성
    - 다이얼로그/모달 컴포넌트 설정
    - 신고된 사용자 닉네임 표시
    - _요구사항: 7.1, 7.2_

  - [x] 12.2 신고 사유 드롭다운 구현
    - 신고 사유 드롭다운 추가 (spam, harassment, inappropriate_content, other)
    - _요구사항: 7.2_

  - [x] 12.3 설명 textarea 구현
    - 설명용 선택적 textarea 추가
    - 길이 검증 (최대 1000자)
    - 문자 수 표시
    - _요구사항: 7.2, 7.4_

  - [x] 12.4 폼 제출 구현
    - POST /api/user/report 엔드포인트 호출
    - 성공 처리 (확인 메시지 표시, 다이얼로그 닫기)
    - 에러 처리 (에러 메시지 표시)
    - _요구사항: 7.5_

- [x] 13. InquiryForm 컴포넌트 구현
  - [x] 13.1 InquiryForm 컴포넌트 구조 생성
    - react-hook-form으로 폼 상태 설정
    - _요구사항: 8.1, 8.2_

  - [x] 13.2 검증이 포함된 제목 필드 구현
    - 제목 입력 필드 추가
    - 길이 검증 (최대 200자)
    - 문자 수 표시
    - _요구사항: 8.1_

  - [x] 13.3 검증이 포함된 메시지 textarea 구현
    - 메시지용 textarea 추가
    - 길이 검증 (최대 2000자)
    - 문자 수 표시
    - _요구사항: 8.1_

  - [x] 13.4 폼 제출 구현
    - POST /api/user/inquiry 엔드포인트 호출
    - 성공 처리 (inquiry ID와 함께 확인 표시, 폼 초기화)
    - 에러 처리 (에러 메시지 표시)
    - _요구사항: 8.3_

- [x] 14. API 클라이언트 서비스 구현
  - [x] 14.1 인증이 포함된 API 클라이언트 생성
    - axios 또는 fetch 래퍼 설정
    - 요청 헤더에 JWT 토큰 추가
    - 필요한 경우 토큰 갱신 처리
    - _요구사항: 10.9_

  - [x] 14.2 API 클라이언트 메서드 구현
    - getUserProfile()
    - updateUserProfile(updates)
    - initiatePasswordReset(email)
    - confirmPasswordReset(email, code, newPassword)
    - deleteAccount(password)
    - createReport(report)
    - createInquiry(inquiry)
    - getUserInquiries()
    - _요구사항: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 10.8_

  - [ ]* 14.3 API 클라이언트에 대한 단위 테스트 작성
    - 요청 헤더 주입 테스트 (JWT 토큰)
    - 에러 처리 테스트 (네트워크 에러, API 에러)
    - _요구사항: 10.9, 10.10_

- [x] 15. 통합 및 연결
  - [x] 15.1 MyPage 컴포넌트를 API 클라이언트와 연결
    - MyPage를 API 클라이언트 메서드에 연결
    - 로딩 및 에러 상태 처리
    - _요구사항: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [x] 15.2 ProfileEditForm을 API 클라이언트와 연결
    - 폼 제출을 updateUserProfile API에 연결
    - 성공 및 에러 응답 처리
    - _요구사항: 4.5, 4.6_

  - [x] 15.3 ReportUserDialog를 API 클라이언트와 연결
    - 폼 제출을 createReport API에 연결
    - 성공 및 에러 응답 처리
    - _요구사항: 7.5_

  - [x] 15.4 InquiryForm을 API 클라이언트와 연결
    - 폼 제출을 createInquiry API에 연결
    - 성공 및 에러 응답 처리
    - _요구사항: 8.3_

  - [x] 15.5 MyPage에 대한 라우팅 추가
    - React Router에 /mypage 라우트 추가
    - 인증 가드로 라우트 보호
    - _요구사항: 3.1_

  - [ ]* 15.6 엔드투엔드 테스트 작성
    - 전체 사용자 프로필 업데이트 플로우 테스트
    - 전체 비밀번호 재설정 플로우 테스트
    - 전체 계정 삭제 플로우 테스트
    - 전체 신고 제출 플로우 테스트
    - 전체 문의 제출 플로우 테스트
    - _요구사항: 전체_

- [x] 16. 최종 체크포인트 - 모든 테스트 통과 확인
  - 모든 테스트가 통과하는지 확인하고, 질문이 있으면 사용자에게 문의하세요.

## 참고사항

- `*`로 표시된 작업은 선택 사항이며 더 빠른 MVP를 위해 건너뛸 수 있습니다
- 각 작업은 추적 가능성을 위해 특정 요구사항을 참조합니다
- 체크포인트는 점진적인 검증을 보장합니다
- 속성 테스트는 보편적인 정확성 속성을 검증합니다
- 단위 테스트는 특정 예제 및 엣지 케이스를 검증합니다
- 통합 테스트는 엔드투엔드 플로우를 검증합니다
- 데이터베이스 연결 풀링은 성능에 중요합니다
- 모든 API 엔드포인트는 JWT 인증이 필요합니다
- 소프트 삭제는 30일 동안 사용자 데이터를 보존합니다
- Lambda 함수는 Cognito-PostgreSQL 동기화를 자동으로 처리합니다
