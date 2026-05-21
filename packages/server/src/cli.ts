#!/usr/bin/env node
import { SignalingServer } from './server';

const port = parseInt(
  process.argv.find(arg => arg === '--port')
    ? process.argv[process.argv.indexOf('--port') + 1]
    : process.env.PORT || '3001'
);

new SignalingServer(port);