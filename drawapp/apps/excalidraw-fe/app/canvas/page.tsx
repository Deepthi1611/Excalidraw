"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getToken } from "@/lib/auth";

export default function CanvasPage() {
  const router = useRouter();

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace("/signin?next=%2Fcanvas");
    }
  }, [router]);

  return (
    <main className="min-h-screen bg-background px-6 py-12">
      <div className="mx-auto max-w-4xl rounded-2xl border border-border bg-card p-8 shadow-sm">
        <h1 className="text-3xl font-bold mb-3">Canvas</h1>
        <p className="text-muted-foreground mb-6">
          You are signed in. Hook your drawing surface here.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/"
            className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Back to Home
          </Link>
          <Link
            href="/signout"
            className="inline-flex h-10 items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-100"
          >
            Sign Out
          </Link>
        </div>
      </div>
    </main>
  );
}
