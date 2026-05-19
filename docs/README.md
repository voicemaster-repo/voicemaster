# VoiceMaster - WebRTC Voice Communication Library

Simple WebRTC library for adding real-time voice chat to your web applications.

## Features

- Simple API - Connect and talk in 5 lines of code
- Low latency - 20-50ms with Opus codec
- TypeScript - Full type safety
- React Hooks - First-class React support
- Built-in VAD - Voice Activity Detection
- Auto-reconnect - Handles network issues
- P2P - No server load for voice transmission

## Installation

npm install @voicemaster/core
npm install @voicemaster/react
npm install -g @voicemaster/server

## Quick Start

### 1. Start the signaling server

npx @voicemaster/server --port 3001

### 2. Use in your app

import { VoiceClient } from '@voicemaster/core';

const client = new VoiceClient({
    signalingUrl: 'ws://localhost:3001',
    roomId: 'my-room',
    userId: 'user-123'
});

client.on('remoteStream', (stream) => {
    const audio = new Audio();
    audio.srcObject = stream;
    audio.play();
});

client.connect();

### 3. React example

import { useVoice } from '@voicemaster/react';

function VoiceChat() {
    const { isConnected, toggleMute } = useVoice({
        signalingUrl: 'ws://localhost:3001',
        roomId: 'my-room',
        userId: 'user-123'
    });

    return (
        <button onClick={toggleMute}>
            {isConnected ? 'Talk' : 'Connect'}
        </button>
    );
}

## API Reference

### VoiceClient Methods

- connect() - Connect to room
- disconnect() - Leave room
- toggleMute() - Mute/unmute microphone
- isMuted() - Check mute status
- getPeers() - Get list of connected users
- getUserId() - Get current user ID
- setSpeakingThreshold(threshold) - Adjust VAD sensitivity

### Events

- connected - Connected to room
- disconnected - Disconnected
- remoteStream - Incoming audio stream
- localStream - Your microphone stream
- userJoined - User joined room
- userLeft - User left room
- speaking - User started speaking
- stoppedSpeaking - User stopped speaking
- error - Error occurred

### useVoice Hook (React)

- isConnected - boolean
- isMuted - boolean
- remoteStream - MediaStream or null
- peers - string[]
- speakingUsers - Set(string)
- connect() - function
- disconnect() - function
- toggleMute() - function

## Signaling Server

### Command line

npx @voicemaster/server --port 3001
npx @voicemaster/server --port 8080

### Programmatic usage

import { SignalingServer } from '@voicemaster/server';
const server = new SignalingServer(3001);

## Advanced Examples

### Push-to-talk

let pttActive = false;

document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        pttActive = true;
        client.toggleMute();
    }
});

document.addEventListener('keyup', (e) => {
    if (e.code === 'Space') {
        pttActive = false;
        client.toggleMute();
    }
});

### Voice activity indicator

client.on('speaking', (userId) => {
    showIndicator(userId, true);
});

client.on('stoppedSpeaking', (userId) => {
    showIndicator(userId, false);
});

### Custom STUN/TURN servers

const client = new VoiceClient({
    signalingUrl: 'ws://localhost:3001',
    roomId: 'my-room',
    userId: 'user-123',
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        {
            urls: 'turn:my-turn-server.com:3478',
            username: 'user',
            credential: 'password'
        }
    ]
});

### Recording conversation

let mediaRecorder;
const chunks = [];

client.on('remoteStream', (stream) => {
    mediaRecorder = new MediaRecorder(stream);
    mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
    mediaRecorder.start();
});

function saveRecording() {
    const blob = new Blob(chunks, { type: 'audio/webm' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'recording.webm';
    a.click();
}

## Production Deployment

### Using PM2

pm2 start npx --name "voicemaster" -- @voicemaster/server --port 3001
pm2 save

### Using Docker

FROM node:18-alpine
RUN npm install -g @voicemaster/server
EXPOSE 3001
CMD ["voicemaster-server", "--port", "3001"]

### Using systemd (Linux)

[Unit]
Description=VoiceMaster Signaling Server
After=network.target

[Service]
Type=simple
ExecStart=/usr/bin/npx @voicemaster/server --port 3001
Restart=always

[Install]
WantedBy=multi-user.target

## Browser Support

Chrome - Full
Firefox - Full
Edge - Full
Safari - Full
Opera - Full

## Troubleshooting

### No audio?

Check microphone permissions in browser
Allow microphone access in address bar

### Can't connect?

Verify signaling server is running
Check WebSocket connection in console (F12)

### Poor audio quality?

Use headphones to prevent echo
Check your internet connection speed

## API Protocol

### Client to Server

{"type": "join", "roomId": "string", "userId": "string"}
{"type": "signal", "userId": "string", "payload": "any"}
{"type": "leave", "roomId": "string", "userId": "string"}

### Server to Client

{"type": "user-joined", "userId": "string", "payload": {"users": []}}
{"type": "signal", "userId": "string", "payload": "any"}
{"type": "user-left", "userId": "string"}

## License

MIT (c) Sergey Minasyan

## Links

GitHub Repository: https://github.com/portside/voicemaster
npm Registry: https://www.npmjs.com/package/@voicemaster/core
Report Issue: https://github.com/portside/voicemaster/issues