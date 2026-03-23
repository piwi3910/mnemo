import { DataSource } from "typeorm";
import { AuthProvider } from "./entities/AuthProvider";
import { GraphEdge } from "./entities/GraphEdge";
import { InviteCode } from "./entities/InviteCode";
import { RefreshToken } from "./entities/RefreshToken";
import { SearchIndex } from "./entities/SearchIndex";
import { Settings } from "./entities/Settings";
import { User } from "./entities/User";

const DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgresql://postgres:postgres@localhost:5432/mnemo";

export const AppDataSource = new DataSource({
  type: "postgres",
  url: DATABASE_URL,
  synchronize: true,
  logging: false,
  entities: [AuthProvider, GraphEdge, InviteCode, RefreshToken, SearchIndex, Settings, User],
});
