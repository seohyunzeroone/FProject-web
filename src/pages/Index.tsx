import { MainLayout } from "@/components/layout/MainLayout";
import { JournalBook } from "@/components/journal/JournalBook";

const Index = () => {
  return (
    <MainLayout>
      {/* 1. items-center 제거! -> 자식들이 가로로 꽉 찰 수 있게 됨 */}
      <div className="min-h-screen flex flex-col justify-center py-12 w-full px-4">
        
        {/* Header는 스스로 중앙 정렬 유지 */}
        <header className="text-center mb-8 animate-fade-in w-full">
          <h1 className="font-serif text-3xl md:text-5xl text-primary mb-3 gold-accent">
            기록실
          </h1>
          <p className="font-handwriting text-2xl text-muted-foreground">
            나의 추억을 기록으로 남겨보세요!
          </p>
        </header>

        {/* 2. JournalBook을 위한 래퍼 생성
             w-full: 부모 너비 100% 차지
             flex justify-center: 내부의 JournalBook(max-w-7xl)을 화면 중앙에 배치
        */}
        <div className="w-full flex justify-center animate-fade-in">
          <JournalBook />
        </div>
      </div>
    </MainLayout>
  );
};

export default Index;