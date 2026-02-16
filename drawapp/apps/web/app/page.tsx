"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";

export default function Home() {
  const [roomId, setRoomId] = useState<string>("");
  const router = useRouter();
  const normalizedRoomId = roomId.trim();
  const canJoin = normalizedRoomId.length > 0;

  const handleJoinRoom = () => {
    if (!canJoin) return;
    router.push(`/room/${normalizedRoomId}`);
  };

  return (
    <div className={styles.page}>
      <div className={styles.inputRow}>
        <input
          id="room-id"
          className={styles.input}
          type="text"
          placeholder="Enter Room ID"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleJoinRoom();
          }}
        />
        <button
          className={styles.button}
          type="button"
          onClick={handleJoinRoom}
          disabled={!canJoin}
        >
          Join Room
        </button>
      </div>
    </div>
  );
}
