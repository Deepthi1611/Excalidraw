import { useEffect, useState } from "react";
import { ws_url } from "../app/config";

export function useSocket() {
    const [loading, setLoading] = useState(true);
    const [socket, setSocket] = useState<WebSocket | null>(null);

    useEffect(() => {
        const ws = new WebSocket(ws_url);
        ws.onopen = () => {
            setLoading(false);
            setSocket(ws);
        };
        ws.onclose = () => {
            setSocket(null);
        };
        ws.onerror = (error) => {
            console.error("WebSocket error:", error);
            setLoading(false);
        };
        return () => {
            ws.close();
        };
    }, []);

    return { socket, loading };
}
