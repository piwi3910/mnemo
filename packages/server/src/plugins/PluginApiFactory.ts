import { PluginAPI, PluginManifest, PluginEvent, PluginEventHandler, NoteEntry } from "./types.js";
import { PluginEventBus } from "./PluginEventBus.js";
import { PluginRouter } from "./PluginRouter.js";
import { PluginHealthMonitor } from "./PluginHealthMonitor.js";
import {
  getStorageValue,
  setStorageValue,
  deleteStorageValue,
  listStorageEntries,
} from "../services/pluginStorageService.js";
import { prisma } from "../prisma.js";
import { RequestHandler } from "express";
import path from "path";
import fs from "fs";

interface PluginApiFactoryDeps {
  eventBus: PluginEventBus;
  pluginRouter: PluginRouter;
  healthMonitor: PluginHealthMonitor;
  notesDir: string;
}

export class PluginApiFactory {
  private deps: PluginApiFactoryDeps;

  constructor(deps: PluginApiFactoryDeps) {
    this.deps = deps;
  }

  createApi(manifest: PluginManifest): PluginAPI {
    const pluginId = manifest.id;
    const dataDir = path.join(process.cwd(), "data", "plugins", pluginId);
    fs.mkdirSync(dataDir, { recursive: true });

    const api: PluginAPI = {
      notes: this.createNotesApi(pluginId),
      events: this.createEventsApi(pluginId),
      routes: this.createRoutesApi(pluginId),
      storage: this.createStorageApi(pluginId),
      settings: this.createSettingsApi(pluginId),
      search: this.createSearchApi(pluginId),
      log: {
        info: (msg: string, ...args: unknown[]) =>
          console.log(`[plugin:${pluginId}]`, msg, ...args),
        warn: (msg: string, ...args: unknown[]) =>
          console.warn(`[plugin:${pluginId}]`, msg, ...args),
        error: (msg: string, ...args: unknown[]) =>
          console.error(`[plugin:${pluginId}]`, msg, ...args),
      },
      plugin: {
        id: pluginId,
        version: manifest.version,
        dataDir,
      },
    };

    return api;
  }

  private createNotesApi(_pluginId: string): PluginAPI["notes"] {
    const notesDir = this.deps.notesDir;
    return {
      async get(userId: string, notePath: string) {
        const fullPath = path.join(notesDir, userId, `${notePath}.md`);
        const content = await fs.promises.readFile(fullPath, "utf-8");
        const stat = await fs.promises.stat(fullPath);
        const title = notePath.split("/").pop() || notePath;
        return { path: notePath, content, title, modifiedAt: stat.mtime };
      },
      async list(userId: string, folder?: string) {
        async function scanDir(dirPath: string, prefix: string): Promise<NoteEntry[]> {
          const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
          const results: NoteEntry[] = [];
          for (const e of entries) {
            const entryPath = prefix ? `${prefix}/${e.name}` : e.name;
            if (e.isDirectory()) {
              const children = await scanDir(path.join(dirPath, e.name), entryPath);
              results.push({ name: e.name, path: entryPath, type: "directory", children });
            } else {
              results.push({ name: e.name, path: entryPath, type: "file" });
            }
          }
          return results;
        }
        const dir = folder
          ? path.join(notesDir, userId, folder)
          : path.join(notesDir, userId);
        return scanDir(dir, folder || "");
      },
      async create(userId: string, notePath: string, content: string) {
        const fullPath = path.join(notesDir, userId, `${notePath}.md`);
        await fs.promises.mkdir(path.dirname(fullPath), { recursive: true });
        await fs.promises.writeFile(fullPath, content, "utf-8");
      },
      async update(userId: string, notePath: string, content: string) {
        const fullPath = path.join(notesDir, userId, `${notePath}.md`);
        await fs.promises.writeFile(fullPath, content, "utf-8");
      },
      async delete(userId: string, notePath: string) {
        const fullPath = path.join(notesDir, userId, `${notePath}.md`);
        await fs.promises.unlink(fullPath);
      },
    };
  }

  private createEventsApi(pluginId: string): PluginAPI["events"] {
    return {
      on: (event: PluginEvent, handler: PluginEventHandler) => {
        this.deps.eventBus.on(event, handler, pluginId);
      },
      off: (event: PluginEvent, handler: PluginEventHandler) => {
        this.deps.eventBus.off(event, handler);
      },
    };
  }

  private createRoutesApi(pluginId: string): PluginAPI["routes"] {
    const { pluginRouter, healthMonitor } = this.deps;
    return {
      register: (method, routePath, handler: RequestHandler) => {
        const wrappedHandler: RequestHandler = async (req, res, next) => {
          try {
            await Promise.resolve(handler(req, res, next));
          } catch (err) {
            healthMonitor.recordError(pluginId);
            next(err);
          }
        };
        pluginRouter.register(pluginId, method, routePath, wrappedHandler);
      },
    };
  }

  private createStorageApi(pluginId: string): PluginAPI["storage"] {
    return {
      get: (key, userId?) => getStorageValue(pluginId, key, userId),
      set: (key, value, userId?) => setStorageValue(pluginId, key, value, userId),
      delete: (key, userId?) => deleteStorageValue(pluginId, key, userId),
      list: (prefix?, userId?) => listStorageEntries(pluginId, prefix, userId),
    };
  }

  private createSettingsApi(pluginId: string): PluginAPI["settings"] {
    return {
      async get(key: string, userId?: string) {
        const settingsKey = `plugin:${pluginId}:${key}`;

        // Check user override first
        if (userId) {
          const userSetting = await prisma.settings.findUnique({
            where: { key_userId: { key: settingsKey, userId } },
          });
          if (userSetting) return JSON.parse(userSetting.value);
        }

        // Fall back to admin default (using empty string as global sentinel)
        const adminSetting = await prisma.settings.findUnique({
          where: { key_userId: { key: settingsKey, userId: "" } },
        });
        if (adminSetting) return JSON.parse(adminSetting.value);

        return null;
      },
    };
  }

  private createSearchApi(_pluginId: string): PluginAPI["search"] {
    return {
      async index(userId, notePath, fields) {
        await prisma.searchIndex.upsert({
          where: { notePath_userId: { notePath, userId } },
          create: {
            notePath,
            userId,
            title: fields.title,
            content: fields.content,
            tags: fields.tags || [],
            modifiedAt: new Date(),
          },
          update: {
            title: fields.title,
            content: fields.content,
            tags: fields.tags || [],
            modifiedAt: new Date(),
          },
        });
      },
      async query(userId, queryStr) {
        const results = await prisma.searchIndex.findMany({
          where: {
            userId,
            OR: [
              { title: { contains: queryStr, mode: "insensitive" } },
              { content: { contains: queryStr, mode: "insensitive" } },
            ],
          },
        });
        return results.map((r) => ({
          path: r.notePath,
          title: r.title,
          snippet: r.content.substring(0, 200),
          score: 1,
        }));
      },
    };
  }
}
