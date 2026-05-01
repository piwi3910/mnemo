import * as React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../primitives/select";
import { Slider } from "../primitives/slider";

export type ThemeOption = "light" | "dark" | "system";

export interface AppearancePanelProps {
  theme: ThemeOption;
  onThemeChange?: (theme: ThemeOption) => void;
  fontSize: number;
  onFontSizeChange?: (size: number) => void;
}

export function AppearancePanel({
  theme,
  onThemeChange,
  fontSize,
  onFontSizeChange,
}: AppearancePanelProps) {
  return (
    <div className="space-y-8 max-w-lg">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50">Appearance</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Customize how Kryton looks.
        </p>
      </div>

      {/* Theme */}
      <section className="space-y-3">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Theme</h3>
        <Select
          value={theme}
          onValueChange={(v) => onThemeChange?.(v as ThemeOption)}
          disabled={!onThemeChange}
        >
          <SelectTrigger className="w-48" aria-label="Theme">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="light">Light</SelectItem>
            <SelectItem value="dark">Dark</SelectItem>
            <SelectItem value="system">System</SelectItem>
          </SelectContent>
        </Select>
      </section>

      {/* Font size */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Font size</h3>
          <span className="text-sm text-gray-500 dark:text-gray-400">{fontSize}px</span>
        </div>
        <Slider
          min={12}
          max={24}
          step={1}
          value={[fontSize]}
          onValueChange={(v) => { if (v[0] !== undefined) onFontSizeChange?.(v[0]); }}
          disabled={!onFontSizeChange}
          aria-label="Font size"
          className="w-full max-w-xs"
        />
        <div className="flex justify-between text-xs text-gray-400 max-w-xs">
          <span>12px</span>
          <span>24px</span>
        </div>
      </section>
    </div>
  );
}
