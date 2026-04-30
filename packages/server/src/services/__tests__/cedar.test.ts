import { describe, it, expect } from "vitest";
import { evaluatePolicy } from "../cedar.js";

const POLICY = `
permit (
  principal == Kryton::Agent::"a1",
  action == Kryton::Action::"read",
  resource is Kryton::Note
) when { resource.folder like "inbox/*" };
`;

describe("cedar evaluator", () => {
  it("permits when condition matches", async () => {
    const r = await evaluatePolicy(POLICY, {
      principal: { type: "Kryton::Agent", id: "a1" },
      action: { type: "Kryton::Action", id: "read" },
      resource: { type: "Kryton::Note", id: "p1", attrs: { folder: "inbox/2026" } },
    });
    expect(r.allowed).toBe(true);
  });

  it("denies when condition fails", async () => {
    const r = await evaluatePolicy(POLICY, {
      principal: { type: "Kryton::Agent", id: "a1" },
      action: { type: "Kryton::Action", id: "read" },
      resource: { type: "Kryton::Note", id: "p1", attrs: { folder: "private/" } },
    });
    expect(r.allowed).toBe(false);
  });

  it("denies when principal does not match", async () => {
    const r = await evaluatePolicy(POLICY, {
      principal: { type: "Kryton::Agent", id: "other" },
      action: { type: "Kryton::Action", id: "read" },
      resource: { type: "Kryton::Note", id: "p1", attrs: { folder: "inbox/2026" } },
    });
    expect(r.allowed).toBe(false);
  });

  it("returns allowed=false for empty policy set", async () => {
    const r = await evaluatePolicy("", {
      principal: { type: "Kryton::Agent", id: "a1" },
      action: { type: "Kryton::Action", id: "read" },
      resource: { type: "Kryton::Note", id: "p1" },
    });
    expect(r.allowed).toBe(false);
  });
});
