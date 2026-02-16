"use client";

import axios from "axios";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { backend_url } from "../config";
import styles from "../auth.module.css";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await axios.post(`${backend_url}/signup`, { name, email, password });
      router.push("/signin");
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.error ?? "Signup failed");
      } else {
        setError("Signup failed");
      }
    }
  };

  return (
    <main className={styles.page}>
      <section className={styles.card}>
      <h1 className={styles.title}>Sign up</h1>
      <p className={styles.subtitle}>Create your account to start chatting.</p>
      <form className={styles.form} onSubmit={onSubmit}>
        <input
          className={styles.input}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name"
        />
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
        <button className={styles.button} type="submit">Create account</button>
      </form>
      {error ? <p className={styles.error}>{error}</p> : null}
      <p className={styles.footer}>
        Already have an account? <Link className={styles.footerLink} href="/signin">Sign in</Link>
      </p>
      </section>
    </main>
  );
}
