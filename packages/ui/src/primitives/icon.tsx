/**
 * Icon — re-exports all named exports from lucide-react.
 *
 * Import directly from this module to avoid name collisions with
 * our UI primitives (Badge, Sheet, etc.) that share names with lucide icons.
 *
 * Usage:
 *   import { Check, ChevronDown } from "@azrtydxb/ui/icon"
 *   // or from lucide-react directly
 */

// Named re-export — consumers should import directly from lucide-react
// or from this module path to avoid collisions with our primitive names.
export * from "lucide-react";
