"use client";
import {useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { WS_URL } from "@/config";
import { Canvas } from "./Canvas";
import { getToken } from "@/lib/auth";

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

  return (
    <div>
      {!socket && <div>Connecting to web socket...</div>}
      <Canvas roomId={roomId} socket={socket} />
    </div>
  );
}
