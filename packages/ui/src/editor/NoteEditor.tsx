import * as React from "react";
import type * as Y from "yjs";

// The editor.html bundle is a static asset bundled alongside this package.
// We inline it at module load time so the component can set `srcdoc` without
// an HTTP request (works in Electron, plain web, and test environments alike).
//
// Vite / webpack will inline small assets via `?raw`; for TypeScript-only
// builds we fall back to a runtime `fetch` via `editorHtmlPromise`.
let _editorHtml: string | null = null;

async function loadEditorHtml(): Promise<string> {
  if (_editorHtml !== null) return _editorHtml;
  try {
    // Dynamic import with ?raw (Vite). In non-Vite environments this throws
    // and we fall back to the fetch path below.
    // @ts-expect-error — Vite-specific raw import
    const mod = await import("./codemirror-bundle/dist/editor.html?raw");
    _editorHtml = mod.default as string;
  } catch {
    // Fallback: fetch the file relative to the current script location. This
    // works in Electron/Tauri renderers that serve assets from the filesystem.
    const url = new URL(
      "./codemirror-bundle/dist/editor.html",
      import.meta.url,
    );
    const resp = await fetch(url.toString());
    _editorHtml = await resp.text();
  }
  return _editorHtml!;
}

export interface NoteEditorProps {
  /** The Yjs document that backs this note. */
  yDoc?: Y.Doc;
  /**
   * Called when the user pastes an image into the editor (data URL or File).
   * Consumers should upload the file and return the resulting URL to insert.
   */
  onPasteImage?: (data: File | string) => Promise<string>;
  /** Additional CSS class names for the wrapper div. */
  className?: string;
  style?: React.CSSProperties;
}

/**
 * NoteEditor — wraps the CodeMirror + Yjs bundle that lives in
 * `codemirror-bundle/dist/editor.html` inside an `<iframe srcdoc>`.
 *
 * Bridge protocol (postMessage):
 * - Outbound (parent → iframe): `{ type: "yjs-update", update: Uint8Array }`
 * - Inbound  (iframe → parent): `{ type: "yjs-update", update: Uint8Array }`
 *                               `{ type: "paste-image", data: string | File }`
 */
export function NoteEditor({ yDoc, onPasteImage, className, style }: NoteEditorProps) {
  const iframeRef = React.useRef<HTMLIFrameElement>(null);
  const [srcdoc, setSrcdoc] = React.useState<string | null>(null);

  // Load editor HTML once
  React.useEffect(() => {
    let cancelled = false;
    loadEditorHtml().then((html) => {
      if (!cancelled) setSrcdoc(html);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Bridge: Yjs document → iframe
  React.useEffect(() => {
    if (!yDoc || !srcdoc) return;

    const iframe = iframeRef.current;
    if (!iframe) return;

    const sendUpdate = (update: Uint8Array) => {
      iframe.contentWindow?.postMessage(
        { type: "yjs-update", update },
        "*",
      );
    };

    // Send current state snapshot once iframe is ready
    const handleLoad = () => {
      const { Y } = iframe.contentWindow as Window & { Y?: typeof import("yjs") };
      if (Y) {
        const state = Y.encodeStateAsUpdate(yDoc);
        sendUpdate(state);
      }
    };
    iframe.addEventListener("load", handleLoad);

    // Forward incremental updates
    const handler = (update: Uint8Array, _origin: unknown) => {
      sendUpdate(update);
    };
    yDoc.on("update", handler);

    return () => {
      iframe.removeEventListener("load", handleLoad);
      yDoc.off("update", handler);
    };
  }, [yDoc, srcdoc]);

  // Bridge: iframe → Yjs document + paste-image
  React.useEffect(() => {
    if (!srcdoc) return;

    const handleMessage = (event: MessageEvent) => {
      if (!event.data || typeof event.data !== "object") return;
      const { type, update, data } = event.data as {
        type: string;
        update?: Uint8Array;
        data?: string | File;
      };

      if (type === "yjs-update" && yDoc && update) {
        const { Y } = (event.source as Window & { Y?: typeof import("yjs") }) ?? {};
        if (Y) {
          Y.applyUpdate(yDoc, update);
        }
      }

      if (type === "paste-image" && onPasteImage && data) {
        onPasteImage(data).then((url) => {
          iframeRef.current?.contentWindow?.postMessage(
            { type: "paste-image-result", url },
            "*",
          );
        });
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [yDoc, onPasteImage, srcdoc]);

  return (
    <div
      className={className}
      style={{ display: "flex", flexDirection: "column", flex: 1, ...style }}
    >
      {srcdoc ? (
        <iframe
          ref={iframeRef}
          title="Note editor"
          srcDoc={srcdoc}
          sandbox="allow-scripts allow-same-origin"
          style={{ flex: 1, border: "none", width: "100%", height: "100%" }}
        />
      ) : (
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          aria-label="Loading editor…"
        />
      )}
    </div>
  );
}
