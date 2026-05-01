import * as React from "react";
import { useState, useMemo } from "react";
import { FolderOpen, Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../primitives/dialog";
import { Button } from "../primitives/button";
import { Input } from "../primitives/input";
import { cn } from "../lib/utils";
import type { FolderData } from "../data/types";

export interface NoteMoveDialogProps {
  open: boolean;
  /** The note path being moved. Used for display. */
  notePath: string;
  folders: FolderData[];
  onMove: (notePath: string, targetFolderPath: string) => Promise<void>;
  onClose: () => void;
}

export function NoteMoveDialog({
  open,
  notePath,
  folders,
  onMove,
  onClose,
}: NoteMoveDialogProps) {
  const [search, setSearch] = useState("");
  const [selectedPath, setSelectedPath] = useState<string>("");
  const [busy, setBusy] = useState(false);

  const noteName = notePath.split("/").pop()?.replace(/\.md$/, "") || notePath;

  const filteredFolders = useMemo(() => {
    const q = search.trim().toLowerCase();
    // Always include root option
    const root = { id: "__root__", path: "" };
    const matched = (q
      ? folders.filter((f) => f.path.toLowerCase().includes(q))
      : folders
    ).slice(0, 50);
    return [root as unknown as FolderData, ...matched];
  }, [folders, search]);

  const handleMove = async () => {
    setBusy(true);
    try {
      await onMove(notePath, selectedPath);
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Move &quot;{noteName}&quot;</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search folders…"
              className="pl-8"
              autoFocus
            />
          </div>

          <div className="max-h-60 overflow-y-auto border rounded-md divide-y divide-gray-100 dark:divide-gray-700">
            {filteredFolders.map((folder) => {
              const isRoot = folder.id === "__root__";
              const label = isRoot ? "(Root)" : folder.path;
              const isSelected = selectedPath === folder.path;
              return (
                <button
                  key={folder.id}
                  type="button"
                  onClick={() => setSelectedPath(folder.path)}
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors",
                    isSelected
                      ? "bg-violet-500/10 text-violet-600 dark:text-violet-400 font-medium"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700",
                  )}
                >
                  <FolderOpen
                    size={14}
                    aria-hidden="true"
                    className={isSelected ? "text-violet-500" : "text-gray-400"}
                  />
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button
            onClick={handleMove}
            disabled={busy || selectedPath === undefined}
            aria-busy={busy}
          >
            {busy ? "Moving…" : "Move here"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
