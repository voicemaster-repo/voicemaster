import Peer from 'simple-peer';

export interface VoiceClientConfig {
  signalingUrl: string;
  roomId: string;
  userId: string;
  autoConnect?: boolean;
  iceServers?: RTCIceServer[];
}

export interface VoiceEvents {
  connected: () => void;
  disconnected: () => void;
  remoteStream: (stream: MediaStream) => void;
  localStream: (stream: MediaStream) => void;
  error: (error: Error) => void;
  userJoined: (userId: string) => void;
  userLeft: (userId: string) => void;
  speaking: (userId: string) => void;
  stoppedSpeaking: (userId: string) => void;
}

type EventHandler<T extends keyof VoiceEvents> = VoiceEvents[T];

export class VoiceClient {
  private ws: WebSocket | null = null;
  private peers: Map<string, Peer.Instance> = new Map();
  private localStream: MediaStream | null = null;
  private remoteStreams: Map<string, MediaStream> = new Map();
  private eventHandlers: Partial<Record<keyof VoiceEvents, Function[]>> = {};
  private userId: string;
  private roomId: string;
  private signalingUrl: string;
  private iceServers: RTCIceServer[];
  private speakingDetectionInterval: NodeJS.Timeout | null = null;
  private audioContext: AudioContext | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private analyserNode: AnalyserNode | null = null;
  private speakingThreshold = 0.05;
  private isSpeaking = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private isConnected = false;

  constructor(config: VoiceClientConfig) {
    this.userId = config.userId;
    this.roomId = config.roomId;
    this.signalingUrl = config.signalingUrl;
    this.iceServers = config.iceServers || [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun.relay.metered.ca:80' },
      {
        urls: 'turn:openrelay.metered.ca:80',
        username: 'openrelayproject',
        credential: 'openrelayproject'
      }
    ];

    if (config.autoConnect !== false) {
      this.connect();
    }
  }

  on<K extends keyof VoiceEvents>(event: K, handler: EventHandler<K>): void {
    if (!this.eventHandlers[event]) {
      this.eventHandlers[event] = [];
    }
    this.eventHandlers[event]!.push(handler);
  }

  off<K extends keyof VoiceEvents>(event: K, handler: EventHandler<K>): void {
    const handlers = this.eventHandlers[event];
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index !== -1) handlers.splice(index, 1);
    }
  }

  private emit<K extends keyof VoiceEvents>(event: K, ...args: Parameters<EventHandler<K>>): void {
    const handlers = this.eventHandlers[event];
    if (handlers) {
      handlers.forEach(handler => handler(...args as any));
    }
  }

  async connect(): Promise<void> {
    try {
      await this.initMicrophone();
      this.initWebSocket();
    } catch (error) {
      this.emit('error', error as Error);
      this.handleReconnect();
    }
  }

  private async initMicrophone(): Promise<void> {
    this.localStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        sampleRate: 48000,
        channelCount: 1
      }
    });

    this.emit('localStream', this.localStream);
    this.setupSpeakingDetection();
  }

  private setupSpeakingDetection(): void {
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
        this.emit('speaking', this.userId);
      } else if (!isCurrentlySpeaking && this.isSpeaking) {
        this.isSpeaking = false;
        this.broadcastSpeakingStatus(false);
        this.emit('stoppedSpeaking', this.userId);
      }
    }, 100);
  }

  private broadcastSpeakingStatus(isSpeaking: boolean): void {
    this.peers.forEach((peer) => {
      if (peer && peer.connected) {
        peer.send(JSON.stringify({
          type: 'speaking',
          userId: this.userId,
          isSpeaking
        }));
      }
    });
  }

  private initWebSocket(): void {
    const url = `${this.signalingUrl}?userId=${this.userId}&roomId=${this.roomId}`;
    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
      this.isConnected = true;
      this.send({
        type: 'join',
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
      this.emit('error', new Error('WebSocket error'));
    };
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        this.initWebSocket();
      }, 1000 * Math.min(30, this.reconnectAttempts));
    } else {
      this.emit('disconnected');
    }
  }

  private handleSignalingMessage(message: any): void {
    switch (message.type) {
      case 'user-joined':
        this.initPeer(message.userId, true);
        this.emit('userJoined', message.userId);
        break;

      case 'signal':
        this.handlePeerSignal(message.userId, message.payload);
        break;

      case 'user-left':
        this.closePeer(message.userId);
        this.emit('userLeft', message.userId);
        break;
    }
  }

  private initPeer(targetUserId: string, initiator: boolean): void {
    if (this.peers.has(targetUserId)) return;

    const peer = new Peer({
      initiator,
      trickle: true,
      stream: this.localStream!,
      config: { iceServers: this.iceServers }
    });

    peer.on('signal', (data) => {
      this.send({
        type: 'signal',
        userId: targetUserId,
        payload: data
      });
    });

    peer.on('stream', (stream) => {
      this.remoteStreams.set(targetUserId, stream);
      this.emit('remoteStream', stream);
    });

    peer.on('data', (data) => {
      try {
        const parsed = JSON.parse(data.toString());
        if (parsed.type === 'speaking') {
          if (parsed.isSpeaking) {
            this.emit('speaking', parsed.userId);
          } else {
            this.emit('stoppedSpeaking', parsed.userId);
          }
        }
      } catch (e) {
        // Binary data, ignore
      }
    });

    peer.on('error', (err) => {
      this.emit('error', err);
    });

    peer.on('close', () => {
      this.peers.delete(targetUserId);
    });

    this.peers.set(targetUserId, peer);
  }

  private handlePeerSignal(targetUserId: string, signal: any): void {
    let peer = this.peers.get(targetUserId);
    
    if (!peer) {
      this.initPeer(targetUserId, false);
      peer = this.peers.get(targetUserId);
    }
    
    if (peer) {
      peer.signal(signal);
    }
  }

  private closePeer(userId: string): void {
    const peer = this.peers.get(userId);
    if (peer) {
      peer.destroy();
      this.peers.delete(userId);
    }
  }

  private send(data: any): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  disconnect(): void {
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
      this.localStream.getTracks().forEach(track => track.stop());
    }
    
    if (this.ws) {
      this.ws.close();
    }
    
    this.emit('disconnected');
  }

  toggleMute(): void {
    if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
      }
    }
  }

  isMuted(): boolean {
    return this.localStream?.getAudioTracks()[0]?.enabled === false;
  }

  setSpeakingThreshold(threshold: number): void {
    this.speakingThreshold = Math.min(1, Math.max(0, threshold));
  }

  getRemoteStream(userId?: string): MediaStream | null {
    if (userId) {
        const stream = this.remoteStreams.get(userId);
        return stream || null;
    }
    const firstStream = this.remoteStreams.values().next().value;
    return firstStream || null;
    }

  getPeers(): string[] {
    return Array.from(this.peers.keys());
  }

  getUserId(): string {
    return this.userId;
  }

  isConnectedToRoom(): boolean {
    return this.isConnected;
  }
}

export default VoiceClient;