import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { NoteEditorReact } from "../NoteEditorReact";

// CodeMirror requires a real DOM layout that jsdom doesn't fully provide.
// We just verify the component mounts without throwing and renders its container div.

describe("NoteEditorReact", () => {
  it("mounts without errors", () => {
    const { container } = render(
      <NoteEditorReact content="# Hello" onChange={vi.fn()} />,
    );
    expect(container.querySelector("div")).toBeInTheDocument();
  });

  it("accepts darkMode prop without errors", () => {
    const { container } = render(
      <NoteEditorReact content="" onChange={vi.fn()} darkMode />,
    );
    expect(container.querySelector("div")).toBeInTheDocument();
  });
});
