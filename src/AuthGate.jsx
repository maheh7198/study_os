import { cloneElement, useEffect, useRef, useState } from "react";
import { ArrowRight, Eye, EyeOff, LockKeyhole, LoaderCircle, Mail, Moon, Quote, Sun, UserRound } from "lucide-react";
import studyOSLogo from "./assets/logo.png";
import { apiRequest } from "./services/api.js";
import "./Login.css";
import ErrorBanner from "./components/ErrorBanner.jsx";

const ACCOUNT_KEY = "studyos-active-account";
const LOGOUT_EVENT_KEY = "studyos-session-logout";
const ACCOUNT_DATA_KEYS = ["studyos-tasks", "studyos-subjects", "studyos-goals", "studyos-habits", "studyos-notes", "studyos-notifications", "studyos-placement-hub", "studyos-pomodoro-sessions", "studyos-pomodoro-active-timer", "studyos-study-plans", "studyos-studyplan-sessions", "studyos-study-timetable", "studyos-ai-history", "studyos-task-reminders-sent", "studyos-notifications-version", "studyos-settings", "studyos-feedback", "studyos-theme"];
const QUOTES = ["Small, steady steps create lasting change.", "Focus on the next useful thing.", "A little progress is still progress.", "Make space for what matters today.", "Consistency grows one day at a time."];

function cacheKey(userId, key) { return `studyos-account:${userId}:${key}`; }
function broadcastLogout() { try { localStorage.setItem(LOGOUT_EVENT_KEY, String(Date.now())); } catch { /* Storage may be disabled. */ } }

function prepareAccountStorage(userId) {
  try {
    const previousUserId = localStorage.getItem(ACCOUNT_KEY);
    if (previousUserId === userId) return;
    if (previousUserId) {
      for (const key of ACCOUNT_DATA_KEYS) {
        const value = localStorage.getItem(key);
        if (value !== null) localStorage.setItem(cacheKey(previousUserId, key), value);
      }
      const hasAccountCache = ACCOUNT_DATA_KEYS.some((key) => localStorage.getItem(cacheKey(userId, key)) !== null);
      for (const key of ACCOUNT_DATA_KEYS) localStorage.removeItem(key);
      if (hasAccountCache) {
        for (const key of ACCOUNT_DATA_KEYS) {
          const value = localStorage.getItem(cacheKey(userId, key));
          if (value !== null) localStorage.setItem(key, value);
        }
      }
    }
    localStorage.setItem(ACCOUNT_KEY, userId);
  } catch { /* Authentication still works when browser storage is unavailable. */ }
}

function initialNightMode() {
  try {
    const settings = JSON.parse(localStorage.getItem("studyos-settings") || "{}");
    return settings.theme === "dark" || localStorage.getItem("studyos-theme") === "night";
  } catch { return false; }
}

function AuthForm({ onAuthenticated, initialMessage }) {
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const [formError, setFormError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [retryAfter, setRetryAfter] = useState(0);
  const [night, setNight] = useState(initialNightMode);
  const [quoteIndex, setQuoteIndex] = useState(0);
  const lastRequestRef = useRef(null);
  const register = mode === "register";
  const strengthChecks = [password.length >= 8, /[a-z]/.test(password) && /[A-Z]/.test(password), /\d/.test(password), /[^A-Za-z0-9]/.test(password)];
  const strength = strengthChecks.filter(Boolean).length;

  useEffect(() => {
    try {
      localStorage.setItem("studyos-theme", night ? "night" : "light");
      const settings = JSON.parse(localStorage.getItem("studyos-settings") || "{}");
      localStorage.setItem("studyos-settings", JSON.stringify({ ...settings, theme: night ? "dark" : "light" }));
    } catch { /* Theme remains available for this page when storage is disabled. */ }
  }, [night]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;
    const timer = window.setInterval(() => setQuoteIndex((index) => (index + 1) % QUOTES.length), 8000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!retryAfter) return undefined;
    const timer = window.setTimeout(() => setRetryAfter((seconds) => Math.max(0, seconds - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [retryAfter]);

  async function sendAuth(body, isRegister) {
    setFormError(null); setFieldErrors({}); setBusy(true);
    lastRequestRef.current = { body, isRegister };
    try {
      const result = await apiRequest("/auth/" + (isRegister ? "register" : "login"), { method: "POST", body: isRegister ? body : { ...body, rememberMe } });
      prepareAccountStorage(result.user.id);
      if (isRegister) {
        try {
          const settings = JSON.parse(localStorage.getItem("studyos-settings") || "{}");
          localStorage.setItem("studyos-settings", JSON.stringify({ ...settings, profileName: result.user.name, theme: night ? "dark" : "light" }));
          window.dispatchEvent(new Event("studyos-settings-changed"));
        } catch { /* Account setup continues when storage is unavailable. */ }
      }
      onAuthenticated(result.user);
    } catch (error) {
      setFormError(error);
      if (error.fieldErrors) setFieldErrors(error.fieldErrors);
      if (error.status === 429 && error.retryAfterSeconds) setRetryAfter(error.retryAfterSeconds);
    } finally { setBusy(false); }
  }

  function submit(event) {
    event.preventDefault();
    if (busy || retryAfter) return;
    const cleanEmail = email.trim().toLowerCase();
    const errors = {};
    if (register && !name.trim()) errors.name = "Enter your name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) errors.email = "Enter a valid email address.";
    // The API currently requires 12 characters; keep client validation aligned with it.
    if (password.length < 12) errors.password = "Use at least 12 characters.";
    if (password.length > 128) errors.password = "Password must be 128 characters or fewer.";
    if (register && password !== confirmPassword) errors.confirmPassword = "Passwords do not match.";
    setFieldErrors(errors);
    if (Object.keys(errors).length) return;
    sendAuth(register ? { name: name.trim(), email: cleanEmail, password } : { email: cleanEmail, password }, register);
  }

  function retry() { if (lastRequestRef.current && !busy && !retryAfter) sendAuth(lastRequestRef.current.body, lastRequestRef.current.isRegister); }
  function changeMode(next) { setMode(next); setFormError(null); setFieldErrors({}); setConfirmPassword(""); }
  function errorId(field) { return fieldErrors[field] ? field + "-error" : undefined; }

  return (
    <div className={`studyos auth-standalone ${night ? "night" : ""}`}>
    <main className="auth-shell">
      <button className="auth-theme-toggle" type="button" onClick={() => setNight((value) => !value)} aria-label={`Switch to ${night ? "light" : "night"} mode`} title={`Switch to ${night ? "light" : "night"} mode`}>{night ? <Sun size={18} /> : <Moon size={18} />}<span>{night ? "Light" : "Night"}</span></button>
      <section className="auth-layout" aria-label="Account access">
        <aside className="auth-brand-panel">
          <div className="auth-orb auth-orb-one" /><div className="auth-orb auth-orb-two" /><div className="auth-orb auth-orb-three" />
          <div className="auth-brand-content">
            <div className="auth-brand"><img src={studyOSLogo} alt="StudyOS" /></div>
            <div className="auth-brand-copy"><h2>Study <span className="auth-gradient-word">smarter.</span><br />Stay <span className="auth-gradient-word">consistent.</span></h2><p>Your plans, tasks and progress, all in one calm place.</p>
              <div className="auth-quote" aria-live="polite" aria-atomic="true"><Quote size={26} aria-hidden="true" /><div className="auth-quote-content"><p key={quoteIndex}>{QUOTES[quoteIndex]}</p><div className="auth-quote-dots" role="group" aria-label="Choose a quote">{QUOTES.map((quote, index) => <button key={quote} type="button" className={index === quoteIndex ? "active" : ""} aria-label={`Show quote ${index + 1}`} aria-pressed={index === quoteIndex} onClick={() => setQuoteIndex(index)} />)}</div></div></div>
            </div>
            <p className="auth-privacy">Your data stays private to your account.</p>
          </div>
        </aside>
        <section className="auth-form-panel" aria-labelledby="auth-title">
          <div className="auth-form-inner">
            <h1 id="auth-title">{register ? "Create your account" : "Welcome back"}</h1>
            <p className="auth-subtitle">{register ? "A calm place to build your study routine." : "Sign in to continue where you left off."}</p>
            <div className="auth-tabs" role="tablist" aria-label="Choose sign in or registration"><button id="login-tab" type="button" role="tab" aria-selected={!register} className={!register ? "active" : ""} onClick={() => changeMode("login")}>Login</button><button id="register-tab" type="button" role="tab" aria-selected={register} className={register ? "active" : ""} onClick={() => changeMode("register")}>Register</button><span className={`auth-tab-indicator ${register ? "right" : ""}`} /></div>
            <div className="auth-live-region" aria-live="polite" aria-atomic="true">
              {initialMessage && !formError ? (typeof initialMessage === "string" ? <div className="auth-notice">{initialMessage}</div> : <ErrorBanner error={initialMessage} onRetry={() => window.location.reload()} />) : null}
              {formError ? <ErrorBanner error={formError} onRetry={formError.status === 429 ? undefined : retry} /> : null}
              {formError?.status === 409 ? <button className="auth-login-instead" type="button" onClick={() => changeMode("login")}>Log in instead</button> : null}
              {retryAfter > 0 ? <p className="auth-rate-countdown">Try again in {retryAfter} seconds.</p> : null}
            </div>
            <form className="auth-form" onSubmit={submit} noValidate>
              {register && <label htmlFor="auth-name"><span>Display name</span><span className="auth-input-wrap"><UserRound size={18} /><input id="auth-name" name="name" autoComplete="name" maxLength={100} required placeholder="Your name" autoFocus value={name} onChange={(event) => setName(event.target.value)} aria-invalid={Boolean(fieldErrors.name)} aria-describedby={errorId("name")} /></span>{fieldErrors.name && <small className="auth-field-error" id="name-error">{fieldErrors.name}</small>}</label>}
              <label htmlFor="auth-email"><span>Email address</span><span className="auth-input-wrap"><Mail size={18} /><input id="auth-email" name="email" type="email" autoComplete="email" maxLength={254} required placeholder="you@example.com" autoFocus={!register} value={email} onChange={(event) => setEmail(event.target.value)} aria-invalid={Boolean(fieldErrors.email)} aria-describedby={errorId("email")} /></span>{fieldErrors.email && <small className="auth-field-error" id="email-error">{fieldErrors.email}</small>}</label>
              <label htmlFor="auth-password"><span>Password</span><span className="auth-input-wrap"><LockKeyhole size={18} /><input id="auth-password" name="password" type={showPassword ? "text" : "password"} autoComplete={register ? "new-password" : "current-password"} maxLength={128} required placeholder="Enter your password" value={password} onChange={(event) => setPassword(event.target.value)} onKeyDown={(event) => setCapsLock(event.getModifierState("CapsLock"))} onKeyUp={(event) => setCapsLock(event.getModifierState("CapsLock"))} aria-invalid={Boolean(fieldErrors.password)} aria-describedby={[errorId("password"), capsLock ? "caps-warning" : null].filter(Boolean).join(" ") || undefined} /><button className="auth-password-toggle" type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></span>{capsLock && <small className="auth-caps-warning" id="caps-warning">Caps Lock is on.</small>}{fieldErrors.password && <small className="auth-field-error" id="password-error">{fieldErrors.password}</small>}</label>
              {register ? <><div className="auth-password-strength" aria-label={`Password strength ${strength} of 4`}><div className="auth-strength-meter">{strengthChecks.map((passed, index) => <i key={index} className={passed ? "passed" : ""} />)}</div><span>{strength < 2 ? "Needs work" : strength < 4 ? "Getting stronger" : "Strong password"}</span></div><ul className="auth-requirements">{["8+ characters", "Upper and lower case", "A number", "A symbol"].map((label, index) => <li key={label} className={strengthChecks[index] ? "met" : ""}>{label}</li>)}</ul><label htmlFor="auth-confirm-password"><span>Confirm password</span><span className="auth-input-wrap"><LockKeyhole size={18} /><input id="auth-confirm-password" name="confirmPassword" type={showPassword ? "text" : "password"} autoComplete="new-password" maxLength={128} required placeholder="Re-enter your password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} aria-invalid={Boolean(fieldErrors.confirmPassword)} aria-describedby={errorId("confirmPassword")} /></span>{fieldErrors.confirmPassword && <small className="auth-field-error" id="confirmPassword-error">{fieldErrors.confirmPassword}</small>}</label></> : <label className="auth-remember"><input type="checkbox" checked={rememberMe} onChange={(event) => setRememberMe(event.target.checked)} /><span>Remember me</span></label>}
              <button className="auth-submit" type="submit" disabled={busy || retryAfter > 0}>{busy ? <LoaderCircle className="auth-spinner" size={18} /> : <LockKeyhole size={18} />}{busy ? "Please wait..." : register ? "Create account" : "Sign in"}{!busy && <ArrowRight size={18} />}</button>
            </form>
            <p className="auth-switch">{register ? "Already have an account?" : "New to StudyOS?"} <button type="button" onClick={() => changeMode(register ? "login" : "register")}>{register ? "Log in" : "Create an account"}</button></p>
            <p className="auth-card-privacy">Your data stays private to your account.</p>
          </div>
        </section>
      </section>
    </main>
    </div>
  );
}

export default function AuthGate({ children }) {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);
  const [message, setMessage] = useState("");
  useEffect(() => {
    const handleExpired = (event) => { setUser(null); setMessage(event.detail?.message || "Your session expired. Please log in again."); };
    window.addEventListener("studyos-auth-expired", handleExpired);
    return () => window.removeEventListener("studyos-auth-expired", handleExpired);
  }, []);
  useEffect(() => {
    let active = true;
    apiRequest("/auth/me").then(({ user: restoredUser }) => {
      if (!active) return;
      prepareAccountStorage(restoredUser.id);
      setUser(restoredUser);
    }).catch((error) => {
      if (!active) return;
      if (error.status !== 401) setMessage(error);
    }).finally(() => { if (active) setChecking(false); });
    return () => { active = false; };
  }, []);
  if (checking) return <main className="auth-loading" role="status"><LoaderCircle className="auth-spinner" size={24} /><span>Restoring your session...</span></main>;
  if (!user) return <AuthForm onAuthenticated={setUser} initialMessage={message} />;
  return cloneElement(children, { key: user.id, user, onLogout: (broadcast = true) => { if (broadcast) broadcastLogout(); setUser(null); } });
}
