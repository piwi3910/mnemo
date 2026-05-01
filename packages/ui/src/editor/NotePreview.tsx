import * as React from "react";

export interface NotePreviewProps {
  /** Markdown content to render. */
  content: string;
  /**
   * Called when the user clicks a wiki-link or internal link.
   * Receives the target note name/path.
   */
  onLinkClick: (noteName: string) => void;
  /**
   * Called when the user clicks a broken (non-existent) wiki-link and wants to
   * create the note.
   */
  onCreateNote?: (name: string) => void;
  /**
   * Optional renderer factory: given a code-fence language string, return a
   * React component to render that block.
   */
  getCodeFenceRenderer?: (language: string) => {
    component: React.ComponentType<{ content: string; notePath: string }>;
  } | undefined;
  /** Path of the note being previewed (used for embed de-duplication). */
  notePath?: string;
  /**
   * Optional set of note names/paths that exist; used to highlight broken
   * wiki-links.
   */
  existingNotes?: Set<string>;
  className?: string;
}

// ---------------------------------------------------------------------------
// Inline markdown renderer — no external dependencies needed.
// Handles: headings, bold, italic, inline-code, fenced code, hr,
// blockquote, ul/ol, wiki-links [[Name]], paragraphs.
// ---------------------------------------------------------------------------

function renderInline(
  text: string,
  onLinkClick: (n: string) => void,
  onCreateNote?: (n: string) => void,
  existingNotes?: Set<string>,
  keyPrefix = "",
): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  const pattern =
    /(\*\*([^*]+)\*\*)|(\*([^*]+)\*)|(`([^`]+)`)|\[\[([^\]]+)\]\]/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }

    if (match[1] !== undefined) {
      // **bold**
      nodes.push(<strong key={`${keyPrefix}b${match.index}`}>{match[2]}</strong>);
    } else if (match[3] !== undefined) {
      // *italic*
      nodes.push(<em key={`${keyPrefix}i${match.index}`}>{match[4]}</em>);
    } else if (match[5] !== undefined) {
      // `code`
      nodes.push(
        <code
          key={`${keyPrefix}c${match.index}`}
          className="rounded bg-gray-100 px-1 font-mono text-sm dark:bg-gray-800"
        >
          {match[6]}
        </code>,
      );
    } else if (match[7] !== undefined) {
      // [[wiki-link]]
      const rawTarget = match[7];
      const target = rawTarget.split("|")[0]?.trim() ?? rawTarget;
      const label = rawTarget.includes("|")
        ? (rawTarget.split("|")[1]?.trim() ?? target)
        : target;
      const isBroken = existingNotes ? !existingNotes.has(target) : false;
      nodes.push(
        <a
          key={`${keyPrefix}w${match.index}`}
          href="#"
          data-wiki-target={target}
          data-broken={String(isBroken)}
          onClick={(e) => {
            e.preventDefault();
            if (isBroken && onCreateNote) {
              onCreateNote(target);
            } else {
              onLinkClick(target);
            }
          }}
          className={
            isBroken
              ? "text-red-500 underline decoration-dotted hover:text-red-600"
              : "text-violet-600 underline hover:text-violet-700 dark:text-violet-400"
          }
        >
          {label}
        </a>,
      );
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes;
}

const HEADING_TAGS = ["", "h1", "h2", "h3", "h4", "h5", "h6"] as const;
const HEADING_SIZES = ["", "text-3xl", "text-2xl", "text-xl", "text-lg", "text-base", "text-sm"];

function parseMarkdown(
  content: string,
  props: Pick<
    NotePreviewProps,
    "onLinkClick" | "onCreateNote" | "existingNotes" | "getCodeFenceRenderer" | "notePath"
  >,
): React.ReactNode[] {
  const { onLinkClick, onCreateNote, existingNotes, getCodeFenceRenderer, notePath = "" } = props;
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i] ?? "";

    // Fenced code block
    if (line.startsWith("```")) {
      const lang = line.slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !(lines[i] ?? "").startsWith("```")) {
        codeLines.push(lines[i] ?? "");
        i++;
      }
      i++; // skip closing ```
      const codeContent = codeLines.join("\n");

      if (lang && getCodeFenceRenderer) {
        const renderer = getCodeFenceRenderer(lang);
        if (renderer) {
          const Comp = renderer.component;
          elements.push(
            <Comp key={`fence-${i}`} content={codeContent} notePath={notePath} />,
          );
          continue;
        }
      }

      elements.push(
        <pre
          key={`pre-${i}`}
          className="my-3 overflow-x-auto rounded bg-gray-100 p-3 text-sm dark:bg-gray-800"
        >
          <code>{codeContent}</code>
        </pre>,
      );
      continue;
    }

    // Heading
    const headingMatch = line.match(/^(#{1,6})\s+(.*)/);
    if (headingMatch) {
      const level = headingMatch[1]?.length ?? 1;
      const clampedLevel = Math.min(Math.max(level, 1), 6) as 1 | 2 | 3 | 4 | 5 | 6;
      const headingText = headingMatch[2] ?? "";
      const Tag = HEADING_TAGS[clampedLevel];
      const sizeClass = HEADING_SIZES[clampedLevel] ?? "";
      elements.push(
        React.createElement(
          Tag,
          { key: `h-${i}`, className: `${sizeClass} my-3 font-semibold` },
          renderInline(headingText, onLinkClick, onCreateNote, existingNotes, `h${i}`),
        ),
      );
      i++;
      continue;
    }

    // Horizontal rule
    if (/^[-*_]{3,}$/.test(line.trim())) {
      elements.push(<hr key={`hr-${i}`} className="my-4 border-gray-200 dark:border-gray-700" />);
      i++;
      continue;
    }

    // Blockquote
    if (line.startsWith(">")) {
      const bqLines: string[] = [];
      while (i < lines.length && (lines[i] ?? "").startsWith(">")) {
        bqLines.push((lines[i] ?? "").slice(1).trimStart());
        i++;
      }
      elements.push(
        <blockquote
          key={`bq-${i}`}
          className="my-3 border-l-4 border-violet-300 pl-4 italic text-gray-600 dark:border-violet-700 dark:text-gray-400"
        >
          {bqLines.join(" ")}
        </blockquote>,
      );
      continue;
    }

    // Unordered list
    if (/^[-*+]\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*+]\s/.test(lines[i] ?? "")) {
        items.push((lines[i] ?? "").slice(2));
        i++;
      }
      elements.push(
        <ul key={`ul-${i}`} className="my-2 list-disc space-y-1 pl-6">
          {items.map((item, j) => (
            <li key={j}>
              {renderInline(item, onLinkClick, onCreateNote, existingNotes, `ul${i}-${j}`)}
            </li>
          ))}
        </ul>,
      );
      continue;
    }

    // Ordered list
    if (/^\d+\.\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i] ?? "")) {
        items.push((lines[i] ?? "").replace(/^\d+\.\s/, ""));
        i++;
      }
      elements.push(
        <ol key={`ol-${i}`} className="my-2 list-decimal space-y-1 pl-6">
          {items.map((item, j) => (
            <li key={j}>
              {renderInline(item, onLinkClick, onCreateNote, existingNotes, `ol${i}-${j}`)}
            </li>
          ))}
        </ol>,
      );
      continue;
    }

    // Empty line → paragraph break
    if (line.trim() === "") {
      i++;
      continue;
    }

    // Paragraph — collect consecutive non-empty, non-special lines
    const paraLines: string[] = [];
    while (
      i < lines.length &&
      (lines[i] ?? "").trim() !== "" &&
      !/^(#{1,6}\s|>|[-*+]\s|\d+\.\s|```|[-*_]{3,})/.test(lines[i] ?? "")
    ) {
      paraLines.push(lines[i] ?? "");
      i++;
    }

    if (paraLines.length > 0) {
      elements.push(
        <p key={`p-${i}`} className="my-2 leading-relaxed">
          {renderInline(
            paraLines.join(" "),
            onLinkClick,
            onCreateNote,
            existingNotes,
            `p${i}`,
          )}
        </p>,
      );
    }
  }

  return elements;
}

/**
 * NotePreview — renders markdown content as React elements.
 *
 * Lightweight built-in renderer: supports headings, bold/italic/code, fenced
 * code blocks, blockquotes, lists, horizontal rules, and wiki-links `[[Name]]`.
 * Consumers can supply a `getCodeFenceRenderer` for custom code-fence blocks
 * (e.g. Dataview queries).
 *
 * Wiki-links are rendered as clickable anchors. Broken links (when
 * `existingNotes` is provided and the target is missing) are styled in red and
 * trigger `onCreateNote` on click.
 */
export function NotePreview({
  content,
  onLinkClick,
  onCreateNote,
  getCodeFenceRenderer,
  notePath = "",
  existingNotes,
  className,
}: NotePreviewProps) {
  const elements = React.useMemo(
    () =>
      parseMarkdown(content, {
        onLinkClick,
        onCreateNote,
        existingNotes,
        getCodeFenceRenderer,
        notePath,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [content, notePath],
  );

  return (
    <div
      className={
        className ??
        "markdown-preview mx-auto max-w-3xl p-6 text-gray-900 dark:text-gray-100"
      }
    >
      {elements}
    </div>
  );
}
