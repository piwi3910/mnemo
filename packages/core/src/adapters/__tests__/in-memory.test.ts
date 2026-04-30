import { runConformanceSuite } from "../../__tests__/adapter-conformance";
import { InMemoryAdapter } from "../in-memory";

runConformanceSuite("InMemoryAdapter", () => new InMemoryAdapter());
