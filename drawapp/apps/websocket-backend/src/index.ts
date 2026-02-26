import fs from "node:fs";
import path from "node:path";
import { WebSocketServer, WebSocket as WsWebSocket, RawData } from "ws";
import type { IncomingMessage } from "node:http";
import jwt, { JwtPayload } from "jsonwebtoken";
import { getJwtSecret } from "@repo/backend-common/config";
import { prisma } from "@repo/db/client";

// Load shared backend env values so JWT verification works in this process too.
function loadDbEnvFile(): void {
  const envPath = path.resolve(__dirname, "../../../packages/db/.env");
  if (!fs.existsSync(envPath)) {
    return;
  }

  const raw = fs.readFileSync(envPath, "utf8");
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;

    const key = trimmed.slice(0, eqIndex).trim();
    const rawValue = trimmed.slice(eqIndex + 1).trim();
    // Support both quoted and unquoted .env values.
    const value =
      (rawValue.startsWith('"') && rawValue.endsWith('"')) ||
      (rawValue.startsWith("'") && rawValue.endsWith("'"))
        ? rawValue.slice(1, -1)
        : rawValue;

    if (key) process.env[key] = value;
  }
}

loadDbEnvFile();

const wss = new WebSocketServer({ port: 8080 });

function formatError(err: unknown): string {
  if (err instanceof Error) {
    return `${err.name}: ${err.message}`;
  }
  return String(err);
}

function checkUser(token: string): string | null {
  try {
    if (!token) return null;

    const jwtSecret = getJwtSecret();
    if (!jwtSecret) throw new Error("JWT_SECRET is not defined");

    const decoded = jwt.verify(token, jwtSecret) as JwtPayload;
    if (decoded?.userId && typeof decoded.userId === "string") {
      return decoded.userId;
    }
    return null;
  } catch (err) {
    console.error(`Error verifying token: ${formatError(err)}`);
    return null;
  }
}

interface Connection {
  userId: string;
  ws: WsWebSocket;
  // Rooms this specific socket/device has joined.
  rooms: Set<string>;
}

type ClientMessage =
  | { type: "join_room"; roomId: string }
  | { type: "leave_room"; roomId: string }
  | { type: "chat"; roomId: string; message: string }
  | {
      type: "shape";
      roomId: string;
      clientId?: string;
      shape:
        | { type: "rectangle"; x: number; y: number; width: number; height: number }
        | { type: "circle"; centerX: number; centerY: number; radius: number }
        | { type: "line"; x1: number; y1: number; x2: number; y2: number };
    }
  | { type: "delete_shape"; roomId: string; shapeId: number };

const connectionsBySocket = new Map<WsWebSocket, Connection>();
// Helps track all active sockets for a user (same user on multiple devices/tabs).
const socketsByUser = new Map<string, Set<WsWebSocket>>();
// Fast room broadcast lookup: room -> sockets currently inside the room.
const membersByRoom = new Map<string, Set<WsWebSocket>>();

wss.on("connection", (ws: WsWebSocket, req: IncomingMessage) => {
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
    const conn: Connection = { userId, ws, rooms: new Set<string>() };
    connectionsBySocket.set(ws, conn);

    let userSockets = socketsByUser.get(userId);
    if (!userSockets) {
      userSockets = new Set<WsWebSocket>();
      socketsByUser.set(userId, userSockets);
    }
    userSockets.add(ws);

    ws.on("message", async(data: RawData) => {
      let parsedData: ClientMessage;
      try {
        parsedData = JSON.parse(data.toString()) as ClientMessage;
      } catch {
        ws.send(JSON.stringify({ type: "error", message: "Invalid JSON" }));
        return;
      }

      const currentConn = connectionsBySocket.get(ws);
      if (!currentConn) return;

      if (parsedData.type === "join_room") {
        const { roomId } = parsedData;
        console.log('joining room with id', roomId)
        // Join only this socket/device to the room.
        currentConn.rooms.add(roomId);

        let roomMembers = membersByRoom.get(roomId);
        if (!roomMembers) {
          roomMembers = new Set<WsWebSocket>();
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
          if (roomMembers.size === 0) membersByRoom.delete(roomId);
        }
        return;
      }

      if (parsedData.type === "chat") {
        const { roomId, message } = parsedData;

        await prisma.chat.create({
          data: {
            roomId: Number(roomId),
            userId: currentConn.userId,
            message,
          },
        });

        // Sender must be a member of the room before sending.
        if (!currentConn.rooms.has(roomId)) {
          ws.send(
            JSON.stringify({
              type: "error",
              message: "Join room before sending messages",
            }),
          );
          return;
        }

        const roomMembers = membersByRoom.get(roomId);
        if (!roomMembers) return;

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
        return;
      }

      if (parsedData.type === "shape") {
        const { roomId, shape, clientId } = parsedData;

        // Sender must join the room before drawing.
        if (!currentConn.rooms.has(roomId)) {
          ws.send(
            JSON.stringify({
              type: "error",
              message: "Join room before sending shapes",
            }),
          );
          return;
        }

        const roomIdNum = Number(roomId);
        if (!Number.isInteger(roomIdNum) || roomIdNum <= 0) {
          ws.send(JSON.stringify({ type: "error", message: "Invalid roomId" }));
          return;
        }

        const payload =
          shape.type === "rectangle"
            ? {
                x: shape.x,
                y: shape.y,
                width: shape.width,
                height: shape.height,
              }
            : shape.type === "circle"
              ? {
                centerX: shape.centerX,
                centerY: shape.centerY,
                radius: shape.radius,
              }
              : {
                x1: shape.x1,
                y1: shape.y1,
                x2: shape.x2,
                y2: shape.y2,
              };

        let createdShape;
        try {
          createdShape = await prisma.shape.create({
            data: {
              roomId: roomIdNum,
              userId: currentConn.userId,
              type: shape.type,
              payload: JSON.stringify(payload),
            },
          });
        } catch (err) {
          ws.send(JSON.stringify({ type: "error", message: `Failed to save shape: ${formatError(err)}` }));
          return;
        }

        const roomMembers = membersByRoom.get(roomId);
        if (!roomMembers) return;

        const outgoing = JSON.stringify({
          type: "shape",
          roomId,
          userId: currentConn.userId,
          clientId,
          shape: {
            id: createdShape.id,
            type: shape.type,
            ...payload,
          },
        });

        // Broadcast to everyone (including sender) so sender can reconcile local preview with DB id.
        for (const memberSocket of roomMembers) {
          if (memberSocket.readyState === memberSocket.OPEN) {
            memberSocket.send(outgoing);
          }
        }
        return;
      }

      if (parsedData.type === "delete_shape") {
        const { roomId, shapeId } = parsedData;

        // Sender must join the room before erasing.
        if (!currentConn.rooms.has(roomId)) {
          ws.send(
            JSON.stringify({
              type: "error",
              message: "Join room before deleting shapes",
            }),
          );
          return;
        }

        if (!Number.isInteger(shapeId) || shapeId <= 0) {
          ws.send(JSON.stringify({ type: "error", message: "Invalid shapeId" }));
          return;
        }

        try {
          await prisma.shape.delete({ where: { id: shapeId } });
        } catch (err) {
          ws.send(JSON.stringify({ type: "error", message: `Failed to delete shape: ${formatError(err)}` }));
          return;
        }

        const roomMembers = membersByRoom.get(roomId);
        if (!roomMembers) return;

        const outgoing = JSON.stringify({
          type: "delete_shape",
          roomId,
          shapeId,
        });

        for (const memberSocket of roomMembers) {
          if (memberSocket.readyState === memberSocket.OPEN) {
            memberSocket.send(outgoing);
          }
        }
      }
    });

    ws.on("close", () => {
      const currentConn = connectionsBySocket.get(ws);
      if (!currentConn) return;

      // Remove this socket from all rooms it had joined.
      for (const roomId of currentConn.rooms) {
        const roomMembers = membersByRoom.get(roomId);
        if (roomMembers) {
          roomMembers.delete(ws);
          if (roomMembers.size === 0) membersByRoom.delete(roomId);
        }
      }

      const userSockets = socketsByUser.get(currentConn.userId);
      if (userSockets) {
        userSockets.delete(ws);
        if (userSockets.size === 0) socketsByUser.delete(currentConn.userId);
      }

      // Finally remove socket -> connection mapping.
      connectionsBySocket.delete(ws);
    });
  } catch (err) {
    console.error(`Error during WebSocket connection: ${formatError(err)}`);
    ws.close(1011, "Internal Server Error");
  }
});
