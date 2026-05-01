import * as React from "react";
import { Copy, Check, Trash2, AlertTriangle, Plus } from "lucide-react";
import { Button } from "../primitives/button";
import { Input } from "../primitives/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../primitives/select";

export type ApiKeyScope = "read-only" | "read-write";
export type ApiKeyExpiry = "30d" | "90d" | "1y" | "never";

export interface ApiKeyInfo {
  id: string;
  name: string;
  keyPrefix: string;
  scope: ApiKeyScope;
  lastUsedAt?: string | null;
  expiresAt?: string | null;
}

export interface NewApiKeyResult {
  id: string;
  key: string;
}

export interface ApiKeysPanelProps {
  keys: ApiKeyInfo[];
  newKeyResult?: NewApiKeyResult | null;
  onDismissNewKey?: () => void;
  onMint?: (name: string, scope: ApiKeyScope, expiry: ApiKeyExpiry) => void;
  onRevoke?: (id: string) => void;
  isLoading?: boolean;
  error?: string | null;
}

function formatRelativeTime(dateStr: string | null | undefined): string {
  if (!dateStr) return "Never";
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function formatExpiry(dateStr: string | null | undefined): string {
  if (!dateStr) return "Never";
  const d = new Date(dateStr);
  if (d < new Date()) return "Expired";
  return d.toLocaleDateString();
}

export function ApiKeysPanel({
  keys,
  newKeyResult,
  onDismissNewKey,
  onMint,
  onRevoke,
  isLoading = false,
  error,
}: ApiKeysPanelProps) {
  const [name, setName] = React.useState("");
  const [scope, setScope] = React.useState<ApiKeyScope>("read-only");
  const [expiry, setExpiry] = React.useState<ApiKeyExpiry>("never");
  const [confirmRevokeId, setConfirmRevokeId] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);
  const [nameError, setNameError] = React.useState("");

  const handleCopy = async () => {
    if (!newKeyResult) return;
    try {
      await navigator.clipboard.writeText(newKeyResult.key);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleMint = () => {
    if (!name.trim()) {
      setNameError("Name is required");
      return;
    }
    setNameError("");
    onMint?.(name.trim(), scope, expiry);
    setName("");
    setScope("read-only");
    setExpiry("never");
  };

  return (
    <div className="space-y-8 max-w-lg">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50">API Keys</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Manage API keys for programmatic access.
        </p>
      </div>

      {/* New key banner */}
      {newKeyResult && (
        <div className="rounded-lg border border-yellow-400/50 bg-yellow-50 p-4 space-y-2 dark:bg-yellow-900/20 dark:border-yellow-500/30">
          <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-400 text-sm font-medium">
            <AlertTriangle className="h-4 w-4" />
            Copy your API key now — it won&apos;t be shown again
          </div>
          <div className="flex items-center gap-2">
            <code className="flex-1 rounded border border-gray-200 bg-white px-3 py-2 text-xs font-mono text-gray-800 truncate dark:bg-gray-900 dark:border-gray-700 dark:text-gray-200">
              {newKeyResult.key}
            </code>
            <button
              onClick={handleCopy}
              className="shrink-0 rounded-md border border-gray-200 p-2 text-gray-500 hover:text-gray-900 transition-colors dark:border-gray-700 dark:hover:text-gray-50"
              aria-label="Copy API key"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </button>
          </div>
          {onDismissNewKey && (
            <button
              onClick={onDismissNewKey}
              className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              Dismiss
            </button>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Key list */}
      <section className="space-y-2">
        {isLoading ? (
          <p className="py-8 text-center text-sm text-gray-500">Loading API keys…</p>
        ) : keys.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-500">No API keys yet.</p>
        ) : (
          keys.map((key) => (
            <div
              key={key.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 px-3 py-2.5 dark:border-gray-700"
            >
              <div className="min-w-0 flex-1 space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-50 truncate">
                    {key.name}
                  </span>
                  <span
                    className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium ${
                      key.scope === "read-write"
                        ? "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300"
                        : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                    }`}
                  >
                    {key.scope}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  <span className="font-mono">{key.keyPrefix}…</span>
                  <span>Used: {formatRelativeTime(key.lastUsedAt)}</span>
                  <span>Expires: {formatExpiry(key.expiresAt)}</span>
                </div>
              </div>
              {onRevoke && (
                confirmRevokeId === key.id ? (
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => {
                        onRevoke(key.id);
                        setConfirmRevokeId(null);
                      }}
                      className="rounded bg-red-100 px-2 py-1 text-xs text-red-600 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400"
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => setConfirmRevokeId(null)}
                      className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmRevokeId(key.id)}
                    className="shrink-0 p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                    aria-label={`Revoke ${key.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )
              )}
            </div>
          ))
        )}
      </section>

      {/* Mint form */}
      {onMint && (
        <section className="space-y-3 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            <Plus className="h-4 w-4 text-violet-600" />
            Create new API key
          </div>

          <div className="space-y-1">
            <Input
              placeholder="Key name (e.g. My MCP Client)"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setNameError("");
              }}
              onKeyDown={(e) => { if (e.key === "Enter") handleMint(); }}
              aria-label="API key name"
            />
            {nameError && <p className="text-xs text-red-500">{nameError}</p>}
          </div>

          <div className="flex gap-3">
            <div className="flex-1 space-y-1">
              <label className="text-xs text-gray-500 dark:text-gray-400">Scope</label>
              <Select value={scope} onValueChange={(v) => setScope(v as ApiKeyScope)}>
                <SelectTrigger aria-label="API key scope">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="read-only">Read only</SelectItem>
                  <SelectItem value="read-write">Read + Write</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 space-y-1">
              <label className="text-xs text-gray-500 dark:text-gray-400">Expires</label>
              <Select value={expiry} onValueChange={(v) => setExpiry(v as ApiKeyExpiry)}>
                <SelectTrigger aria-label="API key expiry">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="never">Never</SelectItem>
                  <SelectItem value="30d">30 days</SelectItem>
                  <SelectItem value="90d">90 days</SelectItem>
                  <SelectItem value="1y">1 year</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button onClick={handleMint} className="w-full" size="sm">
            Create API Key
          </Button>
        </section>
      )}
    </div>
  );
}
