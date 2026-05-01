import * as React from "react";
import { Loader2 } from "lucide-react";
import type { GraphData, HoveredNodeInfo } from "./types";
import { useD3Graph } from "./useD3Graph";

export interface GraphViewProps {
  /** Graph data with nodes and edges. */
  graphData: GraphData | null;
  /** Show a loading spinner overlay when true. */
  loading?: boolean;
  /** Path of the currently active note (highlighted in the graph). */
  activeNotePath?: string | null;
  /**
   * Layout mode:
   * - `"full"` — global force-directed layout of all notes.
   * - `"local"` — 2-hop neighbourhood centred on `activeNotePath`.
   */
  mode?: "full" | "local";
  /** Called when the user clicks a node. */
  onNoteSelect: (path: string) => void;
  /** Called when the user hovers a node. */
  onNodeHover?: (node: HoveredNodeInfo | null) => void;
  /**
   * Mutable ref whose `.current` will be set to a `recenter()` function after
   * the graph mounts. Call it to programmatically reset zoom/pan.
   */
  recenterRef?: React.MutableRefObject<(() => void) | null>;
  /** Paths of starred notes (rendered with a star shape). */
  starredPaths?: Set<string>;
  className?: string;
}

/**
 * GraphView — D3 force-layout graph rendered on an HTML canvas.
 *
 * Supports two modes:
 * - `"full"` — all notes in a global force-directed layout.
 * - `"local"` — 2-hop neighbourhood centred on the active note (concentric
 *   ring layout with the active note pinned at the centre).
 *
 * Features: zoom/pan, node hover tooltip, node drag, auto-resize.
 */
export function GraphView({
  graphData,
  loading = false,
  activeNotePath = null,
  mode = "full",
  onNoteSelect,
  onNodeHover,
  recenterRef,
  starredPaths,
  className,
}: GraphViewProps) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  useD3Graph(canvasRef, graphData, {
    activeNotePath,
    mode,
    starredPaths,
    onNodeClick: onNoteSelect,
    onNodeHover,
    recenterRef,
  });

  return (
    <div
      className={className ?? "relative flex flex-1 overflow-hidden"}
      aria-label="Knowledge graph"
    >
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2
            size={20}
            className="animate-spin text-violet-500"
            aria-label="Loading graph…"
          />
        </div>
      )}
      {graphData && graphData.nodes.length === 0 && !loading && (
        <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-500">
          No notes yet
        </div>
      )}
      <canvas ref={canvasRef} className="h-full w-full" />
    </div>
  );
}
