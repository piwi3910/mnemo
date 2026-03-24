import http from "http";
import { WebSocketServer, WebSocket } from "ws";

export class PluginWebSocket {
  private wss: WebSocketServer;

  constructor(server: http.Server) {
    this.wss = new WebSocketServer({ server, path: "/ws/plugins" });

    this.wss.on("connection", (ws) => {
      ws.on("error", (err) => {
        console.error("[plugin-ws] Client error:", err);
      });
    });

    console.log("[plugin-ws] WebSocket server attached at /ws/plugins");
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
