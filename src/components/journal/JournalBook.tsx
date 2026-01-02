import { useState, KeyboardEvent, useEffect, useRef } from "react";
import { Send, Sparkles, Feather, HelpCircle, Loader2, X, Trash2 } from "lucide-react"; // X, Trash2 아이콘 추가
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

export const JournalBook = () => {
  const [entries, setEntries] = useState<string[]>([]);
  const [currentEntry, setCurrentEntry] = useState("");
  const entriesContainerRef = useRef<HTMLDivElement>(null);
  
  // 요약(Analysis) 관련 상태
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogStep, setDialogStep] = useState<"confirm" | "loading" | "result">("confirm");

  // [추가됨] 삭제 관련 상태
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteTargetIndex, setDeleteTargetIndex] = useState<number | null>(null);

  useEffect(() => {
    if (entriesContainerRef.current) {
      entriesContainerRef.current.scrollTo({ top: entriesContainerRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [entries]);

  const addEntry = () => {
    if (currentEntry.trim()) {
      setEntries((prev) => [...prev, currentEntry.trim()]);
      setCurrentEntry("");
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.nativeEvent.isComposing) return;
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      addEntry();
    }
  };

  // [추가됨] 삭제 요청 핸들러 (X버튼 클릭 시)
  const handleDeleteRequest = (index: number) => {
    setDeleteTargetIndex(index);
    setIsDeleteDialogOpen(true);
  };

  // [추가됨] 삭제 확정 핸들러 (팝업에서 '예' 클릭 시)
  const confirmDelete = () => {
    if (deleteTargetIndex !== null) {
      setEntries((prev) => prev.filter((_, i) => i !== deleteTargetIndex));
      setIsDeleteDialogOpen(false);
      setDeleteTargetIndex(null);
    }
  };

  const handleOpenAnalysis = () => {
    setDialogStep("confirm");
    setIsDialogOpen(true);
  };

  const proceedToResult = () => {
    setDialogStep("loading");
    setTimeout(() => {
      setDialogStep("result");
    }, 2000);
  };

  const mockEmotions = [
    { type: "positive" as const, label: "평온", percentage: 45 },
    { type: "neutral" as const, label: "그리움", percentage: 35 },
    { type: "negative" as const, label: "쓸쓸함", percentage: 20 },
  ];

  const defaultScrollbarStyle = `
    pr-2 overflow-y-auto
    [&::-webkit-scrollbar]:w-1.5
    [&::-webkit-scrollbar-track]:bg-transparent
    [&::-webkit-scrollbar-thumb]:bg-primary/20
    [&::-webkit-scrollbar-thumb]:rounded-full
    [&::-webkit-scrollbar-thumb]:hover:bg-primary/40
    transition-colors
  `;

  const paperScrollbarStyle = `
    pr-4 overflow-y-auto
    [&::-webkit-scrollbar]:w-1.5
    [&::-webkit-scrollbar-track]:bg-transparent
    [&::-webkit-scrollbar-thumb]:bg-stone-300
    [&::-webkit-scrollbar-thumb]:rounded-full
    [&::-webkit-scrollbar-thumb]:hover:bg-stone-400
    transition-colors
  `;

  const linedPaperStyle = {
    backgroundImage: "linear-gradient(transparent 37px, #e5e7eb 38px)",
    backgroundSize: "100% 38px",
    lineHeight: "38px",
    paddingTop: "0px",
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 p-4">
      {/* 메인 화면 */}
      <div className="library-card p-6 md:p-8 animate-slide-up border rounded-xl shadow-sm bg-card">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Feather className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-display text-xl font-semibold text-foreground">오늘의 추억</h2>
            <p className="text-sm text-muted-foreground">오늘은 어떤 일이 있었나요?</p>
          </div>
        </div>

        {entries.length > 0 && (
          <div 
            ref={entriesContainerRef}
            className={`space-y-3 mb-6 max-h-[250px] ${defaultScrollbarStyle}`}
          >
            {entries.map((entry, idx) => (
              <div 
                key={`entry-${idx}`}
                // group 클래스 추가 (호버 시 X버튼 표시용)
                className="group flex items-start gap-3 p-4 rounded-lg bg-[#ebe5da] shadow-sm border border-[#dcd6cc] animate-in fade-in slide-in-from-left-2 duration-300 border-l-4 border-l-primary relative"
              >
                <span className="text-xs text-stone-500 font-mono mt-1 font-medium shrink-0">
                  {String(idx + 1).padStart(2, "0")}
                </span>
                <p className="text-stone-800 text-sm flex-1 leading-relaxed font-medium whitespace-pre-wrap break-all">
                  {entry}
                </p>
                
                {/* [추가됨] 삭제 버튼 (X) */}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => handleDeleteRequest(idx)}
                  className="h-6 w-6 shrink-0 text-stone-400 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                  aria-label="이 기록 삭제"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        <div className="relative group">
          <textarea
            value={currentEntry}
            onChange={(e) => setCurrentEntry(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="이곳에 오늘 있었던 일을 적어보세요..."
            className="w-full h-13 px-4 py-3 rounded-xl bg-secondary/20 border border-input focus:border-primary focus:ring-1 focus:ring-primary/20 resize-none text-foreground placeholder:text-muted-foreground/50 outline-none transition-all duration-300 font-serif"
          />
          <div className="absolute bottom-3 right-3">
            <Button variant="ghost" size="icon" onClick={addEntry} disabled={!currentEntry.trim()} className="rounded-full hover:bg-primary/10 hover:text-primary transition-colors">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {entries.length > 0 && (
          <div className="mt-6 flex justify-end">
            <Button onClick={handleOpenAnalysis} className="gap-2 shadow-md hover:shadow-lg transition-all">
              <Sparkles className="w-4 h-4" />
              요약하기
            </Button>
          </div>
        )}
      </div>

      {/* [추가됨] 삭제 확인 팝업 (Dialog) */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-sm bg-card/95 backdrop-blur-md border border-primary/10 shadow-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="w-5 h-5" />
              기록 삭제
            </DialogTitle>
            <DialogDescription className="pt-2">
              이 메시지를 정말 삭제하시겠습니까?<br/>
              삭제된 기록은 복구할 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              아니요
            </Button>
            <Button variant="destructive" onClick={confirmDelete} className="bg-red-500 hover:bg-red-600">
              네, 삭제할래요
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 기존 요약 팝업 (Dialog) */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent 
          className={`
            bg-transparent border-none shadow-none p-0 
            transition-all duration-300 ease-in-out flex flex-col items-center justify-center
            ${dialogStep === "result" ? "sm:max-w-2xl h-[85vh]" : "sm:max-w-lg h-auto"}
          `}
        >
          {dialogStep === "confirm" && (
            <div className="bg-card/95 backdrop-blur-md border border-primary/20 shadow-2xl rounded-lg p-6 w-full animate-in fade-in zoom-in-95 duration-300 space-y-4">
              <DialogHeader>
                <DialogTitle className="font-display text-xl flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-primary" />
                  기록 요약
                </DialogTitle>
                <DialogDescription className="text-base pt-2">
                  오늘 작성하신 {entries.length}개의 기록을 바탕으로 요약을 진행할까요?
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="gap-2 sm:gap-0 mt-4">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="border-primary/20 hover:bg-primary/5 hover:text-primary">
                  아니요, 더 쓸래요
                </Button>
                <Button onClick={proceedToResult} className="bg-primary text-primary-foreground shadow-sm gap-2">
                  <Sparkles className="w-4 h-4" />
                  네, 요약해주세요
                </Button>
              </DialogFooter>
            </div>
          )}

          {dialogStep === "loading" && (
            <div className="bg-card/95 backdrop-blur-md border border-primary/20 shadow-2xl rounded-lg p-10 w-full flex flex-col items-center justify-center space-y-4 animate-in fade-in zoom-in-95 duration-500">
              <div className="relative">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
                <Sparkles className="w-4 h-4 text-primary absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-50 animate-pulse" />
              </div>
              <div className="text-center space-y-1">
                <p className="text-lg font-medium font-display text-foreground">기록을 읽고 있어요...</p>
                <p className="text-sm text-muted-foreground animate-pulse">당신의 소중한 하루를 정리하는 중입니다.</p>
              </div>
            </div>
          )}

          {dialogStep === "result" && (
            <div className="relative w-full h-full flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-700">
              
              <div className="paper-texture bg-[#fdfbf7] w-full h-full rounded-r-lg shadow-2xl flex flex-col relative overflow-hidden text-stone-800">
                <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-black/10 to-transparent pointer-events-none z-10" />
                <div className="absolute right-0 top-0 bottom-0 w-3 bg-gradient-to-l from-black/5 to-transparent pointer-events-none z-10" />

                <div className="h-full flex flex-col relative p-6 pl-8 md:p-8 md:pl-10">
                  <div className="shrink-0 border-b border-stone-300 pb-4 mb-1">
                    <h3 className="font-serif text-stone-500 text-base">
                      {new Date().toLocaleDateString("ko-KR", {
                        year: "numeric", month: "long", day: "numeric", weekday: "long",
                      })}
                    </h3>
                    <div className="flex items-center gap-2 mt-2">
                        {mockEmotions.map((e, i) => (
                          <span key={i} className={`text-xs px-2 py-0.5 rounded-full border ${
                            i === 0 ? "border-rose-300 text-rose-600 bg-rose-50" : "border-stone-300 text-stone-500"
                          }`}>
                            #{e.label}
                          </span>
                        ))}
                    </div>
                  </div>

                  <div className={`flex-1 ${paperScrollbarStyle}`} style={{ marginTop: '10px' }}>
                    <div 
                      className="font-handwriting text-xl text-stone-800 tracking-wide whitespace-pre-wrap min-h-full"
                      style={linedPaperStyle}
                    >
                      오늘의 기록에서는 잔잔한 평온함이 느껴집니다. 
                      과거를 그리워하는 마음과 함께, 고요한 쓸쓸함도 함께 담겨 있네요. 
                      
                      이 모든 감정이 모여 당신만의 하루가 됩니다. 
                      때로는 지나간 추억이 아프게 다가오기도 하지만, 그것 또한 지금의 나를 만든 소중한 조각들입니다.
                      
                      내일은 오늘보다 조금 더 따뜻한 하루가 되기를 바랍니다.
                      당신의 이야기는 여기서 끝이 아닙니다. 계속해서 써내려가세요.
                    </div>
                  </div>

                  <div className="shrink-0 pt-4 mt-2 border-t border-stone-300/50 flex items-center justify-between text-stone-500 text-sm font-serif">
                    <span>총 {entries.length}개의 기록</span>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setIsDialogOpen(false)} className="hover:bg-stone-200/50 hover:text-stone-800">
                        덮기
                      </Button>
                      <Button variant="default" size="sm" className="bg-stone-800 text-[#fdfbf7] hover:bg-stone-700 shadow-sm font-sans">
                        히스토리에 등록
                      </Button>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};