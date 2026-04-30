import { BetterSqlite3Adapter } from "./better-sqlite3";

export class InMemoryAdapter extends BetterSqlite3Adapter {
  constructor() {
    super(":memory:");
  }
}
