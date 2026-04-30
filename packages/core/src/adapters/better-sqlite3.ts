import Database, { type Database as Db } from "better-sqlite3";
import type { SqliteAdapter, SqliteRunResult, Row } from "../adapter";

export class BetterSqlite3Adapter implements SqliteAdapter {
  private db: Db;

  constructor(filename: string) {
    this.db = new Database(filename);
    this.db.pragma("journal_mode = WAL");
    this.db.pragma("foreign_keys = ON");
  }

  exec(sql: string): void {
    this.db.exec(sql);
  }

  run(sql: string, params: readonly unknown[] = []): SqliteRunResult {
    const r = this.db.prepare(sql).run(...params);
    return { changes: r.changes, lastInsertRowid: r.lastInsertRowid };
  }

  get<R = Row>(sql: string, params: readonly unknown[] = []): R | undefined {
    return this.db.prepare(sql).get(...params) as R | undefined;
  }

  all<R = Row>(sql: string, params: readonly unknown[] = []): R[] {
    return this.db.prepare(sql).all(...params) as R[];
  }

  transaction<T>(fn: () => T): T {
    return this.db.transaction(fn)();
  }

  close(): void {
    this.db.close();
  }
}
