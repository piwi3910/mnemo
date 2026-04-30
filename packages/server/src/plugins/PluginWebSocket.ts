import http from "http";
import { WebSocketServer, WebSocket } from "ws";
import { auth } from "../auth.js";
import { createLogger } from "../lib/logger.js";

const log = createLogger("plugin-ws");

export class PluginWebSocket {
  private wss: WebSocketServer;

  constructor(server: http.Server) {
    // noServer: true so we don't intercept upgrades for other paths (e.g. /ws/yjs/*).
    // We handle the path-specific upgrade routing ourselves below.
    this.wss = new WebSocketServer({
      noServer: true,
      maxPayload: 64 * 1024, // 64KB limit
    });

    server.on("upgrade", (req, socket, head) => {
      try {
        const url = new URL(req.url ?? "", `http://${req.headers.host ?? "localhost"}`);
        if (url.pathname !== "/ws/plugins") return; // not ours; let other handlers take it

        // Auth check (was previously verifyClient)
        (async () => {
          const cookieHeader = req.headers.cookie;
          if (!cookieHeader) {
            socket.write("HTTP/1.1 401 Unauthorized\r\nConnection: close\r\n\r\n");
            socket.destroy();
            return;
          }
          let session;
          try {
            session = await auth.api.getSession({ headers: new Headers({ cookie: cookieHeader }) });
          } catch {
            socket.write("HTTP/1.1 401 Unauthorized\r\nConnection: close\r\n\r\n");
            socket.destroy();
            return;
          }
          if (!session) {
            socket.write("HTTP/1.1 401 Unauthorized\r\nConnection: close\r\n\r\n");
            socket.destroy();
            return;
          }
          if ((session.user as Record<string, unknown>).disabled) {
            socket.write("HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n");
            socket.destroy();
            return;
          }
          this.wss.handleUpgrade(req, socket, head, (ws) => {
            this.wss.emit("connection", ws, req);
          });
        })();
      } catch {
        socket.destroy();
      }
    });

    this.wss.on("connection", (ws) => {
      ws.on("error", (err) => {
        log.error("Client error:", err);
      });
    });

    log.info("WebSocket server attached at /ws/plugins (noServer mode)");
  }

  broadcast(event: string, data: object): void {
    const payload = JSON.stringify({ event, data });
    for (const client of this.wss.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    }
  }

  close(): void {
    this.wss.close();
  }
}
