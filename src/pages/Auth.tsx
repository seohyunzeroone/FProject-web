import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { BookOpen, Feather, Mail, Lock, User, ArrowRight, KeyRound, Loader2, HelpCircle, RefreshCcw, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

type AuthMode = "login" | "signup" | "verify" | "forgot" | "reset";

// Google 아이콘 SVG 컴포넌트
const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const Auth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { state: authState, signUp, confirmSignUp, signIn, signInWithGoogle, signOut, forgotPassword, confirmPassword, resendCode } = useAuth();
  
  const [mode, setMode] = useState<AuthMode>("login");
  const [isBookOpen, setIsBookOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    nickname: "",
    code: "",
    newPassword: "",
  });

  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [pendingEmail, setPendingEmail] = useState<string>(""); // 인증 대기 중인 이메일

  useEffect(() => {
    const timer = setTimeout(() => setIsBookOpen(true), 300);
    return () => clearTimeout(timer);
  }, []);

  // 이미 로그인된 경우 메인 페이지로 리다이렉트
  useEffect(() => {
    if (authState.isAuthenticated && !authState.isLoading) {
      const from = (location.state as any)?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  }, [authState.isAuthenticated, authState.isLoading, navigate, location]);

  // 에러 메시지 표시 (location state에서)
  useEffect(() => {
    const error = (location.state as any)?.error;
    if (error) {
      toast({
        title: "오류",
        description: error,
        variant: "destructive",
      });
      // state 초기화
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (mode === "signup" && !formData.name.trim()) {
      newErrors.name = "이름을 입력해주세요.";
    }

    if (mode === "signup" && !formData.nickname.trim()) {
      newErrors.nickname = "닉네임을 입력해주세요.";
    }

    if (mode === "signup" && formData.nickname.length < 2) {
      newErrors.nickname = "닉네임은 2자 이상이어야 합니다.";
    }

    if (mode === "signup" && formData.nickname.length > 20) {
      newErrors.nickname = "닉네임은 20자 이하여야 합니다.";
    }

    if (mode === "signup" && formData.nickname && !/^[가-힣a-zA-Z0-9_]+$/.test(formData.nickname)) {
      newErrors.nickname = "닉네임은 한글, 영문, 숫자, 언더스코어만 사용 가능합니다.";
    }

    if (mode !== "verify" && mode !== "reset" && !formData.email.trim()) {
      newErrors.email = "이메일 주소를 입력해주세요.";
    }

    if (mode === "signup" && formData.password.length < 8) {
      newErrors.password = "비밀번호는 8자 이상이어야 합니다.";
    }

    if (mode === "signup" && !/[!@#$%^&*(),.?":{}|<>]/.test(formData.password)) {
      newErrors.password = "비밀번호에 특수문자가 포함되어야 합니다.";
    }

    if ((mode === "login" || mode === "signup") && !formData.password) {
      newErrors.password = "비밀번호를 입력해주세요.";
    }

    if ((mode === "verify" || mode === "reset") && !formData.code.trim()) {
      newErrors.code = "6자리 코드를 입력해주세요.";
    }

    if (mode === "reset" && !formData.newPassword) {
      newErrors.newPassword = "새 비밀번호를 입력해주세요.";
    }

    if (mode === "reset" && formData.newPassword.length < 8) {
      newErrors.newPassword = "비밀번호는 8자 이상이어야 합니다.";
    }

    if (mode === "reset" && !/[!@#$%^&*(),.?":{}|<>]/.test(formData.newPassword)) {
      newErrors.newPassword = "비밀번호에 특수문자가 포함되어야 합니다.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return; 
    }

    setIsLoading(true);

    try {
      switch (mode) {
        case "login":
          await signIn(formData.email, formData.password);
          toast({ title: "로그인 성공", description: "기록실로 이동합니다." });
          // useEffect에서 자동으로 리다이렉트됨
          break;
          
        case "signup":
          await signUp({ 
            email: formData.email, 
            password: formData.password, 
            name: formData.name, 
            nickname: formData.nickname 
          });
          setPendingEmail(formData.email);
          toast({ title: "인증 메일 발송", description: "이메일로 전송된 코드를 입력해주세요." });
          setMode("verify");
          break;
          
        case "verify":
          const emailToVerify = pendingEmail || formData.email;
          await confirmSignUp(emailToVerify, formData.code);
          toast({ title: "인증 완료", description: "환영합니다! 이제 로그인해주세요." });
          setMode("login");
          setFormData({ ...formData, code: "" });
          setPendingEmail("");
          break;
          
        case "forgot":
          await forgotPassword(formData.email);
          setPendingEmail(formData.email);
          toast({ title: "코드 발송", description: "비밀번호 재설정 코드를 보냈습니다." });
          setMode("reset");
          break;
          
        case "reset":
          const emailToReset = pendingEmail || formData.email;
          await confirmPassword(emailToReset, formData.code, formData.newPassword);
          toast({ title: "비밀번호 변경 완료", description: "새 비밀번호로 로그인해주세요." });
          setMode("login");
          setFormData({ ...formData, code: "", newPassword: "" });
          setPendingEmail("");
          break;
      }
    } catch (error: any) {
      console.error("인증 오류:", error);
      
      // Cognito 에러 메시지 변환
      let errorMessage = error.message || "오류가 발생했습니다.";
      
      // 일반적인 Cognito 에러 코드 처리
      if (error.code === "UserNotFoundException") {
        errorMessage = "사용자를 찾을 수 없습니다.";
      } else if (error.code === "NotAuthorizedException") {
        errorMessage = "이메일 또는 비밀번호가 올바르지 않습니다.";
      } else if (error.code === "UserNotConfirmedException") {
        errorMessage = "이메일 인증이 필요합니다.";
        setPendingEmail(formData.email);
        setMode("verify");
      } else if (error.code === "CodeMismatchException") {
        errorMessage = "인증 코드가 올바르지 않습니다.";
      } else if (error.code === "ExpiredCodeException") {
        errorMessage = "인증 코드가 만료되었습니다. 새 코드를 요청해주세요.";
      } else if (error.code === "InvalidPasswordException") {
        errorMessage = "비밀번호는 8자 이상이며 특수문자를 포함해야 합니다.";
      } else if (error.code === "UsernameExistsException") {
        errorMessage = "이미 사용 중인 이메일입니다.";
      } else if (error.code === "LimitExceededException") {
        errorMessage = "시도 횟수를 초과했습니다. 잠시 후 다시 시도해주세요.";
      } else if (error.code === "TooManyRequestsException") {
        errorMessage = "너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요.";
      }
      
      toast({
        title: "오류",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderInput = (
    icon: React.ElementType,
    name: string,
    type: string,
    placeholder: string,
    label: string
  ) => {
    const hasError = !!errors[name];

    return (
      <div className="space-y-1.5">
        
        <label className={cn(
          "font-serif text-sm block ml-1 transition-colors",
          hasError ? "text-red-800/80" : "text-ink/80"
        )}>
          {label}
        </label>
        
        <div className="relative group">
          <div className={cn(
            "absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-300",
            hasError ? "text-red-800/60" : "text-ink/40 group-focus-within:text-gold"
          )}>
            {icon === User && <User className="w-5 h-5" />}
            {icon === Mail && <Mail className="w-5 h-5" />}
            {icon === Lock && <Lock className="w-5 h-5" />}
            {icon === KeyRound && <KeyRound className="w-5 h-5" />}
          </div>
          
          <input
            type={type}
            name={name}
            value={formData[name as keyof typeof formData]}
            onChange={handleInputChange}
            placeholder={placeholder}
            className={cn(
              "w-full pl-11 pr-4 py-3.5 rounded-md border transition-all duration-300",
              "font-handwriting text-lg text-ink placeholder:text-ink/30",
              "focus:outline-none focus:bg-aged-paper",
              hasError 
                ? "bg-red-50/50 border-red-800/30 focus:border-red-800/50 focus:ring-1 focus:ring-red-800/20" 
                : "bg-aged-paper/60 border-ink/10 group-hover:border-ink/30 focus:border-gold/60 focus:ring-1 focus:ring-gold/30"
            )}
          />
        </div>
        
        {hasError && (
          <div className="flex items-center gap-1.5 mt-1 ml-1 animate-in slide-in-from-left-1 duration-300">
            <AlertCircle className="w-3 h-3 text-red-800/70" />
            <p className="font-handwriting text-sm text-red-800/80">
              {errors[name]}
            </p>
          </div>
        )}
      </div>
    );
  };

  return (
    <MainLayout showSidebar={false}>
      <div className="min-h-screen flex items-center justify-center py-12 px-4">
        <div className="relative w-full max-w-md perspective-1000">
          
          {/* 1. 닫힌 책 커버 */}
          <div
            className={cn(
              "absolute inset-0 book-cover rounded-lg transition-all duration-1000 origin-left ease-in-out",
              isBookOpen ? "rotate-y-180 opacity-0 pointer-events-none" : "rotate-y-0 opacity-100"
            )}
            style={{ transformStyle: "preserve-3d", backfaceVisibility: "hidden" }}
          >
            <div className="h-[600px] flex flex-col items-center justify-center p-8 border-r-4 border-r-black/20 rounded-r-sm">
              <BookOpen className="w-20 h-20 text-gold mb-6 drop-shadow-md" />
              <h2 className="font-serif text-3xl text-sepia mb-2 font-bold tracking-wide">기억의 서</h2>
              <p className="font-handwriting text-muted-foreground text-lg">당신의 모든 순간을 기록합니다</p>
            </div>
          </div>

          {/* 2. 펼쳐진 책 */}
          <div
            className={cn(
              "relative transition-all duration-1000 ease-in-out",
              isBookOpen ? "opacity-100 scale-100 translate-x-0" : "opacity-0 scale-95 translate-x-4"
            )}
          >
            <div className="paper-texture rounded-lg shadow-2xl overflow-hidden min-h-[600px] flex flex-col">
              <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-black/10 via-transparent to-transparent z-10 pointer-events-none" />
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-leather/80 z-20" />

              <div className="flex-1 p-8 pl-12 flex flex-col">
                
                {/* 헤더 */}
                <div className="text-center mb-8 relative">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-leather/10 mb-4 ring-4 ring-leather/5">
                    {mode === "verify" ? <KeyRound className="w-6 h-6 text-gold" /> :
                     mode === "forgot" ? <HelpCircle className="w-6 h-6 text-gold" /> :
                     mode === "reset" ? <KeyRound className="w-6 h-6 text-gold" /> :
                     mode === "signup" ? <Feather className="w-6 h-6 text-gold" /> :
                     <User className="w-6 h-6 text-gold" />}
                  </div>

                  <div key={mode} className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <h1 className="font-serif text-2xl text-ink font-bold mb-1">
                      {mode === "login" && "로그인"}
                      {mode === "signup" && "도서관 회원 등록"}
                      {mode === "verify" && "본인 확인"}
                      {mode === "forgot" && "비밀번호 찾기"}
                      {mode === "reset" && "비밀번호 재설정"}
                    </h1>
                    <p className="font-handwriting text-ink/60 text-sm">
                      {mode === "verify" && "이메일로 전송된 6자리 코드를 입력하세요"}
                      {mode === "reset" && "새로운 비밀번호를 설정하세요"}
                    </p>
                  </div>
                </div>

                {/* 폼 */}
                <form 
                  key={mode} 
                  onSubmit={handleSubmit}
                  noValidate
                  className="space-y-5 flex-1 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-forwards"
                >
                  {mode === "signup" && renderInput(User, "nickname", "text", "cool_user", "닉네임")}
                  {mode === "signup" && renderInput(User, "name", "text", "홍길동", "이름")}
                  {mode !== "verify" && renderInput(Mail, "email", "email", "example@email.com", "이메일")}

                  {(mode === "login" || mode === "signup") && (
                    <div className="space-y-1.5">
                       <div className="flex justify-between items-end">
                        <label className={cn("font-serif text-sm block ml-1 transition-colors", errors.password ? "text-red-800/80" : "text-ink/80")}>
                          비밀번호
                        </label>
                        {mode === "login" && (
                          <button 
                            type="button"
                            onClick={() => setMode("forgot")}
                            className="text-xs font-handwriting text-ink/50 hover:text-gold transition-colors underline decoration-dotted"
                          >
                            비밀번호를 잊으셨나요?
                          </button>
                        )}
                       </div>
                       <div className="relative group">
                        <div className={cn(
                            "absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-300",
                            errors.password ? "text-red-800/60" : "text-ink/40 group-focus-within:text-gold"
                        )}>
                          <Lock className="w-5 h-5" />
                        </div>
                        <input
                          type="password"
                          name="password"
                          value={formData.password}
                          onChange={handleInputChange}
                          placeholder="••••••••"
                          className={cn(
                            "w-full pl-11 pr-4 py-3.5 rounded-md border transition-all duration-300",
                            "font-handwriting text-lg text-ink placeholder:text-ink/30",
                            "focus:outline-none focus:bg-aged-paper",
                            errors.password
                                ? "bg-red-50/50 border-red-800/30 focus:border-red-800/50 focus:ring-1 focus:ring-red-800/20" 
                                : "bg-aged-paper/60 border-ink/10 group-hover:border-ink/30 focus:border-gold/60 focus:ring-1 focus:ring-gold/30"
                          )}
                        />
                       </div>
                       {errors.password && (
                        <div className="flex items-center gap-1.5 mt-1 ml-1 animate-in slide-in-from-left-1 duration-300">
                            <AlertCircle className="w-3 h-3 text-red-800/70" />
                            <p className="font-handwriting text-sm text-red-800/80">{errors.password}</p>
                        </div>
                       )}
                       
                       {mode === "signup" && !errors.password && (
                         <p className="text-[10px] text-ink/40 pl-1 font-sans">* 8자 이상, 특수문자 포함</p>
                       )}
                    </div>
                  )}

                  {mode === "verify" && (
                    <div className="space-y-4">
                      {renderInput(KeyRound, "code", "text", "123456", "인증 코드")}
                      
                      <div className="text-center">
                        <button 
                          type="button"
                          className="inline-flex items-center gap-1.5 text-xs font-handwriting text-ink/50 hover:text-gold transition-colors"
                          onClick={async () => {
                            try {
                              const emailToResend = pendingEmail || formData.email;
                              if (!emailToResend) {
                                toast({ 
                                  title: "오류",
                                  description: "이메일 주소를 찾을 수 없습니다.",
                                  variant: "destructive"
                                });
                                return;
                              }
                              
                              console.log('인증 코드 재전송 시도:', emailToResend);
                              await resendCode(emailToResend);
                              
                              toast({ 
                                title: "전송 완료",
                                description: "인증 코드를 재전송했습니다. 이메일을 확인해주세요.",
                              });
                            } catch (error: any) {
                              console.error('인증 코드 재전송 실패:', error);
                              
                              let errorMessage = error.message || "코드 재전송에 실패했습니다.";
                              
                              // Cognito 에러 코드 처리
                              if (error.code === "UserNotFoundException") {
                                errorMessage = "사용자를 찾을 수 없습니다. 회원가입을 먼저 진행해주세요.";
                              } else if (error.code === "LimitExceededException") {
                                errorMessage = "시도 횟수를 초과했습니다. 잠시 후 다시 시도해주세요.";
                              } else if (error.code === "TooManyRequestsException") {
                                errorMessage = "너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요.";
                              } else if (error.code === "InvalidParameterException") {
                                errorMessage = "사용자가 이미 인증되었거나 잘못된 요청입니다.";
                              }
                              
                              toast({ 
                                title: "오류",
                                description: errorMessage,
                                variant: "destructive"
                              });
                            }
                          }}
                        >
                          <RefreshCcw className="w-3 h-3" />
                          코드가 오지 않았나요? 재전송
                        </button>
                      </div>
                    </div>
                  )}

                  {mode === "reset" && (
                    <div className="space-y-4">
                      {renderInput(KeyRound, "code", "text", "123456", "재설정 코드")}
                      {renderInput(Lock, "newPassword", "password", "••••••••", "새 비밀번호")}
                      {!errors.newPassword && (
                        <p className="text-[10px] text-ink/40 pl-1 font-sans">* 8자 이상, 특수문자 포함</p>
                      )}
                    </div>
                  )}

                  <div className="pt-4">
                    {/* 👇 [수정됨] vintage-btn 대신 직접 Tailwind 클래스로 색상 지정 */}
                    <button
                      type="submit"
                      disabled={isLoading}
                      className={cn(
                        "w-full py-4 rounded-md flex items-center justify-center gap-3 font-serif transition-all duration-300 group disabled:opacity-70 disabled:cursor-not-allowed",
                        // 배경색: 가죽색(bg-leather), 글자색: 세피아(text-sepia)
                        "bg-[hsl(var(--leather))] text-[hsl(var(--sepia))] shadow-md hover:brightness-110 hover:shadow-lg"
                      )}
                    >
                      {isLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <span>
                            {mode === "login" && "기록실 입장"}
                            {mode === "signup" && "회원 등록"}
                            {mode === "verify" && "인증 확인"}
                            {mode === "forgot" && "코드 전송"}
                            {mode === "reset" && "비밀번호 변경"}
                          </span>
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </button>
                  </div>

                  {/* Google 로그인 버튼 (로그인 모드에서만 표시) */}
                  {mode === "login" && (
                    <div className="pt-4">
                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-ink/10"></div>
                        </div>
                        <div className="relative flex justify-center text-xs">
                          <span className="bg-aged-paper px-2 text-ink/40 font-handwriting">또는</span>
                        </div>
                      </div>
                      
                      <button
                        type="button"
                        onClick={() => {
                          try {
                            signInWithGoogle();
                          } catch (error: any) {
                            toast({
                              title: "오류",
                              description: error.message || "Google 로그인에 실패했습니다.",
                              variant: "destructive",
                            });
                          }
                        }}
                        className={cn(
                          "w-full mt-4 py-3.5 rounded-md flex items-center justify-center gap-3 font-serif transition-all duration-300",
                          "bg-white text-gray-700 border border-gray-300 shadow-sm hover:shadow-md hover:bg-gray-50"
                        )}
                      >
                        <GoogleIcon />
                        <span>Google로 로그인</span>
                      </button>
                    </div>
                  )}

                </form>

                <div className="mt-8 text-center pt-6 border-t border-ink/5">
                  <button
                    onClick={() => {
                      if (mode === "login") setMode("signup");
                      else if (mode === "signup") setMode("login");
                      else setMode("login");
                      setErrors({});
                      setFormData({ email: "", password: "", name: "", nickname: "", code: "", newPassword: "" });
                    }}
                    className="font-handwriting text-ink/60 hover:text-gold transition-colors text-sm"
                  >
                    {mode === "login" && "아직 회원이 아니신가요? 가입하기"}
                    {mode === "signup" && "이미 계정이 있으신가요? 로그인"}
                    {(mode === "verify" || mode === "forgot" || mode === "reset") && "로그인 화면으로 돌아가기"}
                  </button>
                </div>

              </div>
            </div>
            
            <div className="absolute -bottom-2 left-4 right-4 h-4 bg-white/50 rounded-b-lg border-x border-b border-black/5 -z-10" />
            <div className="absolute -bottom-4 left-6 right-6 h-4 bg-white/30 rounded-b-lg border-x border-b border-black/5 -z-20" />
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Auth;