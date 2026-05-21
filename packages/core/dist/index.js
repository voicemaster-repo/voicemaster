"use strict";
<<<<<<< HEAD
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
=======
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
>>>>>>> dd8b84457c8d4edb5d353b32e941d030d53668ee
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
<<<<<<< HEAD
=======
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
>>>>>>> dd8b84457c8d4edb5d353b32e941d030d53668ee
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  VoiceClient: () => VoiceClient
});
module.exports = __toCommonJS(index_exports);

// src/VoiceClient.ts
<<<<<<< HEAD
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
=======
var import_simple_peer = __toESM(require("simple-peer"));
var VoiceClient = class {
  constructor(config) {
    this.ws = null;
    this.peers = /* @__PURE__ */ new Map();
    this.localStream = null;
    this.remoteStreams = /* @__PURE__ */ new Map();
    this.eventHandlers = {};
    this.speakingDetectionInterval = null;
    this.audioContext = null;
    this.sourceNode = null;
    this.analyserNode = null;
    this.speakingThreshold = 0.05;
    this.isSpeaking = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.isConnected = false;
    this.userId = config.userId;
    this.roomId = config.roomId;
    this.signalingUrl = config.signalingUrl;
    this.iceServers = config.iceServers || [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun.relay.metered.ca:80" },
      {
        urls: "turn:openrelay.metered.ca:80",
        username: "openrelayproject",
        credential: "openrelayproject"
      }
    ];
    if (config.autoConnect !== false) {
      this.connect();
    }
  }
  on(event, handler) {
    if (!this.eventHandlers[event]) {
      this.eventHandlers[event] = [];
    }
    this.eventHandlers[event].push(handler);
  }
  off(event, handler) {
    const handlers = this.eventHandlers[event];
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index !== -1) handlers.splice(index, 1);
    }
  }
  emit(event, ...args) {
    const handlers = this.eventHandlers[event];
>>>>>>> dd8b84457c8d4edb5d353b32e941d030d53668ee
    if (handlers) {
      handlers.forEach((handler) => handler(...args));
    }
  }
  async connect() {
<<<<<<< HEAD
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
=======
    try {
      await this.initMicrophone();
      this.initWebSocket();
    } catch (error) {
      this.emit("error", error);
      this.handleReconnect();
    }
>>>>>>> dd8b84457c8d4edb5d353b32e941d030d53668ee
  }
  async initMicrophone() {
    this.localStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
<<<<<<< HEAD
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
=======
        autoGainControl: true,
        sampleRate: 48e3,
        channelCount: 1
      }
    });
    this.emit("localStream", this.localStream);
    this.setupSpeakingDetection();
  }
  setupSpeakingDetection() {
    if (!this.localStream) return;
    this.audioContext = new AudioContext();
    this.sourceNode = this.audioContext.createMediaStreamSource(this.localStream);
    this.analyserNode = this.audioContext.createAnalyser();
    this.analyserNode.fftSize = 256;
    this.sourceNode.connect(this.analyserNode);
    this.sourceNode.connect(this.audioContext.destination);
    const dataArray = new Uint8Array(this.analyserNode.frequencyBinCount);
    this.speakingDetectionInterval = setInterval(() => {
      if (!this.analyserNode) return;
      this.analyserNode.getByteTimeDomainData(dataArray);
      let maxSample = 0;
      for (let i = 0; i < dataArray.length; i++) {
        const sample = Math.abs(dataArray[i] / 128 - 1);
        if (sample > maxSample) maxSample = sample;
      }
      const isCurrentlySpeaking = maxSample > this.speakingThreshold;
      if (isCurrentlySpeaking && !this.isSpeaking) {
        this.isSpeaking = true;
        this.broadcastSpeakingStatus(true);
        this.emit("speaking", this.userId);
      } else if (!isCurrentlySpeaking && this.isSpeaking) {
        this.isSpeaking = false;
        this.broadcastSpeakingStatus(false);
        this.emit("stoppedSpeaking", this.userId);
      }
    }, 100);
  }
  broadcastSpeakingStatus(isSpeaking) {
    this.peers.forEach((peer) => {
      if (peer && peer.connected) {
        peer.send(JSON.stringify({
          type: "speaking",
          userId: this.userId,
          isSpeaking
        }));
      }
    });
>>>>>>> dd8b84457c8d4edb5d353b32e941d030d53668ee
  }
  initWebSocket() {
    const url = `${this.signalingUrl}?userId=${this.userId}&roomId=${this.roomId}`;
    this.ws = new WebSocket(url);
    this.ws.onopen = () => {
<<<<<<< HEAD
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
=======
      this.reconnectAttempts = 0;
      this.isConnected = true;
      this.send({
        type: "join",
        roomId: this.roomId,
        userId: this.userId
      });
    };
    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      this.handleSignalingMessage(message);
    };
    this.ws.onclose = () => {
      this.isConnected = false;
      this.handleReconnect();
    };
    this.ws.onerror = (error) => {
      this.emit("error", new Error("WebSocket error"));
    };
  }
  handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        this.initWebSocket();
      }, 1e3 * Math.min(30, this.reconnectAttempts));
    } else {
      this.emit("disconnected");
    }
  }
  handleSignalingMessage(message) {
    switch (message.type) {
      case "user-joined":
        this.initPeer(message.userId, true);
        this.emit("userJoined", message.userId);
        break;
      case "signal":
        this.handlePeerSignal(message.userId, message.payload);
        break;
      case "user-left":
        this.closePeer(message.userId);
        this.emit("userLeft", message.userId);
        break;
    }
  }
  initPeer(targetUserId, initiator) {
    if (this.peers.has(targetUserId)) return;
    const peer = new import_simple_peer.default({
      initiator,
      trickle: true,
      stream: this.localStream,
      config: { iceServers: this.iceServers }
    });
    peer.on("signal", (data) => {
      this.send({
        type: "signal",
        userId: targetUserId,
        payload: data
      });
    });
    peer.on("stream", (stream) => {
      this.remoteStreams.set(targetUserId, stream);
      this.emit("remoteStream", stream);
    });
    peer.on("data", (data) => {
      try {
        const parsed = JSON.parse(data.toString());
        if (parsed.type === "speaking") {
          if (parsed.isSpeaking) {
            this.emit("speaking", parsed.userId);
          } else {
            this.emit("stoppedSpeaking", parsed.userId);
          }
        }
      } catch (e) {
      }
    });
    peer.on("error", (err) => {
      this.emit("error", err);
    });
    peer.on("close", () => {
      this.peers.delete(targetUserId);
    });
    this.peers.set(targetUserId, peer);
  }
  handlePeerSignal(targetUserId, signal) {
    let peer = this.peers.get(targetUserId);
    if (!peer) {
      this.initPeer(targetUserId, false);
      peer = this.peers.get(targetUserId);
    }
    if (peer) {
      peer.signal(signal);
    }
  }
  closePeer(userId) {
    const peer = this.peers.get(userId);
    if (peer) {
      peer.destroy();
      this.peers.delete(userId);
>>>>>>> dd8b84457c8d4edb5d353b32e941d030d53668ee
    }
  }
  send(data) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
<<<<<<< HEAD
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
=======
    }
  }
  disconnect() {
    if (this.speakingDetectionInterval) {
      clearInterval(this.speakingDetectionInterval);
    }
    if (this.audioContext) {
      this.audioContext.close();
    }
    this.peers.forEach((peer) => {
      peer.destroy();
    });
    this.peers.clear();
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
    }
    if (this.ws) {
      this.ws.close();
    }
    this.emit("disconnected");
  }
  toggleMute() {
    if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
      }
    }
  }
  isMuted() {
    return this.localStream?.getAudioTracks()[0]?.enabled === false;
  }
  setSpeakingThreshold(threshold) {
    this.speakingThreshold = Math.min(1, Math.max(0, threshold));
  }
  getRemoteStream(userId) {
    if (userId) {
      const stream = this.remoteStreams.get(userId);
      return stream || null;
    }
    const firstStream = this.remoteStreams.values().next().value;
    return firstStream || null;
  }
  getPeers() {
    return Array.from(this.peers.keys());
>>>>>>> dd8b84457c8d4edb5d353b32e941d030d53668ee
  }
  getUserId() {
    return this.userId;
  }
<<<<<<< HEAD
=======
  isConnectedToRoom() {
    return this.isConnected;
  }
>>>>>>> dd8b84457c8d4edb5d353b32e941d030d53668ee
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  VoiceClient
});
