import * as React from "react";
import { Switch } from "../primitives/switch";
import { Button } from "../primitives/button";

export interface PrivacyPanelProps {
  telemetryEnabled: boolean;
  onTelemetryChange?: (enabled: boolean) => void;
  crashReportsEnabled: boolean;
  onCrashReportsChange?: (enabled: boolean) => void;
  dataDir?: string;
  onExportData?: () => void;
  onClearData?: () => void;
}

export function PrivacyPanel({
  telemetryEnabled,
  onTelemetryChange,
  crashReportsEnabled,
  onCrashReportsChange,
  dataDir,
  onExportData,
  onClearData,
}: PrivacyPanelProps) {
  return (
    <div className="space-y-8 max-w-lg">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50">Privacy</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Control data collection and local data management.
        </p>
      </div>

      {/* Toggles */}
      <section className="space-y-2">
        <ToggleRow
          id="telemetry"
          label="Usage telemetry"
          description="Send anonymous usage statistics to help improve Kryton."
          checked={telemetryEnabled}
          onCheckedChange={onTelemetryChange}
        />
        <ToggleRow
          id="crash-reports"
          label="Crash reports"
          description="Automatically send crash reports when the app encounters an error."
          checked={crashReportsEnabled}
          onCheckedChange={onCrashReportsChange}
        />
      </section>

      {/* Data dir */}
      {dataDir && (
        <section className="space-y-2">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Data directory</h3>
          <code className="block rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-mono text-gray-700 break-all dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300">
            {dataDir}
          </code>
        </section>
      )}

      {/* Actions */}
      {(onExportData || onClearData) && (
        <section className="flex gap-3 pt-2 border-t border-gray-200 dark:border-gray-700">
          {onExportData && (
            <Button variant="outline" size="sm" onClick={onExportData}>
              Export data
            </Button>
          )}
          {onClearData && (
            <Button variant="destructive" size="sm" onClick={onClearData}>
              Clear data
            </Button>
          )}
        </section>
      )}
    </div>
  );
}

interface ToggleRowProps {
  id: string;
  label: string;
  description?: string;
  checked: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

function ToggleRow({ id, label, description, checked, onCheckedChange }: ToggleRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
      <div className="space-y-0.5">
        <label
          htmlFor={id}
          className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer"
        >
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
