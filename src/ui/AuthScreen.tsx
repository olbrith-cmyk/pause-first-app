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
  const [showActivationCode, setShowActivationCode] = useState(false);

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
          setShowActivationCode(true);
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
    <main className="card authScreen">
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
      <p className="muted" style={{ margin: "0 0 2px 0" }}>{t.accountInfo}</p>
      <p className="muted" style={{ margin: 0 }}>{t.accountInfoDetail}</p>

      {onStartDemo && (
        <div className="demoCallout">
          <strong>{lang === "da" ? "Ny her?" : "New here?"}</strong>
          <div className="muted" style={{ fontSize: 13 }}>
            {lang === "da"
              ? "Udforsk appen først. Ingen konto nødvendig."
              : "Explore the app first. No account required."}
          </div>
          <button className="btn btnPrimary" onClick={handleStartDemo} disabled={demoLoading}>
            {demoLoading
              ? lang === "da"
                ? "Klargør demo…"
                : "Setting up demo…"
              : lang === "da"
                ? "Prøv demoen"
                : "Try the demo"}
          </button>
        </div>
      )}

      <div className="authDivider">{lang === "da" ? "Har du allerede købt adgang?" : "Already purchased access?"}</div>

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

        {mode === "signup" &&
          (showActivationCode ? (
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
          ) : (
            <button
              type="button"
              className="btn btnLink"
              onClick={() => setShowActivationCode(true)}
              style={{ alignSelf: "flex-start" }}
            >
              {lang === "da" ? "Har du en aktiveringskode?" : "Have an activation code?"}
            </button>
          ))}

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

        <img src={horseSil} className="authHorseSilhouette" alt="" aria-hidden="true" />
      </div>
    </main>
  );
}
