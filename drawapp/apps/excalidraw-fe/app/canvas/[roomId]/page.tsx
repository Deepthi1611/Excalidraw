"use client";

import { Canvas } from "@/components/Canvas";
import { use } from "react";
export default function CanvasPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = use(params);
  console.log("roomId:", roomId);
  return <Canvas roomId={roomId} />;
}
