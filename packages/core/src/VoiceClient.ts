<<<<<<< HEAD
=======
import Peer from 'simple-peer';

>>>>>>> dd8b84457c8d4edb5d353b32e941d030d53668ee
export interface VoiceClientConfig {
  signalingUrl: string;
  roomId: string;
  userId: string;
  autoConnect?: boolean;
  iceServers?: RTCIceServer[];
}

<<<<<<< HEAD
export class VoiceClient {
  private ws: WebSocket | null = null;
  private pc: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private audioSender: RTCRtpSender | null = null;
  private eventHandlers: Map<string, Function[]> = new Map();
  private signalingUrl: string;
  private roomId: string;
  private userId: string;
  private iceServers: RTCIceServer[];
  private isConnectedFlag = false;
  private isMutedFlag = false;
  private targetUserId: string | null = null;
  private connectingPromise: Promise<void> | null = null;
  private peers: Set<string> = new Set();

  constructor(config: VoiceClientConfig) {
    this.signalingUrl = config.signalingUrl;
    this.roomId = config.roomId;
    this.userId = config.userId;
    this.iceServers = config.iceServers || [
      { urls: 'stun:stun.l.google.com:19302' }
    ];

    if (config.autoConnect !== false) {
      Promise.resolve().then(() => this.connect());
    }
  }

  on(event: string, callback: Function): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event)!.push(callback);
  }



  private emit(event: string, ...args: any[]): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach(handler => handler(...args));
=======
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
>>>>>>> dd8b84457c8d4edb5d353b32e941d030d53668ee
    }
  }

  async connect(): Promise<void> {
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
        this.emit('error', error);
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
      this.emit('error', error as Error);
      this.handleReconnect();
    }
>>>>>>> dd8b84457c8d4edb5d353b32e941d030d53668ee
  }

  private async initMicrophone(): Promise<void> {
    this.localStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
<<<<<<< HEAD
        autoGainControl: true
      }
    });
    this.emit('localStream', this.localStream);
  }

  private initPeerConnection(): void {
    this.pc = new RTCPeerConnection({ iceServers: this.iceServers });

    this.localStream?.getTracks().forEach(track => {
      const sender = this.pc!.addTrack(track, this.localStream!);
      if (track.kind === 'audio') {
        this.audioSender = sender;
      }
    });

    this.pc.ontrack = (event) => {
      const stream = event.streams?.[0] || new MediaStream([event.track]);
      this.remoteStream = stream;
      console.log('[VoiceClient] Remote track received from peer', {
        track: event.track,
        stream,
        fromUserId: this.targetUserId,
        myUserId: this.userId
      });
      this.emit('remoteStream', this.remoteStream);
    };

    this.pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.send({
          type: 'candidate',
          candidate: event.candidate
        });
      }
    };

    this.pc.onconnectionstatechange = () => {
      if (this.pc?.connectionState === 'connected') {
        if (!this.isConnectedFlag) {
          this.isConnectedFlag = true;
          this.emit('connected');
        }
      }
    };
=======
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
>>>>>>> dd8b84457c8d4edb5d353b32e941d030d53668ee
  }

  private initWebSocket(): void {
    const url = `${this.signalingUrl}?userId=${this.userId}&roomId=${this.roomId}`;
    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
<<<<<<< HEAD
      console.log('[VoiceClient] WebSocket connected');
      this.send({ type: 'join', roomId: this.roomId, userId: this.userId });
    };

    this.ws.onmessage = async (event) => {
      const message = JSON.parse(event.data);
      await this.handleSignalingMessage(message);
    };

    this.ws.onerror = (event) => {
      console.error('[VoiceClient] WebSocket error', event);
      this.emit('error', new Error('WebSocket error'));
    };

    this.ws.onclose = () => {
      console.log('[VoiceClient] WebSocket closed');
      this.emit('disconnected');
    };
  }

  private async handleSignalingMessage(message: any): Promise<void> {
    console.log('[VoiceClient] Received message:', message.type, message);
    
    switch (message.type) {
      case 'user-joined':
        console.log('[VoiceClient] User joined, myId:', this.userId, 'theirId:', message.userId);
        if (message.userId !== this.userId) {
          this.peers.add(message.userId);
          console.log('[VoiceClient] Creating offer...');
          this.targetUserId = message.userId;
          await this.createOffer();
          this.emit('userJoined', message.userId);
        } else {
          console.log('[VoiceClient] Ignoring my own join');
        }
        break;
      case 'offer':
        console.log('[VoiceClient] Received offer');
        this.targetUserId = message.userId;
        await this.handleOffer(message);
        break;
      case 'answer':
        console.log('[VoiceClient] Received answer');
        await this.handleAnswer(message);
        break;
      case 'candidate':
        console.log('[VoiceClient] Received candidate');
        await this.handleCandidate(message);
        break;
      case 'user-left':
        this.peers.delete(message.userId);
        this.emit('userLeft', message.userId);
        break;
      default:
        console.log('[VoiceClient] Unknown message type:', message.type);
    }
  }

  private async createOffer(): Promise<void> {
    const offer = await this.pc!.createOffer();
    await this.pc!.setLocalDescription(offer);
    this.send({
      type: 'offer',
      sdp: this.pc!.localDescription
    });
  }

  private async handleOffer(message: any): Promise<void> {
    try {
      console.log('Handling offer', message);
      const offer = new RTCSessionDescription(message.sdp);
      await this.pc!.setRemoteDescription(offer);
      console.log('Remote description set');
      
      const answer = await this.pc!.createAnswer();
      console.log('Answer created');
      
      await this.pc!.setLocalDescription(answer);
      console.log('Local description set');
      
      this.send({
        type: 'answer',
        sdp: this.pc!.localDescription
      });
    } catch (err) {
      console.error('Offer handling error:', err);
    }
  }

  private async handleAnswer(message: any): Promise<void> {
    const answer = new RTCSessionDescription(message.sdp);
    await this.pc!.setRemoteDescription(answer);
  }

  private async handleCandidate(message: any): Promise<void> {
    try {
      if (message.candidate) {
        const candidate = new RTCIceCandidate(message.candidate);
        await this.pc!.addIceCandidate(candidate);
        console.log('ICE candidate added');
      }
    } catch (err) {
      console.error('Candidate error:', err);
=======
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
>>>>>>> dd8b84457c8d4edb5d353b32e941d030d53668ee
    }
  }

  private send(data: any): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
<<<<<<< HEAD
    } else {
      console.warn('[VoiceClient] WebSocket is not open, cannot send message', data);
=======
>>>>>>> dd8b84457c8d4edb5d353b32e941d030d53668ee
    }
  }

  disconnect(): void {
<<<<<<< HEAD
    this.peers.clear();
    if (this.ws) {
      this.send({ type: 'leave', roomId: this.roomId, userId: this.userId });
      this.ws.close();
    }
    this.pc?.close();
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
    }
    this.isConnectedFlag = false;
    this.emit('disconnected');
  }

  getPeers(): string[] {
    return Array.from(this.peers);
  }

  toggleMute(): void {
    if (!this.localStream) {
      console.warn('[VoiceClient] No local stream available for muting');
      return;
    }

    const audioTrack = this.localStream.getAudioTracks()[0];
    if (!audioTrack) {
      console.warn('[VoiceClient] No audio track found for muting');
      return;
    }

    const shouldMute = audioTrack.enabled;
    audioTrack.enabled = !shouldMute;
    this.isMutedFlag = !shouldMute;

    if (this.audioSender) {
      this.audioSender.replaceTrack(shouldMute ? null : audioTrack)
        .then(() => {
          console.log('[VoiceClient] Audio sender replaced after mute toggle', {
            muted: this.isMutedFlag,
            trackId: audioTrack.id,
            enabled: audioTrack.enabled
          });
        })
        .catch((err) => {
          console.error('[VoiceClient] Failed to replace audio sender track', err);
        });
    }

    console.log(`[VoiceClient] Mute toggled: now ${this.isMutedFlag ? 'muted' : 'unmuted'}`, {
      trackId: audioTrack.id,
      enabled: audioTrack.enabled,
      state: audioTrack.readyState
    });
  }

  isMuted(): boolean {
    const muted = this.isMutedFlag;
    console.log('[VoiceClient] isMuted check:', { muted });
    return muted;
=======
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
>>>>>>> dd8b84457c8d4edb5d353b32e941d030d53668ee
  }

  getUserId(): string {
    return this.userId;
  }
<<<<<<< HEAD
}
=======

  isConnectedToRoom(): boolean {
    return this.isConnected;
  }
}

export default VoiceClient;
>>>>>>> dd8b84457c8d4edb5d353b32e941d030d53668ee
