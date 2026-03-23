import { AppDataSource } from "../data-source";
import { GraphEdge } from "../entities/GraphEdge";

const WIKI_LINK_REGEX = /\[\[([^\]]+)\]\]/g;

/**
 * Extract [[wiki-links]] from markdown content.
 */
export function parseLinks(content: string): string[] {
  const links: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = WIKI_LINK_REGEX.exec(content)) !== null) {
    links.push(match[1]);
  }
  return links;
}

/**
 * Convert a link target (e.g. "Projects/Mnemo Roadmap") to a note path
 * relative to NOTES_DIR (e.g. "Projects/Mnemo Roadmap.md").
 */
function linkToPath(link: string): string {
  if (link.endsWith(".md")) {
    return link;
  }
  return `${link}.md`;
}

/**
 * Derive a stable noteId from a note path — just the path without .md extension.
 */
function noteIdFromPath(notePath: string): string {
  return notePath.replace(/\.md$/, "");
}

/**
 * Re-index the graph edges for a given note. Deletes old edges originating
 * from this note and inserts new ones based on the current content.
 */
export async function updateGraphCache(
  notePath: string,
  content: string,
  userId: string
): Promise<void> {
  const repo = AppDataSource.getRepository(GraphEdge);

  // Remove existing edges from this note for this user
  await repo.delete({ fromPath: notePath, userId });

  const links = parseLinks(content);
  if (links.length === 0) return;

  const edges = links.map((link) => {
    const toPath = linkToPath(link);
    const edge = new GraphEdge();
    edge.fromPath = notePath;
    edge.toPath = toPath;
    edge.fromNoteId = noteIdFromPath(notePath);
    edge.toNoteId = noteIdFromPath(toPath);
    edge.userId = userId;
    return edge;
  });

  await repo.save(edges);
}

/**
 * Remove all graph edges that reference the given note path (as source or target).
 */
export async function removeFromGraph(notePath: string, userId: string): Promise<void> {
  const repo = AppDataSource.getRepository(GraphEdge);
  await repo.delete({ fromPath: notePath, userId });
  // We also remove edges pointing TO this note
  await repo.delete({ toPath: notePath, userId });
}

/**
 * Update graph edges when a note is renamed.
 */
export async function renameInGraph(
  oldPath: string,
  newPath: string,
  userId: string
): Promise<void> {
  const repo = AppDataSource.getRepository(GraphEdge);
  const oldNoteId = noteIdFromPath(oldPath);
  const newNoteId = noteIdFromPath(newPath);

  // Update edges originating from the old path
  await repo
    .createQueryBuilder()
    .update(GraphEdge)
    .set({ fromPath: newPath, fromNoteId: newNoteId })
    .where("fromPath = :oldPath AND userId = :userId", { oldPath, userId })
    .execute();

  // Update edges pointing to the old path
  await repo
    .createQueryBuilder()
    .update(GraphEdge)
    .set({ toPath: newPath, toNoteId: newNoteId })
    .where("toPath = :oldPath AND userId = :userId", { oldPath, userId })
    .execute();

  // Also update edges that reference the old note id without .md
  await repo
    .createQueryBuilder()
    .update(GraphEdge)
    .set({ toNoteId: newNoteId })
    .where("toNoteId = :oldNoteId AND userId = :userId", { oldNoteId, userId })
    .execute();
}

export interface GraphNode {
  id: string;
  path: string;
  title: string;
  shared?: boolean;
  ownerUserId?: string;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: { fromNoteId: string; toNoteId: string }[];
}

/**
 * Return the full graph: all nodes (from SearchIndex) and all edges.
 */
/**
 * Get all notes that link TO the given note (backlinks).
 */
export async function getBacklinks(
  notePath: string,
  userId: string
): Promise<{ path: string; title: string }[]> {
  const repo = AppDataSource.getRepository(GraphEdge);
  const noteId = noteIdFromPath(notePath);
  const { hasAccess } = await import("../services/shareService");

  // Find all edges pointing to this note across ALL users
  const edges = await repo.find({ where: { toNoteId: noteId } });
  if (edges.length === 0) return [];

  const { SearchIndex } = await import("../entities/SearchIndex");
  const searchRepo = AppDataSource.getRepository(SearchIndex);

  const backlinks: { path: string; title: string }[] = [];
  for (const edge of edges) {
    if (edge.userId === userId) {
      // Own note — always accessible
      const note = await searchRepo.findOneBy({ notePath: edge.fromPath, userId });
      if (note) {
        backlinks.push({ path: note.notePath, title: note.title });
      }
    } else {
      // Another user's note — check if it's shared with the viewer
      const access = await hasAccess(edge.userId, edge.fromPath, userId);
      if (access.canRead) {
        const note = await searchRepo.findOneBy({ notePath: edge.fromPath, userId: edge.userId });
        if (note) {
          backlinks.push({ path: note.notePath, title: note.title });
        }
      }
    }
  }

  // Deduplicate by path
  const seen = new Set<string>();
  return backlinks.filter((b) => {
    if (seen.has(b.path)) return false;
    seen.add(b.path);
    return true;
  });
}

export async function getFullGraph(userId: string): Promise<GraphData> {
  const edgeRepo = AppDataSource.getRepository(GraphEdge);
  const { SearchIndex } = await import("../entities/SearchIndex");
  const searchRepo = AppDataSource.getRepository(SearchIndex);
  const { getAccessibleSharedPaths } = await import("../services/shareService");

  const [allNotes, allEdges, sharedPaths] = await Promise.all([
    searchRepo.find({ where: { userId } }),
    edgeRepo.find({ where: { userId } }),
    getAccessibleSharedPaths(userId),
  ]);

  // --- Own nodes ---
  const nodes: GraphNode[] = allNotes.map((note) => ({
    id: noteIdFromPath(note.notePath),
    path: note.notePath,
    title: note.title,
  }));

  const ownNodeIds = new Set(nodes.map((n) => n.id));

  // --- Shared nodes ---
  // Fetch SearchIndex entries for each shared note (from the owner's data)
  const sharedNoteEntries = await Promise.all(
    sharedPaths.map(async (sp) => {
      const note = await searchRepo.findOneBy({
        notePath: sp.notePath,
        userId: sp.ownerUserId,
      });
      return note ? { note, ownerUserId: sp.ownerUserId } : null;
    }),
  );

  // Build a lookup from owner's noteId to namespaced id
  // ownerNoteId -> namespaced id (for notes the user doesn't own)
  const ownerNoteIdToNamespaced = new Map<string, string>();

  for (const entry of sharedNoteEntries) {
    if (!entry) continue;
    const rawId = noteIdFromPath(entry.note.notePath);
    const namespacedId = `${entry.ownerUserId}:${entry.note.notePath}`;

    // Skip if this note already exists as the user's own note
    if (ownNodeIds.has(rawId)) continue;

    ownerNoteIdToNamespaced.set(`${entry.ownerUserId}:${rawId}`, namespacedId);

    nodes.push({
      id: namespacedId,
      path: entry.note.notePath,
      title: entry.note.title,
      shared: true,
      ownerUserId: entry.ownerUserId,
    });
  }

  // --- Accessible set (all node IDs the viewer can see) ---
  const accessibleIds = new Set(nodes.map((n) => n.id));

  // --- Shared edges (from owners' data) ---
  // Group shared paths by owner for batch edge fetching
  const ownerIds = [...new Set(sharedPaths.map((sp) => sp.ownerUserId))];
  const sharedEdges: GraphEdge[] = [];
  for (const ownerId of ownerIds) {
    const ownerEdges = await edgeRepo.find({ where: { userId: ownerId } });
    sharedEdges.push(...ownerEdges);
  }

  // --- Map and filter all edges ---
  // Helper: resolve an owner's noteId to the viewer's graph ID
  const resolveId = (rawNoteId: string, ownerId: string): string | null => {
    // If it matches one of the viewer's own notes, use as-is
    if (ownNodeIds.has(rawNoteId)) return rawNoteId;
    // If it's a shared note from this owner, use namespaced ID
    const namespaced = ownerNoteIdToNamespaced.get(`${ownerId}:${rawNoteId}`);
    if (namespaced) return namespaced;
    return null;
  };

  const edges: { fromNoteId: string; toNoteId: string }[] = [];
  const edgeSeen = new Set<string>();

  // Own edges: keep only those where both ends are accessible
  for (const e of allEdges) {
    if (accessibleIds.has(e.fromNoteId) && accessibleIds.has(e.toNoteId)) {
      const key = `${e.fromNoteId}->${e.toNoteId}`;
      if (!edgeSeen.has(key)) {
        edgeSeen.add(key);
        edges.push({ fromNoteId: e.fromNoteId, toNoteId: e.toNoteId });
      }
    }
  }

  // Shared edges: resolve IDs and keep only those where both ends are accessible
  for (const e of sharedEdges) {
    const from = resolveId(e.fromNoteId, e.userId);
    const to = resolveId(e.toNoteId, e.userId);
    if (from && to && accessibleIds.has(from) && accessibleIds.has(to)) {
      const key = `${from}->${to}`;
      if (!edgeSeen.has(key)) {
        edgeSeen.add(key);
        edges.push({ fromNoteId: from, toNoteId: to });
      }
    }
  }

  return { nodes, edges };
}
