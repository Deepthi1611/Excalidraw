"use client";

import { useEffect, useRef, useState } from "react";
import { initDraw, type DrawTool } from "@/draw";

type CanvasProps = {
  roomId: string;
  socket: WebSocket | null;
};

export function Canvas({roomId, socket}:CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // tool selection
  const [selectedTool, setSelectedTool] = useState<DrawTool>("pointer");
  const selectedToolRef = useRef<DrawTool>("pointer");
  // text settings
  const [textColor, setTextColor] = useState("#ffffff");
  const textColorRef = useRef<string>("#ffffff");
  const [textFontSize, setTextFontSize] = useState(16);
  const textFontSizeRef = useRef<number>(16);
  const [canvasSize, setCanvasSize] = useState({ width: 1200, height: 700 });
  // text editor state
  const [textEditor, setTextEditor] = useState({
    isOpen: false,
    x: 0,
    y: 0,
    color: "#ffffff",
    fontSize: 16,
    value: "",
  });
  // It is a ref that stores a function - stores resolve function from promise
  const textResolverRef = useRef<((value: string | null) => void) | null>(null);
  const [isCanvasBootstrapping, setIsCanvasBootstrapping] = useState(true);

  function handleToolChange(tool: DrawTool) {
    // Keep ref in sync immediately so canvas handlers read latest tool in the same tick.
    selectedToolRef.current = tool;
    setSelectedTool(tool);
  }

  function handleTextColorChange(color: string) {
    // Keep ref in sync immediately so text creation uses chosen color on first click.
    textColorRef.current = color;
    setTextColor(color);
    setTextEditor((prev) => (prev.isOpen ? { ...prev, color } : prev));
  }

  function handleTextFontSizeChange(size: number) {
    // Keep ref in sync immediately so text creation uses chosen size on first click.
    textFontSizeRef.current = size;
    setTextFontSize(size);
    setTextEditor((prev) => (prev.isOpen ? { ...prev, fontSize: size } : prev));
  }

  useEffect(() => {
    selectedToolRef.current = selectedTool;
  }, [selectedTool]);

  useEffect(() => {
    textColorRef.current = textColor;
  }, [textColor]);

  useEffect(() => {
    textFontSizeRef.current = textFontSize;
  }, [textFontSize]);

  // opens the text area and waits for user input and returns a promise
  function requestTextInput(x: number, y: number, color: string, fontSize: number): Promise<string | null> {
    return new Promise((resolve) => {
      textResolverRef.current = resolve;
      setTextEditor({
        isOpen: true,
        x,
        y,
        color,
        fontSize,
        value: "",
      });
    });
  }

  // close text editor and resolves the promise
  function closeTextEditor(result: string | null) {
    const resolver = textResolverRef.current;
    textResolverRef.current = null;
    setTextEditor((prev) => ({
      ...prev,
      isOpen: false,
      value: "",
    }));
    if (resolver) resolver(result);
  }

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
      selectedTool === "eraser" ? eraserCursor : selectedTool === "pointer" ? "default" : selectedTool === "text" ? "text" : "crosshair";
  }, [selectedTool]);

  useEffect(() => {
    if (!canvasRef.current || !socket) return;

    let disposed = false;
    let cleanup: (() => void) | void;
    setIsCanvasBootstrapping(true);

    void (async () => {
      cleanup = await initDraw(
        canvasRef.current as HTMLCanvasElement,
        roomId,
        socket,
        selectedToolRef,
        textColorRef,
        textFontSizeRef,
        requestTextInput,
      );
      // the same useEffect run that started initDraw is still the active one for this component.
      if (!disposed) {
        setIsCanvasBootstrapping(false);
      }
      // deps changed or component unmounted
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
      <div
        className={`absolute inset-0 z-10 bg-gradient-to-b from-slate-100 via-slate-50 to-slate-100 transition-opacity duration-300 ${isCanvasBootstrapping ? "animate-pulse opacity-100" : "pointer-events-none opacity-0"}`}
      />
      {textEditor.isOpen ? (
        <textarea
          autoFocus
          value={textEditor.value}
          onChange={(e) =>
            setTextEditor((prev) => ({
              ...prev,
              value: e.target.value,
            }))
          }
          onMouseDown={(e) => e.stopPropagation()}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.preventDefault();
              closeTextEditor(null);
              return;
            }
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              const finalText = textEditor.value.trim();
              closeTextEditor(finalText || null);
            }
          }}
          placeholder="Type text and press Enter"
          className="absolute z-20 min-h-[56px] min-w-[200px] resize rounded-md border border-slate-600 bg-slate-900/95 p-2 text-base text-white outline-none shadow-xl"
          style={{
            left: textEditor.x,
            top: textEditor.y,
            color: textEditor.color,
            fontSize: `${textEditor.fontSize}px`,
            lineHeight: 1.2,
          }}
        />
      ) : null}
      <div className="absolute left-1/2 top-4 z-10 flex -translate-x-1/2 items-center gap-2 rounded-2xl border border-slate-700 bg-slate-900/95 p-2 shadow-lg">
        <button
          className={`rounded-lg px-3 py-1.5 text-sm ${selectedTool === "pointer" ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-100 hover:bg-slate-700"}`}
          onClick={() => handleToolChange("pointer")}
          type="button"
        >
          Pointer
        </button>
        <button
          className={`rounded-lg px-3 py-1.5 text-sm ${selectedTool === "eraser" ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-100 hover:bg-slate-700"}`}
          onClick={() => handleToolChange("eraser")}
          type="button"
        >
          Eraser
        </button>
        <button
          className={`rounded-lg px-3 py-1.5 text-sm ${selectedTool === "rectangle" ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-100 hover:bg-slate-700"}`}
          onClick={() => handleToolChange("rectangle")}
          type="button"
        >
          Rectangle
        </button>
        <button
          className={`rounded-lg px-3 py-1.5 text-sm ${selectedTool === "circle" ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-100 hover:bg-slate-700"}`}
          onClick={() => handleToolChange("circle")}
          type="button"
        >
          Circle
        </button>
        <button
          className={`rounded-lg px-3 py-1.5 text-sm ${selectedTool === "line" ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-100 hover:bg-slate-700"}`}
          onClick={() => handleToolChange("line")}
          type="button"
        >
          Line
        </button>
        <button
          className={`rounded-lg px-3 py-1.5 text-sm ${selectedTool === "text" ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-100 hover:bg-slate-700"}`}
          onClick={() => handleToolChange("text")}
          type="button"
        >
          Text
        </button>
        <label className="flex items-center gap-2 rounded-lg bg-slate-800 px-2 py-1.5 text-xs text-slate-200">
          Color
          <input
            type="color"
            value={textColor}
            onChange={(e) => handleTextColorChange(e.target.value)}
            className="h-5 w-6 cursor-pointer rounded border border-slate-600 bg-transparent p-0"
          />
        </label>
        <label className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs ${selectedTool === "text" ? "bg-slate-800 text-slate-200" : "bg-slate-800/60 text-slate-400"}`}>
          Text Size
          <select
            value={textFontSize}
            onChange={(e) => handleTextFontSizeChange(Number(e.target.value))}
            disabled={selectedTool !== "text"}
            className="rounded border border-slate-600 bg-slate-900 px-1 py-0.5 text-xs text-slate-100 outline-none disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value={12}>12</option>
            <option value={14}>14</option>
            <option value={16}>16</option>
            <option value={18}>18</option>
            <option value={20}>20</option>
            <option value={24}>24</option>
            <option value={28}>28</option>
            <option value={32}>32</option>
          </select>
        </label>
      </div>
    </div>
  );
}
