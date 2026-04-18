import { useState } from "react";
import type { Lang } from "../i18n";
import { useTranslation } from "../i18n";
import { logIn, resetPassword, signUp } from "../auth";

export default function AuthScreen({ lang }: { lang: Lang }) {
  const t = useTranslation(lang);

  const [mode, setMode] = useState<"login" | "signup" | "reset">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    setError(null);
    setStatus(null);

    try {
      if (mode === "signup") {
        await signUp(email.trim(), password);
        setStatus(t.saved);
      } else if (mode === "login") {
        await logIn(email.trim(), password);
        setStatus(t.saved);
      } else {
        await resetPassword(email.trim());
        setStatus(t.saved);
      }
    } catch (e: any) {
      setError(e?.message ?? String(e));
    }
  };

  return (
    <main className="card">
      <h2>{t.welcome}</h2>
      <p className="muted">{t.accountInfo}</p>

      <div className="form">
        <label className="label">
          {t.email}
          <input
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            inputMode="email"
            autoComplete="email"
            placeholder="name@example.com"
          />
        </label>

        {mode !== "reset" && (
          <label className="label">
            {t.password}
            <input
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              placeholder={t.createPassword}
            />
          </label>
        )}

        {error && <div className="alert alertError">{t.error}: {error}</div>}
        {status && <div className="alert alertOk">{status}</div>}

        <div className="row">
          {mode === "signup" && (
            <button className="btn btnPrimary" onClick={run}>
              {t.signUp}
            </button>
          )}
          {mode === "login" && (
            <button className="btn btnPrimary" onClick={run}>
              {t.login}
            </button>
          )}
          {mode === "reset" && (
            <button className="btn btnPrimary" onClick={run}>
              {t.sendReset}
            </button>
          )}
        </div>

        <div className="row rowWrap">
          {mode !== "login" && (
            <button className="btn btnLink" onClick={() => setMode("login")}>
              {t.login}
            </button>
          )}
          {mode !== "signup" && (
            <button className="btn btnLink" onClick={() => setMode("signup")}>
              {t.signUp}
            </button>
          )}
          {mode !== "reset" && (
            <button className="btn btnLink" onClick={() => setMode("reset")}>
              {t.forgotPassword}
            </button>
          )}
          {mode === "reset" && (
            <button className="btn btnLink" onClick={() => setMode("login")}>
              {t.backToLogin}
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
