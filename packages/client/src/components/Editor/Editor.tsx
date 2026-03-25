import { useEffect, useRef, useCallback } from 'react';
import { EditorState, Extension } from '@codemirror/state';
import { EditorView, keymap, placeholder, ViewUpdate } from '@codemirror/view';
import { defaultKeymap, indentWithTab, history, historyKeymap } from '@codemirror/commands';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { syntaxHighlighting, defaultHighlightStyle, bracketMatching } from '@codemirror/language';
import { oneDark } from '@codemirror/theme-one-dark';
import { autocompletion, CompletionContext, CompletionResult } from '@codemirror/autocomplete';
import { search as cmSearch, searchKeymap } from '@codemirror/search';
import { FileNode } from '../../lib/api';
import { collectNotePaths } from '../../lib/noteTreeUtils';

export interface EditorCursorState {
  line: number;
  col: number;
  wordCount: number;
}

interface EditorProps {
  content: string;
  onChange: (content: string) => void;
  darkMode: boolean;
  allNotes: FileNode[];
  onCursorStateChange?: (state: EditorCursorState) => void;
  viewRef?: React.MutableRefObject<EditorView | undefined>;
  pluginExtensions?: Extension[];
}

function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

export function Editor({ content, onChange, darkMode, allNotes, onCursorStateChange, viewRef: externalViewRef, pluginExtensions = [] }: EditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView>(undefined);
  const onChangeRef = useRef(onChange);
  const allNotesRef = useRef(allNotes);
  const onCursorStateChangeRef = useRef(onCursorStateChange);

  onChangeRef.current = onChange;
  allNotesRef.current = allNotes;
  onCursorStateChangeRef.current = onCursorStateChange;

  const wikiLinkCompletion = useCallback((context: CompletionContext): CompletionResult | null => {
    const before = context.matchBefore(/\[\[([^\]]*)$/);
    if (!before) return null;

    const query = before.text.slice(2).toLowerCase();
    const paths = collectNotePaths(allNotesRef.current);

    const options = paths
      .filter(p => p.toLowerCase().includes(query))
      .map(p => ({
        label: p,
        apply: `${p}]]`,
        type: 'text' as const,
      }));

    return {
      from: before.from + 2,
      options,
      validFor: /^[^\]]*$/,
    };
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    const emitCursorState = (view: EditorView) => {
      if (!onCursorStateChangeRef.current) return;
      const pos = view.state.selection.main.head;
      const line = view.state.doc.lineAt(pos);
      onCursorStateChangeRef.current({
        line: line.number,
        col: pos - line.from + 1,
        wordCount: countWords(view.state.doc.toString()),
      });
    };

    const updateListener = EditorView.updateListener.of((update: ViewUpdate) => {
      if (update.docChanged) {
        onChangeRef.current(update.state.doc.toString());
      }
      emitCursorState(update.view);
    });

    const themeExtensions = darkMode ? [oneDark] : [];

    const state = EditorState.create({
      doc: content,
      extensions: [
        ...pluginExtensions,
        ...themeExtensions,
        markdown({ base: markdownLanguage }),
        syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
        bracketMatching(),
        history(),
        cmSearch(),
        autocompletion({
          override: [wikiLinkCompletion],
          activateOnTyping: true,
        }),
        keymap.of([
          ...defaultKeymap,
          ...historyKeymap,
          ...searchKeymap,
          indentWithTab,
        ]),
        placeholder('Start writing...'),
        updateListener,
        EditorView.lineWrapping,
        EditorView.theme({
          '&': { height: '100%' },
          '.cm-scroller': { overflow: 'auto' },
        }),
      ],
    });

    const view = new EditorView({
      state,
      parent: containerRef.current,
    });

    viewRef.current = view;
    if (externalViewRef) externalViewRef.current = view;

    // Fire initial cursor state
    if (onCursorStateChangeRef.current) {
      onCursorStateChangeRef.current({
        line: 1,
        col: 1,
        wordCount: countWords(content),
      });
    }

    return () => {
      view.destroy();
    };
    // Only re-create editor when darkMode or plugin extensions change, not on every content change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [darkMode, wikiLinkCompletion, pluginExtensions]);

  // Sync content from parent when it changes externally (e.g., switching notes)
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;

    const currentContent = view.state.doc.toString();
    if (currentContent !== content) {
      view.dispatch({
        changes: {
          from: 0,
          to: currentContent.length,
          insert: content,
        },
      });
    }
  }, [content]);

  return <div ref={containerRef} className="h-full w-full" />;
}
