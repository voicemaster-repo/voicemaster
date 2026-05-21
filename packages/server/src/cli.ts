#!/usr/bin/env node
import { SignalingServer } from './server';

const portIndex = process.argv.indexOf('--port');
const port = portIndex !== -1 
  ? parseInt(process.argv[portIndex + 1]) 
  : parseInt(process.env.PORT || '3001');

new SignalingServer(port);