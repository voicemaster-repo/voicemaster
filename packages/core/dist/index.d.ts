interface VoiceClientConfig {
    signalingUrl: string;
    roomId: string;
    userId: string;
    autoConnect?: boolean;
    iceServers?: RTCIceServer[];
}
<<<<<<< HEAD
declare class VoiceClient {
    private ws;
    private pc;
    private localStream;
    private remoteStream;
    private audioSender;
    private eventHandlers;
    private signalingUrl;
    private roomId;
    private userId;
    private iceServers;
    private isConnectedFlag;
    private isMutedFlag;
    private targetUserId;
    private connectingPromise;
    private peers;
    constructor(config: VoiceClientConfig);
    on(event: string, callback: Function): void;
    private emit;
    connect(): Promise<void>;
    private initMicrophone;
    private initPeerConnection;
    private initWebSocket;
    private handleSignalingMessage;
    private createOffer;
    private handleOffer;
    private handleAnswer;
    private handleCandidate;
    private send;
    disconnect(): void;
    getPeers(): string[];
    toggleMute(): void;
    isMuted(): boolean;
    getUserId(): string;
}

export { VoiceClient, type VoiceClientConfig };
=======
interface VoiceEvents {
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
declare class VoiceClient {
    private ws;
    private peers;
    private localStream;
    private remoteStreams;
    private eventHandlers;
    private userId;
    private roomId;
    private signalingUrl;
    private iceServers;
    private speakingDetectionInterval;
    private audioContext;
    private sourceNode;
    private analyserNode;
    private speakingThreshold;
    private isSpeaking;
    private reconnectAttempts;
    private maxReconnectAttempts;
    private isConnected;
    constructor(config: VoiceClientConfig);
    on<K extends keyof VoiceEvents>(event: K, handler: EventHandler<K>): void;
    off<K extends keyof VoiceEvents>(event: K, handler: EventHandler<K>): void;
    private emit;
    connect(): Promise<void>;
    private initMicrophone;
    private setupSpeakingDetection;
    private broadcastSpeakingStatus;
    private initWebSocket;
    private handleReconnect;
    private handleSignalingMessage;
    private initPeer;
    private handlePeerSignal;
    private closePeer;
    private send;
    disconnect(): void;
    toggleMute(): void;
    isMuted(): boolean;
    setSpeakingThreshold(threshold: number): void;
    getRemoteStream(userId?: string): MediaStream | null;
    getPeers(): string[];
    getUserId(): string;
    isConnectedToRoom(): boolean;
}

export { VoiceClient, type VoiceClientConfig, type VoiceEvents };
>>>>>>> dd8b84457c8d4edb5d353b32e941d030d53668ee
