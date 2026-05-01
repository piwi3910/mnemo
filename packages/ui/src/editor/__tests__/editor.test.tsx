import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { fireEvent } from "@testing-library/react";
import { NoteEditor } from "../NoteEditor";
import { NotePreview } from "../NotePreview";
import { EditorToolbar } from "../EditorToolbar";

// ---------------------------------------------------------------------------
// NoteEditor
// ---------------------------------------------------------------------------

describe("NoteEditor", () => {
  beforeEach(() => {
    // Mock dynamic import of editor.html to avoid file-system issues in tests
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        text: () => Promise.resolve("<html><body>editor</body></html>"),
      }),
    );
  });

  it("renders a loading placeholder initially", () => {
    const { container } = render(<NoteEditor />);
    // Initially srcdoc is null — no iframe yet
    expect(container.querySelector("iframe")).toBeNull();
    expect(
      container.querySelector('[aria-label="Loading editor…"]'),
    ).toBeInTheDocument();
  });

  it("renders iframe after editor html loads", async () => {
    const { container, findByTitle } = render(<NoteEditor />);
    const iframe = await findByTitle("Note editor");
    expect(iframe.tagName).toBe("IFRAME");
    expect(iframe).toBeInTheDocument();
  });

  it("sets srcDoc on the iframe", async () => {
    const { findByTitle } = render(<NoteEditor />);
    const iframe = (await findByTitle("Note editor")) as HTMLIFrameElement;
    // jsdom lowercases attribute as srcdoc
    expect(iframe.getAttribute("srcdoc") ?? iframe.srcdoc).toContain("<html>");
  });

  it("accepts className and style props", () => {
    const { container } = render(
      <NoteEditor className="my-class" style={{ height: "500px" }} />,
    );
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain("my-class");
  });
});

// ---------------------------------------------------------------------------
// NotePreview
// ---------------------------------------------------------------------------

describe("NotePreview", () => {
  it("renders plain text content", () => {
    render(<NotePreview content="Hello world" onLinkClick={vi.fn()} />);
    expect(screen.getByText("Hello world")).toBeInTheDocument();
  });

  it("renders headings", () => {
    render(<NotePreview content="# Heading One" onLinkClick={vi.fn()} />);
    const h1 = screen.getByRole("heading", { level: 1 });
    expect(h1).toBeInTheDocument();
    expect(h1.textContent).toBe("Heading One");
  });

  it("renders h2 and h3", () => {
    render(
      <NotePreview
        content={"## Second\n### Third"}
        onLinkClick={vi.fn()}
      />,
    );
    expect(screen.getByRole("heading", { level: 2 })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3 })).toBeInTheDocument();
  });

  it("renders wiki-links as anchors", () => {
    render(
      <NotePreview content="See [[My Note]]" onLinkClick={vi.fn()} />,
    );
    const link = screen.getByText("My Note");
    expect(link.tagName).toBe("A");
  });

  it("calls onLinkClick when wiki-link is clicked", () => {
    const onLinkClick = vi.fn();
    render(
      <NotePreview content="[[Target Note]]" onLinkClick={onLinkClick} />,
    );
    fireEvent.click(screen.getByText("Target Note"));
    expect(onLinkClick).toHaveBeenCalledWith("Target Note");
  });

  it("marks broken wiki-links in red when existingNotes provided", () => {
    render(
      <NotePreview
        content="[[Missing Note]]"
        onLinkClick={vi.fn()}
        existingNotes={new Set(["other.md"])}
      />,
    );
    const link = screen.getByText("Missing Note");
    expect(link.className).toMatch(/red/);
  });

  it("calls onCreateNote when broken link is clicked", () => {
    const onCreateNote = vi.fn();
    render(
      <NotePreview
        content="[[Ghost Note]]"
        onLinkClick={vi.fn()}
        onCreateNote={onCreateNote}
        existingNotes={new Set()}
      />,
    );
    fireEvent.click(screen.getByText("Ghost Note"));
    expect(onCreateNote).toHaveBeenCalledWith("Ghost Note");
  });

  it("renders bold text", () => {
    render(<NotePreview content="**bold text**" onLinkClick={vi.fn()} />);
    const strong = document.querySelector("strong");
    expect(strong?.textContent).toBe("bold text");
  });

  it("renders italic text", () => {
    render(<NotePreview content="*italic text*" onLinkClick={vi.fn()} />);
    const em = document.querySelector("em");
    expect(em?.textContent).toBe("italic text");
  });

  it("renders inline code", () => {
    render(<NotePreview content="`const x = 1`" onLinkClick={vi.fn()} />);
    const code = document.querySelector("code");
    expect(code?.textContent).toBe("const x = 1");
  });

  it("renders fenced code block", () => {
    render(
      <NotePreview
        content={"```js\nconst x = 1;\n```"}
        onLinkClick={vi.fn()}
      />,
    );
    expect(document.querySelector("pre")).toBeInTheDocument();
  });

  it("renders unordered list", () => {
    render(
      <NotePreview content={"- Alpha\n- Beta"} onLinkClick={vi.fn()} />,
    );
    expect(screen.getByText("Alpha")).toBeInTheDocument();
    expect(screen.getByText("Beta")).toBeInTheDocument();
    expect(document.querySelector("ul")).toBeInTheDocument();
  });

  it("renders ordered list", () => {
    render(
      <NotePreview content={"1. First\n2. Second"} onLinkClick={vi.fn()} />,
    );
    expect(document.querySelector("ol")).toBeInTheDocument();
  });

  it("renders blockquote", () => {
    render(<NotePreview content="> A quote" onLinkClick={vi.fn()} />);
    expect(document.querySelector("blockquote")).toBeInTheDocument();
  });

  it("renders horizontal rule", () => {
    render(<NotePreview content="---" onLinkClick={vi.fn()} />);
    expect(document.querySelector("hr")).toBeInTheDocument();
  });

  it("accepts custom className", () => {
    const { container } = render(
      <NotePreview
        content=""
        onLinkClick={vi.fn()}
        className="custom-preview"
      />,
    );
    expect(container.firstChild).toHaveClass("custom-preview");
  });
});

// ---------------------------------------------------------------------------
// EditorToolbar
// ---------------------------------------------------------------------------

describe("EditorToolbar", () => {
  it("renders the toolbar element", () => {
    render(<EditorToolbar onCommand={vi.fn()} />);
    expect(screen.getByRole("toolbar")).toBeInTheDocument();
  });

  it("calls onCommand('bold') on Bold button click", () => {
    const onCommand = vi.fn();
    render(<EditorToolbar onCommand={onCommand} />);
    fireEvent.click(screen.getByRole("button", { name: /bold/i }));
    expect(onCommand).toHaveBeenCalledWith("bold");
  });

  it("calls onCommand('italic') on Italic button click", () => {
    const onCommand = vi.fn();
    render(<EditorToolbar onCommand={onCommand} />);
    fireEvent.click(screen.getByRole("button", { name: /italic/i }));
    expect(onCommand).toHaveBeenCalledWith("italic");
  });

  it("calls onCommand('undo') on Undo button click", () => {
    const onCommand = vi.fn();
    render(<EditorToolbar onCommand={onCommand} />);
    fireEvent.click(screen.getByRole("button", { name: /undo/i }));
    expect(onCommand).toHaveBeenCalledWith("undo");
  });

  it("calls onCommand('redo') on Redo button click", () => {
    const onCommand = vi.fn();
    render(<EditorToolbar onCommand={onCommand} />);
    fireEvent.click(screen.getByRole("button", { name: /redo/i }));
    expect(onCommand).toHaveBeenCalledWith("redo");
  });

  it("calls onCommand('table') on Table button click", () => {
    const onCommand = vi.fn();
    render(<EditorToolbar onCommand={onCommand} />);
    fireEvent.click(screen.getByRole("button", { name: /insert table/i }));
    expect(onCommand).toHaveBeenCalledWith("table");
  });

  it("renders view-mode buttons when onViewModeChange provided", () => {
    render(
      <EditorToolbar
        onCommand={vi.fn()}
        onViewModeChange={vi.fn()}
        viewMode="edit"
      />,
    );
    expect(screen.getByRole("button", { name: /edit mode/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /preview mode/i })).toBeInTheDocument();
  });

  it("calls onViewModeChange('preview') when preview button clicked", () => {
    const onViewModeChange = vi.fn();
    render(
      <EditorToolbar
        onCommand={vi.fn()}
        onViewModeChange={onViewModeChange}
        viewMode="edit"
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /preview mode/i }));
    expect(onViewModeChange).toHaveBeenCalledWith("preview");
  });

  it("does not render view-mode buttons when onViewModeChange not provided", () => {
    render(<EditorToolbar onCommand={vi.fn()} />);
    expect(screen.queryByRole("button", { name: /edit mode/i })).not.toBeInTheDocument();
  });

  it("renders upload button when onUploadImage provided", () => {
    render(
      <EditorToolbar onCommand={vi.fn()} onUploadImage={vi.fn()} />,
    );
    expect(
      screen.getByRole("button", { name: /upload image/i }),
    ).toBeInTheDocument();
  });
});
