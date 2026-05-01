import { describe, it, expect, vi, beforeAll } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";

// Radix Slider uses ResizeObserver which jsdom does not implement.
beforeAll(() => {
  if (typeof window.ResizeObserver === "undefined") {
    class ResizeObserverMock {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
    window.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver;
  }
});

import { SettingsScreen } from "../SettingsScreen";
import { AccountPanel } from "../AccountPanel";
import { AppearancePanel } from "../AppearancePanel";
import { EditorPanel } from "../EditorPanel";
import { SyncPanel } from "../SyncPanel";
import { NotificationsPanel } from "../NotificationsPanel";
import { AllowedOriginsEditor } from "../AllowedOriginsEditor";
import { PluginsPanel } from "../PluginsPanel";
import { ApiKeysPanel } from "../ApiKeysPanel";
import { AgentsPanel } from "../AgentsPanel";
import { PrivacyPanel } from "../PrivacyPanel";
import { HotkeysPanel } from "../HotkeysPanel";
import { AdvancedPanel } from "../AdvancedPanel";
import { DiagnosticsPanel } from "../DiagnosticsPanel";

// ---------------------------------------------------------------------------
// SettingsScreen
// ---------------------------------------------------------------------------
describe("SettingsScreen", () => {
  const panels = [
    { id: "account", label: "Account", element: <div>Account content</div> },
    { id: "appearance", label: "Appearance", element: <div>Appearance content</div> },
  ];

  it("renders sidebar nav items", () => {
    render(<SettingsScreen panels={panels} />);
    expect(screen.getByText("Account")).toBeInTheDocument();
    expect(screen.getByText("Appearance")).toBeInTheDocument();
  });

  it("shows first panel content by default", () => {
    render(<SettingsScreen panels={panels} />);
    expect(screen.getByText("Account content")).toBeInTheDocument();
  });

  it("switches panel when nav item is clicked", () => {
    render(<SettingsScreen panels={panels} />);
    fireEvent.click(screen.getByText("Appearance"));
    expect(screen.getByText("Appearance content")).toBeInTheDocument();
  });

  it("respects defaultPanelId", () => {
    render(<SettingsScreen panels={panels} defaultPanelId="appearance" />);
    expect(screen.getByText("Appearance content")).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// AccountPanel
// ---------------------------------------------------------------------------
describe("AccountPanel", () => {
  it("renders email and display name", () => {
    render(
      <AccountPanel email="user@example.com" displayName="Alice" />
    );
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("user@example.com")).toBeInTheDocument();
  });

  it("shows change-email form and calls callback", () => {
    const onChangeEmail = vi.fn();
    render(<AccountPanel email="user@example.com" onChangeEmail={onChangeEmail} />);
    fireEvent.change(screen.getByLabelText("New email address"), {
      target: { value: "new@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: /update email/i }));
    expect(onChangeEmail).toHaveBeenCalledWith("new@example.com");
  });

  it("calls onLogout when logout button clicked", () => {
    const onLogout = vi.fn();
    render(<AccountPanel email="user@example.com" onLogout={onLogout} />);
    fireEvent.click(screen.getByRole("button", { name: /log out/i }));
    expect(onLogout).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// AppearancePanel
// ---------------------------------------------------------------------------
describe("AppearancePanel", () => {
  it("renders theme and font size", () => {
    render(
      <AppearancePanel
        theme="dark"
        fontSize={16}
      />
    );
    expect(screen.getByText("Theme")).toBeInTheDocument();
    expect(screen.getByText("Font size")).toBeInTheDocument();
    expect(screen.getByText("16px")).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// EditorPanel
// ---------------------------------------------------------------------------
describe("EditorPanel", () => {
  it("renders toggles and debounce", () => {
    render(
      <EditorPanel
        vimMode={false}
        lineWrapping={true}
        debounceMs={500}
      />
    );
    expect(screen.getByText("Vim mode")).toBeInTheDocument();
    expect(screen.getByText("Line wrapping")).toBeInTheDocument();
    expect(screen.getByText("500ms")).toBeInTheDocument();
  });

  it("calls onVimModeChange when toggled", () => {
    const onVimModeChange = vi.fn();
    render(
      <EditorPanel
        vimMode={false}
        onVimModeChange={onVimModeChange}
        lineWrapping={false}
        debounceMs={300}
      />
    );
    const toggle = screen.getByRole("switch", { name: /vim mode/i });
    fireEvent.click(toggle);
    expect(onVimModeChange).toHaveBeenCalledWith(true);
  });
});

// ---------------------------------------------------------------------------
// SyncPanel
// ---------------------------------------------------------------------------
describe("SyncPanel", () => {
  it("renders last synced and server URL", () => {
    render(
      <SyncPanel
        lastSyncedAt={null}
        serverUrl="https://sync.example.com"
        onSyncNow={() => {}}
      />
    );
    expect(screen.getByText("Last synced")).toBeInTheDocument();
    expect(screen.getByText("Never")).toBeInTheDocument();
    expect(screen.getByText("https://sync.example.com")).toBeInTheDocument();
  });

  it("calls onSyncNow when button clicked", () => {
    const onSyncNow = vi.fn();
    render(<SyncPanel onSyncNow={onSyncNow} />);
    fireEvent.click(screen.getByRole("button", { name: /sync now/i }));
    expect(onSyncNow).toHaveBeenCalled();
  });

  it("disables sync button when isSyncing", () => {
    render(<SyncPanel onSyncNow={() => {}} isSyncing />);
    expect(screen.getByRole("button", { name: /sync now/i })).toBeDisabled();
  });
});

// ---------------------------------------------------------------------------
// NotificationsPanel
// ---------------------------------------------------------------------------
describe("NotificationsPanel", () => {
  const notifications = [
    { category: "sync-complete" as const, label: "Sync complete", enabled: true },
    { category: "share-invite" as const, label: "Share invite", enabled: false },
  ];

  it("renders notification categories", () => {
    render(<NotificationsPanel notifications={notifications} />);
    expect(screen.getByText("Sync complete")).toBeInTheDocument();
    expect(screen.getByText("Share invite")).toBeInTheDocument();
  });

  it("calls onToggle when switch is toggled", () => {
    const onToggle = vi.fn();
    render(<NotificationsPanel notifications={notifications} onToggle={onToggle} />);
    const toggle = screen.getByRole("switch", { name: /sync complete/i });
    fireEvent.click(toggle);
    expect(onToggle).toHaveBeenCalledWith("sync-complete", false);
  });
});

// ---------------------------------------------------------------------------
// AllowedOriginsEditor
// ---------------------------------------------------------------------------
describe("AllowedOriginsEditor", () => {
  it("renders list of origins", () => {
    render(
      <AllowedOriginsEditor
        origins={["https://example.com", "https://other.com"]}
      />
    );
    expect(screen.getByText("https://example.com")).toBeInTheDocument();
    expect(screen.getByText("https://other.com")).toBeInTheDocument();
  });

  it("shows empty state when no origins", () => {
    render(<AllowedOriginsEditor origins={[]} />);
    expect(screen.getByText("No allowed origins.")).toBeInTheDocument();
  });

  it("calls onAdd with a valid URL", () => {
    const onAdd = vi.fn();
    render(<AllowedOriginsEditor origins={[]} onAdd={onAdd} />);
    fireEvent.change(screen.getByLabelText("New allowed origin"), {
      target: { value: "https://new.example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: /add/i }));
    expect(onAdd).toHaveBeenCalledWith("https://new.example.com");
  });

  it("shows error for invalid URL", () => {
    render(<AllowedOriginsEditor origins={[]} onAdd={() => {}} />);
    fireEvent.change(screen.getByLabelText("New allowed origin"), {
      target: { value: "not-a-url" },
    });
    fireEvent.click(screen.getByRole("button", { name: /add/i }));
    expect(screen.getByText(/valid URL origin/i)).toBeInTheDocument();
  });

  it("calls onRemove when remove button is clicked", () => {
    const onRemove = vi.fn();
    render(
      <AllowedOriginsEditor
        origins={["https://example.com"]}
        onRemove={onRemove}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /remove https:\/\/example\.com/i }));
    expect(onRemove).toHaveBeenCalledWith("https://example.com");
  });
});

// ---------------------------------------------------------------------------
// PluginsPanel
// ---------------------------------------------------------------------------
describe("PluginsPanel", () => {
  const plugins = [
    {
      id: "p1",
      name: "My Plugin",
      version: "1.0.0",
      enabled: true,
    },
  ];

  it("renders plugin list", () => {
    render(<PluginsPanel plugins={plugins} />);
    expect(screen.getByText("My Plugin")).toBeInTheDocument();
    expect(screen.getByText("v1.0.0")).toBeInTheDocument();
  });

  it("renders empty state", () => {
    render(<PluginsPanel plugins={[]} />);
    expect(screen.getByText("No plugins installed.")).toBeInTheDocument();
  });

  it("calls onToggle when switch is clicked", () => {
    const onToggle = vi.fn();
    render(<PluginsPanel plugins={plugins} onToggle={onToggle} />);
    const toggle = screen.getByRole("switch", { name: /my plugin enabled/i });
    fireEvent.click(toggle);
    expect(onToggle).toHaveBeenCalledWith("p1", false);
  });

  it("calls onInstall with the URL", () => {
    const onInstall = vi.fn();
    render(<PluginsPanel plugins={[]} onInstall={onInstall} />);
    fireEvent.change(screen.getByLabelText("Plugin manifest URL"), {
      target: { value: "https://plugins.example.com/my-plugin.json" },
    });
    fireEvent.click(screen.getByRole("button", { name: /install/i }));
    expect(onInstall).toHaveBeenCalledWith("https://plugins.example.com/my-plugin.json");
  });
});

// ---------------------------------------------------------------------------
// ApiKeysPanel
// ---------------------------------------------------------------------------
describe("ApiKeysPanel", () => {
  const keys = [
    {
      id: "k1",
      name: "Test Key",
      keyPrefix: "sk_test_abc",
      scope: "read-only" as const,
      lastUsedAt: null,
      expiresAt: null,
    },
  ];

  it("renders key list", () => {
    render(<ApiKeysPanel keys={keys} />);
    expect(screen.getByText("Test Key")).toBeInTheDocument();
  });

  it("renders empty state", () => {
    render(<ApiKeysPanel keys={[]} />);
    expect(screen.getByText("No API keys yet.")).toBeInTheDocument();
  });

  it("renders loading state", () => {
    render(<ApiKeysPanel keys={[]} isLoading />);
    expect(screen.getByText("Loading API keys…")).toBeInTheDocument();
  });

  it("shows new key banner when newKeyResult is provided", () => {
    render(
      <ApiKeysPanel
        keys={keys}
        newKeyResult={{ id: "k2", key: "sk_live_supersecret" }}
      />
    );
    expect(screen.getByText(/copy.*key now/i)).toBeInTheDocument();
    expect(screen.getByText("sk_live_supersecret")).toBeInTheDocument();
  });

  it("calls onMint with form values", async () => {
    const onMint = vi.fn();
    render(<ApiKeysPanel keys={[]} onMint={onMint} />);
    fireEvent.change(screen.getByLabelText("API key name"), {
      target: { value: "My Key" },
    });
    fireEvent.click(screen.getByRole("button", { name: /create api key/i }));
    expect(onMint).toHaveBeenCalledWith("My Key", "read-only", "never");
  });

  it("shows error when trying to create without name", () => {
    const onMint = vi.fn();
    render(<ApiKeysPanel keys={[]} onMint={onMint} />);
    fireEvent.click(screen.getByRole("button", { name: /create api key/i }));
    expect(onMint).not.toHaveBeenCalled();
    expect(screen.getByText("Name is required")).toBeInTheDocument();
  });

  it("calls onRevoke after confirm", () => {
    const onRevoke = vi.fn();
    render(<ApiKeysPanel keys={keys} onRevoke={onRevoke} />);
    fireEvent.click(screen.getByLabelText(/revoke test key/i));
    fireEvent.click(screen.getByRole("button", { name: /confirm/i }));
    expect(onRevoke).toHaveBeenCalledWith("k1");
  });
});

// ---------------------------------------------------------------------------
// AgentsPanel
// ---------------------------------------------------------------------------
describe("AgentsPanel", () => {
  const agents = [
    {
      id: "a1",
      name: "my-agent",
      label: "My Agent",
      lastSeenAt: null,
      tokens: [
        { id: "t1", tokenPrefix: "tok_abc", createdAt: null, lastUsedAt: null },
      ],
    },
  ];

  it("renders agent list", () => {
    render(<AgentsPanel agents={agents} />);
    expect(screen.getByText("my-agent")).toBeInTheDocument();
    expect(screen.getByText("My Agent")).toBeInTheDocument();
  });

  it("renders empty state", () => {
    render(<AgentsPanel agents={[]} />);
    expect(screen.getByText("No agents yet.")).toBeInTheDocument();
  });

  it("shows create form on button click", () => {
    render(<AgentsPanel agents={[]} onCreateAgent={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: /create agent/i }));
    expect(screen.getByLabelText("Agent name")).toBeInTheDocument();
  });

  it("calls onCreateAgent with form values", () => {
    const onCreateAgent = vi.fn();
    render(<AgentsPanel agents={[]} onCreateAgent={onCreateAgent} />);
    fireEvent.click(screen.getByRole("button", { name: /create agent/i }));
    fireEvent.change(screen.getByLabelText("Agent name"), {
      target: { value: "new-agent" },
    });
    fireEvent.change(screen.getByLabelText("Agent label"), {
      target: { value: "New Agent" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^create$/i }));
    expect(onCreateAgent).toHaveBeenCalledWith("new-agent", "New Agent", "");
  });

  it("expands agent and shows tokens on click", () => {
    render(<AgentsPanel agents={agents} />);
    fireEvent.click(screen.getByLabelText("Expand agent"));
    expect(screen.getByText("tok_abc…")).toBeInTheDocument();
  });

  it("calls onMintToken when mint button clicked", () => {
    const onMintToken = vi.fn();
    render(<AgentsPanel agents={agents} onMintToken={onMintToken} />);
    fireEvent.click(screen.getByLabelText("Expand agent"));
    fireEvent.click(screen.getByRole("button", { name: /mint token/i }));
    expect(onMintToken).toHaveBeenCalledWith("a1");
  });

  it("calls onDeleteAgent after two-step confirm", () => {
    const onDeleteAgent = vi.fn();
    render(<AgentsPanel agents={agents} onDeleteAgent={onDeleteAgent} />);
    fireEvent.click(screen.getByLabelText("Delete agent my-agent"));
    fireEvent.click(screen.getByRole("button", { name: /confirm delete/i }));
    expect(onDeleteAgent).toHaveBeenCalledWith("a1");
  });

  it("shows new token banner", () => {
    render(
      <AgentsPanel
        agents={agents}
        newTokenResult={{ agentId: "a1", tokenId: "t2", token: "super-secret-tok" }}
      />
    );
    expect(screen.getByText("super-secret-tok")).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// PrivacyPanel
// ---------------------------------------------------------------------------
describe("PrivacyPanel", () => {
  it("renders telemetry and crash reports toggles", () => {
    render(
      <PrivacyPanel
        telemetryEnabled={true}
        crashReportsEnabled={false}
      />
    );
    expect(screen.getByText("Usage telemetry")).toBeInTheDocument();
    expect(screen.getByText("Crash reports")).toBeInTheDocument();
  });

  it("calls onTelemetryChange when toggle clicked", () => {
    const onTelemetryChange = vi.fn();
    render(
      <PrivacyPanel
        telemetryEnabled={true}
        onTelemetryChange={onTelemetryChange}
        crashReportsEnabled={false}
      />
    );
    const toggle = screen.getByRole("switch", { name: /telemetry/i });
    fireEvent.click(toggle);
    expect(onTelemetryChange).toHaveBeenCalledWith(false);
  });

  it("shows data dir", () => {
    render(
      <PrivacyPanel
        telemetryEnabled={false}
        crashReportsEnabled={false}
        dataDir="/home/user/.kryton"
      />
    );
    expect(screen.getByText("/home/user/.kryton")).toBeInTheDocument();
  });

  it("calls onExportData and onClearData", () => {
    const onExport = vi.fn();
    const onClear = vi.fn();
    render(
      <PrivacyPanel
        telemetryEnabled={false}
        crashReportsEnabled={false}
        onExportData={onExport}
        onClearData={onClear}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /export data/i }));
    fireEvent.click(screen.getByRole("button", { name: /clear data/i }));
    expect(onExport).toHaveBeenCalled();
    expect(onClear).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// HotkeysPanel
// ---------------------------------------------------------------------------
describe("HotkeysPanel", () => {
  const bindings = [
    { id: "save", label: "Save note", binding: "Ctrl+S", defaultBinding: "Ctrl+S" },
    { id: "search", label: "Quick search", binding: "Ctrl+K", defaultBinding: "Ctrl+/" },
  ];

  it("renders bindings table", () => {
    render(<HotkeysPanel bindings={bindings} />);
    expect(screen.getByText("Save note")).toBeInTheDocument();
    expect(screen.getByText("Quick search")).toBeInTheDocument();
    expect(screen.getByText("Ctrl+S")).toBeInTheDocument();
    expect(screen.getByText("Ctrl+K")).toBeInTheDocument();
  });

  it("shows reset button for customised bindings", () => {
    render(<HotkeysPanel bindings={bindings} onResetOne={() => {}} />);
    expect(screen.getAllByRole("button", { name: /reset/i }).length).toBeGreaterThan(0);
  });

  it("calls onResetOne when reset is clicked", () => {
    const onResetOne = vi.fn();
    render(<HotkeysPanel bindings={bindings} onResetOne={onResetOne} />);
    fireEvent.click(screen.getByLabelText(/reset quick search/i));
    expect(onResetOne).toHaveBeenCalledWith("search");
  });

  it("shows reset-all button when there are custom bindings", () => {
    const onResetAll = vi.fn();
    render(<HotkeysPanel bindings={bindings} onResetAll={onResetAll} />);
    fireEvent.click(screen.getByRole("button", { name: /reset all/i }));
    expect(onResetAll).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// AdvancedPanel
// ---------------------------------------------------------------------------
describe("AdvancedPanel", () => {
  it("renders data dir", () => {
    render(<AdvancedPanel dataDir="/data/kryton" />);
    expect(screen.getByText("/data/kryton")).toBeInTheDocument();
  });

  it("calls onShowLogs when button clicked", () => {
    const onShowLogs = vi.fn();
    render(<AdvancedPanel onShowLogs={onShowLogs} />);
    fireEvent.click(screen.getByRole("button", { name: /show logs/i }));
    expect(onShowLogs).toHaveBeenCalled();
  });

  it("goes through multi-step factory reset", () => {
    const onFactoryReset = vi.fn();
    render(<AdvancedPanel onFactoryReset={onFactoryReset} />);

    // Step 0 -> 1
    fireEvent.click(screen.getByRole("button", { name: /factory reset/i }));
    expect(screen.getByText(/are you sure/i)).toBeInTheDocument();

    // Step 1 -> 2
    fireEvent.click(screen.getByRole("button", { name: /yes, continue/i }));
    const input = screen.getByLabelText("Confirm factory reset");
    expect(input).toBeInTheDocument();

    // Wrong text — should not fire
    fireEvent.change(input, { target: { value: "wrong" } });
    const resetBtn = screen.getByRole("button", { name: /reset account/i });
    expect(resetBtn).toBeDisabled();

    // Correct text
    fireEvent.change(input, { target: { value: "reset my account" } });
    expect(resetBtn).not.toBeDisabled();
    fireEvent.click(resetBtn);
    expect(onFactoryReset).toHaveBeenCalled();
  });

  it("cancel resets the flow", () => {
    render(<AdvancedPanel onFactoryReset={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: /factory reset/i }));
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(screen.getByRole("button", { name: /factory reset/i })).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// DiagnosticsPanel
// ---------------------------------------------------------------------------
describe("DiagnosticsPanel", () => {
  it("renders sync state JSON", () => {
    render(
      <DiagnosticsPanel syncState={{ connected: true, pendingOps: 3 }} />
    );
    expect(screen.getByText(/"connected": true/)).toBeInTheDocument();
  });

  it("renders recent errors", () => {
    const errors = [
      { id: "e1", message: "Connection refused", occurredAt: null },
    ];
    render(<DiagnosticsPanel recentErrors={errors} />);
    expect(screen.getByText("Connection refused")).toBeInTheDocument();
  });

  it("renders empty errors state", () => {
    render(<DiagnosticsPanel />);
    expect(screen.getByText("No recent errors.")).toBeInTheDocument();
  });

  it("renders copy report button", () => {
    render(<DiagnosticsPanel />);
    expect(
      screen.getByRole("button", { name: /copy.*report/i })
    ).toBeInTheDocument();
  });

  it("calls onCopyReport when button clicked", () => {
    const onCopyReport = vi.fn();
    render(<DiagnosticsPanel onCopyReport={onCopyReport} />);
    fireEvent.click(screen.getByRole("button", { name: /copy.*report/i }));
    expect(onCopyReport).toHaveBeenCalled();
  });
});
