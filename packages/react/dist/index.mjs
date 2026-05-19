// src/useVoice.ts
import { useEffect, useState, useRef, useCallback } from "react";
import { VoiceClient } from "@voicemaster/core";
function useVoice(options) {
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [remoteStream, setRemoteStream] = useState(null);
  const [speakingUsers, setSpeakingUsers] = useState(/* @__PURE__ */ new Set());
  const [peers, setPeers] = useState([]);
  const clientRef = useRef(null);
  useEffect(() => {
    const client = new VoiceClient({
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
  const connect = useCallback(() => {
    clientRef.current?.connect();
  }, []);
  const disconnect = useCallback(() => {
    clientRef.current?.disconnect();
  }, []);
  const toggleMute = useCallback(() => {
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
export {
  useVoice
};
