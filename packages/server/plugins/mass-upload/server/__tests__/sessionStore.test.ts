import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "fs/promises";
import * as path from "path";
import * as os from "os";
import { SessionStore } from "../sessionStore.js";

describe("SessionStore", () => {
  let store: SessionStore;
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "mass-upload-test-"));
    store = new SessionStore(tmpDir, { maxPerUser: 5, expiryMs: 30 * 60 * 1000 });
  });

  afterEach(async () => {
    store.dispose();
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it("creates a session with unique ID", async () => {
    const session = await store.create("user1");
    expect(session.id).toBeTruthy();
    expect(session.userId).toBe("user1");
    expect(session.files).toEqual([]);
  });

  it("stores session scoped to userId", async () => {
    const session = await store.create("user1");
    const retrieved = store.get(session.id, "user1");
    expect(retrieved).toBeTruthy();
    expect(store.get(session.id, "user2")).toBeNull();
  });

  it("rejects when max sessions exceeded", async () => {
    for (let i = 0; i < 5; i++) {
      await store.create("user1");
    }
    await expect(store.create("user1")).rejects.toThrow("concurrent session");
  });

  it("deletes a session and cleans up files", async () => {
    const session = await store.create("user1");
    await fs.writeFile(path.join(session.dir, "test.md"), "hello");
    await store.delete(session.id, "user1");
    expect(store.get(session.id, "user1")).toBeNull();
    await expect(fs.access(session.dir)).rejects.toThrow();
  });

  it("returns session directory path under userId/sessionId", async () => {
    const session = await store.create("user1");
    expect(session.dir).toContain("user1");
    expect(session.dir).toContain(session.id);
  });
});
