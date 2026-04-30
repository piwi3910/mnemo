import { describe, it, expectTypeOf } from "vitest";
import type { SqliteAdapter, Row } from "../adapter";

describe("SqliteAdapter type", () => {
  it("get returns Row | undefined by default", () => {
    expectTypeOf<ReturnType<SqliteAdapter["get"]>>().toEqualTypeOf<Row | undefined>();
  });
  it("all returns Row[] by default", () => {
    expectTypeOf<ReturnType<SqliteAdapter["all"]>>().toEqualTypeOf<Row[]>();
  });
});
