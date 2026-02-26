"use client";
import {useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { WS_URL } from "@/config";
import { Canvas } from "./Canvas";
import { getToken } from "@/lib/auth";

function CanvasLoadingSkeleton() {
  return (
    <div className="fixed inset-0 overflow-hidden bg-[#f6f6f7]">
      <div className="absolute left-1/2 top-4 z-10 flex -translate-x-1/2 items-center gap-2 rounded-2xl border border-slate-300 bg-white/90 p-2 shadow-sm">
        <div className="h-8 w-20 animate-pulse rounded-md bg-slate-200" />
        <div className="h-8 w-20 animate-pulse rounded-md bg-slate-200" />
        <div className="h-8 w-20 animate-pulse rounded-md bg-slate-200" />
        <div className="h-8 w-20 animate-pulse rounded-md bg-slate-200" />
      </div>
      <div className="absolute inset-0 animate-pulse bg-gradient-to-b from-slate-100 via-slate-50 to-slate-100" />
    </div>
  );
}

export function RoomCanvas({roomId}:{roomId: string}) {
    const router = useRouter();

  const [socket, setSocket] = useState<WebSocket | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      return;
    }

    const ws = new WebSocket(`${WS_URL}?token=${encodeURIComponent(token)}`);
    ws.onopen = () => {
      console.log("WebSocket connection established");
      setSocket(ws);
      ws.send(JSON.stringify({ type: "join_room", roomId }));
    };

    return () => {
      ws.close();
      setSocket(null);
    };
  }, [roomId]);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace(`/signin?next=${encodeURIComponent(`/canvas/${roomId}`)}`);
    }
  }, [roomId, router]);

  // if(!socket) {
  //   return <div>Connecting to web socket...</div>;
  // }

  if (!socket) {
    return <CanvasLoadingSkeleton />;
  }

  return <Canvas roomId={roomId} socket={socket} />;
}
