import { WebSocketServer, WebSocket } from 'ws';
import { randomUUID } from 'crypto';

export class SignalingServer {
  private rooms: Map<string, Map<string, WebSocket>> = new Map();

  constructor(port: number = 3001) {
    const wss = new WebSocketServer({ port });

    console.log('VoiceMaster signaling server started on port', port);

    wss.on('connection', (ws, req) => {
      const url = new URL(req.url || '', `http://${req.headers.host}`);
      const userId = url.searchParams.get('userId') || randomUUID();
      const roomId = url.searchParams.get('roomId') || 'default';

      if (!this.rooms.has(roomId)) {
        this.rooms.set(roomId, new Map());
      }
      this.rooms.get(roomId)!.set(userId, ws);

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
      }
    });
  }
}

const port = parseInt(process.env.PORT || '3001', 10);
new SignalingServer(port);
