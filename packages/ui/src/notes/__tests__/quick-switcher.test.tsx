import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { NoteQuickSwitcher } from "../NoteQuickSwitcher";

const NOTES = [
  { path: "folder/alpha.md", name: "alpha" },
  { path: "folder/beta.md", name: "beta" },
  { path: "gamma.md", name: "gamma" },
];

describe("NoteQuickSwitcher", () => {
  it("renders the search input", () => {
    render(
      <NoteQuickSwitcher notes={NOTES} onSelect={vi.fn()} onClose={vi.fn()} />,
    );
    expect(
      screen.getByPlaceholderText(/type to search notes/i),
    ).toBeInTheDocument();
  });

  it("shows all notes when query is empty", () => {
    render(
      <NoteQuickSwitcher notes={NOTES} onSelect={vi.fn()} onClose={vi.fn()} />,
    );
    expect(screen.getByText("alpha")).toBeInTheDocument();
    expect(screen.getByText("beta")).toBeInTheDocument();
    expect(screen.getByText("gamma")).toBeInTheDocument();
  });

  it("filters notes by fuzzy match on name", () => {
    render(
      <NoteQuickSwitcher notes={NOTES} onSelect={vi.fn()} onClose={vi.fn()} />,
    );
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "alp" } });
    expect(screen.getByText("alpha")).toBeInTheDocument();
    expect(screen.queryByText("beta")).not.toBeInTheDocument();
  });

  it("shows 'no notes found' when filter matches nothing", () => {
    render(
      <NoteQuickSwitcher notes={NOTES} onSelect={vi.fn()} onClose={vi.fn()} />,
    );
    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "zzz" },
    });
    expect(screen.getByText(/no notes found/i)).toBeInTheDocument();
  });

  it("calls onSelect and onClose when a note is clicked", () => {
    const onSelect = vi.fn();
    const onClose = vi.fn();
    render(
      <NoteQuickSwitcher
        notes={NOTES}
        onSelect={onSelect}
        onClose={onClose}
      />,
    );
    fireEvent.click(screen.getByText("alpha"));
    expect(onSelect).toHaveBeenCalledWith("folder/alpha.md");
    expect(onClose).toHaveBeenCalled();
  });

  it("calls onClose when Escape is pressed", () => {
    const onClose = vi.fn();
    render(
      <NoteQuickSwitcher notes={NOTES} onSelect={vi.fn()} onClose={onClose} />,
    );
    fireEvent.keyDown(screen.getByRole("combobox"), { key: "Escape" });
    expect(onClose).toHaveBeenCalled();
  });

  it("navigates with ArrowDown / Enter", () => {
    const onSelect = vi.fn();
    const onClose = vi.fn();
    render(
      <NoteQuickSwitcher
        notes={NOTES}
        onSelect={onSelect}
        onClose={onClose}
      />,
    );
    const input = screen.getByRole("combobox");
    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "Enter" });
    // After ArrowDown from index 0 we should be at index 1 (beta)
    expect(onSelect).toHaveBeenCalledWith("folder/beta.md");
  });
});
