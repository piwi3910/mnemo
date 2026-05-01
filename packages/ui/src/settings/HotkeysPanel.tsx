import * as React from "react";
import { Button } from "../primitives/button";

export interface HotkeyBinding {
  id: string;
  label: string;
  binding: string;
  defaultBinding: string;
}

export interface HotkeysPanelProps {
  bindings: HotkeyBinding[];
  onResetAll?: () => void;
  onResetOne?: (id: string) => void;
}

export function HotkeysPanel({
  bindings,
  onResetAll,
  onResetOne,
}: HotkeysPanelProps) {
  const hasCustomBindings = bindings.some((b) => b.binding !== b.defaultBinding);

  return (
    <div className="space-y-8 max-w-lg">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50">Hotkeys</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Keyboard shortcuts. Re-binding will be available in a future release.
          </p>
        </div>
        {onResetAll && hasCustomBindings && (
          <Button variant="outline" size="sm" onClick={onResetAll}>
            Reset all
          </Button>
        )}
      </div>

      <section>
        <table className="w-full text-sm" aria-label="Hotkey bindings">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="pb-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 pr-4">
                Action
              </th>
              <th className="pb-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                Shortcut
              </th>
              {onResetOne && (
                <th className="pb-2 w-16" />
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {bindings.map((binding) => {
              const isCustom = binding.binding !== binding.defaultBinding;
              return (
                <tr key={binding.id}>
                  <td className="py-2.5 pr-4 text-gray-700 dark:text-gray-300">
                    {binding.label}
                  </td>
                  <td className="py-2.5">
                    <kbd
                      className={`inline-flex items-center rounded border px-2 py-0.5 text-xs font-mono ${
                        isCustom
                          ? "border-violet-300 bg-violet-50 text-violet-700 dark:border-violet-700 dark:bg-violet-900/30 dark:text-violet-300"
                          : "border-gray-200 bg-gray-50 text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                      }`}
                    >
                      {binding.binding}
                    </kbd>
                  </td>
                  {onResetOne && (
                    <td className="py-2.5 text-right">
                      {isCustom && (
                        <button
                          onClick={() => onResetOne(binding.id)}
                          className="text-xs text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                          aria-label={`Reset ${binding.label} to default`}
                        >
                          Reset
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </div>
  );
}
