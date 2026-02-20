"use client";

export function AuthPage({isSignIn}: {isSignIn: boolean}) {
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-100 via-blue-50 to-orange-50 px-4 py-8">
      <div className="mx-auto max-w-md rounded-2xl border border-slate-200/80 bg-white/90 p-6 shadow-xl backdrop-blur">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          {isSignIn ? "Welcome back" : "Create your account"}
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          {isSignIn ? "Sign in to continue to your workspace." : "Sign up to start collaborating in rooms."}
        </p>

        <div className="mt-5 grid gap-3">
          <input
            type="text"
            placeholder="Email"
            className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />
          <input
            type="password"
            placeholder="Password"
            className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />
          <button
            onClick={() => {
            }}
            className="mt-1 h-11 w-full rounded-lg bg-blue-600 text-sm font-semibold text-white transition hover:bg-blue-700 active:scale-[0.99]"
          >
            {isSignIn ? "Sign In" : "Sign Up"}
          </button>
        </div>
      </div>
    </div>
  );
}
