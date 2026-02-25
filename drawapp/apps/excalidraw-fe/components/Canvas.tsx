"use client";

import { useEffect, useRef, useState } from "react";
import { initDraw, type DrawTool } from "@/draw";

type CanvasProps = {
  roomId: string;
  socket: WebSocket | null;
};

export function Canvas({roomId, socket}:CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedTool, setSelectedTool] = useState<DrawTool>("rectangle");
  const [canvasSize, setCanvasSize] = useState({ width: 1200, height: 700 });

  useEffect(() => {
    function updateCanvasSize() {
      setCanvasSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }

    updateCanvasSize();
    window.addEventListener("resize", updateCanvasSize);
    return () => window.removeEventListener("resize", updateCanvasSize);
  }, []);

    // disposed = false when effect starts.
    // Cleanup function sets disposed = true on unmount/dependency change.
    // When async initDraw resolves:
    // if disposed is already true, it immediately calls returned cleanup.

  useEffect(() => {
    if (!canvasRef.current || !socket) return;

    let disposed = false;
    let cleanup: (() => void) | void;

    void (async () => {
      cleanup = await initDraw(canvasRef.current as HTMLCanvasElement, roomId, socket, selectedTool);
      if (disposed && cleanup) cleanup();
    })();

    return () => {
      disposed = true;
      if (cleanup) cleanup();
    };
  }, [roomId, socket, selectedTool, canvasSize.width, canvasSize.height]);

  return (
    <div className="fixed inset-0 overflow-hidden bg-[#f6f6f7]">
      <canvas
        ref={canvasRef}
        width={canvasSize.width}
        height={canvasSize.height}
        className="block h-screen w-screen"
      />
      <div className="absolute left-1/2 top-4 z-10 flex -translate-x-1/2 items-center gap-2 rounded-2xl border border-slate-700 bg-slate-900/95 p-2 shadow-lg">
        <button
          className={`rounded-lg px-3 py-1.5 text-sm ${selectedTool === "rectangle" ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-100 hover:bg-slate-700"}`}
          onClick={() => setSelectedTool("rectangle")}
          type="button"
        >
          Rectangle
        </button>
        <button
          className={`rounded-lg px-3 py-1.5 text-sm ${selectedTool === "circle" ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-100 hover:bg-slate-700"}`}
          onClick={() => setSelectedTool("circle")}
          type="button"
        >
          Circle
        </button>
        <button
          className={`rounded-lg px-3 py-1.5 text-sm ${selectedTool === "line" ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-100 hover:bg-slate-700"}`}
          onClick={() => setSelectedTool("line")}
          type="button"
        >
          Line
        </button>
      </div>
    </div>
  );
}
