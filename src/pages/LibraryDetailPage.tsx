import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, MoreVertical, Plus, Trash2, X } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { LibraryItemCard } from "@/components/library/LibraryItemCard";
import { DeleteConfirmModal } from "@/components/library/DeleteConfirmModal";
import { AddItemModal } from "@/components/library/AddItemModal";
import { useLibraryContext } from "@/contexts/LibraryContext";
import { libraryTypeConfigs } from "@/data/libraryMockData";
import { LibraryItem, LibraryItemType, LibraryItemVisibility } from "@/types/library";
import { Dialog, DialogContent } from "@/components/ui/dialog";

const LibraryDetailPage = () => {
  const { type } = useParams<{ type: string }>();
  const navigate = useNavigate();
  const { getItemsByType, deleteItems, addItem } = useLibraryContext();
  const menuRef = useRef<HTMLDivElement | null>(null);

  const itemType = type as LibraryItemType;
  const config = libraryTypeConfigs.find((item) => item.type === itemType);

  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [previewItem, setPreviewItem] = useState<LibraryItem | null>(null);

  const items = useMemo(() => getItemsByType(itemType), [getItemsByType, itemType]);

  useEffect(() => {
    // 메뉴 외부 클릭 시 닫기.
    if (!isMenuOpen) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMenuOpen]);

  if (!config) {
    navigate("/library");
    return null;
  }

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id]));
  };

  const handleEnterDeleteMode = () => {
    setIsMenuOpen(false);
    setIsSelectionMode(true);
    setSelectedIds([]);
  };

  const handleCancelSelection = () => {
    setIsSelectionMode(false);
    setSelectedIds([]);
  };

  const handleDeleteConfirm = () => {
    deleteItems(selectedIds);
    setIsSelectionMode(false);
    setSelectedIds([]);
  };

  const handleAddItem = (item: { name: string; visibility: LibraryItemVisibility }) => {
    addItem({
      name: item.name,
      type: itemType,
      visibility: item.visibility,
    });
  };

  const handleOpenPreview = (item: LibraryItem) => {
    if (item.type === "image" || item.type === "video") {
      // 이미지/영상만 크게 미리보기로 열기.
      setPreviewItem(item);
    }
  };

  return (
    <MainLayout>
      <div className="min-h-screen py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <header className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-ink hover:text-gold transition-colors"
                onClick={() => navigate("/library")}
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="font-serif text-2xl text-primary gold-accent">{config.label}</h1>
                <p className="font-handwriting text-base text-muted-foreground">{items.length}개 항목</p>
              </div>
            </div>

            {isSelectionMode ? (
              <div className="flex items-center gap-3">
                <span className="font-serif text-sm text-ink">
                  선택 중 ({selectedIds.length}개)
                </span>
                <button
                  type="button"
                  className="vintage-btn px-4 py-2 rounded-md text-sm font-serif text-sepia hover:text-gold transition-colors"
                  onClick={handleCancelSelection}
                >
                  <X className="w-4 h-4 inline-block mr-1" />
                  취소
                </button>
              </div>
            ) : (
              <div ref={menuRef} className="relative">
                <button
                  type="button"
                  className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-ink hover:text-gold transition-colors"
                  onClick={() => setIsMenuOpen((prev) => !prev)}
                >
                  <MoreVertical className="w-5 h-5" />
                </button>
                {isMenuOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 mt-2 w-40 rounded-md border border-ink/10 bg-background/95 shadow-page backdrop-blur-sm z-20"
                  >
                    <button
                      type="button"
                      className="w-full text-left px-4 py-2 text-sm font-serif text-sepia hover:bg-gold/10 hover:text-gold transition-colors"
                      onClick={() => {
                        setIsMenuOpen(false);
                        setIsAddModalOpen(true);
                      }}
                    >
                      <Plus className="w-4 h-4 inline-block mr-2" />
                      추가
                    </button>
                    <button
                      type="button"
                      className="w-full text-left px-4 py-2 text-sm font-serif text-red-800 hover:bg-red-100/50 hover:text-red-900 transition-colors"
                      onClick={handleEnterDeleteMode}
                    >
                      <Trash2 className="w-4 h-4 inline-block mr-2" />
                      삭제
                    </button>
                  </div>
                )}
              </div>
            )}
          </header>

          {items.length === 0 ? (
            <div className="text-center py-20 paper-texture rounded-lg">
              <Plus className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="font-serif text-xl text-ink mb-2">항목이 없습니다</h2>
              <p className="font-handwriting text-base text-muted-foreground mb-4">
                새 {config.label}을(를) 추가해보세요
              </p>
              <button
                type="button"
                className="vintage-btn px-5 py-3 rounded-md font-serif text-sepia hover:text-gold transition-colors"
                onClick={() => setIsAddModalOpen(true)}
              >
                <Plus className="w-4 h-4 inline-block mr-2" />
                추가하기
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {items.map((item, index) => (
                <div key={item.id} style={{ animationDelay: `${index * 0.05}s` }}>
                  <LibraryItemCard
                    item={item}
                    isSelectionMode={isSelectionMode}
                    isSelected={selectedIds.includes(item.id)}
                    onSelect={handleToggleSelect}
                    onOpen={handleOpenPreview}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {isSelectionMode && selectedIds.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-background/95 border-t border-ink/10 p-4 backdrop-blur-sm">
          <div className="max-w-5xl mx-auto flex justify-end">
            <button
              type="button"
              className="vintage-btn px-5 py-3 rounded-md font-serif text-sepia hover:text-gold transition-colors"
              onClick={() => setIsDeleteModalOpen(true)}
            >
              <Trash2 className="w-4 h-4 inline-block mr-2" />
              {selectedIds.length}개 삭제
            </button>
          </div>
        </div>
      )}

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        itemCount={selectedIds.length}
      />

      <AddItemModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        itemType={itemType}
        typeLabel={config.label}
        onAdd={handleAddItem}
      />

      <Dialog open={!!previewItem} onOpenChange={() => setPreviewItem(null)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden">
          {previewItem?.thumbnail ? (
            <img
              src={previewItem.thumbnail}
              alt={previewItem.name}
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="p-8 text-center font-serif text-ink">
              미리보기 이미지가 없습니다.
            </div>
          )}
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default LibraryDetailPage;