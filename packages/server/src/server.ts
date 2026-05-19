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
    
    console.log(`🎙️ VoiceFlow Signaling Server`);
    console.log(`📡 WebSocket endpoint: ws://localhost:${port}`);
    console.log(`✅ Server started on port ${port}`);
    
    wss.on('connection', (ws, req) => {
      const url = new URL(req.url || '', `http://${req.headers.host}`);
      const userId = url.searchParams.get('userId') || randomUUID();
      const roomId = url.searchParams.get('roomId') || 'default';
      
      console.log(`🔵 User ${userId} joined room ${roomId}`);
      
      this.clients.set(ws, { userId, roomId });
      
      if (!this.rooms.has(roomId)) {
        this.rooms.set(roomId, new Map());
      }
      this.rooms.get(roomId)!.set(userId, ws);
      
      // Уведомить всех о новом пользователе
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
      }
    });
  }
}

const port = parseInt(process.env.PORT || '3001');
new SignalingServer(port);