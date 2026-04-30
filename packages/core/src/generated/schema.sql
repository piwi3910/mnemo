CREATE TABLE IF NOT EXISTS settings (
  key TEXT NOT NULL,
  userId TEXT NOT NULL,
  value TEXT NOT NULL,
  updatedAt INTEGER NOT NULL,
  version INTEGER NOT NULL,
  cursor INTEGER NOT NULL,
  _local_status TEXT NOT NULL DEFAULT 'synced',
  _local_seq INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS graph_edge (
  id TEXT NOT NULL PRIMARY KEY,
  fromPath TEXT NOT NULL,
  toPath TEXT NOT NULL,
  fromNoteId TEXT NOT NULL,
  toNoteId TEXT NOT NULL,
  userId TEXT NOT NULL,
  version INTEGER NOT NULL,
  cursor INTEGER NOT NULL,
  _local_status TEXT NOT NULL DEFAULT 'synced',
  _local_seq INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS note_share (
  id TEXT NOT NULL PRIMARY KEY,
  ownerUserId TEXT NOT NULL,
  path TEXT NOT NULL,
  isFolder INTEGER NOT NULL,
  sharedWithUserId TEXT NOT NULL,
  permission TEXT NOT NULL,
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL,
  version INTEGER NOT NULL,
  cursor INTEGER NOT NULL,
  _local_status TEXT NOT NULL DEFAULT 'synced',
  _local_seq INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS access_request (
  id TEXT NOT NULL PRIMARY KEY,
  requesterUserId TEXT NOT NULL,
  ownerUserId TEXT NOT NULL,
  notePath TEXT NOT NULL,
  status TEXT NOT NULL,
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL,
  _local_status TEXT NOT NULL DEFAULT 'synced',
  _local_seq INTEGER NOT NULL DEFAULT 0,
  version INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS plugin_storage (
  pluginId TEXT NOT NULL,
  key TEXT NOT NULL,
  userId TEXT NOT NULL,
  value TEXT NOT NULL,
  updatedAt INTEGER NOT NULL,
  _local_status TEXT NOT NULL DEFAULT 'synced',
  _local_seq INTEGER NOT NULL DEFAULT 0,
  version INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS installed_plugin (
  id TEXT NOT NULL PRIMARY KEY,
  name TEXT NOT NULL,
  version TEXT NOT NULL,
  description TEXT NOT NULL,
  author TEXT NOT NULL,
  state TEXT NOT NULL,
  error TEXT,
  manifest TEXT,
  enabled INTEGER NOT NULL,
  installedAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL,
  schemaVersion INTEGER NOT NULL,
  cursor INTEGER NOT NULL,
  _local_status TEXT NOT NULL DEFAULT 'synced',
  _local_seq INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS trash_item (
  id TEXT NOT NULL PRIMARY KEY,
  originalPath TEXT NOT NULL,
  userId TEXT NOT NULL,
  trashedAt INTEGER NOT NULL,
  version INTEGER NOT NULL,
  cursor INTEGER NOT NULL,
  _local_status TEXT NOT NULL DEFAULT 'synced',
  _local_seq INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS folder (
  id TEXT NOT NULL PRIMARY KEY,
  userId TEXT NOT NULL,
  path TEXT NOT NULL,
  parentId TEXT,
  version INTEGER NOT NULL,
  cursor INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL,
  _local_status TEXT NOT NULL DEFAULT 'synced',
  _local_seq INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS tag (
  id TEXT NOT NULL PRIMARY KEY,
  userId TEXT NOT NULL,
  name TEXT NOT NULL,
  color TEXT,
  version INTEGER NOT NULL,
  cursor INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL,
  _local_status TEXT NOT NULL DEFAULT 'synced',
  _local_seq INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS note_tag (
  notePath TEXT NOT NULL,
  tagId TEXT NOT NULL,
  userId TEXT NOT NULL,
  version INTEGER NOT NULL,
  cursor INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL,
  _local_status TEXT NOT NULL DEFAULT 'synced',
  _local_seq INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS note_revision (
  id TEXT NOT NULL PRIMARY KEY,
  userId TEXT NOT NULL,
  notePath TEXT NOT NULL,
  content TEXT NOT NULL,
  createdAt INTEGER NOT NULL,
  _local_status TEXT NOT NULL DEFAULT 'synced',
  _local_seq INTEGER NOT NULL DEFAULT 0,
  version INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS attachment (
  id TEXT NOT NULL PRIMARY KEY,
  userId TEXT NOT NULL,
  notePath TEXT NOT NULL,
  filename TEXT NOT NULL,
  contentHash TEXT NOT NULL,
  sizeBytes INTEGER NOT NULL,
  mimeType TEXT NOT NULL,
  storagePath TEXT NOT NULL,
  createdAt INTEGER NOT NULL,
  _local_status TEXT NOT NULL DEFAULT 'synced',
  _local_seq INTEGER NOT NULL DEFAULT 0,
  version INTEGER NOT NULL DEFAULT 0
);

-- Core internal bookkeeping
CREATE TABLE IF NOT EXISTS sync_state (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS yjs_documents (
  doc_id TEXT PRIMARY KEY,
  snapshot BLOB NOT NULL,
  state_vector BLOB NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS yjs_pending_updates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  doc_id TEXT NOT NULL,
  update_data BLOB NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS tier2_cache_meta (
  entity_type TEXT NOT NULL,
  parent_id TEXT NOT NULL,
  fetched_at INTEGER NOT NULL,
  accessed_at INTEGER NOT NULL,
  PRIMARY KEY (entity_type, parent_id)
);
