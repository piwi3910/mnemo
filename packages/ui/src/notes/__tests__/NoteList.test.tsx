import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { NoteList } from "../NoteList";
import { NoteCard } from "../NoteCard";
import type { NoteData } from "../../data/types";

const makeNote = (overrides: Partial<NoteData> = {}): NoteData => ({
  id: "n1",
  path: "notes/first.md",
  title: "First",
  tags: "[]",
  modifiedAt: 0,
  version: 0,
  ...overrides,
});

describe("NoteList", () => {
  it("renders notes by title", () => {
    const notes: NoteData[] = [
      makeNote({ id: "1", path: "a", title: "First" }),
      makeNote({ id: "2", path: "b", title: "Second" }),
    ];
    render(<NoteList notes={notes} onSelect={() => {}} />);
    expect(screen.getByText("First")).toBeInTheDocument();
    expect(screen.getByText("Second")).toBeInTheDocument();
  });

  it("calls onSelect with the note path when clicked", () => {
    const onSelect = vi.fn();
    const notes: NoteData[] = [makeNote({ id: "1", path: "a/note.md", title: "First" })];
    render(<NoteList notes={notes} onSelect={onSelect} />);
    fireEvent.click(screen.getByText("First"));
    expect(onSelect).toHaveBeenCalledWith("a/note.md");
  });

  it("renders empty message when no notes", () => {
    render(<NoteList notes={[]} onSelect={() => {}} emptyMessage="Nothing here" />);
    expect(screen.getByText("Nothing here")).toBeInTheDocument();
  });

  it("highlights active note", () => {
    const notes: NoteData[] = [makeNote({ id: "1", path: "active.md", title: "Active" })];
    render(<NoteList notes={notes} activeNotePath="active.md" onSelect={() => {}} />);
    const card = screen.getByText("Active").closest("[role='button']");
    expect(card?.className).toMatch(/violet/);
  });
});

describe("NoteCard", () => {
  it("renders tags as badges", () => {
    const note = makeNote({ tags: '["react","typescript"]' });
    render(<NoteCard note={note} onSelect={() => {}} />);
    expect(screen.getByText("react")).toBeInTheDocument();
    expect(screen.getByText("typescript")).toBeInTheDocument();
  });

  it("shows star button and calls onToggleStar", () => {
    const onToggleStar = vi.fn();
    const note = makeNote({ path: "test.md" });
    render(<NoteCard note={note} isStarred={false} onSelect={() => {}} onToggleStar={onToggleStar} />);
    const starBtn = screen.getByRole("button", { name: /star note/i });
    fireEvent.click(starBtn);
    expect(onToggleStar).toHaveBeenCalledWith("test.md");
  });
});
