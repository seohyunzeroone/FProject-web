export type LibraryItemType = "image" | "document" | "file" | "video";

export type LibraryItemVisibility = "public" | "private";

export interface LibraryItem {
  id: string;
  name: string;
  type: LibraryItemType;
  visibility: LibraryItemVisibility;
  thumbnail?: string;
  preview?: string;
  createdAt: Date;
  size?: number;
}

export interface LibraryTypeConfig {
  type: LibraryItemType;
  label: string;
  icon: string;
  color: string;
  route: string;
}