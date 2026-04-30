import { isAuthorized } from "@cedar-policy/cedar-wasm/nodejs";
import type { CedarValueJson } from "@cedar-policy/cedar-wasm/nodejs";

export interface AuthzPrincipal {
  type: string;
  id: string;
}

export interface AuthzAction {
  type: string;
  id: string;
}

export interface AuthzResource {
  type: string;
  id: string;
  attrs?: Record<string, unknown>;
}

export interface AuthzInput {
  principal: AuthzPrincipal;
  action: AuthzAction;
  resource: AuthzResource;
  context?: Record<string, unknown>;
}

export interface AuthzResult {
  allowed: boolean;
  reasons?: string[];
}

/**
 * Evaluate a Cedar policy string against a request triple.
 *
 * @param policySource - Cedar policy text (may be empty or multi-policy)
 * @param input        - Principal, action, resource, and optional context
 * @returns `{ allowed: boolean }` — always resolves, never throws on policy errors
 */
export async function evaluatePolicy(
  policySource: string,
  input: AuthzInput,
): Promise<AuthzResult> {
  const entities = input.resource.attrs
    ? [
        {
          uid: { type: input.resource.type, id: input.resource.id },
          attrs: toAttrRecord(input.resource.attrs),
          parents: [] as { type: string; id: string }[],
        },
      ]
    : [];

  const answer = isAuthorized({
    policies: { staticPolicies: policySource },
    principal: { type: input.principal.type, id: input.principal.id },
    action: { type: input.action.type, id: input.action.id },
    resource: { type: input.resource.type, id: input.resource.id },
    context: toAttrRecord(input.context ?? {}),
    entities,
  });

  if (answer.type === "failure") {
    // Parse failure — treat as deny
    return {
      allowed: false,
      reasons: answer.errors.map((e) => e.message),
    };
  }

  return {
    allowed: answer.response.decision === "allow",
    reasons: answer.response.diagnostics.errors.map((e) => e.error.message),
  };
}

/** Convert a plain JS record to Cedar's CedarValueJson record type */
function toAttrRecord(
  obj: Record<string, unknown>,
): Record<string, CedarValueJson> {
  const out: Record<string, CedarValueJson> = {};
  for (const [k, v] of Object.entries(obj)) {
    out[k] = toCedarValue(v);
  }
  return out;
}

function toCedarValue(v: unknown): CedarValueJson {
  if (
    typeof v === "string" ||
    typeof v === "boolean" ||
    typeof v === "number" ||
    v === null
  ) {
    return v as CedarValueJson;
  }
  if (Array.isArray(v)) {
    return v.map(toCedarValue) as CedarValueJson;
  }
  if (typeof v === "object") {
    const out: Record<string, CedarValueJson> = {};
    for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
      out[k] = toCedarValue(val);
    }
    return out as CedarValueJson;
  }
  // fallback: stringify
  return String(v);
}
