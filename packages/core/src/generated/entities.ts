export interface EntityMetadata {
  name: string;
  table: string;
  tier: "tier1" | "tier2";
  parent: string | null;
}

export const ENTITIES = [
  { name: "Settings", table: "settings", tier: "tier1", parent: null },
  { name: "GraphEdge", table: "graph_edge", tier: "tier1", parent: null },
  { name: "NoteShare", table: "note_share", tier: "tier1", parent: null },
  { name: "AccessRequest", table: "access_request", tier: "tier2", parent: "NoteShare" },
  { name: "PluginStorage", table: "plugin_storage", tier: "tier2", parent: "InstalledPlugin" },
  { name: "InstalledPlugin", table: "installed_plugin", tier: "tier1", parent: null },
  { name: "TrashItem", table: "trash_item", tier: "tier1", parent: null },
  { name: "Folder", table: "folder", tier: "tier1", parent: null },
  { name: "Tag", table: "tag", tier: "tier1", parent: null },
  { name: "NoteTag", table: "note_tag", tier: "tier1", parent: null },
  { name: "NoteRevision", table: "note_revision", tier: "tier2", parent: "Note" },
  { name: "Attachment", table: "attachment", tier: "tier2", parent: "Note" },
] as const satisfies readonly EntityMetadata[];
