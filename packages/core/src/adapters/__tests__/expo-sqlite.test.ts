import { describe, it, expect, vi, beforeEach } from "vitest";
import { ExpoSqliteAdapter, type ExpoSqliteApi } from "../expo-sqlite";

function makeMock(): { api: ExpoSqliteApi; calls: string[] } {
  const calls: string[] = [];
  const stmts = new Map<string, { run: any; get: any; all: any }>();
  const data = new Map<string, any[]>();

  const mockDb = {
    execSync: (sql: string) => { calls.push(`exec:${sql}`); },
    runSync: (sql: string, params: any[]) => {
      calls.push(`run:${sql}|${JSON.stringify(params)}`);
      return { changes: 1, lastInsertRowId: 1 };
    },
    getFirstSync: (sql: string, params: any[]) => {
      calls.push(`getFirst:${sql}`);
      return undefined;
    },
    getAllSync: (sql: string, params: any[]) => {
      calls.push(`getAll:${sql}`);
      return [];
    },
    withTransactionSync: (fn: () => void) => {
      calls.push(`tx:start`);
      try { fn(); calls.push(`tx:commit`); }
      catch (e) { calls.push(`tx:rollback`); throw e; }
    },
    closeSync: () => { calls.push(`close`); },
  };

  const api: ExpoSqliteApi = {
    openDatabaseSync: () => mockDb as any,
  };
  return { api, calls };
}

describe("ExpoSqliteAdapter", () => {
  it("delegates exec to execSync", () => {
    const { api, calls } = makeMock();
    const a = new ExpoSqliteAdapter("test.db", api);
    a.exec("CREATE TABLE x (id INT)");
    expect(calls).toContain("exec:CREATE TABLE x (id INT)");
  });

  it("delegates run with params", () => {
    const { api, calls } = makeMock();
    const a = new ExpoSqliteAdapter("test.db", api);
    const r = a.run("INSERT INTO x VALUES (?)", [1]);
    expect(r.changes).toBe(1);
    expect(calls.find(c => c.startsWith("run:"))).toContain("[1]");
  });

  it("transaction commits", () => {
    const { api, calls } = makeMock();
    const a = new ExpoSqliteAdapter("test.db", api);
    a.transaction(() => { a.run("X", []); });
    expect(calls).toContain("tx:start");
    expect(calls).toContain("tx:commit");
  });

  it("transaction rolls back on throw", () => {
    const { api, calls } = makeMock();
    const a = new ExpoSqliteAdapter("test.db", api);
    expect(() => a.transaction(() => { throw new Error("boom"); })).toThrow();
    expect(calls).toContain("tx:rollback");
  });
});
