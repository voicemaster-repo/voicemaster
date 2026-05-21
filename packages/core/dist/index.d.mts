interface VoiceClientConfig {
    signalingUrl: string;
    roomId: string;
    userId: string;
    autoConnect?: boolean;
    iceServers?: RTCIceServer[];
}
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
