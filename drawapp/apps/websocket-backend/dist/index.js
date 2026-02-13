"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const ws_1 = require("ws");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("@repo/backend-common/config");
function loadDbEnvFile() {
    const envPath = node_path_1.default.resolve(__dirname, "../../../packages/db/.env");
    if (!node_fs_1.default.existsSync(envPath)) {
        return;
    }
    const raw = node_fs_1.default.readFileSync(envPath, "utf8");
    for (const line of raw.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) {
            continue;
        }
        const eqIndex = trimmed.indexOf("=");
        if (eqIndex === -1) {
            continue;
        }
        const key = trimmed.slice(0, eqIndex).trim();
        const rawValue = trimmed.slice(eqIndex + 1).trim();
        const value = (rawValue.startsWith('"') && rawValue.endsWith('"')) ||
            (rawValue.startsWith("'") && rawValue.endsWith("'"))
            ? rawValue.slice(1, -1)
            : rawValue;
        if (key) {
            process.env[key] = value;
        }
    }
}
loadDbEnvFile();
const wss = new ws_1.WebSocketServer({ port: 8080 });
function checkUser(token) {
    try {
        const jwtSecret = (0, config_1.getJwtSecret)();
        if (!jwtSecret)
            throw new Error("JWT_SECRET is not defined");
        const decoded = jsonwebtoken_1.default.verify(token, jwtSecret);
        if (decoded && decoded.userId) {
            return decoded.userId;
        }
        return null;
    }
    catch (err) {
        console.error('Error verifying token:', err);
        return null;
    }
}
// In-memory store for connected users - each user object has user id, rooms they are in, and their WebSocket connection
const users = [];
wss.on('connection', function connection(ws, req) {
    try {
        console.log('A new client connected!');
        const url = req.url; // contains what url we are trying to connect to, and also the query params
        if (!url) {
            return;
        }
        const queryParams = new URLSearchParams(url.split('?')[1]);
        const token = queryParams.get('token') || "";
        console.log('Token:', token);
        const userId = checkUser(token);
        if (!userId) {
            console.log('Unauthorized client attempted to connect');
            ws.close(1008, 'Unauthorized');
            return;
        }
        // add user to the global users array with their userId, an empty array for rooms, and their WebSocket connection
        users.push({ userId, rooms: [], ws });
        ws.on('message', function message(data) {
            const parsedData = JSON.parse(data.toString());
            if (parsedData.type === 'join_room') {
                const { roomId } = parsedData;
                const user = users.find(u => u.userId === userId);
                console.log(user);
                console.log(users);
                // add the room to the user's rooms array if they are not already in it
                if (user && roomId && !user.rooms.includes(roomId)) {
                    user.rooms.push(roomId);
                    console.log(`User ${userId} joined room ${roomId}`);
                    console.log(users);
                }
            }
            if (parsedData.type === 'leave_room') {
                const { roomId } = parsedData;
                const user = users.find(u => u.userId === userId);
                // remove the room from the user's rooms array
                if (user) {
                    user.rooms = user.rooms.filter(r => r !== roomId);
                    console.log(`User ${userId} left room ${roomId}`);
                }
                else
                    return;
            }
            if (parsedData.type === 'chat') {
                const { roomId, message } = parsedData;
                // broadcast the message to all users in the same room
                users.forEach(u => {
                    console.log(u.userId, u.rooms);
                    if (u.rooms.includes(roomId)) {
                        u.ws.send(JSON.stringify({ type: 'chat', userId, message }));
                    }
                });
            }
        });
    }
    catch (err) {
        console.error('Error during WebSocket connection:', err);
        ws.close(1011, 'Internal Server Error');
    }
});
