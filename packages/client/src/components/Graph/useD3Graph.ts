import { useEffect, useRef, useCallback } from 'react';
import * as d3 from 'd3';
import { GraphData } from '../../lib/api';
import { GRAPH_CONFIG } from './graphConfig';

interface SimNode extends d3.SimulationNodeDatum {
  id: string;
  title: string;
  path: string;
  shared?: boolean;
  ownerUserId?: string;
}

interface SimLink extends d3.SimulationLinkDatum<SimNode> {
  source: SimNode | string;
  target: SimNode | string;
}

interface UseD3GraphOptions {
  activeNotePath: string | null;
  mode: 'local' | 'full';
  starredPaths?: Set<string>;
  onNodeClick: (path: string) => void;
  recenterRef?: React.MutableRefObject<(() => void) | null>;
}

export function useD3Graph(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  graphData: GraphData | null,
  options: UseD3GraphOptions,
): void {
  const { activeNotePath, mode, starredPaths, onNodeClick, recenterRef } = options;
  const simulationRef = useRef<d3.Simulation<SimNode, SimLink>>(undefined);
  const hoveredNodeRef = useRef<SimNode | null>(null);
  const nodesRef = useRef<SimNode[]>([]);
  const linksRef = useRef<SimLink[]>([]);
  const transformRef = useRef(d3.zoomIdentity);
  const zoomRef = useRef<d3.ZoomBehavior<HTMLCanvasElement, unknown> | null>(null);

  const handleNodeClick = useCallback((node: SimNode) => {
    if (node.shared && node.ownerUserId) {
      onNodeClick(`shared:${node.ownerUserId}:${node.path}`);
    } else {
      onNodeClick(node.path);
    }
  }, [onNodeClick]);

  useEffect(() => {
    if (!graphData || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cfg = GRAPH_CONFIG;

    // Filter for local mode
    let filteredNodes = graphData.nodes;
    let filteredEdges = graphData.edges;

    if (mode === 'local' && activeNotePath) {
      const activeNodeId = graphData.nodes.find(n => n.path === activeNotePath)?.id;
      if (activeNodeId) {
        const connectedIds = new Set<string>();
        connectedIds.add(activeNodeId);
        for (const edge of graphData.edges) {
          if (edge.fromNoteId === activeNodeId) connectedIds.add(edge.toNoteId);
          if (edge.toNoteId === activeNodeId) connectedIds.add(edge.fromNoteId);
        }
        filteredNodes = graphData.nodes.filter(n => connectedIds.has(n.id));
        filteredEdges = graphData.edges.filter(e => connectedIds.has(e.fromNoteId) && connectedIds.has(e.toNoteId));
      }
    }

    const isDark = document.documentElement.classList.contains('dark');
    const colors = isDark ? cfg.colors.dark : cfg.colors.light;

    let currentWidth = 0;
    let currentHeight = 0;

    const resize = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (rect) {
        canvas.width = rect.width * window.devicePixelRatio;
        canvas.height = rect.height * window.devicePixelRatio;
        canvas.style.width = `${rect.width}px`;
        canvas.style.height = `${rect.height}px`;
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        currentWidth = rect.width;
        currentHeight = rect.height;
      }
    };
    resize();

    const nodes: SimNode[] = filteredNodes.map(n => ({ ...n }));
    const nodeMap = new Map(nodes.map(n => [n.id, n]));

    const links: SimLink[] = filteredEdges
      .filter(e => nodeMap.has(e.fromNoteId) && nodeMap.has(e.toNoteId))
      .map(e => ({
        source: e.fromNoteId,
        target: e.toNoteId,
      }));

    nodesRef.current = nodes;
    linksRef.current = links;

    // Pin active node at center so others orbit around it
    const activeNode = activeNotePath ? nodes.find(n => n.path === activeNotePath) : null;
    if (activeNode) {
      activeNode.fx = currentWidth / 2;
      activeNode.fy = currentHeight / 2;
    }

    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink<SimNode, SimLink>(links).id(d => d.id).distance(cfg.simulation.linkDistance))
      .force('charge', d3.forceManyBody().strength(cfg.simulation.chargeStrength))
      .force('center', d3.forceCenter(currentWidth / 2, currentHeight / 2))
      .force('collision', d3.forceCollide().radius(cfg.simulation.collisionRadius));

    simulationRef.current = simulation;

    function draw() {
      if (!ctx) return;
      const w = canvas.width / window.devicePixelRatio;
      const h = canvas.height / window.devicePixelRatio;

      ctx.save();
      ctx.clearRect(0, 0, w, h);

      const t = transformRef.current;
      ctx.translate(t.x, t.y);
      ctx.scale(t.k, t.k);

      // Draw links
      ctx.strokeStyle = colors.link;
      ctx.lineWidth = 1;
      for (const link of links) {
        const source = link.source as SimNode;
        const target = link.target as SimNode;
        if (source.x === undefined || source.y === undefined || target.x === undefined || target.y === undefined) continue;
        ctx.beginPath();
        ctx.moveTo(source.x, source.y);
        ctx.lineTo(target.x, target.y);
        ctx.stroke();
      }

      // Draw nodes
      for (const node of nodes) {
        if (node.x === undefined || node.y === undefined) continue;
        const isHovered = hoveredNodeRef.current === node;
        const isActive = node.path === activeNotePath;
        const isStarred = starredPaths?.has(node.path) ?? false;
        const isShared = node.shared === true;
        const radius = isActive ? cfg.node.activeRadius : isHovered ? cfg.node.hoveredRadius : cfg.node.defaultRadius;

        if (isStarred && !isActive) {
          // Draw star shape for starred nodes
          const r = isHovered ? cfg.node.starHoveredRadius : cfg.node.starDefaultRadius;
          const innerR = r * cfg.node.starInnerRadiusRatio;
          ctx.beginPath();
          for (let i = 0; i < 10; i++) {
            const angle = (Math.PI / 2) + (i * Math.PI / 5);
            const dist = i % 2 === 0 ? r : innerR;
            const px = node.x + Math.cos(angle) * dist;
            const py = node.y - Math.sin(angle) * dist;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.closePath();
          ctx.fillStyle = colors.star;
          ctx.fill();
          ctx.strokeStyle = colors.starStroke;
          ctx.lineWidth = 1;
          ctx.stroke();
        } else {
          // Normal circle node
          ctx.beginPath();
          ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI);
          ctx.fillStyle = isActive
            ? colors.nodeActive
            : isShared
              ? colors.nodeShared
              : isHovered
                ? colors.nodeHovered
                : colors.node;
          ctx.fill();

          if (isHovered || isActive || isShared) {
            ctx.strokeStyle = isActive
              ? colors.strokeActive
              : isShared
                ? colors.strokeShared
                : colors.strokeHovered;
            ctx.lineWidth = 2;
            ctx.stroke();
          }
        }

        // Label
        const fontSize = isHovered || isActive ? cfg.font.activeSize : cfg.font.defaultSize;
        ctx.font = `${fontSize}px ${cfg.font.family}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillStyle = colors.label;
        const label = node.title.length > cfg.label.maxLength
          ? node.title.slice(0, cfg.label.truncatedLength) + cfg.label.ellipsis
          : node.title;
        ctx.fillText(label, node.x, node.y + radius + cfg.node.labelOffset);
      }

      ctx.restore();
    }

    simulation.on('tick', draw);

    // Reset zoom to identity so the pinned center node is visible
    transformRef.current = d3.zoomIdentity;

    // Zoom + pan
    const d3Canvas = d3.select(canvas);
    const zoom = d3.zoom<HTMLCanvasElement, unknown>()
      .scaleExtent([cfg.zoom.scaleMin, cfg.zoom.scaleMax])
      .on('zoom', (event) => {
        transformRef.current = event.transform;
        draw();
      });

    d3Canvas.call(zoom);
    zoomRef.current = zoom;

    // Expose recenter function
    if (recenterRef) {
      recenterRef.current = () => {
        transformRef.current = d3.zoomIdentity;
        d3Canvas.transition().duration(cfg.zoom.recenterDuration).call(zoom.transform, d3.zoomIdentity);
      };
    }

    // Hit-test helper
    function getNodeAt(mx: number, my: number): SimNode | null {
      const t = transformRef.current;
      const x = (mx - t.x) / t.k;
      const y = (my - t.y) / t.k;
      for (const node of nodes) {
        if (node.x === undefined || node.y === undefined) continue;
        const dx = x - node.x;
        const dy = y - node.y;
        if (dx * dx + dy * dy < cfg.node.hitTestRadiusSq) return node;
      }
      return null;
    }

    // Hover detection
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const node = getNodeAt(e.clientX - rect.left, e.clientY - rect.top);
      hoveredNodeRef.current = node;
      canvas.style.cursor = node ? 'pointer' : 'default';
      draw();
    };

    // Click detection
    const handleMouseClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const node = getNodeAt(e.clientX - rect.left, e.clientY - rect.top);
      if (node) handleNodeClick(node);
    };

    // Drag behavior
    let dragNode: SimNode | null = null;

    const handleMouseDown = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const node = getNodeAt(e.clientX - rect.left, e.clientY - rect.top);
      if (node) {
        dragNode = node;
        simulation.alphaTarget(cfg.simulation.dragAlphaTarget).restart();
        // Prevent zoom while dragging
        d3Canvas.on('.zoom', null);
      }
    };

    const handleMouseDrag = (e: MouseEvent) => {
      if (!dragNode) return;
      const rect = canvas.getBoundingClientRect();
      const t = transformRef.current;
      dragNode.fx = (e.clientX - rect.left - t.x) / t.k;
      dragNode.fy = (e.clientY - rect.top - t.y) / t.k;
    };

    const handleMouseUp = () => {
      if (dragNode) {
        dragNode.fx = null;
        dragNode.fy = null;
        dragNode = null;
        simulation.alphaTarget(0);
        d3Canvas.call(zoom);
      }
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('click', handleMouseClick);
    canvas.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseDrag);
    window.addEventListener('mouseup', handleMouseUp);

    const resizeObserver = new ResizeObserver(() => {
      resize();
      // Re-center active node and simulation after resize
      if (activeNode) {
        activeNode.fx = currentWidth / 2;
        activeNode.fy = currentHeight / 2;
      }
      simulation.force('center', d3.forceCenter(currentWidth / 2, currentHeight / 2));
      simulation.alpha(cfg.simulation.resizeAlpha).restart();
    });
    if (canvas.parentElement) resizeObserver.observe(canvas.parentElement);

    return () => {
      simulation.stop();
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('click', handleMouseClick);
      canvas.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseDrag);
      window.removeEventListener('mouseup', handleMouseUp);
      resizeObserver.disconnect();
    };
  }, [graphData, mode, activeNotePath, handleNodeClick, recenterRef, starredPaths, canvasRef]);
}
