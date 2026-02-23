"use client";
import {useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { WS_URL } from "@/config";
import { Canvas } from "./Canvas";

export function RoomCanvas({roomId}:{roomId: string}) {
    const router = useRouter();

  const [socket, setSocket] = useState<WebSocket | null>(null);

  useEffect(() => {
    const ws = new WebSocket(`${WS_URL}`);
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
    // Temporary bypass: skip signin check for canvas route.
    // const token = getToken();
    // if (!token) {
    //   router.replace("/signin?next=%2Fcanvas");
    // }
  }, [router]);

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
