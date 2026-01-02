import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { BookOpen, ChevronRight, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

interface HistoryChapter {
  id: string;
  date: string;
  title: string;
  preview: string;
  entries: number;
}

const mockHistory: HistoryChapter[] = [
  {
    id: "1",
    date: "2024년 12월 22일",
    title: "겨울의 시작",
    preview: "오늘은 첫눈이 내렸다. 창밖을 바라보며 지난 시간들을 떠올렸다...",
    entries: 5,
  },
  {
    id: "2",
    date: "2024년 12월 21일",
    title: "조용한 하루",
    preview: "아무것도 하지 않은 하루였지만, 그래서 더 평화로웠다...",
    entries: 3,
  },
  {
    id: "3",
    date: "2024년 12월 20일",
    title: "새로운 시작",
    preview: "과거의 나를 기록하기 시작한 첫 날. 이 기록이 미래의 나에게...",
    entries: 7,
  },
];

const History = () => {
  const [selectedChapter, setSelectedChapter] = useState<string | null>(null);

  return (
    <MainLayout>
      <div className="min-h-screen py-12 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <header className="text-center mb-12 animate-fade-in">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-secondary mb-4">
              <Calendar className="w-8 h-8 text-gold" />
            </div>
            <h1 className="font-serif text-3xl text-primary mb-2 gold-accent">
              히스토리
            </h1>
            <p className="font-handwriting text-xl text-muted-foreground">
              지난 기록들을 다시 펼쳐보세요
            </p>
          </header>

          {/* Chapter List */}
          <div className="space-y-4">
            {mockHistory.map((chapter, index) => (
              <button
                key={chapter.id}
                onClick={() => setSelectedChapter(
                  selectedChapter === chapter.id ? null : chapter.id
                )}
                className={cn(
                  "w-full text-left paper-texture rounded-lg overflow-hidden transition-all duration-500 animate-fade-in",
                  selectedChapter === chapter.id
                    ? "shadow-book"
                    : "shadow-page hover:shadow-soft"
                )}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Book spine accent */}
                <div className="absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-r from-leather to-transparent" />

                <div className="p-6 pl-8">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* Date as chapter number */}
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-serif text-sm text-ink/60">
                          {chapter.date}
                        </span>
                        <span className="text-ink/40">·</span>
                        <span className="font-serif text-sm text-ink/60">
                          {chapter.entries}개의 기록
                        </span>
                      </div>

                      {/* Chapter title */}
                      <h3 className="font-serif text-xl text-ink mb-3">
                        {chapter.title}
                      </h3>

                      {/* Preview */}
                      <p className="font-handwriting text-ink/80 text-lg line-clamp-2 leading-relaxed">
                        {chapter.preview}
                      </p>
                    </div>

                    {/* Open indicator */}
                    <div className="ml-4 flex-shrink-0">
                      <div
                        className={cn(
                          "w-10 h-10 rounded-full bg-secondary/50 flex items-center justify-center transition-transform duration-300",
                          selectedChapter === chapter.id && "rotate-90"
                        )}
                      >
                        <ChevronRight className="w-5 h-5 text-gold" />
                      </div>
                    </div>
                  </div>

                  {/* Expanded content */}
                  <div
                    className={cn(
                      "overflow-hidden transition-all duration-500",
                      selectedChapter === chapter.id
                        ? "max-h-96 opacity-100 mt-6"
                        : "max-h-0 opacity-0"
                    )}
                  >
                    <div className="border-t border-ink/10 pt-6 page-lines">
                      <div className="flex items-center gap-2 mb-4">
                        <BookOpen className="w-5 h-5 text-gold" />
                        <span className="font-serif text-sm text-ink/70">
                          전체 기록
                        </span>
                      </div>

                      <div className="space-y-5 font-handwriting text-ink/85 text-lg leading-relaxed tracking-wide">
                        <p>
                          이 날의 첫 번째 기록입니다. 아침에 일어나 창밖을 바라보았습니다.
                        </p>
                        <p>
                          점심 무렵, 오래된 사진첩을 꺼내 보았습니다. 추억이 새록새록 떠올랐습니다.
                        </p>
                        <p>
                          저녁에는 조용히 차를 마시며 하루를 정리했습니다.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Empty state hint */}
          {mockHistory.length === 0 && (
            <div className="text-center py-20">
              <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className="font-handwriting text-xl text-muted-foreground">
                아직 기록이 없습니다
              </p>
              <p className="font-serif text-sm text-muted-foreground mt-2">
                첫 번째 기록을 시작해보세요
              </p>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default History;
