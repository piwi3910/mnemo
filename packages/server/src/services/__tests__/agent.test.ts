import { describe, it, expect, beforeEach } from "vitest";
import { prisma } from "../../prisma.js";
import {
  createAgent,
  setAgentPolicy,
  mintToken,
  validateToken,
  revokeToken,
  listAgents,
  deleteAgent,
} from "../agent.js";

describe("agent service", () => {
  beforeEach(async () => {
    await prisma.agentToken.deleteMany();
    await prisma.agent.deleteMany();
    await prisma.user.deleteMany({ where: { id: "u-ag" } });
    await prisma.user.create({
      data: { id: "u-ag", email: "ag@example.com", name: "Agent Test" },
    });
  });

  it("creates agent and mints a token; validate succeeds", async () => {
    const a = await createAgent("u-ag", { name: "claude", label: "Claude" });
    expect(a.ownerUserId).toBe("u-ag");

    const t = await mintToken(a.id, { expiresInSeconds: 3600 });
    expect(t.token).toBeTruthy();
    expect(t.tokenId).toBeTruthy();

    const r = await validateToken(t.token);
    expect(r?.agentId).toBe(a.id);
    expect(r?.ownerUserId).toBe("u-ag");
  });

  it("revoked token fails validation", async () => {
    const a = await createAgent("u-ag", { name: "claude", label: "Claude" });
    const t = await mintToken(a.id, { expiresInSeconds: 3600 });
    await revokeToken(t.tokenId);
    const r = await validateToken(t.token);
    expect(r).toBeNull();
  });

  it("expired token fails validation", async () => {
    const a = await createAgent("u-ag", { name: "claude", label: "Claude" });
    // Expire in -1 seconds (already expired)
    const t = await mintToken(a.id, { expiresInSeconds: -1 });
    const r = await validateToken(t.token);
    expect(r).toBeNull();
  });

  it("unknown token fails validation", async () => {
    const r = await validateToken("no-such-token");
    expect(r).toBeNull();
  });

  it("sets agent policy text", async () => {
    const a = await createAgent("u-ag", { name: "claude", label: "Claude" });
    expect(a.policyText).toBeNull();
    const updated = await setAgentPolicy(a.id, 'permit(principal, action, resource);');
    expect(updated.policyText).toBe('permit(principal, action, resource);');
  });

  it("lists agents for owner", async () => {
    await createAgent("u-ag", { name: "bot1", label: "Bot 1" });
    await createAgent("u-ag", { name: "bot2", label: "Bot 2" });
    const agents = await listAgents("u-ag");
    expect(agents).toHaveLength(2);
    expect(agents.map((a) => a.name).sort()).toEqual(["bot1", "bot2"]);
  });

  it("deletes agent and cascades tokens", async () => {
    const a = await createAgent("u-ag", { name: "claude", label: "Claude" });
    const t = await mintToken(a.id, { expiresInSeconds: 3600 });
    await deleteAgent(a.id);
    const r = await validateToken(t.token);
    expect(r).toBeNull();
    const agents = await listAgents("u-ag");
    expect(agents).toHaveLength(0);
  });
});
