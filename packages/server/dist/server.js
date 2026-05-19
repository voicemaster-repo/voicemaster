#!/usr/bin/env node
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/server.ts
var server_exports = {};
__export(server_exports, {
  SignalingServer: () => SignalingServer
});
module.exports = __toCommonJS(server_exports);
var import_ws = require("ws");
var import_crypto = require("crypto");
var SignalingServer = class {
  rooms = /* @__PURE__ */ new Map();
  clients = /* @__PURE__ */ new Map();
  constructor(port2 = 3001) {
    const wss = new import_ws.WebSocketServer({ port: port2 });
    console.log(`\u{1F399}\uFE0F VoiceFlow Signaling Server`);
    console.log(`\u{1F4E1} WebSocket endpoint: ws://localhost:${port2}`);
    console.log(`\u2705 Server started on port ${port2}`);
    wss.on("connection", (ws, req) => {
      const url = new URL(req.url || "", `http://${req.headers.host}`);
      const userId = url.searchParams.get("userId") || (0, import_crypto.randomUUID)();
      const roomId = url.searchParams.get("roomId") || "default";
      console.log(`\u{1F535} User ${userId} joined room ${roomId}`);
      this.clients.set(ws, { userId, roomId });
      if (!this.rooms.has(roomId)) {
        this.rooms.set(roomId, /* @__PURE__ */ new Map());
      }
      this.rooms.get(roomId).set(userId, ws);
      this.broadcastToRoom(roomId, userId, {
        type: "user-joined",
        roomId,
        userId,
        payload: { users: Array.from(this.rooms.get(roomId).keys()) }
      });
      ws.on("message", (data) => {
        var _a;
        try {
          const message = JSON.parse(data.toString());
          console.log(`\u{1F4E8} Message from ${userId}: ${message.type}`);
          if (message.type === "signal") {
            const targetWs = (_a = this.rooms.get(message.roomId)) == null ? void 0 : _a.get(message.userId);
            if (targetWs && targetWs.readyState === import_ws.WebSocket.OPEN) {
              targetWs.send(JSON.stringify({
                type: "signal",
                userId,
                payload: message.payload
              }));
            }
          }
        } catch (err) {
          console.error("Parse error:", err);
        }
      });
      ws.on("close", () => {
        var _a, _b;
        console.log(`\u{1F534} User ${userId} left room ${roomId}`);
        (_a = this.rooms.get(roomId)) == null ? void 0 : _a.delete(userId);
        this.clients.delete(ws);
        this.broadcastToRoom(roomId, userId, {
          type: "user-left",
          roomId,
          userId,
          payload: { users: Array.from(((_b = this.rooms.get(roomId)) == null ? void 0 : _b.keys()) || []) }
        });
      });
    });
  }
  broadcastToRoom(roomId, excludeUserId, message) {
    const room = this.rooms.get(roomId);
    if (!room) return;
    room.forEach((ws, userId) => {
      if (userId !== excludeUserId && ws.readyState === import_ws.WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
      }
    });
  }
};
var port = parseInt(process.env.PORT || "3001");
new SignalingServer(port);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  SignalingServer
});
