import axios from "axios";
import { HTTP_BACKEND } from "../config";

type Shape = {
    type: "rectangle"
    x: number;
    y: number;
    width: number;
    height: number;
} | {
    type: "circle"
    centerX: number;
    centerY: number;
    radius: number;
} 

export async function initDraw(canvas: HTMLCanvasElement, roomId: string) {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const existingShapes:Shape[] = await getExistingShapes(roomId);

    // Fill the canvas with a black background
    // ctx.fillStyle = "rgba(0, 0, 0)";
    // paints a rectangle that covers the entire canvas
    // ctx.fillRect(0,0, canvas.width, canvas.height);

    // render existing shapes on the canvas
    clearCanvas(existingShapes, ctx, canvas);

    let startX = 0;
    let startY = 0;

    canvas.addEventListener("mousedown", (e: MouseEvent) => {
        // track the starting point of the rectangle
      startX = e.clientX;
      startY = e.clientY;
    });

    canvas.addEventListener("mouseup", (e: MouseEvent) => {
        // calculate the width and height of the rectangle based on 
        // the starting point and current mouse position
      const width = e.clientX - startX;
      const height = e.clientY - startY;
    // push the new rectangle to the existingShapes array
      existingShapes.push({
        type: "rectangle",
        x: startX,
        y: startY,
        width,
        height,
        });
    });

    canvas.addEventListener("mousemove", (e: MouseEvent) => {
      if(e.buttons === 1) {
        const width = e.clientX - startX;
        const height = e.clientY - startY;
        clearCanvas(existingShapes, ctx, canvas);
        // draw the new rectangle on top of the existing shapes
        ctx.strokeStyle = "rgba(255, 255, 255)";
        ctx.strokeRect(startX, startY, width, height);
      }
    });
}

export function clearCanvas(existingShapes: Shape[], ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "rgba(0, 0, 0)";
    ctx.fillRect(0,0, canvas.width, canvas.height);
    // Redraw existing shapes
    existingShapes.forEach(shape => {
        if(shape.type === "rectangle") {
            ctx.strokeStyle = "rgba(255, 255, 255)";
            ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
        } else if(shape.type === "circle") {
            ctx.beginPath();
            ctx.arc(shape.centerX, shape.centerY, shape.radius, 0, 2 * Math.PI);
            ctx.fill();
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
    updatedAt: string;
};

async function getExistingShapes(roomId:string): Promise<Shape[]> { 
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
}