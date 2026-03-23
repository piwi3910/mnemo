import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { useCallback, useEffect, useState } from 'react';
import { api } from '../../lib/api';

interface PreviewProps {
  content: string;
  onLinkClick: (noteName: string) => void;
}

const IMAGE_EXTENSIONS = /\.(png|jpg|jpeg|gif|svg|webp|bmp)$/i;

export function Preview({ content, onLinkClick }: PreviewProps) {
  const [embeddedNotes, setEmbeddedNotes] = useState<Record<string, string>>({});

  // Find all note embeds (not images) in content
  const noteEmbeds = Array.from(content.matchAll(/!\[\[([^\]]+)\]\]/g))
    .map((m) => m[1])
    .filter((name) => !IMAGE_EXTENSIONS.test(name));

  // Fetch embedded note content
  useEffect(() => {
    let cancelled = false;
    const toFetch = noteEmbeds.filter((name) => !(name in embeddedNotes));
    if (toFetch.length === 0) return;

    Promise.all(
      toFetch.map(async (name) => {
        try {
          const note = await api.getNote(name.endsWith('.md') ? name : `${name}.md`);
          return { name, content: note.content };
        } catch {
          return { name, content: null };
        }
      })
    ).then((results) => {
      if (cancelled) return;
      setEmbeddedNotes((prev) => {
        const next = { ...prev };
        for (const r of results) {
          next[r.name] = r.content ?? `*Note "${r.name}" not found*`;
        }
        return next;
      });
    });

    return () => { cancelled = true; };
    // We intentionally only depend on the serialized embed list
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [noteEmbeds.join(',')]);

  // Transform content: handle embeds and wiki-links
  const transformedContent = content
    // Image embeds: ![[image.png]] → <img>
    .replace(
      /!\[\[([^\]]+\.(png|jpg|jpeg|gif|svg|webp|bmp))\]\]/gi,
      (_match, fileName: string) =>
        `<div class="embed-image"><img src="/api/files/${encodeURIComponent(fileName)}" alt="${fileName}" /></div>`
    )
    // Note embeds: ![[Note Name]] → embedded content
    .replace(
      /!\[\[([^\]]+)\]\]/g,
      (_match, noteName: string) => {
        if (IMAGE_EXTENSIONS.test(noteName)) return _match;
        const noteContent = embeddedNotes[noteName];
        if (noteContent === undefined) {
          return `<div class="embed-note embed-loading"><div class="embed-note-header">${noteName}</div><p class="embed-note-loading-text">Loading...</p></div>`;
        }
        // Strip the first heading from embedded content to avoid duplication
        const strippedContent = noteContent.replace(/^#\s+.+\n?/, '');
        return `<div class="embed-note"><div class="embed-note-header"><a class="wiki-link" data-wiki-target="${noteName}" href="#">${noteName}</a></div>\n\n${strippedContent}\n\n</div>`;
      }
    )
    // Regular wiki-links: [[Note]] → clickable link
    .replace(
      /\[\[([^\]]+)\]\]/g,
      (_, linkText: string) => `<a class="wiki-link" data-wiki-target="${linkText}" href="#">${linkText}</a>`
    );

  const handleClick = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const wikiTarget = target.closest<HTMLElement>('[data-wiki-target]');
    if (wikiTarget) {
      e.preventDefault();
      const noteName = wikiTarget.getAttribute('data-wiki-target');
      if (noteName) onLinkClick(noteName);
    }
  }, [onLinkClick]);

  return (
    <div className="markdown-preview p-6 max-w-3xl mx-auto" onClick={handleClick}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
      >
        {transformedContent}
      </ReactMarkdown>
    </div>
  );
}
