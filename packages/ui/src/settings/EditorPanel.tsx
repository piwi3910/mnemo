import * as React from "react";
import { Switch } from "../primitives/switch";
import { Slider } from "../primitives/slider";

export interface EditorPanelProps {
  vimMode: boolean;
  onVimModeChange?: (enabled: boolean) => void;
  lineWrapping: boolean;
  onLineWrappingChange?: (enabled: boolean) => void;
  debounceMs: number;
  onDebounceMsChange?: (ms: number) => void;
}

export function EditorPanel({
  vimMode,
  onVimModeChange,
  lineWrapping,
  onLineWrappingChange,
  debounceMs,
  onDebounceMsChange,
}: EditorPanelProps) {
  return (
    <div className="space-y-8 max-w-lg">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50">Editor</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Configure the editor behaviour.
        </p>
      </div>

      {/* Toggle rows */}
      <section className="space-y-4">
        <ToggleRow
          label="Vim mode"
          description="Enable vim keybindings in the editor."
          checked={vimMode}
          onCheckedChange={onVimModeChange}
          id="vim-mode"
        />
        <ToggleRow
          label="Line wrapping"
          description="Wrap long lines instead of scrolling horizontally."
          checked={lineWrapping}
          onCheckedChange={onLineWrappingChange}
          id="line-wrapping"
        />
      </section>

      {/* Debounce */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Save debounce</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Delay before auto-saving changes.
            </p>
          </div>
          <span className="text-sm text-gray-500 dark:text-gray-400">{debounceMs}ms</span>
        </div>
        <Slider
          min={100}
          max={5000}
          step={100}
          value={[debounceMs]}
          onValueChange={(v) => { if (v[0] !== undefined) onDebounceMsChange?.(v[0]); }}
          disabled={!onDebounceMsChange}
          aria-label="Save debounce milliseconds"
          className="w-full max-w-xs"
        />
        <div className="flex justify-between text-xs text-gray-400 max-w-xs">
          <span>100ms</span>
          <span>5000ms</span>
        </div>
      </section>
    </div>
  );
}

interface ToggleRowProps {
  label: string;
  description?: string;
  checked: boolean;
  onCheckedChange?: (checked: boolean) => void;
  id: string;
}

function ToggleRow({ label, description, checked, onCheckedChange, id }: ToggleRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
      <div className="space-y-0.5">
        <label htmlFor={id} className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
          {label}
        </label>
        {description && (
          <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>
        )}
      </div>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={!onCheckedChange}
      />
    </div>
  );
}
