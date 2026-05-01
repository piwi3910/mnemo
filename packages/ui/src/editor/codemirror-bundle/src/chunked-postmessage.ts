const CHUNK_SIZE = 60 * 1024; // 60KB to leave headroom for JSON envelope
const CHUNK_TIMEOUT = 30_000;

export function sendChunked(postMessage: (s: string) => void, obj: { type: string; [k: string]: unknown }): void {
  const json = JSON.stringify(obj);
  if (json.length <= CHUNK_SIZE) {
    postMessage(json);
    return;
  }
  const chunkId = String(Math.random()).slice(2);
  const total = Math.ceil(json.length / CHUNK_SIZE);
  for (let seq = 0; seq < total; seq++) {
    const slice = json.slice(seq * CHUNK_SIZE, (seq + 1) * CHUNK_SIZE);
    postMessage(JSON.stringify({
      type: `${obj.type}:chunk`,
      chunkId,
      seq,
      total,
      payload: slice,
    }));
  }
}

interface PendingChunks {
  chunks: string[];
  total: number;
  received: number;
  type: string;
  startedAt: number;
}

export function setupChunkedReceiver() {
  const pending = new Map<string, PendingChunks>();

  // Janitor: drop expired buffers
  setInterval(() => {
    const now = Date.now();
    for (const [id, p] of pending) {
      if (now - p.startedAt > CHUNK_TIMEOUT) {
        console.warn(`Dropping incomplete chunk buffer ${id} (${p.received}/${p.total})`);
        pending.delete(id);
      }
    }
  }, 5_000);

  return function receive(msg: { type: string; [k: string]: unknown }): { type: string; [k: string]: unknown } | null {
    if (!msg.type.endsWith(":chunk")) return msg; // not a chunk

    const baseType = msg.type.slice(0, -":chunk".length);
    const chunkId = msg.chunkId as string;
    const seq = msg.seq as number;
    const total = msg.total as number;
    const payload = msg.payload as string;

    let p = pending.get(chunkId);
    if (!p) {
      p = { chunks: new Array(total) as string[], total, received: 0, type: baseType, startedAt: Date.now() };
      pending.set(chunkId, p);
    }
    if (p.chunks[seq] === undefined) {
      p.chunks[seq] = payload;
      p.received++;
    }
    if (p.received < p.total) return null; // incomplete

    pending.delete(chunkId);
    const reassembled = p.chunks.join("");
    try {
      return JSON.parse(reassembled) as { type: string; [k: string]: unknown };
    } catch {
      console.warn(`Failed to parse reassembled chunk ${chunkId}`);
      return null;
    }
  };
}
