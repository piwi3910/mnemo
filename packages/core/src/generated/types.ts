export interface Settings {
  key: string;
  userId: string;
  value: string;
  updatedAt: number;
  version: number;
  cursor: number;
  version: number;
}

export interface GraphEdge {
  id: string;
  fromPath: string;
  toPath: string;
  fromNoteId: string;
  toNoteId: string;
  userId: string;
  version: number;
  cursor: number;
  version: number;
}

export interface NoteShare {
  id: string;
  ownerUserId: string;
  path: string;
  isFolder: boolean;
  sharedWithUserId: string;
  permission: string;
  createdAt: number;
  updatedAt: number;
  version: number;
  cursor: number;
  version: number;
}

export interface AccessRequest {
  id: string;
  requesterUserId: string;
  ownerUserId: string;
  notePath: string;
  status: string;
  createdAt: number;
  updatedAt: number;
  version: number;
}

export interface PluginStorage {
  pluginId: string;
  key: string;
  userId: string;
  value: unknown;
  updatedAt: number;
  version: number;
}

export interface InstalledPlugin {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  state: string;
  error: string | null;
  manifest: unknown | null;
  enabled: boolean;
  installedAt: number;
  updatedAt: number;
  schemaVersion: number;
  cursor: number;
  version: number;
}

export interface TrashItem {
  id: string;
  originalPath: string;
  userId: string;
  trashedAt: number;
  version: number;
  cursor: number;
  version: number;
}

export interface Folder {
  id: string;
  userId: string;
  path: string;
  parentId: string | null;
  version: number;
  cursor: number;
  updatedAt: number;
  version: number;
}

export interface Tag {
  id: string;
  userId: string;
  name: string;
  color: string | null;
  version: number;
  cursor: number;
  updatedAt: number;
  version: number;
}

export interface NoteTag {
  notePath: string;
  tagId: string;
  userId: string;
  version: number;
  cursor: number;
  updatedAt: number;
  version: number;
}

export interface NoteRevision {
  id: string;
  userId: string;
  notePath: string;
  content: string;
  createdAt: number;
  version: number;
}

export interface Attachment {
  id: string;
  userId: string;
  notePath: string;
  filename: string;
  contentHash: string;
  sizeBytes: number;
  mimeType: string;
  storagePath: string;
  createdAt: number;
  version: number;
}
