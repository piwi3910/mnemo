import { prisma } from "../prisma.js";

/**
 * Strip markdown formatting to produce plain text for indexing.
 */
function stripMarkdown(content: string): string {
  return (
    content
      // Remove headings markers
      .replace(/^#{1,6}\s+/gm, "")
      // Remove bold/italic markers
      .replace(/\*{1,3}([^*]+)\*{1,3}/g, "$1")
      .replace(/_{1,3}([^_]+)_{1,3}/g, "$1")
      // Remove wiki links but keep text
      .replace(/\[\[([^\]]+)\]\]/g, "$1")
      // Remove markdown links
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      // Remove inline code
      .replace(/`([^`]+)`/g, "$1")
      // Remove code blocks
      .replace(/```[\s\S]*?```/g, "")
      // Remove horizontal rules
      .replace(/^[-*_]{3,}\s*$/gm, "")
      // Remove checkbox markers
      .replace(/- \[[ x]\] /g, "- ")
  );
}

/**
 * Extract tags (words starting with #) from content.
 */
function extractTags(content: string): string[] {
  const tagRegex = /#([a-zA-Z0-9_-]+)/g;
  const tags: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = tagRegex.exec(content)) !== null) {
    // Avoid matching headings — tags must not be preceded by a newline + #
    // The regex only matches #word patterns; headings are "# Word" (with space)
    tags.push(match[1]);
  }
  return [...new Set(tags)];
}

/**
 * Extract the title from markdown content. Uses the first # heading, or
 * falls back to the filename.
 */
export function extractTitle(content: string, filePath: string): string {
  const headingMatch = content.match(/^#\s+(.+)$/m);
  if (headingMatch) {
    return headingMatch[1].trim();
  }
  // Fallback: derive from filename
  const basename = filePath.split("/").pop() || filePath;
  return basename.replace(/\.md$/, "");
}

/**
 * Index a note in the search database.
 */
export async function indexNote(
  notePath: string,
  content: string,
  userId: string
): Promise<void> {
  const title = extractTitle(content, notePath);
  const plainContent = stripMarkdown(content);
  const tags = extractTags(content);

  await prisma.searchIndex.upsert({
    where: { notePath_userId: { notePath, userId } },
    create: {
      notePath,
      userId,
      title,
      content: plainContent,
      tags,
      modifiedAt: new Date(),
    },
    update: {
      title,
      content: plainContent,
      tags,
      modifiedAt: new Date(),
    },
  });
}

/**
 * Remove a note from the search index.
 */
export async function removeFromIndex(notePath: string, userId: string): Promise<void> {
  await prisma.searchIndex.deleteMany({ where: { notePath, userId } });
}

/**
 * Rename a note in the search index.
 */
export async function renameInIndex(
  oldPath: string,
  newPath: string,
  userId: string
): Promise<void> {
  const entry = await prisma.searchIndex.findUnique({
    where: { notePath_userId: { notePath: oldPath, userId } },
  });
  if (entry) {
    await prisma.searchIndex.delete({
      where: { notePath_userId: { notePath: oldPath, userId } },
    });
    await prisma.searchIndex.create({
      data: {
        notePath: newPath,
        userId,
        title: entry.title,
        content: entry.content,
        tags: entry.tags,
        modifiedAt: entry.modifiedAt,
      },
    });
  }
}

/**
 * Get all tags across all notes with their counts.
 */
export async function getAllTags(userId: string): Promise<{ tag: string; count: number }[]> {
  const allNotes = await prisma.searchIndex.findMany({ where: { userId } });

  const tagCounts = new Map<string, number>();
  for (const note of allNotes) {
    for (const tag of note.tags) {
      if (tag) {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      }
    }
  }

  return Array.from(tagCounts.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Get all note paths that have a given tag.
 */
export async function getNotesByTag(
  tag: string,
  userId: string
): Promise<{ notePath: string; title: string }[]> {
  const allNotes = await prisma.searchIndex.findMany({ where: { userId } });

  return allNotes
    .filter((note) => note.tags.includes(tag))
    .map((note) => ({ notePath: note.notePath, title: note.title }));
}

export interface SearchResult {
  path: string;
  title: string;
  snippet: string;
  tags: string[];
  modifiedAt: Date;
  isShared?: boolean;
  ownerUserId?: string;
}

/**
 * Search notes by query, matching against title and content using case-insensitive contains.
 * Also includes notes shared with the user.
 */
export async function search(query: string, userId: string): Promise<SearchResult[]> {
  // 1. Own notes query (existing behaviour)
  const ownResults = await prisma.searchIndex.findMany({
    where: {
      userId,
      OR: [
        { title: { contains: query, mode: "insensitive" } },
        { content: { contains: query, mode: "insensitive" } },
      ],
    },
    orderBy: { modifiedAt: "desc" },
  });

  const ownMapped: SearchResult[] = ownResults.map((r) => {
    const snippet = createSnippet(r.content, query);
    return {
      path: r.notePath,
      title: r.title,
      snippet,
      tags: r.tags,
      modifiedAt: r.modifiedAt,
    };
  });

  // 2. Shared notes query
  const shares = await prisma.noteShare.findMany({
    where: { sharedWithUserId: userId },
  });

  const sharedResults: SearchResult[] = [];

  for (const share of shares) {
    let matchingNotes;

    if (!share.isFolder) {
      // File share: match by exact path and owner
      matchingNotes = await prisma.searchIndex.findMany({
        where: {
          notePath: share.path,
          userId: share.ownerUserId,
          OR: [
            { title: { contains: query, mode: "insensitive" } },
            { content: { contains: query, mode: "insensitive" } },
          ],
        },
      });
    } else {
      // Folder share: match notes under the shared folder path
      matchingNotes = await prisma.searchIndex.findMany({
        where: {
          notePath: { startsWith: share.path },
          userId: share.ownerUserId,
          OR: [
            { title: { contains: query, mode: "insensitive" } },
            { content: { contains: query, mode: "insensitive" } },
          ],
        },
      });
    }

    for (const r of matchingNotes) {
      sharedResults.push({
        path: r.notePath,
        title: r.title,
        snippet: createSnippet(r.content, query),
        tags: r.tags,
        modifiedAt: r.modifiedAt,
        isShared: true,
        ownerUserId: r.userId,
      });
    }
  }

  // 3. Combine and deduplicate by path (own notes take priority)
  const seenPaths = new Set(ownMapped.map((r) => r.path));
  const combined = [...ownMapped];
  for (const shared of sharedResults) {
    const key = `${shared.ownerUserId}:${shared.path}`;
    if (!seenPaths.has(shared.path) && !seenPaths.has(key)) {
      seenPaths.add(key);
      combined.push(shared);
    }
  }

  return combined;
}

/**
 * Create a context snippet around the first occurrence of the query in the content.
 */
function createSnippet(content: string, query: string): string {
  const lowerContent = content.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const idx = lowerContent.indexOf(lowerQuery);

  if (idx === -1) {
    // Query matched title only; return beginning of content
    return content.substring(0, 150).trim() + (content.length > 150 ? "..." : "");
  }

  const start = Math.max(0, idx - 60);
  const end = Math.min(content.length, idx + query.length + 60);
  let snippet = content.substring(start, end).trim();

  if (start > 0) snippet = "..." + snippet;
  if (end < content.length) snippet = snippet + "...";

  return snippet;
}
