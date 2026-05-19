// src/VoiceClientMobile.ts
import {
  mediaDevices,
  RTCPeerConnection,
  RTCSessionDescription,
  RTCIceCandidate
} from "react-native-webrtc";
var VoiceClientMobile = class {
  constructor(config) {
    this.ws = null;
    this.peerConnection = null;
    this.localStream = null;
    this.remoteStream = null;
    this.eventHandlers = /* @__PURE__ */ new Map();
    this.signalingUrl = config.signalingUrl;
    this.roomId = config.roomId;
    this.userId = config.userId;
    this.iceServers = config.iceServers || [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" }
    ];
    if (config.autoConnect !== false) {
      this.connect();
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
      handlers.forEach((cb) => cb(...args));
    }
  }
  async connect() {
    try {
      await this.initMicrophone();
      this.initPeerConnection();
      this.initWebSocket();
    } catch (error) {
      this.emit("error", error);
    }
  }
  async initMicrophone() {
    this.localStream = await mediaDevices.getUserMedia({ audio: true });
    this.emit("localStream", this.localStream);
  }
  initPeerConnection() {
    const configuration = { iceServers: this.iceServers };
    this.peerConnection = new RTCPeerConnection(configuration);
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        this.peerConnection.addTrack(track, this.localStream);
      });
    }
    this.peerConnection.ontrack = (event) => {
      this.remoteStream = event.streams[0];
      if (this.remoteStream) {
        this.emit("remoteStream", this.remoteStream);
      }
    };
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.send({
          type: "ice-candidate",
          userId: this.userId,
          roomId: this.roomId,
          payload: event.candidate
        });
      }
    };
  }
  initWebSocket() {
    const url = `${this.signalingUrl}?userId=${this.userId}&roomId=${this.roomId}`;
    this.ws = new WebSocket(url);
    this.ws.onopen = () => {
      this.send({ type: "join", roomId: this.roomId, userId: this.userId });
      this.emit("connected");
    };
    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      this.handleSignalingMessage(message);
    };
    this.ws.onclose = () => {
      this.emit("disconnected");
    };
  }
  handleSignalingMessage(message) {
    switch (message.type) {
      case "user-joined":
        if (message.userId !== this.userId) {
          this.createOffer();
          this.emit("userJoined", message.userId);
        }
        break;
      case "offer":
        this.handleOffer(message);
        break;
      case "answer":
        this.handleAnswer(message);
        break;
      case "ice-candidate":
        this.handleIceCandidate(message);
        break;
      case "user-left":
        this.emit("userLeft", message.userId);
        break;
    }
  }
  createOffer() {
    this.peerConnection?.createOffer().then((offer) => this.peerConnection.setLocalDescription(offer)).then(() => {
      this.send({
        type: "offer",
        userId: this.userId,
        roomId: this.roomId,
        payload: this.peerConnection.localDescription
      });
    }).catch((err) => this.emit("error", err));
  }
  handleOffer(message) {
    const offer = new RTCSessionDescription(message.payload);
    this.peerConnection?.setRemoteDescription(offer).then(() => this.peerConnection.createAnswer()).then((answer) => this.peerConnection.setLocalDescription(answer)).then(() => {
      this.send({
        type: "answer",
        userId: message.userId,
        roomId: this.roomId,
        payload: this.peerConnection.localDescription
      });
    }).catch((err) => this.emit("error", err));
  }
  handleAnswer(message) {
    const answer = new RTCSessionDescription(message.payload);
    this.peerConnection?.setRemoteDescription(answer).catch((err) => this.emit("error", err));
  }
  handleIceCandidate(message) {
    const candidate = new RTCIceCandidate(message.payload);
    this.peerConnection?.addIceCandidate(candidate).catch((err) => console.warn("ICE candidate error", err));
  }
  send(data) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }
  disconnect() {
    if (this.ws) {
      this.send({ type: "leave", roomId: this.roomId, userId: this.userId });
      this.ws.close();
    }
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
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
  getUserId() {
    return this.userId;
  }
};

// src/useVoiceMobile.ts
import { useEffect, useState, useRef, useCallback } from "react";
function useVoiceMobile(options) {
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [remoteStream, setRemoteStream] = useState(null);
  const [speakingUsers, setSpeakingUsers] = useState(/* @__PURE__ */ new Set());
  const clientRef = useRef(null);
  useEffect(() => {
    const client = new VoiceClientMobile({
      signalingUrl: options.signalingUrl,
      roomId: options.roomId,
      userId: options.userId,
      iceServers: options.iceServers,
      autoConnect: false
    });
    client.on("connected", () => setIsConnected(true));
    client.on("disconnected", () => {
      setIsConnected(false);
      setRemoteStream(null);
      setSpeakingUsers(/* @__PURE__ */ new Set());
    });
    client.on("remoteStream", (stream) => setRemoteStream(stream));
    client.on("userLeft", (userId) => {
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
    client.on("error", (error) => console.error("Voice error:", error));
    clientRef.current = client;
    if (options.autoConnect !== false) {
      client.connect();
    }
    return () => client.disconnect();
  }, [options.signalingUrl, options.roomId, options.userId, options.iceServers]);
  const connect = useCallback(() => clientRef.current?.connect(), []);
  const disconnect = useCallback(() => clientRef.current?.disconnect(), []);
  const toggleMute = useCallback(() => {
    clientRef.current?.toggleMute();
    setIsMuted((prev) => !prev);
  }, []);
  return {
    isConnected,
    isMuted,
    remoteStream,
    speakingUsers,
    connect,
    disconnect,
    toggleMute,
    client: clientRef.current
  };
}
export {
  VoiceClientMobile,
  useVoiceMobile
};
