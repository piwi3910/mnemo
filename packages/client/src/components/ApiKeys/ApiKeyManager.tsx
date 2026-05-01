import { useState, useEffect, useCallback } from 'react';
import { ApiKeysPanel } from '@azrtydxb/ui';
import type { ApiKeyInfo as UiApiKeyInfo, ApiKeyScope, ApiKeyExpiry, NewApiKeyResult } from '@azrtydxb/ui';
import { apiKeyApi } from '../../lib/api';

/**
 * Thin wrapper around @azrtydxb/ui ApiKeysPanel.
 * Manages HTTP data-fetching; ui component handles all rendering.
 */
export function ApiKeyManager() {
  const [keys, setKeys] = useState<UiApiKeyInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newKeyResult, setNewKeyResult] = useState<NewApiKeyResult | null>(null);

  const fetchKeys = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiKeyApi.list();
      // Map to ui's ApiKeyInfo shape (field names are identical)
      setKeys(result.map(k => ({
        id: k.id,
        name: k.name,
        keyPrefix: k.keyPrefix,
        scope: k.scope as ApiKeyScope,
        lastUsedAt: k.lastUsedAt,
        expiresAt: k.expiresAt,
      })));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load API keys');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchKeys();
  }, [fetchKeys]);

  const handleMint = useCallback(async (
    name: string,
    scope: ApiKeyScope,
    expiry: ApiKeyExpiry,
  ) => {
    setError(null);
    try {
      let expiresAt: string | undefined;
      if (expiry !== 'never') {
        const d = new Date();
        if (expiry === '30d') d.setDate(d.getDate() + 30);
        else if (expiry === '90d') d.setDate(d.getDate() + 90);
        else if (expiry === '1y') d.setFullYear(d.getFullYear() + 1);
        expiresAt = d.toISOString();
      }
      const result = await apiKeyApi.create({ name, scope, expiresAt });
      setNewKeyResult({ id: result.id, key: result.key });
      await fetchKeys();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create API key');
    }
  }, [fetchKeys]);

  const handleRevoke = useCallback(async (id: string) => {
    setError(null);
    try {
      await apiKeyApi.revoke(id);
      if (newKeyResult?.id === id) setNewKeyResult(null);
      await fetchKeys();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to revoke API key');
    }
  }, [fetchKeys, newKeyResult]);

  return (
    <ApiKeysPanel
      keys={keys}
      isLoading={loading}
      error={error}
      newKeyResult={newKeyResult}
      onDismissNewKey={() => setNewKeyResult(null)}
      onMint={handleMint}
      onRevoke={handleRevoke}
    />
  );
}
