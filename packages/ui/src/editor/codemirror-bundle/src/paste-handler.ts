import type { EditorView } from "@codemirror/view";

interface PasteRequest {
  pasteId: string;
  filename: string;
  mimeType: string;
  base64: string;
}

export function makePasteHandler(onImagePaste: (req: PasteRequest) => void) {
  return function paste(event: ClipboardEvent, view: EditorView): boolean {
    const items = event.clipboardData?.items;
    if (!items) return false;

    for (let i = 0; i < items.length; i++) {
      const item = items[i]!;
      if (item.kind === "file" && item.type.startsWith("image/")) {
        event.preventDefault();
        const file = item.getAsFile();
        if (!file) continue;

        const reader = new FileReader();
        reader.onload = () => {
          const result = String(reader.result);
          const base64 = result.includes(",") ? result.split(",")[1]! : "";
          const pasteId = String(Math.random()).slice(2, 12);
          const placeholder = `![](uploading:${pasteId})`;
          const pos = view.state.selection.main.from;
          view.dispatch({ changes: { from: pos, insert: placeholder } });
          onImagePaste({
            pasteId,
            filename: file.name || "pasted-image.png",
            mimeType: file.type || "image/png",
            base64,
          });
        };
        reader.readAsDataURL(file);
        return true;
      }
    }
    return false;
  };
}
