import { runConformanceSuite } from "../../__tests__/adapter-conformance";
import { BetterSqlite3Adapter } from "../better-sqlite3";

runConformanceSuite("BetterSqlite3Adapter", () => new BetterSqlite3Adapter(":memory:"));
