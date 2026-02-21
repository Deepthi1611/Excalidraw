"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { initDraw } from "@/draw";

export default function CanvasPage() {
  const router = useRouter();

  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // Temporary bypass: skip signin check for canvas route.
    // const token = getToken();
    // if (!token) {
    //   router.replace("/signin?next=%2Fcanvas");
    // }
  }, [router]);

  useEffect(() => {
    if(canvasRef.current) {
      initDraw(canvasRef.current);
    }
  }, []);



  return (
    <div>
      <canvas ref={canvasRef} width={2000} height={1000}></canvas>
    </div>
  );
}
