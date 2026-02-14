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
// Load shared backend env values so JWT verification works in this process too.
function loadDbEnvFile() {
    const envPath = node_path_1.default.resolve(__dirname, "../../../packages/db/.env");
    if (!node_fs_1.default.existsSync(envPath)) {
        return;
    }
    const raw = node_fs_1.default.readFileSync(envPath, "utf8");
    for (const line of raw.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#"))
            continue;
        const eqIndex = trimmed.indexOf("=");
        if (eqIndex === -1)
            continue;
        const key = trimmed.slice(0, eqIndex).trim();
        const rawValue = trimmed.slice(eqIndex + 1).trim();
        // Support both quoted and unquoted .env values.
        const value = (rawValue.startsWith('"') && rawValue.endsWith('"')) ||
            (rawValue.startsWith("'") && rawValue.endsWith("'"))
            ? rawValue.slice(1, -1)
            : rawValue;
        if (key)
            process.env[key] = value;
    }
}
loadDbEnvFile();
const wss = new ws_1.WebSocketServer({ port: 8080 });
function formatError(err) {
    if (err instanceof Error) {
        return `${err.name}: ${err.message}`;
    }
    return String(err);
}
function checkUser(token) {
    try {
        const jwtSecret = (0, config_1.getJwtSecret)();
        if (!jwtSecret)
            throw new Error("JWT_SECRET is not defined");
        const decoded = jsonwebtoken_1.default.verify(token, jwtSecret);
        if (decoded?.userId && typeof decoded.userId === "string") {
            return decoded.userId;
        }
        return null;
    }
    catch (err) {
        console.error(`Error verifying token: ${formatError(err)}`);
        return null;
    }
}
const connectionsBySocket = new Map();
// Helps track all active sockets for a user (same user on multiple devices/tabs).
const socketsByUser = new Map();
// Fast room broadcast lookup: room -> sockets currently inside the room.
const membersByRoom = new Map();
wss.on("connection", (ws, req) => {
    try {
        const url = req.url;
        if (!url) {
            ws.close(1008, "Missing URL");
            return;
        }
        const queryParams = new URLSearchParams(url.split("?")[1] ?? "");
        const token = queryParams.get("token") ?? "";
        const userId = checkUser(token);
        if (!userId) {
            ws.close(1008, "Unauthorized");
            return;
        }
        // One connection object per socket. This avoids collisions between same-user devices.
        const conn = { userId, ws, rooms: new Set() };
        connectionsBySocket.set(ws, conn);
        let userSockets = socketsByUser.get(userId);
        if (!userSockets) {
            userSockets = new Set();
            socketsByUser.set(userId, userSockets);
        }
        userSockets.add(ws);
        ws.on("message", (data) => {
            let parsedData;
            try {
                parsedData = JSON.parse(data.toString());
            }
            catch {
                ws.send(JSON.stringify({ type: "error", message: "Invalid JSON" }));
                return;
            }
            const currentConn = connectionsBySocket.get(ws);
            if (!currentConn)
                return;
            if (parsedData.type === "join_room") {
                const { roomId } = parsedData;
                // Join only this socket/device to the room.
                currentConn.rooms.add(roomId);
                let roomMembers = membersByRoom.get(roomId);
                if (!roomMembers) {
                    roomMembers = new Set();
                    membersByRoom.set(roomId, roomMembers);
                }
                roomMembers.add(ws);
                return;
            }
            if (parsedData.type === "leave_room") {
                const { roomId } = parsedData;
                // Leave only this socket/device from the room.
                currentConn.rooms.delete(roomId);
                const roomMembers = membersByRoom.get(roomId);
                if (roomMembers) {
                    roomMembers.delete(ws);
                    if (roomMembers.size === 0)
                        membersByRoom.delete(roomId);
                }
                return;
            }
            if (parsedData.type === "chat") {
                const { roomId, message } = parsedData;
                // Sender must be a member of the room before sending.
                if (!currentConn.rooms.has(roomId)) {
                    ws.send(JSON.stringify({
                        type: "error",
                        message: "Join room before sending messages",
                    }));
                    return;
                }
                const roomMembers = membersByRoom.get(roomId);
                if (!roomMembers)
                    return;
                const payload = JSON.stringify({
                    type: "chat",
                    roomId,
                    userId: currentConn.userId,
                    message,
                });
                // Broadcast to every socket in the room, including other devices of same user.
                for (const memberSocket of roomMembers) {
                    if (memberSocket.readyState === memberSocket.OPEN) {
                        memberSocket.send(payload);
                    }
                }
            }
        });
        ws.on("close", () => {
            const currentConn = connectionsBySocket.get(ws);
            if (!currentConn)
                return;
            // Remove this socket from all rooms it had joined.
            for (const roomId of currentConn.rooms) {
                const roomMembers = membersByRoom.get(roomId);
                if (roomMembers) {
                    roomMembers.delete(ws);
                    if (roomMembers.size === 0)
                        membersByRoom.delete(roomId);
                }
            }
            const userSockets = socketsByUser.get(currentConn.userId);
            if (userSockets) {
                userSockets.delete(ws);
                if (userSockets.size === 0)
                    socketsByUser.delete(currentConn.userId);
            }
            // Finally remove socket -> connection mapping.
            connectionsBySocket.delete(ws);
        });
    }
    catch (err) {
        console.error(`Error during WebSocket connection: ${formatError(err)}`);
        ws.close(1011, "Internal Server Error");
    }
});
