import { useState } from "react";
import type { Lang } from "../i18n";
import { useTranslation } from "../i18n";
import { cancelSignup, logIn, resetPassword, signUp } from "../auth";
import { checkActivationCode, redeemActivationCode } from "../firestore";
import horseSil from "../assets/silhouettes/horse.png";

export default function AuthScreen({
  lang,
  onLangChange,
  onStartDemo
}: {
  lang: Lang;
  onLangChange?: (next: Lang) => void;
  onStartDemo?: () => Promise<void>;
}) {
  const t = useTranslation(lang);

  const [mode, setMode] = useState<"login" | "signup" | "reset">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [activationCode, setActivationCode] = useState("");

  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [demoLoading, setDemoLoading] = useState(false);

  const invalidCodeMessage = (reason?: "not_found" | "used") =>
    reason === "used"
      ? lang === "da"
        ? "Denne aktiveringskode er allerede brugt."
        : "This activation code has already been used."
      : lang === "da"
        ? "Ugyldig aktiveringskode."
        : "Invalid activation code.";

  const run = async () => {
    setError(null);
    setStatus(null);

    try {
      if (mode === "signup") {
        const code = activationCode.trim();
        if (!code) {
          setError(lang === "da" ? "Indtast venligst din aktiveringskode." : "Please enter your activation code.");
          return;
        }

        const check = await checkActivationCode(code);
        if (!check.valid) {
          setError(invalidCodeMessage(check.reason));
          return;
        }

        const cred = await signUp(email.trim(), password);

        const redeemed = await redeemActivationCode(code, cred.user.uid);
        if (!redeemed.ok) {
          await cancelSignup(cred.user);
          setError(invalidCodeMessage(redeemed.reason));
          return;
        }

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

  const handleStartDemo = async () => {
    if (!onStartDemo) return;
    setError(null);
    setDemoLoading(true);
    try {
      await onStartDemo();
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <main className="card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
        <h2 style={{ margin: 0 }}>{t.welcome}</h2>
        {onLangChange && (
          <button
            onClick={() => onLangChange(lang === "en" ? "da" : "en")}
            className="langBtn"
            aria-label="Toggle language"
          >
            {lang === "en" ? "DA" : "EN"}
          </button>
        )}
      </div>
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

        {mode === "signup" && (
          <label className="label">
            {t.activationCode}
            <input
              className="input"
              value={activationCode}
              onChange={(e) => setActivationCode(e.target.value)}
              autoComplete="off"
              placeholder={t.activationCodePlaceholder}
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

        {onStartDemo && (
          <div style={{ marginTop: 6, textAlign: "center" as const }}>
            <div className="muted" style={{ fontSize: 13, marginBottom: 8 }}>
              {lang === "da" ? "Vil du se, hvordan appen fungerer, før du opretter en konto?" : "Want to see how the app works before creating an account?"}
            </div>
            <button className="btn btnSecondary" onClick={handleStartDemo} disabled={demoLoading} style={{ width: "100%" }}>
              {demoLoading
                ? lang === "da"
                  ? "Klargør demo…"
                  : "Setting up demo…"
                : lang === "da"
                  ? "Prøv en demo (ingen konto nødvendig)"
                  : "Try a demo (no account needed)"}
            </button>
          </div>
        )}

        <img src={horseSil} className="authHorseSilhouette" alt="" aria-hidden="true" />
      </div>
    </main>
  );
}
