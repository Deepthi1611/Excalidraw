"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const { WebSocketServer, WebSocket } = require('ws');
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("@repo/backend-common/config");
const wss = new WebSocketServer({ port: 8080 });
wss.on('connection', function connection(ws, req) {
    try {
        console.log('A new client connected!');
        const url = req.url;
        if (!url) {
            return;
        }
        const queryParams = new URLSearchParams(url.split('?')[1]);
        const token = queryParams.get('token') || "";
        console.log('Token:', token);
        if (!config_1.JWT_SECRET) {
            throw new Error('JWT_SECRET is not defined');
        }
        const decoded = jsonwebtoken_1.default.verify(token, config_1.JWT_SECRET);
        if (!decoded || !decoded.userId) {
            ws.close(1008, 'Invalid token');
            return;
        }
        ws.send('Welcome New Client!');
    }
    catch (err) {
        console.error('Error during WebSocket connection:', err);
        ws.close(1011, 'Internal Server Error');
    }
});
