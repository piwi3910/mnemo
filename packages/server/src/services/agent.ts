import { prisma } from "../prisma.js";
import * as crypto from "crypto";

export interface CreateAgentInput {
  name: string;
  label: string;
  policyText?: string;
}

export interface MintTokenOptions {
  expiresInSeconds: number;
  scope?: string;
}

export interface MintedToken {
  token: string;
  tokenId: string;
  expiresAt: Date;
}

export interface ValidatedToken {
  agentId: string;
  ownerUserId: string;
  tokenId: string;
}

/** Create a new agent owned by the given user. */
export async function createAgent(ownerUserId: string, input: CreateAgentInput) {
  return prisma.agent.create({
    data: {
      ownerUserId,
      name: input.name,
      label: input.label,
      policyText: input.policyText ?? null,
    },
  });
}

/** Replace the Cedar policy text for an agent. */
export async function setAgentPolicy(agentId: string, policyText: string) {
  return prisma.agent.update({ where: { id: agentId }, data: { policyText } });
}

/** Mint a new bearer token for the agent. Returns the raw token (shown once). */
export async function mintToken(
  agentId: string,
  opts: MintTokenOptions,
): Promise<MintedToken> {
  const token = crypto.randomBytes(32).toString("base64url");
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const expiresAt = new Date(Date.now() + opts.expiresInSeconds * 1000);

  const row = await prisma.agentToken.create({
    data: {
      agentId,
      tokenHash,
      scope: opts.scope ?? null,
      expiresAt,
    },
  });

  return { token, tokenId: row.id, expiresAt };
}

/**
 * Validate a raw bearer token.
 * Returns agent+owner info if valid; null if not found, revoked, or expired.
 */
export async function validateToken(token: string): Promise<ValidatedToken | null> {
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  const t = await prisma.agentToken.findFirst({
    where: {
      tokenHash,
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
    include: { agent: true },
  });

  if (!t) return null;

  return {
    agentId: t.agentId,
    ownerUserId: t.agent.ownerUserId,
    tokenId: t.id,
  };
}

/** Soft-revoke a token by setting revokedAt. */
export async function revokeToken(tokenId: string): Promise<void> {
  await prisma.agentToken.update({
    where: { id: tokenId },
    data: { revokedAt: new Date() },
  });
}

/** List all agents owned by a user. */
export async function listAgents(ownerUserId: string) {
  return prisma.agent.findMany({ where: { ownerUserId } });
}

/** Permanently delete an agent and cascade its tokens. */
export async function deleteAgent(agentId: string): Promise<void> {
  await prisma.agent.delete({ where: { id: agentId } });
}
