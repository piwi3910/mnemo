import * as React from "react";
import { Button } from "../primitives/button";
import { Input } from "../primitives/input";

export interface AdvancedPanelProps {
  dataDir?: string;
  onShowLogs?: () => void;
  onFactoryReset?: () => void;
}

export function AdvancedPanel({
  dataDir,
  onShowLogs,
  onFactoryReset,
}: AdvancedPanelProps) {
  const [resetStep, setResetStep] = React.useState<0 | 1 | 2>(0);
  const [resetConfirmText, setResetConfirmText] = React.useState("");
  const CONFIRM_PHRASE = "reset my account";

  const handleResetInitiate = () => setResetStep(1);
  const handleResetCancel = () => {
    setResetStep(0);
    setResetConfirmText("");
  };
  const handleResetConfirm = () => {
    if (resetStep === 1) {
      setResetStep(2);
      return;
    }
    if (resetStep === 2 && resetConfirmText === CONFIRM_PHRASE) {
      onFactoryReset?.();
      setResetStep(0);
      setResetConfirmText("");
    }
  };

  return (
    <div className="space-y-8 max-w-lg">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50">Advanced</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Developer tools and account management.
        </p>
      </div>

      {/* Data dir */}
      {dataDir && (
        <section className="space-y-2">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Data directory</h3>
          <code className="block rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-mono text-gray-700 break-all dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300">
            {dataDir}
          </code>
        </section>
      )}

      {/* Show logs */}
      {onShowLogs && (
        <section className="space-y-2">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Logs</h3>
          <Button variant="outline" size="sm" onClick={onShowLogs}>
            Show logs
          </Button>
        </section>
      )}

      {/* Factory reset */}
      {onFactoryReset && (
        <section className="space-y-3 rounded-lg border border-red-200 p-4 dark:border-red-800/50">
          <div>
            <h3 className="text-sm font-medium text-red-700 dark:text-red-400">
              Factory reset this account
            </h3>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              This permanently deletes all data associated with this account. This action cannot be undone.
            </p>
          </div>

          {resetStep === 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleResetInitiate}
            >
              Factory reset&hellip;
            </Button>
          )}

          {resetStep === 1 && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-red-700 dark:text-red-400">
                Are you sure? This cannot be undone.
              </p>
              <div className="flex gap-2">
                <Button variant="destructive" size="sm" onClick={handleResetConfirm}>
                  Yes, continue
                </Button>
                <Button variant="ghost" size="sm" onClick={handleResetCancel}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {resetStep === 2 && (
            <div className="space-y-3">
              <p className="text-sm text-red-700 dark:text-red-400">
                Type <strong>{CONFIRM_PHRASE}</strong> to confirm:
              </p>
              <Input
                value={resetConfirmText}
                onChange={(e) => setResetConfirmText(e.target.value)}
                placeholder={CONFIRM_PHRASE}
                aria-label="Confirm factory reset"
                className="border-red-300 dark:border-red-700"
              />
              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={resetConfirmText !== CONFIRM_PHRASE}
                  onClick={handleResetConfirm}
                >
                  Reset account
                </Button>
                <Button variant="ghost" size="sm" onClick={handleResetCancel}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
