import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  OutgoingLinksPanel,
  buildNotePathMap,
  extractOutgoingLinks,
  resolveOutgoingLinks,
} from "../OutgoingLinksPanel";

// ─── Pure helpers ─────────────────────────────────────────────────────────────

describe("extractOutgoingLinks", () => {
  it("extracts [[wiki-links]] from content", () => {
    const content = "Hello [[Alpha]] and [[Beta]]";
    expect(extractOutgoingLinks(content)).toEqual(["Alpha", "Beta"]);
  });

  it("deduplicates links (case-insensitive)", () => {
    const content = "[[Alpha]] and [[alpha]]";
    expect(extractOutgoingLinks(content)).toHaveLength(1);
  });

  it("returns empty array for content with no links", () => {
    expect(extractOutgoingLinks("No links here")).toEqual([]);
  });
});

describe("buildNotePathMap", () => {
  it("maps name (no ext) to path", () => {
    const map = buildNotePathMap([
      { name: "Alpha.md", path: "folder/Alpha.md" },
    ]);
    expect(map.get("alpha")).toBe("folder/Alpha.md");
  });
});

describe("resolveOutgoingLinks", () => {
  it("marks existing links as resolved", () => {
    const map = new Map([["alpha", "Alpha.md"]]);
    const result = resolveOutgoingLinks(["Alpha"], map);
    expect(result[0]!.exists).toBe(true);
    expect(result[0]!.path).toBe("Alpha.md");
  });

  it("marks missing links as broken", () => {
    const map = new Map<string, string>();
    const result = resolveOutgoingLinks(["Missing"], map);
    expect(result[0]!.exists).toBe(false);
    expect(result[0]!.path).toBeNull();
  });
});

// ─── OutgoingLinksPanel ───────────────────────────────────────────────────────

describe("OutgoingLinksPanel", () => {
  const existingLink = { name: "Alpha", path: "Alpha.md", exists: true };
  const brokenLink = { name: "Broken", path: null, exists: false };

  it("returns null when no links are provided", () => {
    const { container } = render(
      <OutgoingLinksPanel
        links={[]}
        onNoteSelect={vi.fn()}
        onCreateNote={vi.fn()}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders collapsed by default", () => {
    render(
      <OutgoingLinksPanel
        links={[existingLink]}
        onNoteSelect={vi.fn()}
        onCreateNote={vi.fn()}
      />,
    );
    expect(screen.queryByText("Alpha")).not.toBeInTheDocument();
  });

  it("expands when header is clicked", () => {
    render(
      <OutgoingLinksPanel
        links={[existingLink]}
        onNoteSelect={vi.fn()}
        onCreateNote={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByText(/outgoing links/i));
    expect(screen.getByText("Alpha")).toBeInTheDocument();
  });

  it("shows broken count badge", () => {
    render(
      <OutgoingLinksPanel
        links={[existingLink, brokenLink]}
        onNoteSelect={vi.fn()}
        onCreateNote={vi.fn()}
      />,
    );
    expect(screen.getByText(/1 broken/i)).toBeInTheDocument();
  });

  it("calls onNoteSelect for existing links", () => {
    const onNoteSelect = vi.fn();
    render(
      <OutgoingLinksPanel
        links={[existingLink]}
        onNoteSelect={onNoteSelect}
        onCreateNote={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByText(/outgoing links/i));
    fireEvent.click(screen.getByText("Alpha"));
    expect(onNoteSelect).toHaveBeenCalledWith("Alpha.md");
  });

  it("calls onCreateNote for broken links", () => {
    const onCreateNote = vi.fn();
    render(
      <OutgoingLinksPanel
        links={[brokenLink]}
        onNoteSelect={vi.fn()}
        onCreateNote={onCreateNote}
      />,
    );
    fireEvent.click(screen.getByText(/outgoing links/i));
    fireEvent.click(screen.getByText("Broken"));
    expect(onCreateNote).toHaveBeenCalledWith("Broken");
  });
});
