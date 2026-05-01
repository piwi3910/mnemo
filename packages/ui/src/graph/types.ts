export interface GraphNode {
  id: string;
  title: string;
  path: string;
  shared?: boolean;
  ownerUserId?: string;
}

export interface GraphEdge {
  fromNoteId: string;
  toNoteId: string;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface HoveredNodeInfo {
  path: string;
  title: string;
  x: number;
  y: number;
}
