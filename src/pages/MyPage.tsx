import type React from "react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { useAuth } from "@/contexts/AuthContext";
// TODO: These services should not be imported in frontend - use API client instead
// import { getUserService } from "@/services/userService";
// import { getAuthService } from "@/services/authService";
// import { getReportService } from "@/services/reportService";
// import { getInquiryService } from "@/services/inquiryService";
import type { FullUserProfile } from "@/types/database";
import {
  User,
  MessageCircle,
  AlertTriangle,
  Edit,
  LogOut,
  Lock,
  X,
  Loader2,
} from "lucide-react";

const cn = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(" ");

interface MenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  variant?: "default" | "danger";
}

const menuItems: MenuItem[] = [
  {
    id: "inquiry",
    label: "문의",
    icon: MessageCircle,
    description: "궁금한 점을 물어보세요",
  },
  {
    id: "report",
    label: "회원 신고",
    icon: AlertTriangle,
    description: "부적절한 활동을 신고하세요",
  },
  {
    id: "edit",
    label: "정보 수정",
    icon: Edit,
    description: "프로필 정보를 변경하세요",
  },
  {
    id: "changePassword",
    label: "비밀번호 변경",
    icon: Lock,
    description: "계정 비밀번호를 변경하세요",
  },
  {
    id: "logout",
    label: "로그아웃",
    icon: LogOut,
    description: "계정에서 로그아웃합니다",
  },
  {
    id: "withdraw",
    label: "회원 탈퇴",
    icon: LogOut,
    description: "계정을 삭제합니다",
    variant: "danger",
  },
];
;

const MyPage = () => {
  const navigate = useNavigate();
  const { signOut, state } = useAuth();
  const user = state.user;
  
  // Profile state
  const [profile, setProfile] = useState<FullUserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal states
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [isWithdrawAgreed, setIsWithdrawAgreed] = useState(false);
  const [isWithdrawCompleteOpen, setIsWithdrawCompleteOpen] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const [isLogoutCompleteOpen, setIsLogoutCompleteOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isReportCompleteOpen, setIsReportCompleteOpen] = useState(false);
  const [isInquiryOpen, setIsInquiryOpen] = useState(false);
  const [isInquiryCompleteOpen, setIsInquiryCompleteOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isChangePasswordCompleteOpen, setIsChangePasswordCompleteOpen] = useState(false);
  const [isVerifyCodeOpen, setIsVerifyCodeOpen] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // Report form state
  const [reportedUserId, setReportedUserId] = useState("");
  const [reportReason, setReportReason] = useState<'spam' | 'harassment' | 'inappropriate_content' | 'other'>('spam');
  const [reportDescription, setReportDescription] = useState("");
  
  // Inquiry form state
  const [inquirySubject, setInquirySubject] = useState("");
  const [inquiryMessage, setInquiryMessage] = useState("");

  // Fetch profile data on mount
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) {
        setError("User not authenticated");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        
        const token = state.tokens?.idToken;
        if (!token) {
          setError("인증 토큰을 찾을 수 없습니다.");
          setIsLoading(false);
          return;
        }

        // Fetch profile from API
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/user/profile`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('프로필을 불러오는데 실패했습니다.');
        }

        const data = await response.json();
        setProfile(data.data);
      } catch (err) {
        console.error("Failed to fetch profile:", err);
        setError(err instanceof Error ? err.message : "Failed to load profile");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [user, state.tokens]);

  const closeWithdrawModal = () => {
    setIsWithdrawOpen(false);
    setIsWithdrawAgreed(false);
  };

  const handleWithdrawConfirm = async () => {
    if (!user) {
      alert("사용자 인증 정보가 없습니다.");
      return;
    }

    try {
      // Get token from auth state
      const token = state.tokens?.idToken;

      if (!token) {
        alert("인증 토큰을 찾을 수 없습니다. 다시 로그인해주세요.");
        return;
      }

      // Call backend API to delete account
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/user/account`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '회원 탈퇴에 실패했습니다.');
      }

      // Close modal and show completion message
      setIsWithdrawOpen(false);
      setIsWithdrawAgreed(false);
      setIsWithdrawCompleteOpen(true);

      // Sign out and redirect after 2 seconds
      const handleSignOutAndRedirect = async () => {
        try {
          await signOut();
        } catch (err) {
          console.error('로그아웃 실패:', err);
        } finally {
          navigate('/');
        }
      };

      setTimeout(() => {
        handleSignOutAndRedirect();
      }, 2000);

    } catch (error) {
      console.error("회원 탈퇴 실패:", error);
      alert(error instanceof Error ? error.message : "회원 탈퇴에 실패했습니다. 다시 시도해주세요.");
      setIsWithdrawOpen(false);
      setIsWithdrawAgreed(false);
    }
  };

  const closeWithdrawCompleteModal = () => {
    setIsWithdrawCompleteOpen(false);
  };

  const openLogoutConfirm = () => {
    setIsLogoutConfirmOpen(true);
  };

  const closeLogoutConfirm = () => {
    setIsLogoutConfirmOpen(false);
  };

  const handleLogoutConfirm = async () => {
    console.log('로그아웃 시작');
    try {
      console.log('signOut 호출 전');
      await signOut();
      console.log('signOut 호출 후');
      setIsLogoutConfirmOpen(false);
      setIsLogoutCompleteOpen(true);
      
      // 로그아웃 완료 메시지를 잠깐 보여준 후 로그인 페이지로 이동
      setTimeout(() => {
        console.log('로그인 페이지로 이동');
        setIsLogoutCompleteOpen(false);
        navigate('/auth');
      }, 1000);
    } catch (error) {
      console.error('로그아웃 실패:', error);
      setIsLogoutConfirmOpen(false);
      // 에러가 발생해도 로그인 페이지로 이동
      navigate('/auth');
    }
  };

  const closeLogoutComplete = () => {
    setIsLogoutCompleteOpen(false);
  };

  const closeReportModal = () => {
    setIsReportOpen(false);
    setReportedUserId("");
    setReportReason('spam');
    setReportDescription("");
  };

  const handleReportSubmit = async () => {
    if (!user) {
      alert("사용자 인증 정보가 없습니다.");
      return;
    }

    if (!reportedUserId.trim()) {
      alert("신고할 회원의 닉네임 또는 이메일을 입력해주세요.");
      return;
    }

    try {
      const token = state.tokens?.idToken;
      if (!token) {
        alert("인증 토큰을 찾을 수 없습니다. 다시 로그인해주세요.");
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/user/report`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reported_user_identifier: reportedUserId,
          reason: reportReason,
          description: reportDescription || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '신고 접수에 실패했습니다.');
      }

      setIsReportOpen(false);
      setReportedUserId("");
      setReportReason('spam');
      setReportDescription("");
      setIsReportCompleteOpen(true);
    } catch (error) {
      console.error("신고 접수 실패:", error);
      alert(error instanceof Error ? error.message : "신고 접수에 실패했습니다. 다시 시도해주세요.");
    }
  };

  const closeReportComplete = () => {
    setIsReportCompleteOpen(false);
  };

  const closeInquiryModal = () => {
    setIsInquiryOpen(false);
    setInquirySubject("");
    setInquiryMessage("");
  };

  const handleInquirySubmit = async () => {
    if (!user) {
      alert("사용자 인증 정보가 없습니다.");
      return;
    }

    if (!inquirySubject.trim() || !inquiryMessage.trim()) {
      alert("제목과 문의 내용을 모두 입력해주세요.");
      return;
    }

    try {
      const token = state.tokens?.idToken;
      if (!token) {
        alert("인증 토큰을 찾을 수 없습니다. 다시 로그인해주세요.");
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/user/inquiry`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subject: inquirySubject,
          message: inquiryMessage,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '문의 접수에 실패했습니다.');
      }

      setIsInquiryOpen(false);
      setInquirySubject("");
      setInquiryMessage("");
      setIsInquiryCompleteOpen(true);
    } catch (error) {
      console.error("문의 접수 실패:", error);
      alert(error instanceof Error ? error.message : "문의 접수에 실패했습니다. 다시 시도해주세요.");
    }
  };

  const closeInquiryComplete = () => {
    setIsInquiryCompleteOpen(false);
  };

  const closeChangePasswordModal = () => {
    setIsChangePasswordOpen(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setVerificationCode("");
  };

  const closeVerifyCodeModal = () => {
    setIsVerifyCodeOpen(false);
    setVerificationCode("");
  };

  const handleChangePasswordSubmit = async () => {
    // 비밀번호 확인 검증
    if (newPassword !== confirmPassword) {
      alert("새 비밀번호와 비밀번호 확인이 일치하지 않습니다.");
      return;
    }
    
    if (!user) {
      alert("사용자 인증 정보가 없습니다.");
      return;
    }

    try {
      const token = state.tokens?.idToken;
      if (!token) {
        alert("인증 토큰을 찾을 수 없습니다. 다시 로그인해주세요.");
        return;
      }

      // 비밀번호 재설정 코드를 이메일로 전송
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/user/password-reset`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: user.email,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '비밀번호 변경 요청에 실패했습니다.');
      }

      // 첫 번째 모달 닫고 인증 코드 입력 모달 열기
      setIsChangePasswordOpen(false);
      setIsVerifyCodeOpen(true);
    } catch (error) {
      console.error("비밀번호 변경 실패:", error);
      alert(error instanceof Error ? error.message : "비밀번호 변경에 실패했습니다. 다시 시도해주세요.");
    }
  };

  const handleVerifyCodeSubmit = async () => {
    if (!verificationCode.trim()) {
      alert("인증 코드를 입력해주세요.");
      return;
    }

    if (!user) {
      alert("사용자 인증 정보가 없습니다.");
      return;
    }

    try {
      const token = state.tokens?.idToken;
      if (!token) {
        alert("인증 토큰을 찾을 수 없습니다. 다시 로그인해주세요.");
        return;
      }

      // 인증 코드로 비밀번호 변경 확인
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/user/password-reset/confirm`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: user.email,
          code: verificationCode,
          newPassword: newPassword,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '비밀번호 변경에 실패했습니다.');
      }

      // 성공 시 모든 모달 닫고 완료 모달 열기
      setIsVerifyCodeOpen(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setVerificationCode("");
      setIsChangePasswordCompleteOpen(true);
    } catch (error) {
      console.error("비밀번호 변경 실패:", error);
      alert(error instanceof Error ? error.message : "비밀번호 변경에 실패했습니다. 인증 코드를 확인해주세요.");
    }
  };

  const closeChangePasswordComplete = () => {
    setIsChangePasswordCompleteOpen(false);
  };

  return (
    <MainLayout>
      <div className="min-h-screen py-12 px-4 bg-background">
        <div className="max-w-2xl mx-auto space-y-10">
          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
            </div>
          )}

          {/* Profile Section */}
          {profile && !isLoading && (
            <>
              <section className="bg-card rounded-xl shadow-md border border-border p-6">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full bg-secondary p-1">
                      <div className="w-full h-full rounded-full bg-background overflow-hidden flex items-center justify-center">
                        {profile.profileImageUrl ? (
                          <img
                            src={profile.profileImageUrl}
                            alt="프로필 사진"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <User className="w-8 h-8 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                    <div className="absolute inset-0 rounded-full border-2 border-yellow-600/30" />
                  </div>

                  <div className="flex-1">
                    <h2 className="font-serif text-2xl text-primary gold-accent">
                      {profile.nickname}님
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      {profile.email}
                    </p>
                  </div>
                </div>

                {/* Additional Profile Info */}
                {(profile.bio || profile.phoneNumber) && (
                  <div className="mt-4 pt-4 border-t border-border space-y-2">
                    {profile.bio && (
                      <p className="text-sm text-foreground">{profile.bio}</p>
                    )}
                    {profile.phoneNumber && (
                      <p className="text-sm text-muted-foreground">
                        전화번호: {profile.phoneNumber}
                      </p>
                    )}
                  </div>
                )}

                {/* Account Dates */}
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-xs text-muted-foreground">
                    가입일: {new Date(profile.createdAt).toLocaleDateString('ko-KR')}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    최근 업데이트: {new Date(profile.updatedAt).toLocaleDateString('ko-KR')}
                  </p>
                </div>
                  </section>

              {/* Menu */}
              <div className="space-y-6">
            <div className="bg-card rounded-lg shadow-md overflow-hidden border border-border">
              {menuItems
                .filter((item) => item.variant !== "danger")
                .map((item, index, arr) => {
                  const Icon = item.icon;
                  const isLast = index === arr.length - 1;

                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        if (item.id === "logout") {
                          openLogoutConfirm();
                        }
                        if (item.id === "edit") {
                          navigate("/edit-profile");
                        }
                        if (item.id === "changePassword") {
                          setIsChangePasswordOpen(true);
                        }
                        if (item.id === "report") {
                          setIsReportOpen(true);
                        }
                        if (item.id === "inquiry") {
                          setIsInquiryOpen(true);
                        }
                      }}
                      className={cn(
                        "w-full p-5 text-left transition-all duration-200 group relative hover:bg-secondary/30",
                        !isLast && "border-b border-border"
                      )}
                    >
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-yellow-700 group-hover:bg-yellow-600 transition-colors" />

                      <div className="flex items-center gap-4 pl-2">
                        <div className="w-10 h-10 flex items-center justify-center">
                          <Icon className="w-6 h-6 text-foreground/60 group-hover:text-yellow-600 transition-colors" />
                        </div>

                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-foreground group-hover:text-yellow-600 transition-colors">
                            {item.label}
                          </h3>
                          <p className="handwriting text-lg text-muted-foreground leading-snug">
                            {item.description}
                          </p>
                        </div>

                        <div className="text-muted-foreground group-hover:text-foreground transition-colors">
                          →
                        </div>
                      </div>
                    </button>
                  );
                })}
            </div>

            <div className="bg-card rounded-lg shadow-md overflow-hidden border border-border">
              {menuItems
                .filter((item) => item.variant === "danger")
                .map((item) => {
                  const Icon = item.icon;

                  return (
                    <button
                      key={item.id}
                      onClick={() => setIsWithdrawOpen(true)}
                      className="w-full p-5 text-left transition-all duration-200 group relative hover:bg-red-50/10"
                    >
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500/50 group-hover:bg-red-500 transition-colors" />

                      <div className="flex items-center gap-4 pl-2">
                        <div className="w-10 h-10 flex items-center justify-center">
                          <Icon className="w-6 h-6 text-red-500" />
                        </div>

                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-red-500">
                            {item.label}
                          </h3>
                          <p className="handwriting text-lg text-muted-foreground leading-snug">
                            {item.description}
                          </p>
                        </div>

                        <div className="text-muted-foreground group-hover:text-red-500/70 transition-colors">
                          →
                        </div>
                      </div>
                    </button>
                  );
                })}
            </div>
          </div>
            </>
          )}
        </div>
      </div>

      {isWithdrawOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/60"
            aria-label="닫기"
            onClick={closeWithdrawModal}
          />
          <div className="relative w-full max-w-lg bg-card rounded-xl shadow-xl border border-border p-6">
            <button
              type="button"
              className="absolute right-4 top-4 text-muted-foreground hover:text-foreground transition-colors"
              onClick={closeWithdrawModal}
              aria-label="닫기"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <h3 className="font-semibold text-foreground">회원 탈퇴</h3>
            </div>
            <p className="text-sm text-muted-foreground whitespace-pre-line mb-6">
              회원정보 및 기록, 사진 등 서비스 이용기록은 모두 삭제되며, 삭제된 데이터는 복구되지 않습니다.
              {"\n"}삭제되는 내용을 확인하시고 필요한 데이터는 미리 백업을 해주세요.
            </p>

            <label className="flex items-start gap-3 rounded-lg border border-border bg-secondary/30 p-4">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 accent-red-500"
                checked={isWithdrawAgreed}
                onChange={(event) => setIsWithdrawAgreed(event.target.checked)}
              />
              <span className="text-sm text-foreground">
                안내 사항을 확인하였으며, 이에 동의합니다.
              </span>
            </label>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                className="flex-1 rounded-lg border border-border px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-secondary/40"
                onClick={closeWithdrawModal}
              >
                취소
              </button>
              <button
                type="button"
                className={cn(
                  "flex-1 rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-600",
                  !isWithdrawAgreed && "pointer-events-none opacity-60"
                )}
                disabled={!isWithdrawAgreed}
                onClick={handleWithdrawConfirm}
              >
                회원 탈퇴
              </button>
            </div>
          </div>
        </div>
      )}

      {isWithdrawCompleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/60"
            aria-label="닫기"
            onClick={closeWithdrawCompleteModal}
          />
          <div className="relative w-full max-w-sm bg-card rounded-xl shadow-xl border border-border p-6 text-center">
            <p className="text-sm text-foreground">회원 탈퇴 되었습니다.</p>
            <button
              type="button"
              className="mt-5 w-full rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              onClick={closeWithdrawCompleteModal}
            >
              확인
            </button>
          </div>
        </div>
      )}

      {isLogoutConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/60"
            aria-label="닫기"
            onClick={closeLogoutConfirm}
          />
          <div className="relative w-full max-w-sm bg-card rounded-xl shadow-xl border border-border p-6 text-center">
            <p className="text-sm text-foreground">로그아웃하시겠습니까?</p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                className="flex-1 rounded-lg border border-border px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-secondary/40"
                onClick={closeLogoutConfirm}
              >
                취소
              </button>
              <button
                type="button"
                className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                onClick={handleLogoutConfirm}
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}

      {isLogoutCompleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/60"
            aria-label="닫기"
            onClick={closeLogoutComplete}
          />
          <div className="relative w-full max-w-sm bg-card rounded-xl shadow-xl border border-border p-6 text-center">
            <p className="text-sm text-foreground">로그아웃 되었습니다.</p>
            <button
              type="button"
              className="mt-5 w-full rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              onClick={closeLogoutComplete}
            >
              확인
            </button>
          </div>
        </div>
      )}

      {isReportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/60"
            aria-label="닫기"
            onClick={closeReportModal}
          />
          <div className="relative w-full max-w-lg bg-card rounded-xl shadow-xl border border-border p-6">
            <button
              type="button"
              className="absolute right-4 top-4 text-muted-foreground hover:text-foreground transition-colors"
              onClick={closeReportModal}
              aria-label="닫기"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <h3 className="font-semibold text-foreground">회원 신고</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              신고 대상과 사유를 입력해 주세요.
            </p>

            <div className="space-y-4">
              <div className="space-y-2">
                <label
                  htmlFor="report-userid"
                  className="text-sm font-medium text-foreground"
                >
                  닉네임, 회원 이메일 신고 *
                </label>
                <input
                  id="report-userid"
                  name="report-userid"
                  type="text"
                  value={reportedUserId}
                  onChange={(e) => setReportedUserId(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="닉네임 또는 이메일을 입력하세요"
                  required
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="report-reason-select"
                  className="text-sm font-medium text-foreground"
                >
                  신고 사유 *
                </label>
                <select
                  id="report-reason-select"
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value as any)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  required
                >
                  <option value="spam">스팸</option>
                  <option value="harassment">괴롭힘</option>
                  <option value="inappropriate_content">부적절한 콘텐츠</option>
                  <option value="other">기타</option>
                </select>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="report-description"
                  className="text-sm font-medium text-foreground"
                >
                  상세 설명 (선택사항)
                </label>
                <textarea
                  id="report-description"
                  name="report-description"
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  rows={4}
                  maxLength={1000}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="신고 사유를 상세히 입력하세요 (최대 1000자)"
                />
                <p className="text-xs text-muted-foreground text-right">
                  {reportDescription.length} / 1000
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                className="flex-1 rounded-lg border border-border px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-secondary/40"
                onClick={closeReportModal}
              >
                취소
              </button>
              <button
                type="button"
                className="flex-1 rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-600"
                onClick={handleReportSubmit}
              >
                신고
              </button>
            </div>
          </div>
        </div>
      )}

      {isReportCompleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/60"
            aria-label="닫기"
            onClick={closeReportComplete}
          />
          <div className="relative w-full max-w-sm bg-card rounded-xl shadow-xl border border-border p-6 text-center">
            <p className="text-sm text-foreground">
              신고가 성공적으로 접수되었습니다.
            </p>
            <button
              type="button"
              className="mt-5 w-full rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              onClick={closeReportComplete}
            >
              확인
            </button>
          </div>
        </div>
      )}

      {isInquiryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/60"
            aria-label="닫기"
            onClick={closeInquiryModal}
          />
          <div className="relative w-full max-w-lg bg-card rounded-xl shadow-xl border border-border p-6">
            <button
              type="button"
              className="absolute right-4 top-4 text-muted-foreground hover:text-foreground transition-colors"
              onClick={closeInquiryModal}
              aria-label="닫기"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-2">
              <MessageCircle className="w-5 h-5 text-yellow-600" />
              <h3 className="font-semibold text-foreground">문의</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              문의할 내용을 자유롭게 작성해주세요.
            </p>

            <div className="space-y-4">
              <div className="space-y-2">
                <label
                  htmlFor="inquiry-subject"
                  className="text-sm font-medium text-foreground"
                >
                  제목 *
                </label>
                <input
                  id="inquiry-subject"
                  name="inquiry-subject"
                  type="text"
                  value={inquirySubject}
                  onChange={(e) => setInquirySubject(e.target.value)}
                  maxLength={200}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="문의 제목을 입력하세요 (최대 200자)"
                  required
                />
                <p className="text-xs text-muted-foreground text-right">
                  {inquirySubject.length} / 200
                </p>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="inquiry-message"
                  className="text-sm font-medium text-foreground"
                >
                  문의 내용 *
                </label>
                <textarea
                  id="inquiry-message"
                  name="inquiry-message"
                  value={inquiryMessage}
                  onChange={(e) => setInquiryMessage(e.target.value)}
                  rows={5}
                  maxLength={2000}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="문의 내용을 입력하세요 (최대 2000자)"
                  required
                />
                <p className="text-xs text-muted-foreground text-right">
                  {inquiryMessage.length} / 2000
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                className="flex-1 rounded-lg border border-border px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-secondary/40"
                onClick={closeInquiryModal}
              >
                취소
              </button>
              <button
                type="button"
                className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                onClick={handleInquirySubmit}
              >
                문의
              </button>
            </div>
          </div>
        </div>
      )}

      {isInquiryCompleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/60"
            aria-label="닫기"
            onClick={closeInquiryComplete}
          />
          <div className="relative w-full max-w-sm bg-card rounded-xl shadow-xl border border-border p-6 text-center">
            <p className="text-sm text-foreground">
              문의가 성공적으로 접수되었습니다.
            </p>
            <button
              type="button"
              className="mt-5 w-full rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              onClick={closeInquiryComplete}
            >
              확인
            </button>
          </div>
        </div>
      )}

      {isChangePasswordOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/60"
            aria-label="닫기"
            onClick={closeChangePasswordModal}
          />
          <div className="relative w-full max-w-lg bg-card rounded-xl shadow-xl border border-border p-6">
            <button
              type="button"
              className="absolute right-4 top-4 text-muted-foreground hover:text-foreground transition-colors"
              onClick={closeChangePasswordModal}
              aria-label="닫기"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-2">
              <Lock className="w-5 h-5 text-yellow-600" />
              <h3 className="font-semibold text-foreground">비밀번호 변경</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              현재 비밀번호와 새로운 비밀번호를 입력해주세요.
            </p>

            <div className="space-y-4">
              <div className="space-y-2">
                <label
                  htmlFor="current-password"
                  className="text-sm font-medium text-foreground"
                >
                  현재 비밀번호
                </label>
                <input
                  id="current-password"
                  name="current-password"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="현재 비밀번호를 입력하세요"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="new-password"
                  className="text-sm font-medium text-foreground"
                >
                  새 비밀번호
                </label>
                <input
                  id="new-password"
                  name="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="새 비밀번호를 입력하세요"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="confirm-password"
                  className="text-sm font-medium text-foreground"
                >
                  새 비밀번호 확인
                </label>
                <input
                  id="confirm-password"
                  name="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`w-full rounded-lg border px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    confirmPassword && newPassword !== confirmPassword
                      ? "border-red-500 bg-red-50/10"
                      : "border-border bg-background"
                  }`}
                  placeholder="새 비밀번호를 다시 입력하세요"
                />
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-xs text-red-500">
                    비밀번호가 일치하지 않습니다.
                  </p>
                )}
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                className="flex-1 rounded-lg border border-border px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-secondary/40"
                onClick={closeChangePasswordModal}
              >
                취소
              </button>
              <button
                type="button"
                className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleChangePasswordSubmit}
                disabled={!currentPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword}
              >
                변경
              </button>
            </div>
          </div>
        </div>
      )}

      {isVerifyCodeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/60"
            aria-label="닫기"
            onClick={closeVerifyCodeModal}
          />
          <div className="relative w-full max-w-lg bg-card rounded-xl shadow-xl border border-border p-6">
            <button
              type="button"
              className="absolute right-4 top-4 text-muted-foreground hover:text-foreground transition-colors"
              onClick={closeVerifyCodeModal}
              aria-label="닫기"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="font-semibold text-foreground mb-2">인증 코드 입력</h3>
            <p className="text-sm text-muted-foreground mb-6">
              이메일로 전송된 6자리 인증 코드를 입력해주세요.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  인증 코드
                </label>
                <input
                  type="text"
                  className="w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="6자리 코드 입력"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  maxLength={6}
                />
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                className="flex-1 rounded-lg border border-border px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-secondary/40"
                onClick={closeVerifyCodeModal}
              >
                취소
              </button>
              <button
                type="button"
                className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleVerifyCodeSubmit}
                disabled={!verificationCode.trim()}
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}

      {isChangePasswordCompleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/60"
            aria-label="닫기"
            onClick={closeChangePasswordComplete}
          />
          <div className="relative w-full max-w-sm bg-card rounded-xl shadow-xl border border-border p-6 text-center">
            <p className="text-sm text-foreground">
              비밀번호 변경이 완료되었습니다.
            </p>
            <button
              type="button"
              className="mt-5 w-full rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              onClick={closeChangePasswordComplete}
            >
              확인
            </button>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default MyPage;