import * as fs from "fs/promises";
import * as path from "path";
import * as crypto from "crypto";

export interface FileEntry {
  index: number;
  originalName: string;
  resolvedPath: string;
  size: number;
  status: "valid" | "duplicate" | "warning" | "invalid";
  errors: string[];
  existingNote?: boolean;
}

export interface Session {
  id: string;
  userId: string;
  dir: string;
  files: FileEntry[];
  targetFolder: string;
  preserveStructure: boolean;
  createdAt: number;
}

interface StoreOptions {
  maxPerUser: number;
  expiryMs: number;
}

export class SessionStore {
  private sessions = new Map<string, Session>();
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(
    private baseDir: string,
    private options: StoreOptions
  ) {
    this.timer = setInterval(() => this.cleanExpired(), 5 * 60 * 1000);
  }

  async create(userId: string): Promise<Session> {
    const userSessions = [...this.sessions.values()].filter(
      (s) => s.userId === userId
    );
    if (userSessions.length >= this.options.maxPerUser) {
      throw new Error(
        `Max concurrent session limit (${this.options.maxPerUser}) reached`
      );
    }

    const id = crypto.randomUUID();
    const dir = path.join(this.baseDir, userId, id);
    await fs.mkdir(dir, { recursive: true });

    const session: Session = {
      id,
      userId,
      dir,
      files: [],
      targetFolder: "",
      preserveStructure: false,
      createdAt: Date.now(),
    };
    this.sessions.set(id, session);
    return session;
  }

  get(sessionId: string, userId: string): Session | null {
    const session = this.sessions.get(sessionId);
    if (!session || session.userId !== userId) return null;
    return session;
  }

  async delete(sessionId: string, userId: string): Promise<boolean> {
    const session = this.get(sessionId, userId);
    if (!session) return false;
    this.sessions.delete(sessionId);
    await fs.rm(session.dir, { recursive: true, force: true }).catch(() => {});
    return true;
  }

  private async cleanExpired(): Promise<void> {
    const now = Date.now();
    for (const [id, session] of this.sessions) {
      if (now - session.createdAt > this.options.expiryMs) {
        this.sessions.delete(id);
        await fs.rm(session.dir, { recursive: true, force: true }).catch(() => {});
      }
    }
  }

  async cleanAll(): Promise<void> {
    for (const [id, session] of this.sessions) {
      this.sessions.delete(id);
      await fs.rm(session.dir, { recursive: true, force: true }).catch(() => {});
    }
  }

  dispose(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}
