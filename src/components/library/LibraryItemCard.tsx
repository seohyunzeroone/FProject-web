import { Check, File, FileText, Globe, Image, Lock, Video } from "lucide-react";
import { LibraryItem } from "@/types/library";
import { cn } from "@/lib/utils";

const iconMap = {
  image: Image,
  document: FileText,
  file: File,
  video: Video,
};

interface LibraryItemCardProps {
  item: LibraryItem;
  isSelectionMode: boolean;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onOpen?: (item: LibraryItem) => void;
}

export function LibraryItemCard({
  item,
  isSelectionMode,
  isSelected,
  onSelect,
  onOpen,
}: LibraryItemCardProps) {
  const IconComponent = iconMap[item.type];

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  const formatDate = (date: Date) =>
    date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  return (
    <div
      className={cn(
        "group relative cursor-pointer paper-texture rounded-lg overflow-hidden transition-all duration-300 animate-fade-in",
        isSelected ? "ring-2 ring-gold shadow-book" : "shadow-page hover:shadow-soft hover:-translate-y-1"
      )}
      onClick={() => {
        if (isSelectionMode) {
          onSelect(item.id);
          return;
        }
        // 선택 모드가 아닐 때는 상세 미리보기로 진입.
        onOpen?.(item);
      }}
    >
      {isSelectionMode && (
        <div className="absolute top-3 left-3 z-10">
          <div
            className={cn(
              "w-6 h-6 rounded-full flex items-center justify-center transition-all border",
              isSelected
                ? "bg-gold text-background border-gold"
                : "bg-background/80 border-ink/20"
            )}
          >
            {isSelected ? <Check className="w-4 h-4" /> : null}
          </div>
        </div>
      )}

      <div className="relative aspect-[4/3] bg-secondary/30 overflow-hidden">
        {item.thumbnail ? (
          <img
            src={item.thumbnail}
            alt={item.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <IconComponent className="w-10 h-10 text-ink/30" />
          </div>
        )}

        <div
          className={cn(
            "absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-serif flex items-center gap-1",
            item.visibility === "public"
              ? "bg-gold/20 text-gold"
              : "bg-ink/10 text-ink/70"
          )}
        >
          {item.visibility === "public" ? (
            <>
              <Globe className="w-3 h-3" />
              Public
            </>
          ) : (
            <>
              <Lock className="w-3 h-3" />
              Private
            </>
          )}
        </div>
      </div>

      <div className="p-4 border-t border-ink/10 bg-background/10">
        <h3 className="font-serif text-sm text-ink truncate">{item.name}</h3>
        <div className="flex items-center justify-between mt-1">
          <p className="font-serif text-xs text-ink/50">{formatDate(item.createdAt)}</p>
          {item.size && (
            <p className="font-serif text-xs text-ink/50">{formatFileSize(item.size)}</p>
          )}
        </div>
      </div>
    </div>
  );
}