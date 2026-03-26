import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import express, { type Express } from "express";
import request from "supertest";
import * as fs from "fs/promises";
import * as path from "path";
import * as os from "os";

import { SessionStore } from "../sessionStore.js";
import { createHandlers } from "../index.js";
import type { PluginAPI } from "../../../../src/plugins/types.js";

function makeApi(overrides: Partial<PluginAPI> = {}): PluginAPI {
  return {
    notes: {
      get: vi.fn(),
      list: vi.fn().mockResolvedValue([]),
      create: vi.fn().mockResolvedValue(undefined),
      update: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn(),
    },
    events: { on: vi.fn(), off: vi.fn() },
    routes: { register: vi.fn() },
    storage: {
      get: vi.fn(),
      set: vi.fn(),
      delete: vi.fn(),
      list: vi.fn(),
    },
    settings: {
      get: vi.fn().mockResolvedValue(1048576),
    },
    search: { index: vi.fn(), query: vi.fn() },
    log: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
    plugin: { id: "mass-upload", version: "1.0.0", dataDir: "/tmp/mass-upload" },
    ...overrides,
  } as unknown as PluginAPI;
}

function makeApp(api: PluginAPI, sessionStore: SessionStore): Express {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    (req as any).user = { id: "test-user" };
    next();
  });

  const handlers = createHandlers(api, sessionStore);
  app.post("/validate", handlers.validate);
  app.post("/confirm", handlers.confirm);
  app.delete("/session/:sessionId", handlers.deleteSession);

  return app;
}

describe("Mass Upload routes", () => {
  let tmpDir: string;
  let sessionStore: SessionStore;
  let api: PluginAPI;
  let app: Express;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "mass-upload-routes-test-"));
    sessionStore = new SessionStore(tmpDir, { maxPerUser: 5, expiryMs: 30 * 60 * 1000 });
    api = makeApi();
    app = makeApp(api, sessionStore);
  });

  afterEach(async () => {
    sessionStore.dispose();
    await fs.rm(tmpDir, { recursive: true, force: true });
    vi.clearAllMocks();
  });

  // --- 401 without user ---
  it("returns 401 without user on POST /validate", async () => {
    // Build app without auth middleware
    const anonApp = express();
    anonApp.use(express.json());
    const handlers = createHandlers(api, sessionStore);
    anonApp.post("/validate", handlers.validate);

    const res = await request(anonApp)
      .post("/validate")
      .attach("files", Buffer.from("# Hello"), "test.md");

    expect(res.status).toBe(401);
  });

  it("returns 401 without user on POST /confirm", async () => {
    const anonApp = express();
    anonApp.use(express.json());
    const handlers = createHandlers(api, sessionStore);
    anonApp.post("/confirm", handlers.confirm);

    const res = await request(anonApp)
      .post("/confirm")
      .send({ sessionId: "fake", actions: [] });

    expect(res.status).toBe(401);
  });

  it("returns 401 without user on DELETE /session/:id", async () => {
    const anonApp = express();
    anonApp.use(express.json());
    const handlers = createHandlers(api, sessionStore);
    anonApp.delete("/session/:sessionId", handlers.deleteSession);

    const res = await request(anonApp).delete("/session/fake-id");
    expect(res.status).toBe(401);
  });

  // --- POST /validate ---
  it("returns validation report with sessionId and file statuses for valid .md files", async () => {
    const res = await request(app)
      .post("/validate")
      .attach("files", Buffer.from("# Hello\nContent"), "note.md");

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("sessionId");
    expect(res.body).toHaveProperty("files");
    expect(Array.isArray(res.body.files)).toBe(true);
    expect(res.body.files).toHaveLength(1);
    expect(res.body.files[0].status).toBe("valid");
    expect(res.body.files[0].originalName).toBe("note.md");
  });

  it("rejects non-.md files as invalid", async () => {
    const res = await request(app)
      .post("/validate")
      .attach("files", Buffer.from("some content"), "document.txt");

    expect(res.status).toBe(200);
    expect(res.body.files[0].status).toBe("invalid");
    expect(res.body.files[0].errors).toContain("File must have .md extension");
  });

  it("respects targetFolder and preserveStructure query params", async () => {
    const res = await request(app)
      .post("/validate?targetFolder=Projects&preserveStructure=false")
      .attach("files", Buffer.from("# Hello"), "note.md");

    expect(res.status).toBe(200);
    expect(res.body.targetFolder).toBe("Projects");
    expect(res.body.preserveStructure).toBe(false);
    expect(res.body.files[0].resolvedPath).toBe("Projects/note.md");
  });

  it("detects duplicates using flattenNotePaths on the note tree", async () => {
    (api.notes.list as any).mockResolvedValue([
      { name: "existing.md", path: "existing.md", type: "file" },
    ]);

    const res = await request(app)
      .post("/validate")
      .attach("files", Buffer.from("# Hello"), "existing.md");

    expect(res.status).toBe(200);
    expect(res.body.files[0].status).toBe("duplicate");
    expect(res.body.files[0].existingNote).toBe(true);
  });

  // --- POST /confirm ---
  it("creates notes for valid files", async () => {
    // First validate to get sessionId
    const validateRes = await request(app)
      .post("/validate")
      .attach("files", Buffer.from("# Hello\nContent"), "note.md");

    expect(validateRes.status).toBe(200);
    const { sessionId } = validateRes.body;

    const confirmRes = await request(app)
      .post("/confirm")
      .send({ sessionId, actions: [{ index: 0, action: "create" }] });

    expect(confirmRes.status).toBe(200);
    expect(confirmRes.body.created).toContain("note.md");
    expect(confirmRes.body.errors).toHaveLength(0);
    expect(api.notes.create).toHaveBeenCalledWith(
      "test-user",
      "note.md",
      expect.any(String)
    );
  });

  it("overwrites notes when action is overwrite", async () => {
    const validateRes = await request(app)
      .post("/validate")
      .attach("files", Buffer.from("# Hello"), "note.md");

    const { sessionId } = validateRes.body;

    const confirmRes = await request(app)
      .post("/confirm")
      .send({ sessionId, actions: [{ index: 0, action: "overwrite" }] });

    expect(confirmRes.status).toBe(200);
    expect(confirmRes.body.overwritten).toContain("note.md");
    expect(api.notes.update).toHaveBeenCalledWith(
      "test-user",
      "note.md",
      expect.any(String)
    );
  });

  it("returns 410 for invalid/expired session", async () => {
    const res = await request(app)
      .post("/confirm")
      .send({ sessionId: "nonexistent-session-id", actions: [] });

    expect(res.status).toBe(410);
    expect(res.body.error).toMatch(/session not found|expired/i);
  });

  it("returns 400 when sessionId is missing from confirm", async () => {
    const res = await request(app)
      .post("/confirm")
      .send({ actions: [] });

    expect(res.status).toBe(400);
  });

  it("skips files with action skip", async () => {
    const validateRes = await request(app)
      .post("/validate")
      .attach("files", Buffer.from("# Hello"), "note.md");

    const { sessionId } = validateRes.body;

    const confirmRes = await request(app)
      .post("/confirm")
      .send({ sessionId, actions: [{ index: 0, action: "skip" }] });

    expect(confirmRes.status).toBe(200);
    expect(confirmRes.body.created).toHaveLength(0);
    expect(confirmRes.body.overwritten).toHaveLength(0);
    expect(api.notes.create).not.toHaveBeenCalled();
  });

  // --- DELETE /session/:sessionId ---
  it("removes session", async () => {
    const validateRes = await request(app)
      .post("/validate")
      .attach("files", Buffer.from("# Hello"), "note.md");

    const { sessionId } = validateRes.body;

    const deleteRes = await request(app).delete(`/session/${sessionId}`);
    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.deleted).toBe(true);

    // Session should no longer exist
    expect(sessionStore.get(sessionId, "test-user")).toBeNull();
  });

  it("returns 404 when deleting non-existent session", async () => {
    const res = await request(app).delete("/session/does-not-exist");
    expect(res.status).toBe(404);
  });
});
