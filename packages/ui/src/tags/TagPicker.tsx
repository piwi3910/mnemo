import * as React from "react";
import { useState, useCallback, useRef, useEffect } from "react";
import { Hash, X, ChevronDown } from "lucide-react";
import { cn } from "../lib/utils";

export interface TagPickerProps {
  /** All available tags to choose from. */
  availableTags: string[];
  /** Currently selected tags. */
  selectedTags: string[];
  onChange: (tags: string[]) => void;
  /** Allow creating new tags by typing a value not in availableTags. */
  allowCreate?: boolean;
  placeholder?: string;
  className?: string;
}

export function TagPicker({
  availableTags,
  selectedTags,
  onChange,
  allowCreate = true,
  placeholder = "Add tag…",
  className,
}: TagPickerProps) {
  const [inputValue, setInputValue] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = availableTags.filter(
    (t) =>
      !selectedTags.includes(t) &&
      t.toLowerCase().includes(inputValue.toLowerCase()),
  );

  const addTag = useCallback(
    (tag: string) => {
      const trimmed = tag.trim();
      if (!trimmed || selectedTags.includes(trimmed)) return;
      onChange([...selectedTags, trimmed]);
      setInputValue("");
      setOpen(false);
    },
    [selectedTags, onChange],
  );

  const removeTag = useCallback(
    (tag: string) => {
      onChange(selectedTags.filter((t) => t !== tag));
    },
    [selectedTags, onChange],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && inputValue.trim()) {
        e.preventDefault();
        const first = filtered[0];
        if (first !== undefined) {
          addTag(first);
        } else if (allowCreate) {
          addTag(inputValue);
        }
      } else if (e.key === "Escape") {
        setOpen(false);
        setInputValue("");
      } else if (
        e.key === "Backspace" &&
        inputValue === "" &&
        selectedTags.length > 0
      ) {
        const last = selectedTags[selectedTags.length - 1];
        if (last !== undefined) removeTag(last);
      }
    },
    [inputValue, filtered, allowCreate, addTag, removeTag, selectedTags],
  );

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const showDropdown =
    open && (filtered.length > 0 || (allowCreate && inputValue.trim()));

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div className="flex flex-wrap gap-1 min-h-[36px] w-full rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-2 py-1 text-sm">
        {selectedTags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-0.5 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 rounded-full px-2 py-0.5 text-xs"
          >
            <Hash size={10} />
            {tag}
            <button
              onClick={() => removeTag(tag)}
              className="ml-0.5 hover:text-violet-900 dark:hover:text-violet-100"
              aria-label={`Remove tag ${tag}`}
            >
              <X size={10} />
            </button>
          </span>
        ))}
        <input
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={selectedTags.length === 0 ? placeholder : ""}
          className="flex-1 min-w-[80px] bg-transparent outline-none placeholder:text-gray-400 text-gray-900 dark:text-gray-50"
        />
        <button
          onClick={() => setOpen((v) => !v)}
          className="ml-auto self-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          tabIndex={-1}
          aria-label="Toggle tag list"
        >
          <ChevronDown size={14} />
        </button>
      </div>

      {showDropdown && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg max-h-48 overflow-y-auto">
          {filtered.map((tag) => (
            <button
              key={tag}
              onClick={() => addTag(tag)}
              className="flex items-center gap-1.5 w-full text-left px-3 py-1.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <Hash size={12} className="text-gray-400" />
              {tag}
            </button>
          ))}
          {allowCreate && inputValue.trim() && !availableTags.includes(inputValue.trim()) && (
            <button
              onClick={() => addTag(inputValue)}
              className="flex items-center gap-1.5 w-full text-left px-3 py-1.5 text-sm text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20"
            >
              <Hash size={12} />
              Create &ldquo;{inputValue.trim()}&rdquo;
            </button>
          )}
        </div>
      )}
    </div>
  );
}
