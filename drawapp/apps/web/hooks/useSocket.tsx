import { useEffect, useState } from "react";
import { ws_url } from "../app/config";

export function useSocket(token: string | null) {
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState<WebSocket | null>(null);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setSocket(null);
      return;
    }

    const ws = new WebSocket(`${ws_url}?token=${encodeURIComponent(token)}`);

    ws.onopen = () => {
      setLoading(false);
      setSocket(ws);
    };
    ws.onclose = () => setSocket(null);
    ws.onerror = () => setLoading(false);

    return () => ws.close();
  }, [token]);

  return { socket, loading };
}
