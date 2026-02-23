"use client";
import {useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { initDraw } from "@/draw";

export function Canvas({roomId}:{roomId: string}) {
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
    if(!canvasRef.current) return;
    initDraw(canvasRef.current, roomId);
  }, [canvasRef, roomId]);

  return (
    <div>
      <canvas ref={canvasRef} width={2000} height={1000}></canvas>
      {/* <div className="absolute bottom-0 right-0">
        <button className="bg-white text-black p-2 m-2">Rectangle</button>
        <button className="bg-white text-black p-2 m-2">Circle</button>
      </div> */}
    </div>
  );
}