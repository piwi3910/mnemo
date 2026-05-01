import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { OutlinePane, extractHeadings } from "../OutlinePane";

describe("extractHeadings", () => {
  it("extracts ATX headings from content", () => {
    const content = "# H1\n## H2\n### H3\nNormal text";
    const hs = extractHeadings(content);
    expect(hs).toHaveLength(3);
    expect(hs[0]).toEqual({ level: 1, text: "H1", line: 1 });
    expect(hs[1]).toEqual({ level: 2, text: "H2", line: 2 });
    expect(hs[2]).toEqual({ level: 3, text: "H3", line: 3 });
  });

  it("ignores non-heading lines", () => {
    expect(extractHeadings("Just a paragraph")).toHaveLength(0);
  });

  it("supports up to 6 heading levels", () => {
    const hs = extractHeadings("###### H6");
    expect(hs[0].level).toBe(6);
  });
});

describe("OutlinePane", () => {
  it("shows 'no headings' message when content has none", async () => {
    render(
      <OutlinePane
        content="No headings here"
        onJumpToLine={vi.fn()}
        debounceMs={0}
      />,
    );
    // Wait for debounce
    await act(async () => {
      await new Promise((r) => setTimeout(r, 10));
    });
    expect(screen.getByText(/no headings found/i)).toBeInTheDocument();
  });

  it("renders heading text after debounce", async () => {
    render(
      <OutlinePane
        content="# My Title\n## Section"
        onJumpToLine={vi.fn()}
        debounceMs={0}
      />,
    );
    await act(async () => {
      await new Promise((r) => setTimeout(r, 10));
    });
    expect(screen.getByText("My Title")).toBeInTheDocument();
    expect(screen.getByText("Section")).toBeInTheDocument();
  });

  it("calls onJumpToLine when a heading is clicked", async () => {
    const onJumpToLine = vi.fn();
    render(
      <OutlinePane
        content="# First\n## Second"
        onJumpToLine={onJumpToLine}
        debounceMs={0}
      />,
    );
    await act(async () => {
      await new Promise((r) => setTimeout(r, 10));
    });
    fireEvent.click(screen.getByText("First"));
    expect(onJumpToLine).toHaveBeenCalledWith(1);
  });
});
