#!/usr/bin/env node
declare class SignalingServer {
    private rooms;
    private clients;
    constructor(port?: number);
    private broadcastToRoom;
}

export { SignalingServer };
