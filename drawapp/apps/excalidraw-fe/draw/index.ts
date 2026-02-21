import axios from "axios";

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

export function initDraw(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const existingShapes:Shape[] = [];

    // Fill the canvas with a black background
    ctx.fillStyle = "rgba(0, 0, 0)";
    // paints a rectangle that covers the entire canvas
    ctx.fillRect(0,0, canvas.width, canvas.height);

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

function getExistingShapes(roomId:string) { 
    axios.get(`/api/rooms/${roomId}/shapes`).then(response => { }).catch(error => {
        console.error("Error fetching existing shapes:", error);
    });
}