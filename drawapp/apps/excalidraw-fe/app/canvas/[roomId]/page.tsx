"use client";

import { RoomCanvas } from "@/components/RoomCanvas";
import { use } from "react";
export default function CanvasPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = use(params);
  // console.log("roomId:", roomId);

  return <RoomCanvas roomId={roomId} />;
}
