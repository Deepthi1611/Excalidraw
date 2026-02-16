"use client";

import { useEffect, useState } from "react";
import { useSocket } from "../hooks/useSocket";
import styles from "./ChatRoomClient.module.css";

export function ChatRoomClient({
  messages,
  roomId,
}: {
  messages: { message: string }[];
  roomId: string;
}) {
  const [chats, setChats] = useState(messages);
  const [currentMessage, setCurrentMessage] = useState("");
  const { socket, loading } = useSocket();

  useEffect(() => {
    if (socket && !loading && socket.readyState === WebSocket.OPEN) {
      socket.send(
        JSON.stringify({
          type: "join_room",
          roomId,
        }),
      );

      socket.onmessage = (event) => {
        const parsedData = JSON.parse(event.data);
        if (parsedData.type === "chat") {
          setChats((c) => [...c, { message: parsedData.message }]);
        }
      };
    }
  }, [socket, loading, roomId]);

  return (
    <div className={styles.page}>
      <div className={styles.chatShell}>
        <div className={styles.header}>
          <h1 className={styles.title}>Room Chat</h1>
          <span className={styles.roomId}>#{roomId}</span>
        </div>

        <div className={styles.messages}>
          {chats.length === 0 ? (
            <p className={styles.empty}>No messages yet</p>
          ) : (
            chats.map((m, idx) => (
              <div className={styles.messageRow} key={`${m.message}-${idx}`}>
                <div className={styles.bubble}>{m.message}</div>
              </div>
            ))
          )}
        </div>

        <div className={styles.composer}>
          <input
            className={styles.input}
            type="text"
            value={currentMessage}
            placeholder="Type a message..."
            onChange={(e) => {
              setCurrentMessage(e.target.value);
            }}
          />
          <button
            className={styles.button}
            onClick={() => {
              if (!socket || socket.readyState !== WebSocket.OPEN) {
                return;
              }

              socket.send(
                JSON.stringify({
                  type: "chat",
                  roomId,
                  message: currentMessage,
                }),
              );

              setCurrentMessage("");
            }}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
