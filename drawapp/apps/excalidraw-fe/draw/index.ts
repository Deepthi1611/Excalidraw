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
} | {
  type: "line";
  x1: number;
  y1: number;
  x2: number;
  y2: number;
};

type RectangleShape = Extract<Shape, { type: "rectangle" }>;
type CircleShape = Extract<Shape, { type: "circle" }>;
type LineShape = Extract<Shape, { type: "line" }>;
export type DrawTool = Shape["type"];

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

function normalizeCircle(startX: number, startY: number, endX: number, endY: number): CircleShape {
  const dx = endX - startX;
  const dy = endY - startY;
  return {
    type: "circle",
    // Use drag endpoints as a diameter so circle size matches pointer drag.
    centerX: (startX + endX) / 2,
    centerY: (startY + endY) / 2,
    radius: Math.hypot(dx, dy) / 2,
  };
}

function normalizeLine(startX: number, startY: number, endX: number, endY: number): LineShape {
  return {
    type: "line",
    x1: startX,
    y1: startY,
    x2: endX,
    y2: endY,
  };
}

export async function initDraw(
  canvas: HTMLCanvasElement,
  roomId: string,
  socket: WebSocket | null,
  selectedTool: DrawTool,
): Promise<(() => void) | void> {
  // 1) Get the 2D drawing context and ensure we have an active socket before proceeding.
  const ctx = canvas.getContext("2d");
  if (!ctx || !socket) return;

  // 2) Load already persisted shapes for this room from HTTP API and render them first.
  const existingShapes: Shape[] = await getExistingShapes(roomId);
  clearCanvas(existingShapes, ctx, canvas);

  // 3) Local interaction state for the current drag session.
  let startX = 0;
  let startY = 0;
  let isDrawing = false;

  // 4) Convert viewport mouse coordinates (clientX/clientY) to canvas-local coordinates
  // by subtracting the canvas viewport offset (rect.left/top). This prevents draw offset.
  function getCanvasPoint(e: MouseEvent) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }

  const onSocketMessage = (event: MessageEvent) => {
    // 5) Parse incoming websocket messages; ignore malformed frames safely.
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
    // 6) Start a new drawing interaction and store drag origin.
    const point = getCanvasPoint(e);
    startX = point.x;
    startY = point.y;
    isDrawing = true;
  };

  const onMouseMove = (e: MouseEvent) => {
    // 7) While dragging, redraw current scene and paint a live preview shape.
    if (!isDrawing) return;
    const point = getCanvasPoint(e);
    clearCanvas(existingShapes, ctx, canvas);
    ctx.strokeStyle = "rgba(255, 255, 255, 1)";

    if (selectedTool === "rectangle") {
      const preview = normalizeRectangle(startX, startY, point.x, point.y);
      ctx.strokeRect(preview.x, preview.y, preview.width, preview.height);
      return;
    }

    if (selectedTool === "circle") {
      const preview = normalizeCircle(startX, startY, point.x, point.y);
      ctx.beginPath();
      ctx.arc(preview.centerX, preview.centerY, preview.radius, 0, 2 * Math.PI);
      ctx.stroke();
      return;
    }

    const preview = normalizeLine(startX, startY, point.x, point.y);
    ctx.beginPath();
    ctx.moveTo(preview.x1, preview.y1);
    ctx.lineTo(preview.x2, preview.y2);
    ctx.stroke();
  };

  const onMouseUp = (e: MouseEvent) => {
    // 8) Finalize drawing when mouse is released.
    if (!isDrawing) return;
    isDrawing = false;

    const point = getCanvasPoint(e);
    const shape =
      selectedTool === "rectangle"
        ? normalizeRectangle(startX, startY, point.x, point.y)
        : selectedTool === "circle"
          ? normalizeCircle(startX, startY, point.x, point.y)
          : normalizeLine(startX, startY, point.x, point.y);

    // Ignore accidental tiny drags/click jitter.
    const tooSmall =
      shape.type === "rectangle"
        ? shape.width < 2 || shape.height < 2
        : shape.type === "circle"
          ? shape.radius < 2
          : Math.abs(shape.x2 - shape.x1) < 2 && Math.abs(shape.y2 - shape.y1) < 2;

    if (tooSmall) {
      clearCanvas(existingShapes, ctx, canvas);
      return;
    }

    // 9) Add finalized shape locally and redraw immediately for responsive UI.
    existingShapes.push(shape);
    clearCanvas(existingShapes, ctx, canvas);

    // 10) Publish finalized shape over websocket for realtime sync with other clients.
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

  // 11) Attach all runtime listeners for draw interactions + realtime sync.
  canvas.addEventListener("mousedown", onMouseDown);
  canvas.addEventListener("mousemove", onMouseMove);
  window.addEventListener("mouseup", onMouseUp);
  socket.addEventListener("message", onSocketMessage);

  // 12) Return cleanup to prevent duplicate listeners on unmount/re-init.
  return () => {
    canvas.removeEventListener("mousedown", onMouseDown);
    canvas.removeEventListener("mousemove", onMouseMove);
    window.removeEventListener("mouseup", onMouseUp);
    socket.removeEventListener("message", onSocketMessage);
  };
}

// clear the canvas and add the existing shapes to the canvas
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
      return;
    }

    if (shape.type === "line") {
      ctx.beginPath();
      ctx.strokeStyle = "rgba(255, 255, 255, 1)";
      ctx.moveTo(shape.x1, shape.y1);
      ctx.lineTo(shape.x2, shape.y2);
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
    .filter((shape): shape is Shape => shape.type === "rectangle" || shape.type === "circle" || shape.type === "line");
  } catch (err) {
    console.error("Failed to fetch existing shapes:", err);
    return [];
  }
}
