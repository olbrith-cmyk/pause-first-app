import { useState } from "react";
import type { Lang } from "../i18n";
import { useTranslation } from "../i18n";
import { cancelSignup, logIn, resetPassword, signUp } from "../auth";
import { checkActivationCode, redeemActivationCode } from "../firestore";
import horseSil from "../assets/silhouettes/horse-outline.png";
import dogSil from "../assets/silhouettes/dog-outline.png";
import catSil from "../assets/silhouettes/cat-outline.png";
import sheepSil from "../assets/silhouettes/sheep.png";
import birdSil from "../assets/silhouettes/bird-outline.png";
import turtleSil from "../assets/silhouettes/turtle.png";

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

  const [mode, setMode] = useState<"login" | "signup" | "reset">("login");
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
    <main className="card authScreen">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
        <h2 style={{ margin: 0 }}>{t.welcome}</h2>
        {onLangChange && (
          <button
            onClick={() => onLangChange(lang === "en" ? "da" : "en")}
            className="langBtn"
            aria-label="Toggle language"
          >
            {lang === "en" ? "🇩🇰 DA" : "🇬🇧 EN"}
          </button>
        )}
      </div>
      <p className="muted" style={{ margin: "0 0 2px 0", fontWeight: 700 }}>{t.accountInfo}</p>
      <p className="muted" style={{ margin: 0, fontStyle: "italic" }}>{t.accountInfoDetail}</p>

      {onStartDemo && mode !== "signup" && (
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

      {mode !== "signup" && (
        <div className="authDivider">{lang === "da" ? "Har du allerede adgang?" : "Already have access?"}</div>
      )}

      {mode === "signup" && (
        <div style={{ textAlign: "center", marginBottom: 8 }}>
          <button type="button" className="btn btnLink" onClick={() => setMode("login")}>
            {t.login}
          </button>
        </div>
      )}

      <div className={mode === "signup" ? "form formCompact" : "form"}>
        <label className="label">
          {t.email}
          <input
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            inputMode="email"
            autoComplete="email"
            placeholder={lang === "da" ? "navn@eksempel.dk" : "name@example.com"}
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
              placeholder={mode === "signup" ? t.createPassword : lang === "da" ? "Indtast adgangskode" : "Enter password"}
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
            <span className="muted" style={{ fontSize: 12, fontWeight: 400 }}>
              {lang === "da" ? "Fra din købsmail." : "From your purchase email."}
              {" "}
              {lang === "da"
                ? "Bruges én gang til at aktivere dit køb. Derefter logger du ind med e-mail + adgangskode."
                : "Used once to activate your purchase. After that, log in with email + password."}
            </span>
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

        {mode !== "signup" && (
          <div className="row rowWrap authLinksRow" style={{ justifyContent: "center" }}>
            {mode === "login" && (
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
        )}

        {mode === "login" && (
          <div style={{ textAlign: "center" }}>
            <button type="button" className="btn btnLink" onClick={() => setMode("signup")}>
              {lang === "da" ? "Opret bruger" : "Create account"}
            </button>
          </div>
        )}

        <div className="authAnimalRow" aria-hidden="true">
          <img src={horseSil} className="authAnimalImg authAnimalHorse" alt="" />
          <img src={dogSil} className="authAnimalImg authAnimalDog" alt="" />
          <img src={catSil} className="authAnimalImg authAnimalCat" alt="" />
          <img src={sheepSil} className="authAnimalImg authAnimalSheep" alt="" />
          <img src={birdSil} className="authAnimalImg authAnimalBird" alt="" />
          <img src={turtleSil} className="authAnimalImg authAnimalTurtle" alt="" />
        </div>

        <p className="muted" style={{ fontSize: 12, textAlign: "center", margin: "4px 0 0" }}>
          {lang === "da"
            ? "Pause First hjælper dig med at samle det, din dyrlæge har brug for at vide. Supplerer andre apps, du bruger til dine dyr – eller din notesbog. Stiller ikke diagnoser, behandler ikke og erstatter ikke professionel dyrlægefaglig rådgivning."
            : "Pause First helps you prepare for better conversations with your veterinarian. Fits alongside any clinic, any pet health app, any notebook. It does not diagnose, treat, or replace professional veterinary advice."}
        </p>
      </div>
    </main>
  );
}
