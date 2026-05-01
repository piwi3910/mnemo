import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { GraphView } from "../GraphView";
import type { GraphData } from "../types";

// d3 uses canvas API and ResizeObserver which are not available in jsdom.
// Provide minimal stubs so the hook doesn't crash.
beforeEach(() => {
  // Stub ResizeObserver
  if (!("ResizeObserver" in window)) {
    (window as unknown as Record<string, unknown>)["ResizeObserver"] = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  }

  // HTMLCanvasElement.getContext is undefined in jsdom — provide a stub.
  Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
    value: () => ({
      clearRect: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      translate: vi.fn(),
      scale: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
      fillText: vi.fn(),
      closePath: vi.fn(),
      strokeStyle: "",
      lineWidth: 0,
      fillStyle: "",
      font: "",
      textAlign: "",
      textBaseline: "",
    }),
    writable: true,
    configurable: true,
  });
});

const EMPTY_GRAPH: GraphData = { nodes: [], edges: [] };
const SAMPLE_GRAPH: GraphData = {
  nodes: [
    { id: "n1", title: "Note One", path: "note-one.md" },
    { id: "n2", title: "Note Two", path: "note-two.md" },
  ],
  edges: [{ fromNoteId: "n1", toNoteId: "n2" }],
};

describe("GraphView", () => {
  it("renders a canvas element", () => {
    const { container } = render(
      <GraphView graphData={EMPTY_GRAPH} onNoteSelect={vi.fn()} />,
    );
    expect(container.querySelector("canvas")).toBeInTheDocument();
  });

  it("renders loading spinner when loading=true", () => {
    render(
      <GraphView graphData={null} loading onNoteSelect={vi.fn()} />,
    );
    expect(screen.getByLabelText("Loading graph…")).toBeInTheDocument();
  });

  it("does not render loading spinner when loading=false", () => {
    render(
      <GraphView graphData={EMPTY_GRAPH} loading={false} onNoteSelect={vi.fn()} />,
    );
    expect(screen.queryByLabelText("Loading graph…")).not.toBeInTheDocument();
  });

  it("shows empty state when graph has no nodes", () => {
    render(
      <GraphView graphData={EMPTY_GRAPH} onNoteSelect={vi.fn()} />,
    );
    expect(screen.getByText("No notes yet")).toBeInTheDocument();
  });

  it("does not show empty state when nodes exist", () => {
    render(
      <GraphView graphData={SAMPLE_GRAPH} onNoteSelect={vi.fn()} />,
    );
    expect(screen.queryByText("No notes yet")).not.toBeInTheDocument();
  });

  it("does not show empty state while loading", () => {
    render(
      <GraphView graphData={EMPTY_GRAPH} loading onNoteSelect={vi.fn()} />,
    );
    expect(screen.queryByText("No notes yet")).not.toBeInTheDocument();
  });

  it("renders with graphData=null without crashing", () => {
    expect(() =>
      render(<GraphView graphData={null} onNoteSelect={vi.fn()} />),
    ).not.toThrow();
  });

  it("accepts className prop", () => {
    const { container } = render(
      <GraphView
        graphData={EMPTY_GRAPH}
        onNoteSelect={vi.fn()}
        className="custom-graph"
      />,
    );
    expect(container.firstChild).toHaveClass("custom-graph");
  });

  it("has aria-label for accessibility", () => {
    render(
      <GraphView graphData={EMPTY_GRAPH} onNoteSelect={vi.fn()} />,
    );
    expect(screen.getByLabelText("Knowledge graph")).toBeInTheDocument();
  });
});
