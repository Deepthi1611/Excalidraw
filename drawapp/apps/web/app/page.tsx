"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
      <div className={styles.card}>
        <h1 className={styles.title}>Join a Room</h1>
        <p className={styles.subtitle}>Enter your room slug to continue chatting.</p>

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

        <div className={styles.authLinks}>
          <Link className={styles.link} href="/signin">
            Sign in
          </Link>
          <Link className={styles.linkSecondary} href="/signup">
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
}
