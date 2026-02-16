"use client";

import axios from "axios";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { backend_url } from "../config";
import { setToken } from "../auth";
import styles from "../auth.module.css";

export default function SigninPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const response = await axios.post(`${backend_url}/signin`, { email, password });
      const token = response.data?.token as string | undefined;
      if (!token) {
        setError("No token returned from server");
        return;
      }
      setToken(token, "local");
      router.push("/");
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.error ?? "Signin failed");
      } else {
        setError("Signin failed");
      }
    }
  };

  return (
    <main className={styles.page}>
      <section className={styles.card}>
      <h1 className={styles.title}>Sign in</h1>
      <p className={styles.subtitle}>Continue to your room chat.</p>
      <form className={styles.form} onSubmit={onSubmit}>
        <input
          className={styles.input}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          type="email"
        />
        <input
          className={styles.input}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          type="password"
        />
        <button className={styles.button} type="submit">Sign in</button>
      </form>
      {error ? <p className={styles.error}>{error}</p> : null}
      <p className={styles.footer}>
        New user? <Link className={styles.footerLink} href="/signup">Create an account</Link>
      </p>
      </section>
    </main>
  );
}
