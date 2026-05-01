import * as React from "react";
import { Switch } from "../primitives/switch";
import { Button } from "../primitives/button";
import { Input } from "../primitives/input";
import { AllowedOriginsEditor } from "./AllowedOriginsEditor";

export interface PluginInfo {
  id: string;
  name: string;
  version?: string;
  description?: string;
  enabled: boolean;
  allowedOrigins?: string[];
}

export interface PluginsPanelProps {
  plugins: PluginInfo[];
  onToggle?: (id: string, enabled: boolean) => void;
  onInstall?: (url: string) => void;
  onAddOrigin?: (pluginId: string, origin: string) => void;
  onRemoveOrigin?: (pluginId: string, origin: string) => void;
}

export function PluginsPanel({
  plugins,
  onToggle,
  onInstall,
  onAddOrigin,
  onRemoveOrigin,
}: PluginsPanelProps) {
  const [installUrl, setInstallUrl] = React.useState("");
  const [expandedId, setExpandedId] = React.useState<string | null>(null);

  return (
    <div className="space-y-8 max-w-lg">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50">Plugins</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Manage installed plugins and their permissions.
        </p>
      </div>

      {/* Installed plugins list */}
      <section className="space-y-2">
        {plugins.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center">
            No plugins installed.
          </p>
        ) : (
          plugins.map((plugin) => (
            <div
              key={plugin.id}
              className="rounded-lg border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center justify-between gap-4 p-4">
                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-50">
                      {plugin.name}
                    </span>
                    {plugin.version && (
                      <span className="text-xs text-gray-400">v{plugin.version}</span>
                    )}
                  </div>
                  {plugin.description && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {plugin.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {(onAddOrigin || onRemoveOrigin) && (
                    <button
                      className="text-xs text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                      onClick={() =>
                        setExpandedId(expandedId === plugin.id ? null : plugin.id)
                      }
                      aria-expanded={expandedId === plugin.id}
                      aria-label={`${expandedId === plugin.id ? "Collapse" : "Expand"} ${plugin.name} settings`}
                    >
                      Origins
                    </button>
                  )}
                  <Switch
                    id={`plugin-${plugin.id}`}
                    checked={plugin.enabled}
                    onCheckedChange={(checked) => onToggle?.(plugin.id, checked)}
                    disabled={!onToggle}
                    aria-label={`${plugin.name} enabled`}
                  />
                </div>
              </div>

              {expandedId === plugin.id && (
                <div className="border-t border-gray-200 dark:border-gray-700 p-4 pt-3">
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                    Allowed asset origins
                  </p>
                  <AllowedOriginsEditor
                    origins={plugin.allowedOrigins ?? []}
                    onAdd={onAddOrigin ? (o) => onAddOrigin(plugin.id, o) : undefined}
                    onRemove={
                      onRemoveOrigin ? (o) => onRemoveOrigin(plugin.id, o) : undefined
                    }
                  />
                </div>
              )}
            </div>
          ))
        )}
      </section>

      {/* Install URL input */}
      {onInstall && (
        <section className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Install plugin
          </h3>
          <div className="flex gap-2">
            <Input
              type="url"
              placeholder="Plugin manifest URL"
              value={installUrl}
              onChange={(e) => setInstallUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && installUrl.trim()) {
                  onInstall(installUrl.trim());
                  setInstallUrl("");
                }
              }}
              aria-label="Plugin manifest URL"
              className="flex-1"
            />
            <Button
              size="sm"
              disabled={!installUrl.trim()}
              onClick={() => {
                if (installUrl.trim()) {
                  onInstall(installUrl.trim());
                  setInstallUrl("");
                }
              }}
            >
              Install
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}
