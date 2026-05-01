import * as React from "react";
import { Copy, Check, Trash2, Plus, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "../primitives/button";
import { Input } from "../primitives/input";
import { Textarea } from "../primitives/textarea";

export interface AgentToken {
  id: string;
  tokenPrefix: string;
  createdAt?: string | null;
  lastUsedAt?: string | null;
}

export interface AgentInfo {
  id: string;
  name: string;
  label?: string;
  lastSeenAt?: string | null;
  tokens: AgentToken[];
}

export interface NewTokenResult {
  agentId: string;
  tokenId: string;
  token: string;
}

export interface AgentsPanelProps {
  agents: AgentInfo[];
  newTokenResult?: NewTokenResult | null;
  onDismissNewToken?: () => void;
  onCreateAgent?: (name: string, label: string, cedarPolicy: string) => void;
  onDeleteAgent?: (id: string) => void;
  onMintToken?: (agentId: string) => void;
  onRevokeToken?: (agentId: string, tokenId: string) => void;
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
  return `${days}d ago`;
}

export function AgentsPanel({
  agents,
  newTokenResult,
  onDismissNewToken,
  onCreateAgent,
  onDeleteAgent,
  onMintToken,
  onRevokeToken,
}: AgentsPanelProps) {
  const [expandedAgentId, setExpandedAgentId] = React.useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = React.useState<string | null>(null);
  const [confirmRevokeKey, setConfirmRevokeKey] = React.useState<string | null>(null);
  const [newTokenCopied, setNewTokenCopied] = React.useState(false);

  // Create form state
  const [showCreateForm, setShowCreateForm] = React.useState(false);
  const [createName, setCreateName] = React.useState("");
  const [createLabel, setCreateLabel] = React.useState("");
  const [createPolicy, setCreatePolicy] = React.useState("");
  const [createError, setCreateError] = React.useState("");

  const handleCopyToken = async () => {
    if (!newTokenResult) return;
    try {
      await navigator.clipboard.writeText(newTokenResult.token);
      setNewTokenCopied(true);
      setTimeout(() => setNewTokenCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleCreate = () => {
    if (!createName.trim()) {
      setCreateError("Name is required");
      return;
    }
    setCreateError("");
    onCreateAgent?.(createName.trim(), createLabel.trim(), createPolicy.trim());
    setCreateName("");
    setCreateLabel("");
    setCreatePolicy("");
    setShowCreateForm(false);
  };

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50">Agents</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Manage automation agents and their access tokens.
        </p>
      </div>

      {/* New token banner */}
      {newTokenResult && (
        <div className="rounded-lg border border-yellow-400/50 bg-yellow-50 p-4 space-y-2 dark:bg-yellow-900/20 dark:border-yellow-500/30">
          <p className="text-sm font-medium text-yellow-700 dark:text-yellow-400">
            Copy the agent token now — it won&apos;t be shown again
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 rounded border border-gray-200 bg-white px-3 py-2 text-xs font-mono text-gray-800 truncate dark:bg-gray-900 dark:border-gray-700 dark:text-gray-200">
              {newTokenResult.token}
            </code>
            <button
              onClick={handleCopyToken}
              className="shrink-0 rounded-md border border-gray-200 p-2 text-gray-500 hover:text-gray-900 transition-colors dark:border-gray-700 dark:hover:text-gray-50"
              aria-label="Copy agent token"
            >
              {newTokenCopied ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </button>
          </div>
          {onDismissNewToken && (
            <button
              onClick={onDismissNewToken}
              className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              Dismiss
            </button>
          )}
        </div>
      )}

      {/* Agent list */}
      <section className="space-y-2">
        {agents.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-500">No agents yet.</p>
        ) : (
          agents.map((agent) => {
            const isExpanded = expandedAgentId === agent.id;
            return (
              <div
                key={agent.id}
                className="rounded-lg border border-gray-200 dark:border-gray-700"
              >
                {/* Agent header row */}
                <div className="flex items-center gap-3 px-4 py-3">
                  <button
                    onClick={() => setExpandedAgentId(isExpanded ? null : agent.id)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                    aria-label={isExpanded ? "Collapse agent" : "Expand agent"}
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </button>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-50">
                        {agent.name}
                      </span>
                      {agent.label && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {agent.label}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400">
                      Last seen: {formatRelativeTime(agent.lastSeenAt)} &middot;{" "}
                      {agent.tokens.length} token{agent.tokens.length !== 1 ? "s" : ""}
                    </p>
                  </div>

                  {onDeleteAgent && (
                    confirmDeleteId === agent.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            onDeleteAgent(agent.id);
                            setConfirmDeleteId(null);
                          }}
                          className="rounded bg-red-100 px-2 py-1 text-xs text-red-600 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400"
                        >
                          Confirm delete
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="px-2 py-1 text-xs text-gray-500"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDeleteId(agent.id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                        aria-label={`Delete agent ${agent.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )
                  )}
                </div>

                {/* Expanded: token list */}
                {isExpanded && (
                  <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-3 space-y-3">
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
                      Tokens
                    </p>
                    {agent.tokens.length === 0 ? (
                      <p className="text-xs text-gray-400">No tokens yet.</p>
                    ) : (
                      <ul className="space-y-1">
                        {agent.tokens.map((tok) => {
                          const revokeKey = `${agent.id}:${tok.id}`;
                          return (
                            <li
                              key={tok.id}
                              className="flex items-center justify-between gap-3 rounded border border-gray-200 px-3 py-2 dark:border-gray-700"
                            >
                              <div className="text-xs space-y-0.5">
                                <span className="font-mono text-gray-700 dark:text-gray-300">
                                  {tok.tokenPrefix}…
                                </span>
                                <div className="text-gray-400">
                                  Used: {formatRelativeTime(tok.lastUsedAt)}
                                </div>
                              </div>
                              {onRevokeToken && (
                                confirmRevokeKey === revokeKey ? (
                                  <div className="flex items-center gap-1">
                                    <button
                                      onClick={() => {
                                        onRevokeToken(agent.id, tok.id);
                                        setConfirmRevokeKey(null);
                                      }}
                                      className="rounded bg-red-100 px-2 py-1 text-xs text-red-600 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400"
                                    >
                                      Revoke
                                    </button>
                                    <button
                                      onClick={() => setConfirmRevokeKey(null)}
                                      className="px-2 py-1 text-xs text-gray-500"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => setConfirmRevokeKey(revokeKey)}
                                    className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                                    aria-label="Revoke token"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                )
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    )}

                    {onMintToken && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onMintToken(agent.id)}
                        className="w-full"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Mint token
                      </Button>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </section>

      {/* Create agent */}
      {onCreateAgent && (
        <section>
          {!showCreateForm ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCreateForm(true)}
            >
              <Plus className="h-4 w-4" />
              Create agent
            </Button>
          ) : (
            <div className="rounded-lg border border-gray-200 p-4 space-y-3 dark:border-gray-700">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                New agent
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-gray-500">Name</label>
                  <Input
                    placeholder="my-agent"
                    value={createName}
                    onChange={(e) => {
                      setCreateName(e.target.value);
                      setCreateError("");
                    }}
                    aria-label="Agent name"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-gray-500">Label</label>
                  <Input
                    placeholder="My Agent"
                    value={createLabel}
                    onChange={(e) => setCreateLabel(e.target.value)}
                    aria-label="Agent label"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-gray-500">Cedar policy</label>
                <Textarea
                  placeholder={`permit(\n  principal == Agent::"my-agent",\n  action,\n  resource\n);`}
                  value={createPolicy}
                  onChange={(e) => setCreatePolicy(e.target.value)}
                  rows={5}
                  className="font-mono text-xs"
                  aria-label="Cedar policy"
                />
              </div>

              {createError && (
                <p className="text-xs text-red-500">{createError}</p>
              )}

              <div className="flex gap-2">
                <Button size="sm" onClick={handleCreate}>
                  Create
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setShowCreateForm(false);
                    setCreateError("");
                  }}
                >
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
