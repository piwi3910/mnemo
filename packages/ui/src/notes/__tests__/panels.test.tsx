import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { RecentNotesPanel } from "../RecentNotesPanel";
import { NewNoteButton } from "../NewNoteButton";
import type { NoteData } from "../../data/types";

const makeNote = (id: string, title: string, modifiedAt: number): NoteData => ({
  id,
  path: `notes/${title.toLowerCase()}.md`,
  title,
  tags: "[]",
  modifiedAt,
  version: 0,
});

describe("RecentNotesPanel", () => {
  it("renders notes sorted by most-recently-modified", () => {
    const notes: NoteData[] = [
      makeNote("1", "Older", 1000),
      makeNote("2", "Newer", 9000),
    ];
    render(<RecentNotesPanel notes={notes} onSelect={() => {}} formatDate={() => "today"} />);
    const items = screen.getAllByRole("button");
    // "Newer" should come first
    expect(items[0]).toHaveTextContent("Newer");
    expect(items[1]).toHaveTextContent("Older");
  });

  it("calls onSelect when a note is clicked", () => {
    const onSelect = vi.fn();
    const notes: NoteData[] = [makeNote("1", "Alpha", 1000)];
    render(<RecentNotesPanel notes={notes} onSelect={onSelect} />);
    fireEvent.click(screen.getByText("Alpha"));
    expect(onSelect).toHaveBeenCalledWith("notes/alpha.md");
  });

  it("shows empty message when no notes", () => {
    render(<RecentNotesPanel notes={[]} onSelect={() => {}} />);
    expect(screen.getByText(/no recent notes/i)).toBeInTheDocument();
  });

  it("respects the limit prop", () => {
    const notes: NoteData[] = Array.from({ length: 20 }, (_, i) =>
      makeNote(`n${i}`, `Note ${i}`, i),
    );
    render(<RecentNotesPanel notes={notes} onSelect={() => {}} limit={5} />);
    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBe(5);
  });
});

describe("NewNoteButton", () => {
  it("calls onClick when clicked", () => {
    const onClick = vi.fn();
    render(<NewNoteButton onClick={onClick} />);
    fireEvent.click(screen.getByRole("button", { name: /new note/i }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("renders custom label", () => {
    render(<NewNoteButton onClick={() => {}} label="Create note" />);
    expect(screen.getByText("Create note")).toBeInTheDocument();
  });
});
