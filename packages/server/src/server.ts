<<<<<<< HEAD
﻿import { WebSocketServer, WebSocket } from 'ws';
import { randomUUID } from 'crypto';

export class SignalingServer {
  private rooms: Map<string, Map<string, WebSocket>> = new Map();

  constructor(port: number = 3001) {
    const wss = new WebSocketServer({ port });

    console.log('VoiceMaster signaling server started on port', port);

=======
#!/usr/bin/env node
import { WebSocketServer, WebSocket } from 'ws';
import { randomUUID } from 'crypto';

interface SignalingMessage {
  type: 'join' | 'leave' | 'signal';
  roomId: string;
  userId: string;
  payload?: any;
}

export class SignalingServer {
  private rooms: Map<string, Map<string, WebSocket>> = new Map();
  private clients: Map<WebSocket, { userId: string; roomId: string }> = new Map();

  constructor(port: number = 3001) {
    const wss = new WebSocketServer({ port });
    
    console.log(`🎙️ VoiceMaster Signaling Server`);
    console.log(`📡 WebSocket endpoint: ws://localhost:${port}`);
    console.log(`✅ Server started on port ${port}`);
    
>>>>>>> dd8b84457c8d4edb5d353b32e941d030d53668ee
    wss.on('connection', (ws, req) => {
      const url = new URL(req.url || '', `http://${req.headers.host}`);
      const userId = url.searchParams.get('userId') || randomUUID();
      const roomId = url.searchParams.get('roomId') || 'default';
<<<<<<< HEAD

=======
      
      console.log(`🔵 User ${userId} joined room ${roomId}`);
      
      this.clients.set(ws, { userId, roomId });
      
>>>>>>> dd8b84457c8d4edb5d353b32e941d030d53668ee
      if (!this.rooms.has(roomId)) {
        this.rooms.set(roomId, new Map());
      }
      this.rooms.get(roomId)!.set(userId, ws);
<<<<<<< HEAD

      this.broadcast(roomId, userId, {
        type: 'user-joined',
        userId,
        roomId
      });

      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          this.broadcast(roomId, userId, {
            ...message,
            userId
          });
        } catch (err) {
          console.error('Failed to parse signaling message:', err);
        }
      });

      ws.on('close', () => {
        this.rooms.get(roomId)?.delete(userId);
        this.broadcast(roomId, userId, {
          type: 'user-left',
          userId,
          roomId
        });

        if (this.rooms.get(roomId)?.size === 0) {
          this.rooms.delete(roomId);
        }
      });
    });
  }

  private broadcast(roomId: string, excludeUserId: string, message: any): void {
    const room = this.rooms.get(roomId);
    if (!room) return;

    room.forEach((client, userId) => {
      if (userId !== excludeUserId && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
=======
      
      this.broadcastToRoom(roomId, userId, {
        type: 'user-joined',
        roomId,
        userId,
        payload: { users: Array.from(this.rooms.get(roomId)!.keys()) }
      });
      
      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          console.log(`📨 Message from ${userId}: ${message.type}`);
          
          if (message.type === 'signal') {
            const targetWs = this.rooms.get(message.roomId)?.get(message.userId);
            if (targetWs && targetWs.readyState === WebSocket.OPEN) {
              targetWs.send(JSON.stringify({
                type: 'signal',
                userId: userId,
                payload: message.payload
              }));
            }
          }
        } catch (err) {
          console.error('Parse error:', err);
        }
      });
      
      ws.on('close', () => {
        console.log(`🔴 User ${userId} left room ${roomId}`);
        this.rooms.get(roomId)?.delete(userId);
        this.clients.delete(ws);
        
        this.broadcastToRoom(roomId, userId, {
          type: 'user-left',
          roomId,
          userId,
          payload: { users: Array.from(this.rooms.get(roomId)?.keys() || []) }
        });
      });
    });
  }
  
  private broadcastToRoom(roomId: string, excludeUserId: string, message: any): void {
    const room = this.rooms.get(roomId);
    if (!room) return;
    
    room.forEach((ws, userId) => {
      if (userId !== excludeUserId && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
>>>>>>> dd8b84457c8d4edb5d353b32e941d030d53668ee
      }
    });
  }
}

<<<<<<< HEAD
const port = parseInt(process.env.PORT || '3001', 10);
=======
const port = parseInt(process.env.PORT || '3001');
>>>>>>> dd8b84457c8d4edb5d353b32e941d030d53668ee
new SignalingServer(port);
