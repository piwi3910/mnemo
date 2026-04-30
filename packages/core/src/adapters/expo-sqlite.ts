import type { SqliteAdapter, SqliteRunResult, Row } from "../adapter";

interface ExpoDb {
  execSync(sql: string): void;
  runSync(sql: string, params: readonly unknown[]): { changes: number; lastInsertRowId: number };
  getFirstSync<R>(sql: string, params: readonly unknown[]): R | null | undefined;
  getAllSync<R>(sql: string, params: readonly unknown[]): R[];
  withTransactionSync(fn: () => void): void;
  closeSync(): void;
}

export interface ExpoSqliteApi {
  openDatabaseSync(name: string): ExpoDb;
}

export class ExpoSqliteAdapter implements SqliteAdapter {
  private db: ExpoDb;

  constructor(name: string, api?: ExpoSqliteApi) {
    const sqlite = api ?? requireExpoSqliteAtRuntime();
    this.db = sqlite.openDatabaseSync(name);
  }

  exec(sql: string): void {
    this.db.execSync(sql);
  }

  run(sql: string, params: readonly unknown[] = []): SqliteRunResult {
    const r = this.db.runSync(sql, params);
    return { changes: r.changes, lastInsertRowid: r.lastInsertRowId };
  }

  get<R = Row>(sql: string, params: readonly unknown[] = []): R | undefined {
    const r = this.db.getFirstSync<R>(sql, params);
    return r ?? undefined;
  }

  all<R = Row>(sql: string, params: readonly unknown[] = []): R[] {
    return this.db.getAllSync<R>(sql, params);
  }

  transaction<T>(fn: () => T): T {
    let result!: T;
    let err: unknown;
    this.db.withTransactionSync(() => {
      try { result = fn(); }
      catch (e) { err = e; throw e; }
    });
    if (err) throw err;
    return result;
  }

  close(): void {
    this.db.closeSync();
  }
}

function requireExpoSqliteAtRuntime(): ExpoSqliteApi {
  // Lazy require so this module imports cleanly in non-Expo environments.
  // In Expo runtime, `expo-sqlite` is available; in tests, callers pass an api.
  const mod = (Function("return require('expo-sqlite')")()) as ExpoSqliteApi;
  return mod;
}
