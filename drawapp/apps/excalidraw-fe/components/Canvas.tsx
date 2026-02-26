"use client";

import { useEffect, useRef, useState } from "react";
import { initDraw, type DrawTool } from "@/draw";

type CanvasProps = {
  roomId: string;
  socket: WebSocket | null;
};

export function Canvas({roomId, socket}:CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedTool, setSelectedTool] = useState<DrawTool>("pointer");
  const selectedToolRef = useRef<DrawTool>("pointer");
  const [canvasSize, setCanvasSize] = useState({ width: 1200, height: 700 });

  useEffect(() => {
    selectedToolRef.current = selectedTool;
  }, [selectedTool]);

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
    if (!canvasRef.current) return;
    const eraserCursor =
      'url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2724%27 height=%2724%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27%23ffffff%27 stroke-width=%272%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3E%3Cpath d=%27M20 20H7L3 16a2.8 2.8 0 0 1 0-4L13 2a2.8 2.8 0 0 1 4 0l4 4a2.8 2.8 0 0 1 0 4L11 20%27/%3E%3Cpath d=%27m14 7 3 3%27/%3E%3C/svg%3E") 3 20, auto';
    canvasRef.current.style.cursor =
      selectedTool === "eraser" ? eraserCursor : selectedTool === "pointer" ? "default" : "crosshair";
  }, [selectedTool]);

  useEffect(() => {
    if (!canvasRef.current || !socket) return;

    let disposed = false;
    let cleanup: (() => void) | void;

    void (async () => {
      cleanup = await initDraw(canvasRef.current as HTMLCanvasElement, roomId, socket, selectedToolRef);
      if (disposed && cleanup) cleanup();
    })();

    return () => {
      disposed = true;
      if (cleanup) cleanup();
    };
  }, [roomId, socket, canvasSize.width, canvasSize.height]);

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
          className={`rounded-lg px-3 py-1.5 text-sm ${selectedTool === "pointer" ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-100 hover:bg-slate-700"}`}
          onClick={() => setSelectedTool("pointer")}
          type="button"
        >
          Pointer
        </button>
        <button
          className={`rounded-lg px-3 py-1.5 text-sm ${selectedTool === "eraser" ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-100 hover:bg-slate-700"}`}
          onClick={() => setSelectedTool("eraser")}
          type="button"
        >
          Eraser
        </button>
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
