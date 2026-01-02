import { useEffect, useMemo, useRef, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { FolderOpen, Image, FileText, Film, MoreVertical, File, X } from "lucide-react";
import { cn } from "@/lib/utils";
import CircularGallery from "@/components/CircularGallery";
import { useNavigate } from "react-router-dom";
import { useLibraryContext } from "@/contexts/LibraryContext";
import { libraryTypeConfigs } from "@/data/libraryMockData";
import { LibraryItemType, LibraryItemVisibility } from "@/types/library";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const getIcon = (type: "image" | "document" | "video" | "file") => {
  switch (type) {
    case "image":
      return Image;
    case "document":
      return FileText;
    case "video":
      return Film;
    case "file":
      return File;
  }
};

const LibraryPage = () => {
  const [isUploadMenuOpen, setIsUploadMenuOpen] = useState(false);
  const [openItemMenuId, setOpenItemMenuId] = useState<string | null>(null);
  const [visibilityModal, setVisibilityModal] = useState<{
    isOpen: boolean;
    type: LibraryItemType | null;
    visibility: LibraryItemVisibility;
  }>({
    isOpen: false,
    type: null,
    visibility: "public",
  });
  const uploadMenuRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();
  const { getLatestItemByType, getItemCountByType, getItemsByType } = useLibraryContext();

  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, "0");
    const day = `${date.getDate()}`.padStart(2, "0");
    return `${year}.${month}.${day}`;
  };

  const typeCards = useMemo(
    () =>
      libraryTypeConfigs.map((config) => ({
        ...config,
        // 각 타입별 최신 항목/개수를 카드에 노출.
        latestItem: getLatestItemByType(config.type),
        itemCount: getItemCountByType(config.type),
      })),
    [getLatestItemByType, getItemCountByType]
  );

  useEffect(() => {
    // 드롭다운이 열려 있을 때 바깥 클릭으로 닫기
    if (!isUploadMenuOpen) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (!uploadMenuRef.current) {
        return;
      }

      if (!uploadMenuRef.current.contains(event.target as Node)) {
        setIsUploadMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isUploadMenuOpen]);

  useEffect(() => {
    // 아이템 드롭다운이 열려 있을 때 바깥 클릭으로 닫기
    if (!openItemMenuId) {
      return;
    }

    const handleClickOutside = () => {
      setOpenItemMenuId(null);
    };

    document.addEventListener("click", handleClickOutside);

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [openItemMenuId]);

  const handleUploadClick = (target: "video" | "image" | "document" | "file") => {
    setIsUploadMenuOpen(false);
    // TODO: 실제 업로드 로직을 연결하세요.
  };
  const handleVisibilityOpen = (type: LibraryItemType, visibility: LibraryItemVisibility) => {
    // 공개 상태별 목록을 팝업으로 표시.
    setOpenItemMenuId(null);
    setVisibilityModal({
      isOpen: true,
      type,
      visibility,
    });
  };
  const visibilityItems = visibilityModal.type
    ? getItemsByType(visibilityModal.type).filter((item) => item.visibility === visibilityModal.visibility)
    : [];
  const isMediaList = visibilityModal.type === "image" || visibilityModal.type === "video";

  return (
    <MainLayout>
      <div className="min-h-screen py-12 px-4">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <header className="text-center mb-12 animate-fade-in">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-secondary mb-4">
              <FolderOpen className="w-8 h-8 text-gold" />
            </div>
            <h1 className="font-serif text-3xl text-primary mb-2 gold-accent">
              라이브러리
            </h1>
            <p className="font-handwriting text-xl text-muted-foreground">
              사진, 영상, 문서를 보관하세요
            </p>
          </header>

          <div className="w-full h-[450px] my-8 relative rounded-2xl bg-black/5 overflow-hidden border border-[#D9C5B2]/20 shadow-inner">
            <CircularGallery key="main-gallery" bend={3} textColor="#8C7365" borderRadius={0.05} />
          </div>

          {/* Upload dropdown */}
          <div className="flex justify-end mb-8">
            <div ref={uploadMenuRef} className="relative">
              <button
                type="button"
                className="vintage-btn px-5 py-3 rounded-md flex items-center gap-2 font-serif text-sepia hover:text-gold transition-colors"
                aria-haspopup="menu"
                aria-expanded={isUploadMenuOpen}
                onClick={() => {
                  setOpenItemMenuId(null);
                  setIsUploadMenuOpen((prev) => !prev);
                }}
              >
                <img src="/dropdown.png" alt="드롭다운" className="w-12 h-12" />
                <span className="text-xl"> 추가 </span>
              </button>

              {isUploadMenuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 mt-2 w-44 rounded-md border border-ink/10 bg-background/95 shadow-page backdrop-blur-sm z-20"
                >
                  <button
                    type="button"
                    className="w-full text-left px-4 py-2 text-base font-serif text-sepia hover:bg-gold/10 hover:text-gold transition-colors"
                    onClick={() => handleUploadClick("video")}
                  >
                    동영상
                  </button>
                  <button
                    type="button"
                    className="w-full text-left px-4 py-2 text-base font-serif text-sepia hover:bg-gold/10 hover:text-gold transition-colors"
                    onClick={() => handleUploadClick("image")}
                  >
                    사진
                  </button>
                  <button
                    type="button"
                    className="w-full text-left px-4 py-2 text-base font-serif text-sepia hover:bg-gold/10 hover:text-gold transition-colors"
                    onClick={() => handleUploadClick("document")}
                  >
                    문서
                  </button>
                  <button
                    type="button"
                    className="w-full text-left px-4 py-2 text-base font-serif text-sepia hover:bg-gold/10 hover:text-gold transition-colors"
                    onClick={() => handleUploadClick("file")}
                  >
                    파일
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Loveable-style cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {typeCards.map((item, index) => {
              const Icon = getIcon(item.type);

              return (
                <button
                  key={item.type}
                  onClick={() => navigate(item.route)}
                  className={cn(
                    "group relative paper-texture rounded-2xl overflow-hidden transition-all duration-300 animate-fade-in",
                    "shadow-page hover:shadow-soft hover:-translate-y-1"
                  )}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="relative aspect-square bg-secondary/30 overflow-hidden">
                    <div className="absolute inset-2 border border-ink/10 rounded" />

                    {item.latestItem?.thumbnail ? (
                      <img
                        src={item.latestItem.thumbnail}
                        alt={item.latestItem.name}
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Icon className="w-12 h-12 text-ink/30" />
                      </div>
                    )}

                    <div className="absolute top-3 left-3 w-8 h-8 rounded-md bg-background/80 flex items-center justify-center">
                      <Icon className="w-4 h-4 text-ink/50" />
                    </div>

                    {(item.type === "document" || item.type === "file") && item.latestItem && (
                      <div className="absolute left-4 right-4 bottom-16 text-center">
                        <p className="text-lg font-serif text-ink/60 truncate">
                          {item.latestItem.name}
                        </p>
                      </div>
                    )}

                    <button
                      className="absolute top-3 right-3 p-1.5 rounded-full bg-background/80 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsUploadMenuOpen(false);
                        setOpenItemMenuId((prev) => (prev === item.type ? null : item.type));
                      }}
                    >
                      <MoreVertical className="w-4 h-4 text-ink/60" />
                    </button>

                    {openItemMenuId === item.type && (
                      <div
                        role="menu"
                        className="absolute top-12 right-4 w-28 rounded-md border border-ink/10 bg-background/95 shadow-page backdrop-blur-sm z-20"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          className="w-full text-left px-3 py-2 text-sm font-serif text-sepia hover:bg-gold/10 hover:text-gold transition-colors"
                          onClick={() => handleVisibilityOpen(item.type, "public")}
                        >
                          public
                        </button>
                        <button
                          type="button"
                          className="w-full text-left px-3 py-2 text-sm font-serif text-sepia hover:bg-gold/10 hover:text-gold transition-colors"
                          onClick={() => handleVisibilityOpen(item.type, "private")}
                        >
                          private
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="px-4 py-3 border-t border-ink/10 bg-background/10">
                    <h3 className="font-serif text-base text-ink">{item.label}</h3>
                    <p className="font-serif text-xs text-ink/50">
                      {item.latestItem ? formatDate(item.latestItem.createdAt) : "항목 없음"}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Empty state */}
          {typeCards.length === 0 && (
            <div className="text-center py-20 paper-texture rounded-lg">
              <FolderOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className="font-handwriting text-xl text-muted-foreground">
                보관함이 비어있습니다
              </p>
              <p className="font-serif text-sm text-muted-foreground mt-2">
                사진이나 문서를 추가해보세요
              </p>
            </div>
          )}

          <Dialog
            open={visibilityModal.isOpen}
            onOpenChange={(open) =>
              setVisibilityModal((prev) => ({ ...prev, isOpen: open }))
            }
          >
            <DialogContent className="max-w-5xl paper-texture border border-ink/10 [&>button]:hidden [&>button.loveable-close]:block h-[600px]">
              <button
                type="button"
                className="loveable-close absolute right-4 top-4 rounded-full bg-ink/10 p-2 text-ink hover:bg-ink/20 transition-colors"
                onClick={() => setVisibilityModal((prev) => ({ ...prev, isOpen: false }))}
                aria-label="닫기"
              >
                <X className="h-4 w-4" />
              </button>
              <DialogHeader>
                <DialogTitle className="text-xl font-serif text-ink">
                  {visibilityModal.visibility} 항목
                </DialogTitle>
              </DialogHeader>
              <div className="mt-3 space-y-2 text-ink/80">
                {visibilityItems.length === 0 ? (
                  <p className="font-handwriting text-sm text-ink/60">
                    해당 항목이 없습니다.
                  </p>
                ) : isMediaList ? (
                  <div className="flex gap-6 overflow-x-auto snap-x snap-mandatory">
                    {visibilityItems.map((item) => (
                      <div
                        key={item.id}
                        className="relative shrink-0 w-90 h-80 rounded-xl overflow-hidden border border-ink/10 bg-secondary/30 snap-center"
                      >
                        {item.thumbnail ? (
                          <img
                            src={item.thumbnail}
                            alt={item.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-ink/40">
                            미리보기 없음
                          </div>
                        )}
                        <div className="absolute bottom-2 right-3 rounded-full bg-ink/40 px-2 py-1 text-sm font-serif font-semibold text-ink shadow-sm">
                          {item.name}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <ul className="space-y-3">
                    {visibilityItems.map((item) => (
                      <li key={item.id} className="flex items-start gap-3">
                        <div className="flex-1">
                          <p className="text-sm font-serif text-ink">{item.name}</p>
                          {item.type === "document" && item.preview && (
                            <p className="text-xs text-ink/60 whitespace-pre-line line-clamp-2">
                              {item.preview}
                            </p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </MainLayout>
  );
};

export default LibraryPage;