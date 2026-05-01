import { EditorState } from "@codemirror/state";
import { EditorView, keymap } from "@codemirror/view";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { markdown } from "@codemirror/lang-markdown";
import { vim } from "@replit/codemirror-vim";
import * as Y from "yjs";
import { yCollab } from "y-codemirror.next";
import { Awareness, applyAwarenessUpdate, encodeAwarenessUpdate } from "y-protocols/awareness";
import { setupChunkedReceiver, sendChunked } from "./chunked-postmessage";
import { makePasteHandler } from "./paste-handler";
import { lightTheme } from "./theme";

declare global {
  interface Window {
    ReactNativeWebView?: { postMessage: (msg: string) => void };
  }
}

const yDoc = new Y.Doc();
const yText = yDoc.getText("body");
const awareness = new Awareness(yDoc);

let view: EditorView | null = null;
let initialized = false;

function postToRn(obj: unknown) {
  const json = JSON.stringify(obj);
  // Chunk if >64KB
  if (json.length > 64 * 1024) {
    sendChunked(window.ReactNativeWebView!.postMessage.bind(window.ReactNativeWebView), obj as { type: string; [k: string]: unknown });
  } else {
    window.ReactNativeWebView?.postMessage(json);
  }
}

function bytesToBase64(bytes: Uint8Array): string {
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]!);
  return btoa(s);
}
function base64ToBytes(b64: string): Uint8Array {
  const raw = atob(b64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

const chunkedReceiver = setupChunkedReceiver();

function handleMessage(msg: { type: string; [k: string]: unknown }) {
  // Reassemble chunks if applicable
  const reassembled = chunkedReceiver(msg);
  if (reassembled === null) return; // still buffering
  msg = reassembled;

  switch (msg.type) {
    case "yjs:initial-state": {
      const update = base64ToBytes(msg.payload as string);
      Y.applyUpdate(yDoc, update, "remote");
      if (!initialized) mountEditor();
      break;
    }
    case "yjs:remote-update": {
      const update = base64ToBytes(msg.payload as string);
      Y.applyUpdate(yDoc, update, "remote");
      break;
    }
    case "awareness:update": {
      const update = base64ToBytes(msg.payload as string);
      applyAwarenessUpdate(awareness, update, "remote");
      break;
    }
    case "paste:image:resolved": {
      const { pasteId, attachmentRef } = msg as unknown as { pasteId: string; attachmentRef: string };
      replacePlaceholder(pasteId, attachmentRef);
      break;
    }
  }
}

function replacePlaceholder(pasteId: string, ref: string) {
  if (!view) return;
  const text = yText.toString();
  const placeholder = `![](uploading:${pasteId})`;
  const idx = text.indexOf(placeholder);
  if (idx < 0) return;
  yDoc.transact(() => {
    yText.delete(idx, placeholder.length);
    yText.insert(idx, `![](${ref})`);
  });
}

function mountEditor() {
  initialized = true;

  yDoc.on("update", (update: Uint8Array, origin: unknown) => {
    if (origin === "remote") return;
    postToRn({ type: "yjs:update", payload: bytesToBase64(update) });
  });

  awareness.on("update", () => {
    const update = encodeAwarenessUpdate(awareness, [awareness.clientID]);
    postToRn({ type: "awareness:update", payload: bytesToBase64(update) });
  });

  const pasteHandler = makePasteHandler((paste) => postToRn({ type: "paste:image", ...paste }));

  view = new EditorView({
    state: EditorState.create({
      doc: yText.toString(),
      extensions: [
        history(),
        keymap.of([...defaultKeymap, ...historyKeymap]),
        markdown(),
        vim(),
        yCollab(yText, awareness),
        EditorView.domEventHandlers({ paste: pasteHandler }),
        EditorView.lineWrapping,
        lightTheme,
      ],
    }),
    parent: document.getElementById("editor")!,
  });

  view.focus();
  postToRn({ type: "editor:ready" });
}

document.addEventListener("message", (e: MessageEvent | Event) => {
  try {
    const data = (e as MessageEvent).data;
    handleMessage(JSON.parse(typeof data === "string" ? data : ""));
  } catch (err) {
    console.error("editor message parse failed", err);
  }
});

// iOS uses window.addEventListener; Android sometimes uses document
window.addEventListener("message", (e) => {
  try { handleMessage(JSON.parse(e.data)); } catch { /* ignore */ }
});
