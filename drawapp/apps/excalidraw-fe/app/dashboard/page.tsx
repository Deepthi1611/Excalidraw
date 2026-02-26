"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { HTTP_BACKEND } from "@/config";
import { getToken } from "@/lib/auth";

type Room = {
  id: number;
  slug: string;
  createdAt: string;
};

async function getRooms(token: string): Promise<Room[] | null> {
  try {
    const response = await fetch(`${HTTP_BACKEND}/rooms`, {
      cache: "no-store",
      headers: {
        authorization: token,
      },
    });
    if (response.status === 401) return null;
    if (!response.ok) return [];
    return (await response.json()) as Room[];
  } catch {
    return [];
  }
}

export default function DashboardPage() {
  const router = useRouter();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace("/signin?next=%2Fdashboard");
      return;
    }

    void (async () => {
      const data = await getRooms(token);
      // token is invalid/expired
      if (data === null) {
        router.replace("/signin?next=%2Fdashboard");
        return;
      }
      setRooms(data);
      setLoading(false);
    })();
  }, [router]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f6f6f7] px-6 py-10">
        <div className="mx-auto w-full max-w-5xl rounded-xl border border-slate-200 bg-white p-6 text-slate-700">
          Loading rooms...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f6f6f7] px-6 py-10">
      <div className="mx-auto w-full max-w-5xl">
        <h1 className="mb-2 text-3xl font-extrabold text-slate-900">Rooms Dashboard</h1>
        <p className="mb-8 text-slate-600">Choose a room and join to start drawing on that room canvas.</p>

        {rooms.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-slate-700">
            No rooms found. Create one from your backend API, then refresh.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {rooms.map((room) => (
              <div key={room.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-3">
                  <h2 className="text-xl font-bold text-slate-900">{room.slug}</h2>
                  <p className="text-sm text-slate-500">Room ID: {room.id}</p>
                </div>
                <Link
                  href={`/canvas/${room.id}`}
                  className="inline-flex rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  Join Room
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
