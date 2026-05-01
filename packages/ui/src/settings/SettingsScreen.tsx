import * as React from "react";
import { cn } from "../lib/utils";

export interface SettingsPanel {
  id: string;
  label: string;
  element: React.ReactElement;
}

export interface SettingsScreenProps {
  panels: SettingsPanel[];
  defaultPanelId?: string;
  className?: string;
}

export function SettingsScreen({
  panels,
  defaultPanelId,
  className,
}: SettingsScreenProps) {
  const [activePanelId, setActivePanelId] = React.useState<string>(
    defaultPanelId ?? panels[0]?.id ?? "",
  );

  const activePanel = panels.find((p) => p.id === activePanelId);

  return (
    <div
      className={cn(
        "flex h-full min-h-0 w-full overflow-hidden bg-white dark:bg-gray-950",
        className,
      )}
    >
      {/* Sidebar nav */}
      <nav
        className="flex w-52 shrink-0 flex-col gap-0.5 border-r border-gray-200 p-3 dark:border-gray-800"
        aria-label="Settings navigation"
      >
        {panels.map((panel) => (
          <button
            key={panel.id}
            onClick={() => setActivePanelId(panel.id)}
            aria-current={activePanelId === panel.id ? "page" : undefined}
            className={cn(
              "w-full rounded-md px-3 py-2 text-left text-sm transition-colors",
              activePanelId === panel.id
                ? "bg-violet-100 text-violet-700 font-medium dark:bg-violet-900/40 dark:text-violet-300"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-50",
            )}
          >
            {panel.label}
          </button>
        ))}
      </nav>

      {/* Main content */}
      <main className="min-w-0 flex-1 overflow-y-auto p-6">
        {activePanel ? activePanel.element : null}
      </main>
    </div>
  );
}
