export function initDraw(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Fill the canvas with a semi-transparent background
    ctx.fillStyle = "rgba(0, 0, 0)";
    ctx.fillRect(0,0, canvas.width, canvas.height);

    let startX = 0;
    let startY = 0;

    canvas.addEventListener("mousedown", (e: MouseEvent) => {
      startX = e.clientX;
      startY = e.clientY;
    });

    canvas.addEventListener("mouseup", (e: MouseEvent) => {
      console.log(e.clientX, e.clientY);
    });

    canvas.addEventListener("mousemove", (e: MouseEvent) => {
      if(e.buttons === 1) {
        const width = e.clientX - startX;
        const height = e.clientY - startY;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "rgba(0, 0, 0)";
        ctx.fillRect(0,0, canvas.width, canvas.height);
        ctx.strokeStyle = "rgba(255, 255, 255)";
        ctx.strokeRect(startX, startY, width, height);
      }
    });
}