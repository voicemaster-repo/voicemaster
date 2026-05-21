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
  VoiceClient: () => VoiceClient
});
module.exports = __toCommonJS(index_exports);

// src/VoiceClient.ts
var VoiceClient = class {
  constructor(config) {
    this.ws = null;
    this.pc = null;
    this.localStream = null;
    this.remoteStream = null;
    this.audioSender = null;
    this.eventHandlers = /* @__PURE__ */ new Map();
    this.isConnectedFlag = false;
    this.isMutedFlag = false;
    this.targetUserId = null;
    this.connectingPromise = null;
    this.peers = /* @__PURE__ */ new Set();
    this.signalingUrl = config.signalingUrl;
    this.roomId = config.roomId;
    this.userId = config.userId;
    this.iceServers = config.iceServers || [
      { urls: "stun:stun.l.google.com:19302" }
    ];
    if (config.autoConnect !== false) {
      Promise.resolve().then(() => this.connect());
    }
  }
  on(event, callback) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event).push(callback);
  }
  emit(event, ...args) {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach((handler) => handler(...args));
    }
  }
  async connect() {
    if (this.connectingPromise) {
      return this.connectingPromise;
    }
    this.connectingPromise = (async () => {
      try {
        await this.initMicrophone();
        this.initPeerConnection();
        this.initWebSocket();
      } catch (error) {
        this.emit("error", error);
        throw error;
      } finally {
        this.connectingPromise = null;
      }
    })();
    return this.connectingPromise;
  }
  async initMicrophone() {
    this.localStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      }
    });
    this.emit("localStream", this.localStream);
  }
  initPeerConnection() {
    this.pc = new RTCPeerConnection({ iceServers: this.iceServers });
    this.localStream?.getTracks().forEach((track) => {
      const sender = this.pc.addTrack(track, this.localStream);
      if (track.kind === "audio") {
        this.audioSender = sender;
      }
    });
    this.pc.ontrack = (event) => {
      const stream = event.streams?.[0] || new MediaStream([event.track]);
      this.remoteStream = stream;
      console.log("[VoiceClient] Remote track received from peer", {
        track: event.track,
        stream,
        fromUserId: this.targetUserId,
        myUserId: this.userId
      });
      this.emit("remoteStream", this.remoteStream);
    };
    this.pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.send({
          type: "candidate",
          candidate: event.candidate
        });
      }
    };
    this.pc.onconnectionstatechange = () => {
      if (this.pc?.connectionState === "connected") {
        if (!this.isConnectedFlag) {
          this.isConnectedFlag = true;
          this.emit("connected");
        }
      }
    };
  }
  initWebSocket() {
    const url = `${this.signalingUrl}?userId=${this.userId}&roomId=${this.roomId}`;
    this.ws = new WebSocket(url);
    this.ws.onopen = () => {
      console.log("[VoiceClient] WebSocket connected");
      this.send({ type: "join", roomId: this.roomId, userId: this.userId });
    };
    this.ws.onmessage = async (event) => {
      const message = JSON.parse(event.data);
      await this.handleSignalingMessage(message);
    };
    this.ws.onerror = (event) => {
      console.error("[VoiceClient] WebSocket error", event);
      this.emit("error", new Error("WebSocket error"));
    };
    this.ws.onclose = () => {
      console.log("[VoiceClient] WebSocket closed");
      this.emit("disconnected");
    };
  }
  async handleSignalingMessage(message) {
    console.log("[VoiceClient] Received message:", message.type, message);
    switch (message.type) {
      case "user-joined":
        console.log("[VoiceClient] User joined, myId:", this.userId, "theirId:", message.userId);
        if (message.userId !== this.userId) {
          this.peers.add(message.userId);
          console.log("[VoiceClient] Creating offer...");
          this.targetUserId = message.userId;
          await this.createOffer();
          this.emit("userJoined", message.userId);
        } else {
          console.log("[VoiceClient] Ignoring my own join");
        }
        break;
      case "offer":
        console.log("[VoiceClient] Received offer");
        this.targetUserId = message.userId;
        await this.handleOffer(message);
        break;
      case "answer":
        console.log("[VoiceClient] Received answer");
        await this.handleAnswer(message);
        break;
      case "candidate":
        console.log("[VoiceClient] Received candidate");
        await this.handleCandidate(message);
        break;
      case "user-left":
        this.peers.delete(message.userId);
        this.emit("userLeft", message.userId);
        break;
      default:
        console.log("[VoiceClient] Unknown message type:", message.type);
    }
  }
  async createOffer() {
    const offer = await this.pc.createOffer();
    await this.pc.setLocalDescription(offer);
    this.send({
      type: "offer",
      sdp: this.pc.localDescription
    });
  }
  async handleOffer(message) {
    try {
      console.log("Handling offer", message);
      const offer = new RTCSessionDescription(message.sdp);
      await this.pc.setRemoteDescription(offer);
      console.log("Remote description set");
      const answer = await this.pc.createAnswer();
      console.log("Answer created");
      await this.pc.setLocalDescription(answer);
      console.log("Local description set");
      this.send({
        type: "answer",
        sdp: this.pc.localDescription
      });
    } catch (err) {
      console.error("Offer handling error:", err);
    }
  }
  async handleAnswer(message) {
    const answer = new RTCSessionDescription(message.sdp);
    await this.pc.setRemoteDescription(answer);
  }
  async handleCandidate(message) {
    try {
      if (message.candidate) {
        const candidate = new RTCIceCandidate(message.candidate);
        await this.pc.addIceCandidate(candidate);
        console.log("ICE candidate added");
      }
    } catch (err) {
      console.error("Candidate error:", err);
    }
  }
  send(data) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      console.warn("[VoiceClient] WebSocket is not open, cannot send message", data);
    }
  }
  disconnect() {
    this.peers.clear();
    if (this.ws) {
      this.send({ type: "leave", roomId: this.roomId, userId: this.userId });
      this.ws.close();
    }
    this.pc?.close();
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
    }
    this.isConnectedFlag = false;
    this.emit("disconnected");
  }
  getPeers() {
    return Array.from(this.peers);
  }
  toggleMute() {
    if (!this.localStream) {
      console.warn("[VoiceClient] No local stream available for muting");
      return;
    }
    const audioTrack = this.localStream.getAudioTracks()[0];
    if (!audioTrack) {
      console.warn("[VoiceClient] No audio track found for muting");
      return;
    }
    const shouldMute = audioTrack.enabled;
    audioTrack.enabled = !shouldMute;
    this.isMutedFlag = !shouldMute;
    if (this.audioSender) {
      this.audioSender.replaceTrack(shouldMute ? null : audioTrack).then(() => {
        console.log("[VoiceClient] Audio sender replaced after mute toggle", {
          muted: this.isMutedFlag,
          trackId: audioTrack.id,
          enabled: audioTrack.enabled
        });
      }).catch((err) => {
        console.error("[VoiceClient] Failed to replace audio sender track", err);
      });
    }
    console.log(`[VoiceClient] Mute toggled: now ${this.isMutedFlag ? "muted" : "unmuted"}`, {
      trackId: audioTrack.id,
      enabled: audioTrack.enabled,
      state: audioTrack.readyState
    });
  }
  isMuted() {
    const muted = this.isMutedFlag;
    console.log("[VoiceClient] isMuted check:", { muted });
    return muted;
  }
  getUserId() {
    return this.userId;
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  VoiceClient
});
