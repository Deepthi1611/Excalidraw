"use client";

import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Input } from "@/components/ui/input";

export function AuthPage({isSignIn}: {isSignIn: boolean}) {
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-100 via-blue-50 to-orange-50 px-4 py-8">
      <Container size="sm" className="rounded-2xl border border-slate-200/80 bg-white/90 p-6 shadow-xl backdrop-blur">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          {isSignIn ? "Welcome back" : "Create your account"}
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          {isSignIn ? "Sign in to continue to your workspace." : "Sign up to start collaborating in rooms."}
        </p>

        <div className="mt-5 grid gap-3">
          <Input
            type="text"
            placeholder="Email"
          />
          <Input
            type="password"
            placeholder="Password"
          />
          <Button
            onClick={() => {
            }}
            className="mt-1 h-11 w-full rounded-lg text-sm font-semibold active:scale-[0.99]"
          >
            {isSignIn ? "Sign In" : "Sign Up"}
          </Button>
        </div>
      </Container>
    </div>
  );
}
