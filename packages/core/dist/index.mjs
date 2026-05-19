// src/VoiceClient.ts
import Peer from "simple-peer";
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
    if (handlers) {
      handlers.forEach((handler) => handler(...args));
    }
  }
  async connect() {
    try {
      await this.initMicrophone();
      this.initWebSocket();
    } catch (error) {
      this.emit("error", error);
      this.handleReconnect();
    }
  }
  async initMicrophone() {
    this.localStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
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
  }
  initWebSocket() {
    const url = `${this.signalingUrl}?userId=${this.userId}&roomId=${this.roomId}`;
    this.ws = new WebSocket(url);
    this.ws.onopen = () => {
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
    const peer = new Peer({
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
    }
  }
  send(data) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
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
  }
  getUserId() {
    return this.userId;
  }
  isConnectedToRoom() {
    return this.isConnected;
  }
};
export {
  VoiceClient
};
