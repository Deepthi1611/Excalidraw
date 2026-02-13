import fs from "node:fs";
import path from "node:path";
import { WebSocketServer, WebSocket as WsWebSocket, RawData } from "ws";
import type { IncomingMessage } from "node:http";
import jwt, { JwtPayload } from "jsonwebtoken";
import { getJwtSecret } from "@repo/backend-common/config";

function loadDbEnvFile(): void {
  const envPath = path.resolve(__dirname, "../../../packages/db/.env");
  if (!fs.existsSync(envPath)) {
    return;
  }

  const raw = fs.readFileSync(envPath, "utf8");
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
    const value =
      (rawValue.startsWith('"') && rawValue.endsWith('"')) ||
      (rawValue.startsWith("'") && rawValue.endsWith("'"))
        ? rawValue.slice(1, -1)
        : rawValue;
    if (key) {
      process.env[key] = value;
    }
  }
}

loadDbEnvFile();

const wss = new WebSocketServer({ port: 8080 });

function checkUser(token: string): (string | null) {
  try {
    const jwtSecret = getJwtSecret();
    if (!jwtSecret) throw new Error("JWT_SECRET is not defined");
    const decoded = jwt.verify(token, jwtSecret);
    if (decoded && (decoded as JwtPayload).userId) {
      return (decoded as JwtPayload).userId;
    }
    return null;
  } catch (err) {
    console.error('Error verifying token:', err);
    return null;
  }
}

interface User {
  userId: string;
  rooms: string[];
  ws: WsWebSocket;
}

// In-memory store for connected users - each user object has user id, rooms they are in, and their WebSocket connection
const users: User[] = [];

wss.on('connection', function connection(ws: WsWebSocket, req: IncomingMessage) {
  try {
  console.log('A new client connected!');
  const url = req.url; // contains what url we are trying to connect to, and also the query params
  if(!url){
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

  ws.on('message', function message(data: RawData) {
    const parsedData = JSON.parse(data.toString());
    if(parsedData.type === 'join_room') {
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
    if(parsedData.type === 'leave_room') {
      const { roomId } = parsedData;
      const user = users.find(u => u.userId === userId);
      // remove the room from the user's rooms array
      if (user) {
        user.rooms = user.rooms.filter(r => r !== roomId);
        console.log(`User ${userId} left room ${roomId}`);
      } else return;
    } 
    if(parsedData.type === 'chat') {
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

} catch (err) {
  console.error('Error during WebSocket connection:', err);
  ws.close(1011, 'Internal Server Error');
}
});
