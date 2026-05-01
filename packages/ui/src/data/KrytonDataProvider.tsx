// packages/ui/src/data/KrytonDataProvider.tsx
import { createContext, useContext, type ReactNode } from "react";
import type { KrytonDataAdapter } from "./types";

const Ctx = createContext<KrytonDataAdapter | null>(null);

export function KrytonDataProvider({ adapter, children }: { adapter: KrytonDataAdapter; children: ReactNode }) {
  return <Ctx.Provider value={adapter}>{children}</Ctx.Provider>;
}

export function useKrytonData(): KrytonDataAdapter {
  const v = useContext(Ctx);
  if (!v) throw new Error("useKrytonData must be used within <KrytonDataProvider>");
  return v;
}
