import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TagBadge } from "../TagBadge";
import { TagList } from "../TagList";
import { TagFilterBar } from "../TagFilterBar";
import { TagPicker } from "../TagPicker";
import { TagsScreen, type TagEntry, type TagNoteItem } from "../TagsScreen";

// ─── TagBadge ────────────────────────────────────────────────────────────────

describe("TagBadge", () => {
  it("renders tag name", () => {
    render(<TagBadge tag="react" />);
    expect(screen.getByText("react")).toBeInTheDocument();
  });

  it("renders count when provided", () => {
    render(<TagBadge tag="react" count={5} />);
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("renders as button when onClick is provided", () => {
    render(<TagBadge tag="react" onClick={() => {}} />);
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("calls onClick with tag name", () => {
    const onClick = vi.fn();
    render(<TagBadge tag="react" onClick={onClick} />);
    fireEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledWith("react");
  });

  it("sets aria-pressed when selected", () => {
    render(<TagBadge tag="react" selected onClick={() => {}} />);
    expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "true");
  });
});

// ─── TagList ─────────────────────────────────────────────────────────────────

describe("TagList", () => {
  it("renders all tags", () => {
    render(
      <TagList
        tags={[{ tag: "alpha" }, { tag: "beta" }]}
        onTagClick={() => {}}
      />,
    );
    expect(screen.getByText("alpha")).toBeInTheDocument();
    expect(screen.getByText("beta")).toBeInTheDocument();
  });

  it("returns null when tags is empty", () => {
    const { container } = render(<TagList tags={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("marks selected tag as pressed", () => {
    render(
      <TagList
        tags={[{ tag: "alpha" }]}
        selectedTag="alpha"
        onTagClick={() => {}}
      />,
    );
    expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "true");
  });
});

// ─── TagFilterBar ─────────────────────────────────────────────────────────────

describe("TagFilterBar", () => {
  it("renders tags as clickable badges", () => {
    render(
      <TagFilterBar
        tags={[{ tag: "react" }, { tag: "ts" }]}
        activeTag={null}
        onTagSelect={() => {}}
      />,
    );
    expect(screen.getAllByRole("button")).toHaveLength(2);
  });

  it("shows clear button when an activeTag is set", () => {
    render(
      <TagFilterBar
        tags={[{ tag: "react" }]}
        activeTag="react"
        onTagSelect={() => {}}
      />,
    );
    expect(screen.getByRole("button", { name: /clear tag filter/i })).toBeInTheDocument();
  });

  it("calls onTagSelect(null) when clear button is clicked", () => {
    const onTagSelect = vi.fn();
    render(
      <TagFilterBar
        tags={[{ tag: "react" }]}
        activeTag="react"
        onTagSelect={onTagSelect}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /clear tag filter/i }));
    expect(onTagSelect).toHaveBeenCalledWith(null);
  });

  it("returns null when tags is empty", () => {
    const { container } = render(
      <TagFilterBar tags={[]} activeTag={null} onTagSelect={() => {}} />,
    );
    expect(container.firstChild).toBeNull();
  });
});

// ─── TagPicker ───────────────────────────────────────────────────────────────

describe("TagPicker", () => {
  it("renders selected tags as chips", () => {
    render(
      <TagPicker
        availableTags={["react", "ts"]}
        selectedTags={["react"]}
        onChange={() => {}}
      />,
    );
    expect(screen.getByText("react")).toBeInTheDocument();
  });

  it("calls onChange when a tag chip is removed", () => {
    const onChange = vi.fn();
    render(
      <TagPicker
        availableTags={["react"]}
        selectedTags={["react"]}
        onChange={onChange}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /remove tag react/i }));
    expect(onChange).toHaveBeenCalledWith([]);
  });

  it("shows placeholder when no tags selected", () => {
    render(
      <TagPicker
        availableTags={[]}
        selectedTags={[]}
        onChange={() => {}}
        placeholder="Pick a tag"
      />,
    );
    expect(screen.getByPlaceholderText("Pick a tag")).toBeInTheDocument();
  });
});

// ─── TagsScreen ───────────────────────────────────────────────────────────────

describe("TagsScreen", () => {
  const tags: TagEntry[] = [
    { tag: "react", count: 3 },
    { tag: "ts", count: 1 },
  ];
  const tagNotes: TagNoteItem[] = [
    { notePath: "a.md", title: "Alpha Note" },
  ];

  it("renders tag badges", () => {
    render(
      <TagsScreen
        tags={tags}
        tagNotes={[]}
        selectedTag={null}
        onTagSelect={() => {}}
        onNoteSelect={() => {}}
      />,
    );
    expect(screen.getByText("react")).toBeInTheDocument();
    expect(screen.getByText("ts")).toBeInTheDocument();
  });

  it("returns null when tags list is empty", () => {
    const { container } = render(
      <TagsScreen
        tags={[]}
        tagNotes={[]}
        selectedTag={null}
        onTagSelect={() => {}}
        onNoteSelect={() => {}}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("shows tag notes when a tag is selected", () => {
    render(
      <TagsScreen
        tags={tags}
        tagNotes={tagNotes}
        selectedTag="react"
        onTagSelect={() => {}}
        onNoteSelect={() => {}}
      />,
    );
    expect(screen.getByText("Alpha Note")).toBeInTheDocument();
  });

  it("calls onTagSelect when a tag badge is clicked", () => {
    const onTagSelect = vi.fn();
    render(
      <TagsScreen
        tags={tags}
        tagNotes={[]}
        selectedTag={null}
        onTagSelect={onTagSelect}
        onNoteSelect={() => {}}
      />,
    );
    fireEvent.click(screen.getByText("react").closest("button")!);
    expect(onTagSelect).toHaveBeenCalledWith("react");
  });

  it("calls onNoteSelect when a note link is clicked", () => {
    const onNoteSelect = vi.fn();
    render(
      <TagsScreen
        tags={tags}
        tagNotes={tagNotes}
        selectedTag="react"
        onTagSelect={() => {}}
        onNoteSelect={onNoteSelect}
      />,
    );
    fireEvent.click(screen.getByText("Alpha Note"));
    expect(onNoteSelect).toHaveBeenCalledWith("a.md");
  });

  it("shows loading state for tag notes", () => {
    render(
      <TagsScreen
        tags={tags}
        tagNotes={[]}
        loadingNotes
        selectedTag="react"
        onTagSelect={() => {}}
        onNoteSelect={() => {}}
      />,
    );
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });
});
