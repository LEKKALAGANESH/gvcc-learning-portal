"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

type Mode = "login" | "signup";

const copy = {
  login: { title: "Welcome back", sub: "Sign in to continue learning.", cta: "Sign in",
    endpoint: "/api/auth/login", altText: "New here?", altLink: "/signup", altCta: "Create an account" },
  signup: { title: "Create your account", sub: "Start bookmarking and tracking your progress.", cta: "Sign up",
    endpoint: "/api/auth/signup", altText: "Already have an account?", altLink: "/login", altCta: "Sign in" },
} as const;

export default function AuthForm({ mode }: { mode: Mode }) {
  const c = copy[mode];
  const router = useRouter();
  const nextUrl = useSearchParams().get("next") || "/library";
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    const form = new FormData(e.currentTarget);
    const body: Record<string, unknown> = {
      email: form.get("email"),
      password: form.get("password"),
    };
    if (mode === "signup") body.name = form.get("name");

    const res = await fetch(c.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      router.replace(nextUrl);
      router.refresh();
      return;
    }
    const data = await res.json().catch(() => ({}));
    setErrors(data.errors ?? { form: "Something went wrong. Try again." });
    setBusy(false);
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="brand" style={{ marginBottom: 16 }}>
          <span className="brand-mark" aria-hidden>▶</span>
          <span>GVCC&nbsp;Learn</span>
        </div>
        <h1>{c.title}</h1>
        <p className="auth-sub">{c.sub}</p>

        <form className="stack" style={{ gap: 14 }} onSubmit={onSubmit} noValidate>
          {mode === "signup" && (
            <div className="field">
              <label className="label" htmlFor="name">Name</label>
              <input id="name" name="name" className={`input ${errors.name ? "error" : ""}`}
                autoComplete="name" placeholder="Ada Lovelace" required />
              <span className="err">{errors.name}</span>
            </div>
          )}
          <div className="field">
            <label className="label" htmlFor="email">Email</label>
            <input id="email" name="email" type="email" className={`input ${errors.email ? "error" : ""}`}
              autoComplete="email" placeholder="you@example.com" required />
            <span className="err">{errors.email}</span>
          </div>
          <div className="field">
            <label className="label" htmlFor="password">Password</label>
            <input id="password" name="password" type="password"
              className={`input ${errors.password ? "error" : ""}`}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              placeholder="••••••••" required />
            <span className="err">{errors.password}</span>
          </div>

          {errors.form && <div className="err" role="alert" style={{ fontSize: 14 }}>{errors.form}</div>}

          <button className="btn" type="submit" disabled={busy} style={{ marginTop: 4 }}>
            {busy ? "Please wait…" : c.cta}
          </button>
        </form>

        <p className="auth-alt">
          {c.altText} <Link href={c.altLink}>{c.altCta}</Link>
        </p>
        {mode === "login" && (
          <p className="demo-hint">Demo login — demo@gvcc.dev / password123</p>
        )}
      </div>
    </div>
  );
}
