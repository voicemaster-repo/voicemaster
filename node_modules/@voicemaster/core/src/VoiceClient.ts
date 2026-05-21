export interface VoiceClientConfig {
  signalingUrl: string;
  roomId: string;
  userId: string;
  autoConnect?: boolean;
  iceServers?: RTCIceServer[];
}

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
    }
  }

  async connect(): Promise<void> {
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
  }

  private async initMicrophone(): Promise<void> {
    this.localStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
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
  }

  private initWebSocket(): void {
    const url = `${this.signalingUrl}?userId=${this.userId}&roomId=${this.roomId}`;
    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
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
    }
  }

  private send(data: any): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      console.warn('[VoiceClient] WebSocket is not open, cannot send message', data);
    }
  }

  disconnect(): void {
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
  }

  getUserId(): string {
    return this.userId;
  }
}
