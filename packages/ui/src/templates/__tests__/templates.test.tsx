import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { TemplateList } from "../TemplateList";
import { TemplatePicker } from "../TemplatePicker";
import type { TemplateEntry } from "../TemplateList";

const makeTemplate = (name: string, path?: string): TemplateEntry => ({
  name,
  path: path ?? `Templates/${name}.md`,
});

describe("TemplateList", () => {
  it("renders template names", () => {
    render(
      <TemplateList
        templates={[makeTemplate("Meeting"), makeTemplate("Daily")]}
        onSelect={vi.fn()}
      />,
    );
    expect(screen.getByText("Meeting")).toBeInTheDocument();
    expect(screen.getByText("Daily")).toBeInTheDocument();
  });

  it("shows Blank note option when showBlankOption is true", () => {
    render(<TemplateList templates={[]} onSelect={vi.fn()} showBlankOption />);
    expect(screen.getByText(/blank note/i)).toBeInTheDocument();
  });

  it("calls onSelect with empty string for blank note", () => {
    const onSelect = vi.fn();
    render(<TemplateList templates={[]} onSelect={onSelect} showBlankOption />);
    fireEvent.click(screen.getByText(/blank note/i));
    expect(onSelect).toHaveBeenCalledWith("");
  });

  it("calls onSelect with template name when clicked", () => {
    const onSelect = vi.fn();
    render(
      <TemplateList
        templates={[makeTemplate("Meeting")]}
        onSelect={onSelect}
      />,
    );
    fireEvent.click(screen.getByText("Meeting"));
    expect(onSelect).toHaveBeenCalledWith("Meeting");
  });

  it("shows loading state", () => {
    render(
      <TemplateList templates={[]} loading onSelect={vi.fn()} />,
    );
    expect(screen.getByText(/loading templates/i)).toBeInTheDocument();
  });

  it("shows empty message when no templates and no blank option", () => {
    render(
      <TemplateList templates={[]} onSelect={vi.fn()} showBlankOption={false} />,
    );
    expect(screen.getByText(/no templates found/i)).toBeInTheDocument();
  });

  it("renders description when provided", () => {
    render(
      <TemplateList
        templates={[{ name: "T1", path: "Templates/T1.md", description: "A useful template" }]}
        onSelect={vi.fn()}
      />,
    );
    expect(screen.getByText("A useful template")).toBeInTheDocument();
  });
});

describe("TemplatePicker", () => {
  it("renders template list in modal", () => {
    render(
      <TemplatePicker
        templates={[makeTemplate("Standup")]}
        onSelect={vi.fn()}
        onClose={vi.fn()}
        onFetchContent={vi.fn()}
      />,
    );
    expect(screen.getByText("Standup")).toBeInTheDocument();
  });

  it("calls onClose on close button click", () => {
    const onClose = vi.fn();
    render(
      <TemplatePicker
        templates={[]}
        onSelect={vi.fn()}
        onClose={onClose}
        onFetchContent={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /close/i }));
    expect(onClose).toHaveBeenCalled();
  });

  it("fetches content and calls onSelect on template pick", async () => {
    const onSelect = vi.fn();
    const onFetchContent = vi.fn().mockResolvedValue("Hello {{title}}");
    render(
      <TemplatePicker
        templates={[makeTemplate("Standup")]}
        noteTitle="My Note"
        onSelect={onSelect}
        onClose={vi.fn()}
        onFetchContent={onFetchContent}
      />,
    );
    fireEvent.click(screen.getByText("Standup"));
    await waitFor(() =>
      expect(onSelect).toHaveBeenCalledWith("Hello My Note"),
    );
  });

  it("calls onSelect with empty string for blank note", () => {
    const onSelect = vi.fn();
    render(
      <TemplatePicker
        templates={[]}
        onSelect={onSelect}
        onClose={vi.fn()}
        onFetchContent={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByText(/blank note/i));
    expect(onSelect).toHaveBeenCalledWith("");
  });
});
