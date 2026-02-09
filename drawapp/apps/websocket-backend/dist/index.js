"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const { WebSocketServer, WebSocket } = require('ws');
const wss = new WebSocketServer({ port: 8080 });
wss.on('connection', function connection(ws) {
    console.log('A new client connected!');
    ws.send('Welcome New Client!');
});
