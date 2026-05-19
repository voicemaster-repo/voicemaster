# VoiceMaster - WebRTC Voice Communication Library

[![npm version](https://img.shields.io/npm/v/@voicemaster/core)](https://www.npmjs.com/package/@voicemaster/core)
[![npm downloads](https://img.shields.io/npm/dm/@voicemaster/core)](https://www.npmjs.com/package/@voicemaster/core)
[![GitHub repo](https://img.shields.io/badge/GitHub-voicemaster--repo-blue)](https://github.com/voicemaster-repo/voicemaster)

Simple WebRTC library for adding real-time voice chat to your web applications.

## Features

- Simple API - Connect and talk in 5 lines of code
- Low latency - 20-50ms with Opus codec
- TypeScript - Full type safety
- React Hooks - First-class React support
- Built-in VAD - Voice Activity Detection
- Auto-reconnect - Handles network issues
- P2P - No server load for voice transmission

## Packages Overview

| Package | Role | Where to use |
|---------|------|--------------|
| `@voicemaster/server` | **Signaling server** - helps peers connect | Run on your VPS/server |
| `@voicemaster/core` | **Client library** - WebRTC voice logic | Install in your web app |
| `@voicemaster/react` | **React bindings** - hooks for React apps | Install in React project |

## Quick Summary

- **Server** (`@voicemaster/server`) - runs on your backend. One instance serves all users.
- **Client** (`@voicemaster/core` or `@voicemaster/react`) - runs in user's browser.

## Installation

```bash
npm install @voicemaster/core
npm install @voicemaster/react
npm install -g @voicemaster/server // if you project used React for coding
```

## Quick Start
## 1. Start the signaling server
```bash
npx @voicemaster/server --port 3001
```
## 2. Use in your app
```tsx
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
```
## 3. React example
```tsx
import { useVoice } from '@voicemaster/react';

function VoiceChat() {
    const { isConnected, toggleMute } = useVoice({
        signalingUrl: 'ws://localhost:3001',
        roomId: 'my-room',
        userId: 'user-123'
    });

    return (
        <button onClick={toggleMute}>
            {isConnected ? '🎙️ Talk' : '🔌 Connect'}
        </button>
    );
}
```
## API Reference

### VoiceClient

**Methods**

| Method | Description |
|--------|-------------|
| `connect()` | Connect to room |
| `disconnect()` | Leave room |
| `toggleMute()` | Mute/unmute microphone |
| `isMuted()` | Check mute status |
| `getPeers()` | Get list of connected users |
| `getUserId()` | Get current user ID |
| `setSpeakingThreshold(threshold)` | Adjust VAD sensitivity (0-1) |

**Events**

| Event | Payload | Description |
|-------|---------|-------------|
| `connected` | - | Connected to room |
| `disconnected` | - | Disconnected |
| `remoteStream` | `MediaStream` | Incoming audio stream |
| `localStream` | `MediaStream` | Your microphone stream |
| `userJoined` | `userId` | User joined room |
| `userLeft` | `userId` | User left room |
| `speaking` | `userId` | User started speaking |
| `stoppedSpeaking` | `userId` | User stopped speaking |
| `error` | `Error` | Error occurred |

### useVoice Hook (React)

```typescript
const {
    isConnected,      // boolean - connection status
    isMuted,          // boolean - microphone muted
    remoteStream,     // MediaStream | null - incoming audio
    peers,            // string[] - list of users in room
    speakingUsers,    // Set<string> - users currently speaking
    connect,          // () => void - manual connect
    disconnect,       // () => void - manual disconnect
    toggleMute        // () => void - mute/unmute microphone
} = useVoice({
    signalingUrl: 'ws://localhost:3001',  // required
    roomId: 'my-room',                    // required
    userId: 'user-123',                   // required
    autoConnect: true                     // optional, default true
});
```
## Signaling Server

# Command line

```bash
npx @voicemaster/server --port 3001
```

## Programmatic usage

```javascript
import { SignalingServer } from '@voicemaster/server';
const server = new SignalingServer(3001);
```
## Advanced Examples
## Push-to-talk
```javascript
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
```
## Voice activity indicator
```javascript
client.on('speaking', (userId) => {
    showIndicator(userId, true);
});

client.on('stoppedSpeaking', (userId) => {
    showIndicator(userId, false);
});
```

## Custom STUN/TURN servers

```javascript
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
```

## Recording conversation

```javascript
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
    a.download = `recording_${Date.now()}.webm`;
    a.click();
}
```

## Production Deployment

# Using PM2

```bash
pm2 start npx --name "voicemaster" -- @voicemaster/server --port 3001
pm2 save
```

## Using Docker

```dockerfile
FROM node:18-alpine
RUN npm install -g @voicemaster/server
EXPOSE 3001
CMD ["voicemaster-server", "--port", "3001"]
```
## Using systemd (Linux)
```ini
[Unit]
Description=VoiceMaster Signaling Server
After=network.target

[Service]
Type=simple
ExecStart=/usr/bin/npx @voicemaster/server --port 3001
Restart=always

[Install]
WantedBy=multi-user.target
```

Browser	Support: 
| Browser | Supported |
|-------|-------------|
| `Chrome` | Full |
| `Chrome` | Full |
| `Firefox` | Full |
| `Edge` | Full | 
| `Safari` | Full |
| `Opera` | Full | 

## Troubleshooting
# No audio?
- Check microphone permissions in browser
- Allow microphone access in address bar

## Can't connect?
- Verify signaling server is running
- Check WebSocket connection in console (F12)

## Poor audio quality?
- Use headphones to prevent echo
- Check your internet connection speed

## API Protocol
# Client to Server
```json
{"type": "join", "roomId": "string", "userId": "string"}
{"type": "signal", "userId": "string", "payload": "any"}
{"type": "leave", "roomId": "string", "userId": "string"}
```
# Server to Client
```json
{"type": "user-joined", "userId": "string", "payload": {"users": []}}
{"type": "signal", "userId": "string", "payload": "any"}
{"type": "user-left", "userId": "string"}
```
License
MIT (c) Sergey Minasyan

Links
GitHub Repository: https://github.com/voicemaster-repo/voicemaster

npm Registry: https://www.npmjs.com/package/@voicemaster/core

Report Issue: https://github.com/voicemaster-repo/voicemaster/issues
