"use client";

import { useEffect, useRef } from "react";
import { initDraw } from "@/draw";

type CanvasProps = {
  roomId: string;
  socket: WebSocket | null;
};

export function Canvas({roomId, socket}:CanvasProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // disposed = false when effect starts.
    // Cleanup function sets disposed = true on unmount/dependency change.
    // When async initDraw resolves:
    // if disposed is already true, it immediately calls returned cleanup.

  useEffect(() => {
    if (!canvasRef.current || !socket) return;

    let disposed = false;
    let cleanup: (() => void) | void;

    void (async () => {
      cleanup = await initDraw(canvasRef.current as HTMLCanvasElement, roomId, socket);
      if (disposed && cleanup) cleanup();
    })();

    return () => {
      disposed = true;
      if (cleanup) cleanup();
    };
  }, [roomId, socket]);

    return (
        <div>
           <canvas ref={canvasRef} width={2000} height={1000} />
        </div>
    );
}
