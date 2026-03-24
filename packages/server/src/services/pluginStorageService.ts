import { prisma } from "../prisma.js";

const GLOBAL_USER = "";

export async function getStorageValue(
  pluginId: string,
  key: string,
  userId?: string
): Promise<unknown> {
  const entry = await prisma.pluginStorage.findUnique({
    where: {
      pluginId_key_userId: {
        pluginId,
        key,
        userId: userId ?? GLOBAL_USER,
      },
    },
  });
  return entry?.value ?? null;
}

export async function setStorageValue(
  pluginId: string,
  key: string,
  value: unknown,
  userId?: string
): Promise<void> {
  const effectiveUserId = userId ?? GLOBAL_USER;
  await prisma.pluginStorage.upsert({
    where: {
      pluginId_key_userId: {
        pluginId,
        key,
        userId: effectiveUserId,
      },
    },
    create: {
      pluginId,
      key,
      userId: effectiveUserId,
      value: value as Parameters<typeof prisma.pluginStorage.create>[0]["data"]["value"],
    },
    update: {
      value: value as Parameters<typeof prisma.pluginStorage.update>[0]["data"]["value"],
    },
  });
}

export async function deleteStorageValue(
  pluginId: string,
  key: string,
  userId?: string
): Promise<void> {
  await prisma.pluginStorage.deleteMany({
    where: {
      pluginId,
      key,
      userId: userId ?? GLOBAL_USER,
    },
  });
}

export async function listStorageEntries(
  pluginId: string,
  prefix?: string,
  userId?: string
): Promise<Array<{ key: string; value: unknown; userId: string | null }>> {
  const where: Record<string, unknown> = { pluginId };

  if (userId !== undefined) {
    where.userId = userId;
  }
  if (prefix) {
    where.key = { startsWith: prefix };
  }

  const entries = await prisma.pluginStorage.findMany({ where });
  return entries.map((e) => ({
    key: e.key,
    value: e.value,
    userId: e.userId || null,
  }));
}
