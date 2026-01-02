import { useState } from "react";
import { Globe, Lock, Plus } from "lucide-react";
import { LibraryItemType, LibraryItemVisibility } from "@/types/library";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemType: LibraryItemType;
  typeLabel: string;
  onAdd: (item: { name: string; visibility: LibraryItemVisibility }) => void;
}

export function AddItemModal({
  isOpen,
  onClose,
  itemType,
  typeLabel,
  onAdd,
}: AddItemModalProps) {
  const [name, setName] = useState("");
  const [visibility, setVisibility] = useState<LibraryItemVisibility>("private");

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) {
      return;
    }
    // 입력된 값으로 새 항목을 추가.
    onAdd({ name: name.trim(), visibility });
    setName("");
    setVisibility("private");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md paper-texture border border-ink/10">
        <DialogHeader>
          <DialogTitle className="text-xl font-serif flex items-center gap-2 text-ink">
            <Plus className="w-5 h-5 text-gold" />
            새 {typeLabel} 추가
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-ink/80">
              파일 이름
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={`${typeLabel} 이름을 입력하세요`}
              className="bg-background"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="visibility" className="text-ink/80">
              공개 상태
            </Label>
            <Select value={visibility} onValueChange={(value) => setVisibility(value as LibraryItemVisibility)}>
              <SelectTrigger className="bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover border-ink/10">
                <SelectItem value="private">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    Private
                  </div>
                </SelectItem>
                <SelectItem value="public">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    Public
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              취소
            </Button>
            <Button type="submit" className="flex-1" disabled={!name.trim()}>
              추가
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}