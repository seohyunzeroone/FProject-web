import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { LibraryItem, LibraryItemType, LibraryItemVisibility } from "@/types/library";
import { initialMockItems } from "@/data/libraryMockData";

interface LibraryContextType {
  items: LibraryItem[];
  getItemsByType: (type: LibraryItemType) => LibraryItem[];
  getLatestItemByType: (type: LibraryItemType) => LibraryItem | null;
  getItemCountByType: (type: LibraryItemType) => number;
  updateItemsVisibility: (itemIds: string[], visibility: LibraryItemVisibility) => void;
  deleteItems: (itemIds: string[]) => void;
  addItem: (item: Omit<LibraryItem, "id" | "createdAt">) => void;
}

const LibraryContext = createContext<LibraryContextType | undefined>(undefined);

export function LibraryProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<LibraryItem[]>(initialMockItems);

  const getItemsByType = useCallback(
    (type: LibraryItemType) =>
      items
        .filter((item) => item.type === type)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
    [items]
  );

  const getLatestItemByType = useCallback(
    (type: LibraryItemType) => {
      const typeItems = getItemsByType(type);
      return typeItems.length > 0 ? typeItems[0] : null;
    },
    [getItemsByType]
  );

  const getItemCountByType = useCallback(
    (type: LibraryItemType) => items.filter((item) => item.type === type).length,
    [items]
  );

  const updateItemsVisibility = useCallback(
    (itemIds: string[], visibility: LibraryItemVisibility) => {
      // 여러 항목을 한 번에 공개 상태 변경.
      setItems((prev) =>
        prev.map((item) => (itemIds.includes(item.id) ? { ...item, visibility } : item))
      );
    },
    []
  );

  const deleteItems = useCallback((itemIds: string[]) => {
    // 선택된 항목만 제거.
    setItems((prev) => prev.filter((item) => !itemIds.includes(item.id)));
  }, []);

  const addItem = useCallback((item: Omit<LibraryItem, "id" | "createdAt">) => {
    const newItem: LibraryItem = {
      ...item,
      id: `${item.type}-${Date.now()}`,
      createdAt: new Date(),
    };
    setItems((prev) => [newItem, ...prev]);
  }, []);

  const value = useMemo(
    () => ({
      items,
      getItemsByType,
      getLatestItemByType,
      getItemCountByType,
      updateItemsVisibility,
      deleteItems,
      addItem,
    }),
    [
      items,
      getItemsByType,
      getLatestItemByType,
      getItemCountByType,
      updateItemsVisibility,
      deleteItems,
      addItem,
    ]
  );

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
}

export function useLibraryContext() {
  const context = useContext(LibraryContext);
  if (!context) {
    throw new Error("useLibraryContext must be used within a LibraryProvider");
  }
  return context;
}