import { EditorView } from "@codemirror/view";

export const lightTheme = EditorView.theme({
  "&": {
    fontSize: "16px",
    fontFamily: "ui-monospace, 'SFMono-Regular', 'Cascadia Mono', Menlo, monospace",
    height: "100%",
  },
  ".cm-scroller": { fontFamily: "inherit", lineHeight: "1.5" },
  ".cm-content": { padding: "16px" },
  ".cm-focused": { outline: "none" },
});
