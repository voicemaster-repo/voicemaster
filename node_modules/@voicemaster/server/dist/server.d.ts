declare class SignalingServer {
    private rooms;
    constructor(port?: number);
    private broadcast;
}

export { SignalingServer };
