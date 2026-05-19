"use strict";
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

// src/index.ts
var index_exports = {};
__export(index_exports, {
  useVoice: () => useVoice
});
module.exports = __toCommonJS(index_exports);

// src/useVoice.ts
var import_react = require("react");
var import_core = require("@voicemaster/core");
function useVoice(options) {
  const [isConnected, setIsConnected] = (0, import_react.useState)(false);
  const [isMuted, setIsMuted] = (0, import_react.useState)(false);
  const [remoteStream, setRemoteStream] = (0, import_react.useState)(null);
  const [speakingUsers, setSpeakingUsers] = (0, import_react.useState)(/* @__PURE__ */ new Set());
  const [peers, setPeers] = (0, import_react.useState)([]);
  const clientRef = (0, import_react.useRef)(null);
  (0, import_react.useEffect)(() => {
    const client = new import_core.VoiceClient({
      signalingUrl: options.signalingUrl,
      roomId: options.roomId,
      userId: options.userId,
      iceServers: options.iceServers,
      autoConnect: false
    });
    client.on("connected", () => {
      setIsConnected(true);
    });
    client.on("disconnected", () => {
      setIsConnected(false);
      setPeers([]);
      setRemoteStream(null);
    });
    client.on("remoteStream", (stream) => {
      setRemoteStream(stream);
    });
    client.on("userJoined", (userId) => {
      setPeers((prev) => [...prev, userId]);
    });
    client.on("userLeft", (userId) => {
      setPeers((prev) => prev.filter((id) => id !== userId));
      setSpeakingUsers((prev) => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    });
    client.on("speaking", (userId) => {
      setSpeakingUsers((prev) => new Set(prev).add(userId));
    });
    client.on("stoppedSpeaking", (userId) => {
      setSpeakingUsers((prev) => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    });
    client.on("error", (error) => {
      console.error("Voice client error:", error);
    });
    clientRef.current = client;
    if (options.autoConnect !== false) {
      client.connect();
    }
    return () => {
      client.disconnect();
    };
  }, [options.signalingUrl, options.roomId, options.userId, options.iceServers]);
  const connect = (0, import_react.useCallback)(() => {
    clientRef.current?.connect();
  }, []);
  const disconnect = (0, import_react.useCallback)(() => {
    clientRef.current?.disconnect();
  }, []);
  const toggleMute = (0, import_react.useCallback)(() => {
    if (clientRef.current) {
      clientRef.current.toggleMute();
      setIsMuted((prev) => !prev);
    }
  }, []);
  return {
    isConnected,
    isMuted,
    remoteStream,
    peers,
    speakingUsers,
    connect,
    disconnect,
    toggleMute,
    client: clientRef.current
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  useVoice
});
