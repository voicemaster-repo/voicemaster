import { useEffect, useState, useRef, useCallback } from 'react';
import { VoiceClient } from '@voicemaster/core';
import type { VoiceClientConfig } from '@voicemaster/core';

interface UseVoiceOptions extends VoiceClientConfig {
  autoConnect?: boolean;
}

export function useVoice(options: UseVoiceOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [speakingUsers, setSpeakingUsers] = useState<Set<string>>(new Set());
  const [peers, setPeers] = useState<string[]>([]);
  const clientRef = useRef<VoiceClient | null>(null);

  useEffect(() => {
    const client = new VoiceClient({
      signalingUrl: options.signalingUrl,
      roomId: options.roomId,
      userId: options.userId,
      iceServers: options.iceServers,
      autoConnect: false
    });

    client.on('connected', () => {
      setIsConnected(true);
    });

    client.on('disconnected', () => {
      setIsConnected(false);
      setPeers([]);
      setRemoteStream(null);
    });

<<<<<<< HEAD
    client.on('remoteStream', (stream: MediaStream) => {
      setRemoteStream(stream);
    });

    client.on('userJoined', (userId: string) => {
      setPeers(prev => prev.includes(userId) ? prev : [...prev, userId]);
    });

    client.on('userLeft', (userId: string) => {
=======
    client.on('remoteStream', (stream) => {
      setRemoteStream(stream);
    });

    client.on('userJoined', (userId) => {
      setPeers(prev => [...prev, userId]);
    });

    client.on('userLeft', (userId) => {
>>>>>>> dd8b84457c8d4edb5d353b32e941d030d53668ee
      setPeers(prev => prev.filter(id => id !== userId));
      setSpeakingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    });

<<<<<<< HEAD
    client.on('speaking', (userId: string) => {
      setSpeakingUsers(prev => new Set(prev).add(userId));
    });

    client.on('stoppedSpeaking', (userId: string) => {
=======
    client.on('speaking', (userId) => {
      setSpeakingUsers(prev => new Set(prev).add(userId));
    });

    client.on('stoppedSpeaking', (userId) => {
>>>>>>> dd8b84457c8d4edb5d353b32e941d030d53668ee
      setSpeakingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    });

<<<<<<< HEAD
    client.on('error', (error: unknown) => {
=======
    client.on('error', (error) => {
>>>>>>> dd8b84457c8d4edb5d353b32e941d030d53668ee
      console.error('Voice client error:', error);
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
      setIsMuted(prev => !prev);
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