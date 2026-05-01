import * as React from "react";
import { X } from "lucide-react";
import { Button } from "../primitives/button";
import { Input } from "../primitives/input";

export interface AllowedOriginsEditorProps {
  origins: string[];
  onAdd?: (origin: string) => void;
  onRemove?: (origin: string) => void;
}

export function AllowedOriginsEditor({
  origins,
  onAdd,
  onRemove,
}: AllowedOriginsEditorProps) {
  const [input, setInput] = React.useState("");
  const [error, setError] = React.useState("");

  const handleAdd = () => {
    const value = input.trim();
    if (!value) return;
    try {
      new URL(value);
    } catch {
      setError("Enter a valid URL origin (e.g. https://example.com)");
      return;
    }
    setError("");
    onAdd?.(value);
    setInput("");
  };

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        {origins.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 py-2">No allowed origins.</p>
        ) : (
          <ul className="space-y-1" aria-label="Allowed origins">
            {origins.map((origin) => (
              <li
                key={origin}
                className="flex items-center justify-between gap-2 rounded-md border border-gray-200 px-3 py-2 dark:border-gray-700"
              >
                <span className="text-sm font-mono text-gray-800 dark:text-gray-200 break-all">
                  {origin}
                </span>
                {onRemove && (
                  <button
                    onClick={() => onRemove(origin)}
                    aria-label={`Remove ${origin}`}
                    className="shrink-0 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {onAdd && (
        <div className="flex gap-2 items-start">
          <div className="flex-1 space-y-1">
            <Input
              type="url"
              placeholder="https://example.com"
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                setError("");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAdd();
              }}
              aria-label="New allowed origin"
            />
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>
          <Button size="sm" onClick={handleAdd} disabled={!input.trim()}>
            Add
          </Button>
        </div>
      )}
    </div>
  );
}
