import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  ReactFlow,
  Handle,
  Position,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  addEdge,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type NodeProps,
  type Connection,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { X, Save, Plus, Search } from 'lucide-react';
import { api, type FileNode } from '../../lib/api';

interface CanvasViewProps {
  onClose: () => void;
  onNoteSelect: (path: string) => void;
  allNotes: FileNode[];
}

interface CanvasData {
  nodes: Array<{
    id: string;
    type: string;
    position: { x: number; y: number };
    data: { notePath: string; label: string; content?: string };
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
  }>;
}

type NoteCardData = {
  notePath: string;
  label: string;
  content?: string;
};

type NoteCardNode = Node<NoteCardData, 'noteCard'>;

function collectFiles(nodes: FileNode[]): { path: string; name: string }[] {
  const files: { path: string; name: string }[] = [];
  for (const node of nodes) {
    if (node.type === 'file') files.push({ path: node.path, name: node.name.replace(/\.md$/, '') });
    if (node.children) files.push(...collectFiles(node.children));
  }
  return files;
}

function NoteCardNode({ data }: NodeProps<NoteCardNode>) {
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-md p-3 min-w-[200px] max-w-[300px]">
      <div className="font-medium text-sm mb-1 truncate text-gray-900 dark:text-gray-100">
        {data.label}
      </div>
      {data.content && (
        <div className="text-xs text-gray-500 dark:text-gray-400 line-clamp-3">
          {data.content}
        </div>
      )}
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  );
}

const nodeTypes = { noteCard: NoteCardNode };

export function CanvasView({ onClose, onNoteSelect, allNotes }: CanvasViewProps) {
  const [canvasList, setCanvasList] = useState<string[]>([]);
  const [currentCanvas, setCurrentCanvas] = useState<string>('');
  const [newCanvasName, setNewCanvasName] = useState('');
  const [showNewCanvas, setShowNewCanvas] = useState(false);

  const [nodes, setNodes, onNodesChange] = useNodesState<NoteCardNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  const [showNotePicker, setShowNotePicker] = useState(false);
  const [noteSearch, setNoteSearch] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const allFiles = useMemo(() => collectFiles(allNotes), [allNotes]);

  const filteredFiles = useMemo(() => {
    if (!noteSearch) return allFiles.slice(0, 20);
    const lower = noteSearch.toLowerCase();
    return allFiles.filter(f => f.name.toLowerCase().includes(lower) || f.path.toLowerCase().includes(lower)).slice(0, 20);
  }, [allFiles, noteSearch]);

  // Load canvas list on mount
  useEffect(() => {
    api.getCanvasList().then(setCanvasList).catch(() => setCanvasList([]));
  }, []);

  // Load canvas data when selected
  useEffect(() => {
    if (!currentCanvas) return;
    api.getCanvas(currentCanvas).then((data: CanvasData) => {
      const loadedNodes: NoteCardNode[] = data.nodes.map(n => ({
        id: n.id,
        type: 'noteCard' as const,
        position: n.position,
        data: { notePath: n.data.notePath, label: n.data.label, content: n.data.content },
      }));
      setNodes(loadedNodes);
      setEdges(data.edges);
    }).catch(() => {
      setNodes([]);
      setEdges([]);
    });
  }, [currentCanvas, setNodes, setEdges]);

  // Focus search input when picker opens
  useEffect(() => {
    if (showNotePicker && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showNotePicker]);

  const saveCanvas = useCallback(() => {
    if (!currentCanvas) return;
    const data: CanvasData = {
      nodes: nodes.map(n => ({
        id: n.id,
        type: n.type ?? 'noteCard',
        position: n.position,
        data: n.data,
      })),
      edges: edges.map(e => ({
        id: e.id,
        source: e.source,
        target: e.target,
      })),
    };
    api.saveCanvas(currentCanvas, data).catch(() => {
      // Save failed silently
    });
  }, [currentCanvas, nodes, edges]);

  // Auto-save on changes
  useEffect(() => {
    if (!currentCanvas) return;
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
    autoSaveTimerRef.current = setTimeout(() => {
      saveCanvas();
    }, 1000);
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [nodes, edges, currentCanvas, saveCanvas]);

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges(eds => addEdge(connection, eds));
    },
    [setEdges],
  );

  const handleCreateCanvas = useCallback(() => {
    const name = newCanvasName.trim();
    if (!name) return;
    setCanvasList(prev => [...prev, name]);
    setCurrentCanvas(name);
    setNewCanvasName('');
    setShowNewCanvas(false);
    setNodes([]);
    setEdges([]);
    // Save empty canvas
    api.saveCanvas(name, { nodes: [], edges: [] }).catch(() => {
      // Creation failed silently
    });
  }, [newCanvasName, setNodes, setEdges]);

  const handleDeleteCanvas = useCallback(() => {
    if (!currentCanvas) return;
    api.deleteCanvas(currentCanvas).catch(() => {
      // Delete failed silently
    });
    setCanvasList(prev => prev.filter(c => c !== currentCanvas));
    setCurrentCanvas('');
    setNodes([]);
    setEdges([]);
  }, [currentCanvas, setNodes, setEdges]);

  const handleAddNote = useCallback(
    (file: { path: string; name: string }) => {
      const id = `note-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const newNode: NoteCardNode = {
        id,
        type: 'noteCard',
        position: { x: Math.random() * 400 + 100, y: Math.random() * 400 + 100 },
        data: { notePath: file.path, label: file.name },
      };
      // Fetch note content for preview
      api.getNote(file.path).then(note => {
        const snippet = note.content.slice(0, 200).replace(/^#.*\n/, '').trim();
        setNodes(prev =>
          prev.map(n =>
            n.id === id ? { ...n, data: { ...n.data, content: snippet } } : n,
          ),
        );
      }).catch(() => {
        // Content fetch failed, node still usable without preview
      });
      setNodes(prev => [...prev, newNode]);
      setShowNotePicker(false);
      setNoteSearch('');
    },
    [setNodes],
  );

  const handleNodeDoubleClick = useCallback(
    (_event: React.MouseEvent, node: NoteCardNode) => {
      onNoteSelect(node.data.notePath);
    },
    [onNoteSelect],
  );

  return (
    <div className="fixed inset-0 z-50 bg-white dark:bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Canvas</h2>

          {/* Canvas selector */}
          <select
            value={currentCanvas}
            onChange={e => setCurrentCanvas(e.target.value)}
            className="text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
          >
            <option value="">Select canvas...</option>
            {canvasList.map(name => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>

          {/* New canvas */}
          {showNewCanvas ? (
            <div className="flex items-center gap-1">
              <input
                type="text"
                value={newCanvasName}
                onChange={e => setNewCanvasName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleCreateCanvas();
                  if (e.key === 'Escape') setShowNewCanvas(false);
                }}
                placeholder="Canvas name..."
                className="text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                autoFocus
              />
              <button
                onClick={handleCreateCanvas}
                className="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Create
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowNewCanvas(true)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              title="New canvas"
            >
              <Plus size={16} />
            </button>
          )}

          {currentCanvas && (
            <button
              onClick={handleDeleteCanvas}
              className="text-xs px-2 py-1 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
            >
              Delete
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Add note button */}
          {currentCanvas && (
            <button
              onClick={() => setShowNotePicker(prev => !prev)}
              className="flex items-center gap-1 text-sm px-2 py-1 rounded bg-blue-500 text-white hover:bg-blue-600"
              title="Add note to canvas"
            >
              <Plus size={14} />
              Add Note
            </button>
          )}

          {/* Save button */}
          {currentCanvas && (
            <button
              onClick={saveCanvas}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              title="Save canvas"
            >
              <Save size={16} />
            </button>
          )}

          {/* Close button */}
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            title="Close canvas"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Note picker dropdown */}
      {showNotePicker && (
        <div className="absolute top-12 right-4 z-10 w-72 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg">
          <div className="flex items-center gap-2 p-2 border-b border-gray-200 dark:border-gray-600">
            <Search size={14} className="text-gray-400" />
            <input
              ref={searchInputRef}
              type="text"
              value={noteSearch}
              onChange={e => setNoteSearch(e.target.value)}
              placeholder="Search notes..."
              className="flex-1 text-sm bg-transparent outline-none text-gray-800 dark:text-gray-200 placeholder-gray-400"
              onKeyDown={e => {
                if (e.key === 'Escape') {
                  setShowNotePicker(false);
                  setNoteSearch('');
                }
              }}
            />
          </div>
          <div className="max-h-60 overflow-y-auto">
            {filteredFiles.map(file => (
              <button
                key={file.path}
                onClick={() => handleAddNote(file)}
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200"
              >
                <div className="font-medium truncate">{file.name}</div>
                <div className="text-xs text-gray-400 truncate">{file.path}</div>
              </button>
            ))}
            {filteredFiles.length === 0 && (
              <div className="px-3 py-2 text-sm text-gray-400">No notes found</div>
            )}
          </div>
        </div>
      )}

      {/* Canvas area */}
      <div className="flex-1 relative">
        {currentCanvas ? (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeDoubleClick={handleNodeDoubleClick}
            nodeTypes={nodeTypes}
            fitView
            className="bg-gray-50 dark:bg-gray-900"
          >
            <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
            <Controls />
            <MiniMap
              nodeColor={() => '#6366f1'}
              maskColor="rgba(0, 0, 0, 0.2)"
            />
          </ReactFlow>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-500">
            <div className="text-center">
              <p className="text-lg mb-2">No canvas selected</p>
              <p className="text-sm">Select an existing canvas or create a new one to get started.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
