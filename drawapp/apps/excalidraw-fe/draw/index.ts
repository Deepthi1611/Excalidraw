import axios from "axios";
import { HTTP_BACKEND } from "../config";

type Shape = {
  type: "rectangle";
  x: number;
  y: number;
  width: number;
  height: number;
} | {
  type: "circle";
  centerX: number;
  centerY: number;
  radius: number;
};

type RectangleShape = Extract<Shape, { type: "rectangle" }>;

type IncomingWsMessage =
  | { type: "shape"; roomId: string; shape: Shape }
  | { type: "error"; message: string };

function normalizeRectangle(startX: number, startY: number, endX: number, endY: number): RectangleShape {
  return {
    type: "rectangle",
    x: Math.min(startX, endX),
    y: Math.min(startY, endY),
    width: Math.abs(endX - startX),
    height: Math.abs(endY - startY),
  };
}

export async function initDraw(
  canvas: HTMLCanvasElement,
  roomId: string,
  socket: WebSocket | null,
): Promise<(() => void) | void> {

  const ctx = canvas.getContext("2d");
  if (!ctx || !socket) return;

  const existingShapes: Shape[] = await getExistingShapes(roomId);
  clearCanvas(existingShapes, ctx, canvas);

  let startX = 0;
  let startY = 0;
  let isDrawing = false;

  function getCanvasPoint(e: MouseEvent) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }

  const onSocketMessage = (event: MessageEvent) => {
    let message: IncomingWsMessage;
    try {
      message = JSON.parse(event.data as string) as IncomingWsMessage;
    } catch {
      return;
    }

    // Apply live shape updates from other clients, but only for this room.
    if (message.type === "shape" && message.roomId === roomId) {
      existingShapes.push(message.shape);
      clearCanvas(existingShapes, ctx, canvas);
      return;
    }

    if (message.type === "error") {
      console.error("Socket error:", message.message);
    }
  };

  const onMouseDown = (e: MouseEvent) => {
    const point = getCanvasPoint(e);
    startX = point.x;
    startY = point.y;
    isDrawing = true;
  };

  const onMouseMove = (e: MouseEvent) => {
    if (!isDrawing) return;
    const point = getCanvasPoint(e);
    const preview = normalizeRectangle(startX, startY, point.x, point.y);
    clearCanvas(existingShapes, ctx, canvas);
    ctx.strokeStyle = "rgba(255, 255, 255, 1)";
    ctx.strokeRect(preview.x, preview.y, preview.width, preview.height);
  };

  const onMouseUp = (e: MouseEvent) => {
    if (!isDrawing) return;
    isDrawing = false;

    const point = getCanvasPoint(e);
    const shape = normalizeRectangle(startX, startY, point.x, point.y);
    if (shape.width < 2 || shape.height < 2) {
      clearCanvas(existingShapes, ctx, canvas);
      return;
    }

    existingShapes.push(shape);
    clearCanvas(existingShapes, ctx, canvas);

    if (socket.readyState === WebSocket.OPEN) {
      socket.send(
        JSON.stringify({
          type: "shape",
          roomId,
          shape,
        }),
      );
    }
  };

  canvas.addEventListener("mousedown", onMouseDown);
  canvas.addEventListener("mousemove", onMouseMove);
  window.addEventListener("mouseup", onMouseUp);
  socket.addEventListener("message", onSocketMessage);

  return () => {
    canvas.removeEventListener("mousedown", onMouseDown);
    canvas.removeEventListener("mousemove", onMouseMove);
    window.removeEventListener("mouseup", onMouseUp);
    socket.removeEventListener("message", onSocketMessage);
  };
}

export function clearCanvas(existingShapes: Shape[], ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "rgba(0, 0, 0, 1)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  existingShapes.forEach((shape) => {
    if (shape.type === "rectangle") {
      ctx.strokeStyle = "rgba(255, 255, 255, 1)";
      ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
      return;
    }

    if (shape.type === "circle") {
      ctx.beginPath();
      ctx.strokeStyle = "rgba(255, 255, 255, 1)";
      ctx.arc(shape.centerX, shape.centerY, shape.radius, 0, 2 * Math.PI);
      ctx.stroke();
    }
  });
}

type ShapeApiRecord = {
  id: number;
  roomId: number;
  userId: string;
  type: Shape["type"];
  payload: Shape | string;
  createdAt: string;
};

async function getExistingShapes(roomId: string): Promise<Shape[]> {
  try {
    const res = await axios.get<ShapeApiRecord[]>(`${HTTP_BACKEND}/shapes/${roomId}`);
    const records = res.data;

    return records
    .map((record) => {
      const payload =
        typeof record.payload === "string"
          ? JSON.parse(record.payload)
          : record.payload;
      return { ...payload, type: record.type } as Shape;
    })
    .filter((shape): shape is Shape => shape.type === "rectangle" || shape.type === "circle");
  } catch (err) {
    console.error("Failed to fetch existing shapes:", err);
    return [];
  }
}
