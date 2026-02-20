"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "@/lib/auth";

export default function SignOutPage() {
  const router = useRouter();

  useEffect(() => {
    signOut();
    router.replace("/signin");
  }, [router]);

  return <p className="p-6 text-sm text-slate-600">Signing you out...</p>;
}

