"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export default function CanvasPage() {
  const router = useRouter();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);


  useEffect(() => {
    // Temporary bypass: skip signin check for canvas route.
    // const token = getToken();
    // if (!token) {
    //   router.replace("/signin?next=%2Fcanvas");
    // }
  }, [router]);

  useEffect(() => {
    const canvas: HTMLCanvasElement | null = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;
    const ctx: CanvasRenderingContext2D = context;

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
        ctx.strokeRect(startX, startY, width, height);
      }
    });
  }, []);



  return (
    <div>
      <canvas ref={canvasRef} width={500} height={500}></canvas>
    </div>
  );
}
