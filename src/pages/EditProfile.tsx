import { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User, Loader2 } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { useAuth } from "@/contexts/AuthContext";
// TODO: These services should not be imported in frontend - use API client instead
// import { getUserService } from "@/services/userService";
// import { getAuthService } from "@/services/authService";
import type { FullUserProfile, UpdateUserProfileData } from "@/types/database";

const EditProfile = () => {
  const navigate = useNavigate();
  const { state } = useAuth();
  const user = state.user;
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Profile state
  const [profile, setProfile] = useState<FullUserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [nickname, setNickname] = useState("");
  const [bio, setBio] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [profilePreview, setProfilePreview] = useState("");
  
  // Validation state
  const [nicknameError, setNicknameError] = useState<string | null>(null);
  const [bioError, setBioError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [isCheckingNickname, setIsCheckingNickname] = useState(false);
  
  // Modal state
  const [isCompleteOpen, setIsCompleteOpen] = useState(false);

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
        const fetchedProfile = data.data;
        
        setProfile(fetchedProfile);
        
        // Initialize form with current profile data
        setNickname(fetchedProfile.nickname);
        setBio(fetchedProfile.bio || "");
        setPhoneNumber(fetchedProfile.phoneNumber || "");
        setProfilePreview(fetchedProfile.profileImageUrl || "");
      } catch (err) {
        console.error("Failed to fetch profile:", err);
        setError(err instanceof Error ? err.message : "Failed to load profile");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [user, state.tokens]);

  // Validate nickname
  const validateNickname = (value: string): string | null => {
    if (value.length < 2 || value.length > 20) {
      return "닉네임은 2-20자 사이여야 합니다";
    }
    if (!/^[가-힣a-zA-Z0-9_]+$/.test(value)) {
      return "닉네임은 한글, 영문, 숫자, 언더스코어만 사용 가능합니다";
    }
    return null;
  };

  // Validate bio
  const validateBio = (value: string): string | null => {
    if (value.length > 500) {
      return "자기소개는 최대 500자까지 입력 가능합니다";
    }
    return null;
  };

  // Validate phone number
  const validatePhoneNumber = (value: string): string | null => {
    if (!value) return null; // Phone number is optional
    if (!/^[0-9-+() ]+$/.test(value)) {
      return "올바른 전화번호 형식이 아닙니다";
    }
    return null;
  };

  // Check nickname availability
  const checkNicknameAvailability = async (value: string) => {
    if (!user || !profile) return;
    
    // Skip if nickname hasn't changed
    if (value === profile.nickname) {
      setNicknameError(null);
      return;
    }

    const validationError = validateNickname(value);
    if (validationError) {
      setNicknameError(validationError);
      return;
    }

    // Nickname validation passed
    setNicknameError(null);
    
    // TODO: Add API endpoint for nickname availability check
    // For now, validation is done on submit
  };

  // Handle nickname change
  const handleNicknameChange = (value: string) => {
    setNickname(value);
    const error = validateNickname(value);
    setNicknameError(error);
  };

  // Handle bio change
  const handleBioChange = (value: string) => {
    setBio(value);
    const error = validateBio(value);
    setBioError(error);
  };

  // Handle phone number change
  const handlePhoneNumberChange = (value: string) => {
    setPhoneNumber(value);
    const error = validatePhoneNumber(value);
    setPhoneError(error);
  };

  const handleCancel = () => {
    navigate("/mypage");
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    if (!user || !profile) {
      setError("User not authenticated");
      return;
    }

    // Validate all fields
    const nicknameErr = validateNickname(nickname);
    const bioErr = validateBio(bio);
    const phoneErr = validatePhoneNumber(phoneNumber);

    if (nicknameErr || bioErr || phoneErr) {
      setNicknameError(nicknameErr);
      setBioError(bioErr);
      setPhoneError(phoneErr);
      return;
    }

    try {
      setIsSaving(true);
      setError(null);

      const token = state.tokens?.idToken;
      if (!token) {
        setError("인증 토큰을 찾을 수 없습니다. 다시 로그인해주세요.");
        setIsSaving(false);
        return;
      }

      // Prepare updates
      const updates: any = {};
      
      if (nickname !== profile.nickname) {
        updates.nickname = nickname;
      }
      if (bio !== (profile.bio || "")) {
        updates.bio = bio;
      }
      if (phoneNumber !== (profile.phoneNumber || "")) {
        // Send null if empty, otherwise send the phone number
        updates.phone_number = phoneNumber.trim() === "" ? null : phoneNumber;
      }
      if (profilePreview !== (profile.profileImageUrl || "")) {
        updates.profile_image_url = profilePreview || null;
      }

      // Update profile via API
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/user/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '프로필 업데이트에 실패했습니다.');
      }

      setIsCompleteOpen(true);
    } catch (err) {
      console.error("Failed to update profile:", err);
      setError(err instanceof Error ? err.message : "프로필 업데이트에 실패했습니다");
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirm = () => {
    setIsCompleteOpen(false);
    navigate("/mypage");
  };

  const handleProfileClick = () => {
    fileInputRef.current?.click();
  };

  const handleProfileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setProfilePreview(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleProfileClear = () => {
    setProfilePreview("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <MainLayout>
        <div className="min-h-screen py-12 px-4 bg-background">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  // Show error state
  if (error && !profile) {
    return (
      <MainLayout>
        <div className="min-h-screen py-12 px-4 bg-background">
          <div className="max-w-2xl mx-auto">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="min-h-screen py-12 px-4 bg-background">
        <div className="max-w-2xl mx-auto space-y-10">
          <section className="bg-card rounded-xl shadow-md border border-border p-6">
            <h2 className="text-2xl font-semibold text-foreground mb-6">
              정보 수정
            </h2>

            {error && (
              <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
              </div>
            )}

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  프로필 사진
                </label>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <button
                    type="button"
                    onClick={handleProfileClick}
                    className="flex flex-1 items-center justify-center gap-4 rounded-lg border border-border bg-secondary/30 px-4 py-3 text-center transition-colors hover:bg-secondary/40"
                  >
                    <span className="h-16 w-16 overflow-hidden rounded-full border border-border bg-background flex items-center justify-center">
                      {profilePreview ? (
                        <img
                          src={profilePreview}
                          alt="프로필 사진"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <User className="h-7 w-7 text-muted-foreground" />
                      )}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      사진을 눌러 변경하세요
                    </span>
                  </button>
                  <button
                    type="button"
                    className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-secondary/40"
                    onClick={handleProfileClear}
                  >
                    삭제
                  </button>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleProfileChange}
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="nickname"
                  className="text-sm font-medium text-foreground"
                >
                  닉네임 *
                </label>
                <div className="relative">
                  <input
                    id="nickname"
                    name="nickname"
                    type="text"
                    value={nickname}
                    onChange={(event) => handleNicknameChange(event.target.value)}
                    onBlur={() => checkNicknameAvailability(nickname)}
                    className={`w-full rounded-lg border px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                      nicknameError ? "border-red-500 bg-red-50/10" : "border-border bg-background"
                    }`}
                    placeholder="닉네임을 입력하세요 (2-20자)"
                    required
                  />
                  {isCheckingNickname && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                    </div>
                  )}
                </div>
                {nicknameError && (
                  <p className="text-xs text-red-500">{nicknameError}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  한글, 영문, 숫자, 언더스코어 사용 가능합니다
                </p>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="bio"
                  className="text-sm font-medium text-foreground"
                >
                  자기소개
                </label>
                <textarea
                  id="bio"
                  name="bio"
                  value={bio}
                  onChange={(event) => handleBioChange(event.target.value)}
                  rows={4}
                  className={`w-full rounded-lg border px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    bioError ? "border-red-500 bg-red-50/10" : "border-border bg-background"
                  }`}
                  placeholder="자기소개를 입력하세요 (최대 500자)"
                />
                <div className="flex justify-between items-center">
                  {bioError && (
                    <p className="text-xs text-red-500">{bioError}</p>
                  )}
                  <p className={`text-xs ml-auto ${bio.length > 500 ? "text-red-500" : "text-muted-foreground"}`}>
                    {bio.length} / 500
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="phoneNumber"
                  className="text-sm font-medium text-foreground"
                >
                  전화번호
                </label>
                <input
                  id="phoneNumber"
                  name="phoneNumber"
                  type="tel"
                  value={phoneNumber}
                  onChange={(event) => handlePhoneNumberChange(event.target.value)}
                  className={`w-full rounded-lg border px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    phoneError ? "border-red-500 bg-red-50/10" : "border-border bg-background"
                  }`}
                  placeholder="전화번호를 입력하세요 (선택사항)"
                />
                {phoneError && (
                  <p className="text-xs text-red-500">{phoneError}</p>
                )}
              </div>

              <div className="flex flex-col gap-3 sm:flex-row pt-2">
                <button
                  type="button"
                  className="flex-1 rounded-lg border border-border px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-secondary/40"
                  onClick={handleCancel}
                  disabled={isSaving}
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  disabled={isSaving || !!nicknameError || !!bioError || !!phoneError || isCheckingNickname}
                >
                  {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isSaving ? "저장 중..." : "수정"}
                </button>
              </div>
            </form>
          </section>
        </div>
      </div>

      {isCompleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/60"
            aria-label="닫기"
            onClick={handleConfirm}
          />
          <div className="relative w-full max-w-sm bg-card rounded-xl shadow-xl border border-border p-6 text-center">
            <p className="text-sm text-foreground">수정 되었습니다.</p>
            <button
              type="button"
              className="mt-5 w-full rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              onClick={handleConfirm}
            >
              확인
            </button>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default EditProfile;