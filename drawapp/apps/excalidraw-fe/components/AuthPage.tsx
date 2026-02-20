"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Input } from "@/components/ui/input";
import { signIn, signUp } from "@/lib/auth";

export function AuthPage({isSignIn}: {isSignIn: boolean}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const redirectTo = searchParams.get("next") || "/";
  const switchAuthHref = isSignIn
    ? `/signup?next=${encodeURIComponent(redirectTo)}`
    : `/signin?next=${encodeURIComponent(redirectTo)}`;

  const isDisabled = useMemo(() => {
    if (isSignIn) return !email || !password || isSubmitting;
    return !name || !email || !password || isSubmitting;
  }, [email, isSignIn, isSubmitting, name, password]);

  const submitLabel = isSubmitting
    ? isSignIn
      ? "Signing in..."
      : "Signing up..."
    : isSignIn
      ? "Sign In"
      : "Sign Up";

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (isSignIn) {
        await signIn({ email, password });
      } else {
        await signUp({ name, email, password });
        await signIn({ email, password });
      }
      router.push(redirectTo);
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Authentication failed";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-100 via-blue-50 to-orange-50 px-4 py-8">
      <Container size="sm" className="rounded-2xl border border-slate-200/80 bg-white/90 p-6 shadow-xl backdrop-blur">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          {isSignIn ? "Welcome back" : "Create your account"}
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          {isSignIn ? "Sign in to continue to your workspace." : "Sign up to start collaborating in rooms."}
        </p>

        <form className="mt-5 grid gap-3" onSubmit={handleSubmit}>
          {!isSignIn ? (
            <Input
              type="text"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          ) : null}
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <Button
            type="submit"
            disabled={isDisabled}
            className="mt-1 h-11 w-full rounded-lg text-sm font-semibold active:scale-[0.99]"
          >
            {submitLabel}
          </Button>
          <p className="text-center text-sm text-slate-600">
            {isSignIn ? "New here?" : "Already have an account?"}{" "}
            <Link
              href={switchAuthHref}
              className="font-semibold text-primary hover:underline"
            >
              {isSignIn ? "Create account" : "Sign in"}
            </Link>
          </p>
        </form>
      </Container>
    </div>
  );
}
