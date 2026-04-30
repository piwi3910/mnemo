export type Row = Record<string, unknown>;

export interface SqliteRunResult {
  changes: number;
  lastInsertRowid: number | bigint;
}

export interface SqliteAdapter {
  exec(sql: string): void;
  run(sql: string, params?: readonly unknown[]): SqliteRunResult;
  get<R = Row>(sql: string, params?: readonly unknown[]): R | undefined;
  all<R = Row>(sql: string, params?: readonly unknown[]): R[];
  transaction<T>(fn: () => T): T;
  close(): void;
}
