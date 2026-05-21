interface VoiceClientConfig {
    signalingUrl: string;
    roomId: string;
    userId: string;
    iceServers?: Array<{
        urls: string | string[];
        username?: string;
        credential?: string;
    }>;
    autoConnect?: boolean;
}
declare class VoiceClientMobile {
    private ws;
    private peerConnection;
    private localStream;
    private remoteStream;
    private eventHandlers;
    private roomId;
    private userId;
    private signalingUrl;
    private iceServers;
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
    private handleIceCandidate;
    private send;
    disconnect(): void;
    toggleMute(): void;
    isMuted(): boolean;
    getUserId(): string;
}

interface UseVoiceMobileOptions {
    signalingUrl: string;
    roomId: string;
    userId: string;
    iceServers?: Array<{
        urls: string | string[];
        username?: string;
        credential?: string;
    }>;
    autoConnect?: boolean;
}
declare function useVoiceMobile(options: UseVoiceMobileOptions): {
    isConnected: boolean;
    isMuted: boolean;
    remoteStream: MediaStream | null;
    speakingUsers: Set<string>;
    connect: () => Promise<void> | undefined;
    disconnect: () => void | undefined;
    toggleMute: () => void;
    client: VoiceClientMobile | null;
};

export { type VoiceClientConfig, VoiceClientMobile, useVoiceMobile };
