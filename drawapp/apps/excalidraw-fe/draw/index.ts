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

type CanvasShape = Shape & {
  // DB id exists for persisted shapes; needed for delete sync across clients.
  id?: number;
  // Temporary client-side id used to reconcile optimistic shape with server-echo shape.
  clientId?: string;
};

type RectangleShape = Extract<Shape, { type: "rectangle" }>;
type CircleShape = Extract<Shape, { type: "circle" }>;
type LineShape = Extract<Shape, { type: "line" }>;
export type DrawTool = Shape["type"] | "pointer" | "eraser";
type ToolRef = { current: DrawTool };

type IncomingWsMessage =
  // Server broadcasts created shapes (with DB id). clientId may be echoed back for reconciliation.
  | { type: "shape"; roomId: string; clientId?: string; shape: CanvasShape }
  // Server broadcasts erase events so all connected clients remove the same shape.
  | { type: "delete_shape"; roomId: string; shapeId: number }
  | { type: "error"; message: string };

// Distance from point -> line segment, used for erasing line shapes with a small tolerance.
function getPointToSegmentDistance(
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): number {
    // to get the direction of the vector/line
  // Segment direction vector from (x1, y1) -> (x2, y2).
  const dx = x2 - x1;
  const dy = y2 - y1;

//   to get the length of the line so that we'll know if the point is placed beside the line or not
  // Squared segment length (avoids an early sqrt and is enough for projection math).
  const lengthSquared = dx * dx + dy * dy;

  // Degenerate case: segment has no length (start == end), so distance is point-to-point.
//   if lengthSquared is 0 then it is not a line, it is actually a dot
// Math.hypot(px - x1, py - y1) means sqrt(a^2 + b^2)
  if (lengthSquared === 0) return Math.hypot(px - x1, py - y1);

//   Imagine the line is AB - starting point is A and ending point is B
  // Project point P onto the infinite line through the segment.
  // t is the normalized projection position:
  // t < 0   => before segment start - before A
//   t = 0 => exactly at A
// t = 1 => exactly at B
  // t > 1   => after segment end - after B
  // 0..1    => inside segment bounds - somewhere on the line
  // Clamp t to [0, 1] so we get the nearest point on the finite segment but not the entire infinite line
//   We drop a perpendicular shadow from the cursor onto the line.
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lengthSquared));

  // Coordinates of the closest point on the segment to (px, py).
  const projX = x1 + t * dx;
  const projY = y1 + t * dy;

  // Euclidean distance from point to that closest point on the segment.
  return Math.hypot(px - projX, py - projY);
}

function isPointInsideShape(shape: CanvasShape, x: number, y: number): boolean {
  if (shape.type === "rectangle") {
    // Rectangle hit-test: pointer is inside axis-aligned bounds.
    return x >= shape.x && x <= shape.x + shape.width && y >= shape.y && y <= shape.y + shape.height;
  }

  if (shape.type === "circle") {
    // We measure distance from click → center of circle.
    // If that distance is less than the radius → inside.
    // Circle hit-test: distance from pointer to center must be <= radius.
    return Math.hypot(x - shape.centerX, y - shape.centerY) <= shape.radius;
  }

  // Line hit-test: treat pointer as "on line" if it's within 6px of the segment.
  // We use a tolerance because a perfect 1px geometric hit is too hard for users.
  return getPointToSegmentDistance(x, y, shape.x1, shape.y1, shape.x2, shape.y2) <= 6;
}

// Normalize drag input so the shape always has a consistent origin and positive dimensions,
// regardless of draw direction.
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
    // Math.hypot(dx, dy) = sqrt(dx^2 + dy^2), i.e. distance between drag start/end.
    // That distance is the diameter here, so radius is half of it.
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
  selectedToolRef: ToolRef,
): Promise<(() => void) | void> {
  // 1) Get the 2D drawing context and ensure we have an active socket before proceeding.
  const ctx = canvas.getContext("2d");
  if (!ctx || !socket) return;

  // 2) Load already persisted shapes for this room from HTTP API and render them first.
  const existingShapes: CanvasShape[] = await getExistingShapes(roomId);
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
      // Step 1: check if this shape is the server echo of "my own" optimistic shape.
      // We identify that using clientId (temporary id generated on FE before DB insert).
      if (message.clientId) {
        // Try to find the local optimistic copy with the same clientId.
        const localPreviewIndex = existingShapes.findIndex((shape) => shape.clientId === message.clientId);
        if (localPreviewIndex !== -1) {
          // Replace optimistic local shape with authoritative server shape (usually includes DB id).
          existingShapes[localPreviewIndex] = message.shape;
          // Repaint canvas so replacement is visible immediately.
          clearCanvas(existingShapes, ctx, canvas);
          // Stop here: handled via reconciliation path.
          return;
        }
      }

      // Step 2: if not reconciled by clientId, dedupe/update by persistent DB id.
      // This protects against duplicates from reconnect/rebroadcast scenarios.
      if (message.shape.id) {
        // Find existing shape with same DB id.
        const existingIndex = existingShapes.findIndex((shape) => shape.id === message.shape.id);
        if (existingIndex !== -1) {
          // Update existing entry with latest server payload.
          existingShapes[existingIndex] = message.shape;
          // Repaint to reflect update.
          clearCanvas(existingShapes, ctx, canvas);
          // Stop here: dedupe/update completed.
          return;
        }
      }

      // Step 3: shape is genuinely new for this client; append and repaint.
      //   for non-drawer clients who did not draw the shape locally
      existingShapes.push(message.shape);
      clearCanvas(existingShapes, ctx, canvas);
      return;
    }

    if (message.type === "delete_shape" && message.roomId === roomId) {
      // Keep canvas state consistent with server delete broadcasts.
      const deleteIndex = existingShapes.findIndex((shape) => shape.id === message.shapeId);
      if (deleteIndex !== -1) {
        existingShapes.splice(deleteIndex, 1);
      }
      clearCanvas(existingShapes, ctx, canvas);
      return;
    }

    if (message.type === "error") {
      console.error("Socket error:", message.message);
    }
  };

  const onMouseDown = (e: MouseEvent) => {
    const selectedTool = selectedToolRef.current;

    // Pointer mode is selection-only; do not start drawing.
    if (selectedTool === "pointer") return;

    const point = getCanvasPoint(e);
    if (selectedTool === "eraser") {
      // Overlap handling: scan from end (top-most rendered shape) and erase first match.
      for (let i = existingShapes.length - 1; i >= 0; i -= 1) {
        const shape = existingShapes[i];
        if (!isPointInsideShape(shape, point.x, point.y)) continue;

        existingShapes.splice(i, 1);
        clearCanvas(existingShapes, ctx, canvas);

        // Persist erase in backend and broadcast to all room members via websocket server.
        if (shape.id && socket.readyState === WebSocket.OPEN) {
          socket.send(
            JSON.stringify({
              type: "delete_shape",
              roomId,
              shapeId: shape.id,
            }),
          );
        }
        return;
      }
      return;
    }

    // 6) Start a new drawing interaction and store drag origin.
    startX = point.x;
    startY = point.y;
    isDrawing = true;
  };

  const onMouseMove = (e: MouseEvent) => {
    const selectedTool = selectedToolRef.current;
    if (selectedTool === "pointer" || selectedTool === "eraser") return;

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
    const selectedTool = selectedToolRef.current;
    if (selectedTool === "pointer" || selectedTool === "eraser") {
      isDrawing = false;
      return;
    }

    // 8) Finalize drawing when mouse is released.
    if (!isDrawing) return;
    isDrawing = false;

    const point = getCanvasPoint(e);
    const baseShape: Shape =
      selectedTool === "rectangle"
        ? normalizeRectangle(startX, startY, point.x, point.y)
        : selectedTool === "circle"
          ? normalizeCircle(startX, startY, point.x, point.y)
          : normalizeLine(startX, startY, point.x, point.y);

    const clientId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    // Optimistic local shape includes clientId so later server echo can replace it with persisted id.
    const shape: CanvasShape = { ...baseShape, clientId };

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
          // Sent only for reconciliation; backend echoes it back in the broadcast.
          clientId,
          shape: baseShape,
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
export function clearCanvas(existingShapes: CanvasShape[], ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
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

async function getExistingShapes(roomId: string): Promise<CanvasShape[]> {
  try {
    const res = await axios.get<ShapeApiRecord[]>(`${HTTP_BACKEND}/shapes/${roomId}`);
    const records = res.data;

    return records
    .map((record) => {
      const payload =
        typeof record.payload === "string"
          ? JSON.parse(record.payload)
          : record.payload;
      return { ...payload, id: record.id, type: record.type } as CanvasShape;
    })
    .filter(
      (shape): shape is CanvasShape =>
        shape.type === "rectangle" || shape.type === "circle" || shape.type === "line",
    );
  } catch (err) {
    console.error("Failed to fetch existing shapes:", err);
    return [];
  }
}
