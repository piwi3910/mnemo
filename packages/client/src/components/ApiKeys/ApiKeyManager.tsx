import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Copy, Check, AlertTriangle } from 'lucide-react';
import { apiKeyApi, ApiKeyInfo, CreateApiKeyResponse } from '../../lib/api';

function formatRelativeTime(dateStr: string | null): string {
  if (!dateStr) return 'Never';
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function formatExpiry(dateStr: string | null): string {
  if (!dateStr) return 'Never';
  const d = new Date(dateStr);
  const now = new Date();
  if (d < now) return 'Expired';
  return d.toLocaleDateString();
}

type ExpiryOption = '30d' | '90d' | '1y' | 'never';

export function ApiKeyManager() {
  const [keys, setKeys] = useState<ApiKeyInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Create form state
  const [name, setName] = useState('');
  const [scope, setScope] = useState<'read-only' | 'read-write'>('read-only');
  const [expiry, setExpiry] = useState<ExpiryOption>('never');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  // New key display state
  const [newKey, setNewKey] = useState<CreateApiKeyResponse | null>(null);
  const [copied, setCopied] = useState(false);

  // Revoke state
  const [confirmRevokeId, setConfirmRevokeId] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const fetchKeys = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await apiKeyApi.list();
      setKeys(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load API keys');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchKeys();
  }, [fetchKeys]);

  const handleCreate = async () => {
    if (!name.trim()) {
      setCreateError('Name is required');
      return;
    }
    setCreating(true);
    setCreateError('');
    try {
      let expiresAt: string | undefined;
      if (expiry !== 'never') {
        const d = new Date();
        if (expiry === '30d') d.setDate(d.getDate() + 30);
        else if (expiry === '90d') d.setDate(d.getDate() + 90);
        else if (expiry === '1y') d.setFullYear(d.getFullYear() + 1);
        expiresAt = d.toISOString();
      }
      const result = await apiKeyApi.create({ name: name.trim(), scope, expiresAt });
      setNewKey(result);
      setName('');
      setScope('read-only');
      setExpiry('never');
      await fetchKeys();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Failed to create API key');
    } finally {
      setCreating(false);
    }
  };

  const handleCopy = async () => {
    if (!newKey) return;
    try {
      await navigator.clipboard.writeText(newKey.key);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: ignore clipboard errors
    }
  };

  const handleRevoke = async (id: string) => {
    setRevokingId(id);
    setError('');
    try {
      await apiKeyApi.revoke(id);
      setConfirmRevokeId(null);
      if (newKey?.id === id) setNewKey(null);
      await fetchKeys();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to revoke API key');
    } finally {
      setRevokingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* New key banner */}
      {newKey && (
        <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/30 p-4 space-y-2">
          <div className="flex items-center gap-2 text-yellow-400 text-sm font-medium">
            <AlertTriangle size={15} />
            Copy your API key now — it won't be shown again
          </div>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-surface-950 rounded px-3 py-2 text-xs text-gray-200 font-mono truncate border border-gray-700/50">
              {newKey.key}
            </code>
            <button
              onClick={handleCopy}
              className="p-2 rounded-lg bg-surface-800 border border-gray-700/50 text-gray-400 hover:text-gray-200 transition-colors"
              aria-label="Copy API key"
            >
              {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
            </button>
          </div>
          <button
            onClick={() => setNewKey(null)}
            className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/30 px-3 py-2 text-xs text-red-400">
          {error}
        </div>
      )}

      {/* Key list */}
      <div className="space-y-2">
        {loading ? (
          <div className="text-center py-8 text-gray-500 text-sm">Loading API keys...</div>
        ) : keys.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">No API keys yet.</div>
        ) : (
          keys.map(key => (
            <div
              key={key.id}
              className="flex items-center justify-between rounded-lg bg-surface-800 border border-gray-700/50 px-3 py-2.5 gap-3"
            >
              <div className="min-w-0 flex-1 space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-200 font-medium truncate">{key.name}</span>
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                    key.scope === 'read-write'
                      ? 'bg-violet-500/20 text-violet-300'
                      : 'bg-gray-700/60 text-gray-400'
                  }`}>
                    {key.scope}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span className="font-mono">{key.keyPrefix}…</span>
                  <span>Used: {formatRelativeTime(key.lastUsedAt)}</span>
                  <span>Expires: {formatExpiry(key.expiresAt)}</span>
                </div>
              </div>
              {confirmRevokeId === key.id ? (
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleRevoke(key.id)}
                    disabled={revokingId === key.id}
                    className="text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded bg-red-500/10 disabled:opacity-50"
                  >
                    {revokingId === key.id ? '...' : 'Confirm'}
                  </button>
                  <button
                    onClick={() => setConfirmRevokeId(null)}
                    className="text-xs text-gray-400 hover:text-gray-200 px-2 py-1"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmRevokeId(key.id)}
                  className="shrink-0 p-1.5 text-gray-500 hover:text-red-400 transition-colors"
                  aria-label="Revoke API key"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Create form */}
      <div className="rounded-lg bg-surface-800 border border-gray-700/50 p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm text-gray-300 font-medium">
          <Plus size={15} className="text-violet-400" />
          Create new API key
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1">Name</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. My MCP Client"
            className="w-full bg-surface-900 border border-gray-700/50 rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
            onKeyDown={e => { if (e.key === 'Enter') handleCreate(); }}
          />
        </div>

        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-xs text-gray-400 mb-1">Scope</label>
            <select
              value={scope}
              onChange={e => setScope(e.target.value as 'read-only' | 'read-write')}
              className="w-full bg-surface-900 border border-gray-700/50 rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
            >
              <option value="read-only">Read only</option>
              <option value="read-write">Read + Write</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-xs text-gray-400 mb-1">Expires</label>
            <select
              value={expiry}
              onChange={e => setExpiry(e.target.value as ExpiryOption)}
              className="w-full bg-surface-900 border border-gray-700/50 rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
            >
              <option value="never">Never</option>
              <option value="30d">30 days</option>
              <option value="90d">90 days</option>
              <option value="1y">1 year</option>
            </select>
          </div>
        </div>

        {createError && (
          <div className="text-red-400 text-xs">{createError}</div>
        )}

        <button
          onClick={handleCreate}
          disabled={creating}
          className="w-full bg-violet-500 text-white rounded-lg py-2 text-sm font-medium hover:bg-violet-600 transition-colors disabled:opacity-50"
        >
          {creating ? 'Creating...' : 'Create API Key'}
        </button>
      </div>
    </div>
  );
}
