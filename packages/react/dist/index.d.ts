import { VoiceClientConfig, VoiceClient } from '@voicemaster/core';

interface UseVoiceOptions extends VoiceClientConfig {
    autoConnect?: boolean;
}
declare function useVoice(options: UseVoiceOptions): {
    isConnected: boolean;
    isMuted: boolean;
    remoteStream: MediaStream | null;
    peers: string[];
    speakingUsers: Set<string>;
    connect: () => void;
    disconnect: () => void;
    toggleMute: () => void;
    client: VoiceClient | null;
};

export { useVoice };
