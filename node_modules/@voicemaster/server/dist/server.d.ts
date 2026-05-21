<<<<<<< HEAD
declare class SignalingServer {
    private rooms;
    constructor(port?: number);
    private broadcast;
=======
#!/usr/bin/env node
declare class SignalingServer {
    private rooms;
    private clients;
    constructor(port?: number);
    private broadcastToRoom;
>>>>>>> dd8b84457c8d4edb5d353b32e941d030d53668ee
}

export { SignalingServer };
