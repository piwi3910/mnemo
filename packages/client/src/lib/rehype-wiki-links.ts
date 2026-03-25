import { visit } from 'unist-util-visit';
import type { Node } from 'unist';

interface Options {
  existingNotes: Set<string>;
}

/**
 * Rehype plugin that post-processes wiki-link anchors produced by remark-wiki-link.
 *
 * remark-wiki-link emits `<a class="internal ...">` elements. This plugin:
 * - Adds `data-wiki-target` with the original note name
 * - Adds `data-broken` ("true" / "false") based on whether the note exists
 * - Normalises class names to `wiki-link` / `wiki-link wiki-link-broken`
 * - Sets `href="#"` so the click handler in Preview.tsx can intercept navigation
 * - Adds a tooltip on broken links
 */
export function rehypeWikiLinks(options: Options) {
  const { existingNotes } = options;

  return (tree: Node) => {
    visit(tree, 'element', (node: Record<string, unknown>) => {
      const props = node.properties as Record<string, unknown> | undefined;
      if (!props) return;

      const tagName = node.tagName as string;
      const classNames = props.className as string[] | undefined;

      // remark-wiki-link adds class "internal" (and "new" for missing pages)
      if (tagName !== 'a' || !classNames?.includes('internal')) return;

      // Extract the note name from href produced by hrefTemplate
      const href = (props.href as string) || '';
      // Our hrefTemplate produces "/<noteName>" so strip leading slash
      const noteName = decodeURIComponent(href.replace(/^\//, ''));

      const isBroken = !existingNotes.has(noteName.toLowerCase());

      props['data-wiki-target'] = noteName;
      props['data-broken'] = isBroken ? 'true' : 'false';
      props.className = isBroken ? ['wiki-link', 'wiki-link-broken'] : ['wiki-link'];
      props.href = '#';

      if (isBroken) {
        props.title = `Note "${noteName}" not found — click to create`;
      }
    });
  };
}
