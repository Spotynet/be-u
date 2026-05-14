"use client";

import {useState} from "react";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {useAuth} from "@/features/auth/hooks/useAuth";

const INK   = "#12211A";
const DARK  = "#1F3328";
const MAIN  = "#558367";
const ACCENT= "#F6C531";
/** Verde salvia claro — --color-primary-light (brandbook / landing) */
const FORM_BG = `linear-gradient(165deg, #ecf6ef 0%, #d8eae0 45%, #e6f2eb 100%)`;
const LABEL = "#3d6050";

const inputBase: React.CSSProperties = {
  width: "100%",
  background: "white",
  border: "1.5px solid rgba(85,131,103,0.22)",
  borderRadius: 12,
  color: DARK,
  fontSize: 15,
  fontWeight: 500,
  padding: "13px 44px 13px 16px",
  outline: "none",
  transition: "border-color 0.15s, box-shadow 0.15s",
  boxSizing: "border-box",
};

export const LoginForm = () => {
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const {requestEmailCode, loginWithEmailCode, error, clearError, isLoading} = useAuth();
  const router = useRouter();

  const visibleError = localError || error;

  const onFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = MAIN;
    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(85,131,103,0.15)";
  };

  const onBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = "rgba(85,131,103,0.22)";
    e.currentTarget.style.boxShadow = "none";
  };

  const resetMessages = () => {
    setLocalError(null);
    setSuccessMessage(null);
    if (error) clearError();
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setLocalError("Ingresa tu correo electrónico.");
      return;
    }
    if (!/\S+@\S+\.\S+/.test(trimmedEmail)) {
      setLocalError("Ingresa un correo electrónico válido.");
      return;
    }

    try {
      await requestEmailCode(trimmedEmail);
      setEmail(trimmedEmail);
      setStep("code");
      setSuccessMessage("Te enviamos un código de 6 dígitos a tu correo.");
    } catch (err) {
      console.error("Email code request failed:", err);
    }
  };

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();

    const normalizedCode = code.replace(/\D/g, "").slice(0, 6);
    setCode(normalizedCode);
    if (!/^\d{6}$/.test(normalizedCode)) {
      setLocalError("El código debe tener 6 dígitos.");
      return;
    }

    try {
      const result = await loginWithEmailCode({email, code: normalizedCode});
      if (result === "requires_registration") {
        router.push(`/register?email=${encodeURIComponent(email)}`);
        return;
      }
      router.push("/dashboard");
    } catch (err) {
      console.error("Code verification failed:", err);
    }
  };

  const handleResendCode = async () => {
    resetMessages();
    try {
      await requestEmailCode(email);
      setCode("");
      setSuccessMessage("Te enviamos un nuevo código.");
    } catch (err) {
      console.error("Email code resend failed:", err);
    }
  };

  return (
    <div
      style={{
        background: FORM_BG,
        padding: "52px 44px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
      }}>
      <div style={{marginBottom: 36}}>
        <p style={{color:LABEL, fontWeight:800, fontSize:12, letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:8}}>
          {step === "email" ? "Bienvenido de vuelta" : "Verifica tu acceso"}
        </p>
        <h1 style={{color: INK, fontWeight: 900, fontSize: 32, letterSpacing: "-0.03em", margin: 0}}>
          {step === "email" ? "Iniciar Sesión" : "Ingresa el código"}
        </h1>
        <p style={{color:"#64748b", fontSize:14, lineHeight:1.6, margin:"12px 0 0"}}>
          {step === "email"
            ? "Escribe tu correo y te enviaremos un código para entrar."
            : <>Te enviamos un código de 6 dígitos a <strong style={{color:DARK}}>{email}</strong>.</>}
        </p>
      </div>

      <form style={{display: "flex", flexDirection: "column", gap: 22}} onSubmit={step === "email" ? handleEmailSubmit : handleCodeSubmit}>
        {step === "email" ? (
          <div>
            <label style={{display:"block", color:DARK, fontSize:13, fontWeight:600, marginBottom:7}}>
              Correo electrónico
            </label>
            <div style={{position:"relative"}}>
              <input
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  resetMessages();
                }}
                disabled={isLoading}
                style={inputBase}
                onFocus={onFocus}
                onBlur={onBlur}
              />
              <svg style={{position:"absolute",right:14,top:"50%",transform:"translateY(-50%)",color:LABEL}} width="17" height="17" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
              </svg>
            </div>
          </div>
        ) : (
          <div>
            <label style={{display:"block", color:DARK, fontSize:13, fontWeight:600, marginBottom:7}}>
              Código de verificación
            </label>
            <div style={{position:"relative"}}>
              <input
                name="code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                required
                placeholder="123456"
                maxLength={6}
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.replace(/\D/g, "").slice(0, 6));
                  resetMessages();
                }}
                disabled={isLoading}
                style={{
                  ...inputBase,
                  paddingRight: 16,
                  fontSize: 26,
                  letterSpacing: "0.35em",
                  textAlign: "center",
                }}
                onFocus={onFocus}
                onBlur={onBlur}
              />
            </div>
            <button
              type="button"
              onClick={handleResendCode}
              disabled={isLoading}
              style={{
                marginTop: 12,
                background: "none",
                border: "none",
                color: MAIN,
                cursor: isLoading ? "not-allowed" : "pointer",
                fontSize: 13,
                fontWeight: 700,
                padding: 0,
              }}>
              Reenviar código
            </button>
          </div>
        )}

        {successMessage && (
          <div style={{background:"#ecfdf5", border:"1.5px solid #86efac", borderRadius:12, padding:"12px 16px"}}>
            <p style={{color:"#166534", fontSize:13, fontWeight:600, margin:0}}>{successMessage}</p>
          </div>
        )}

        {visibleError && (
          <div style={{background:"#fef2f2", border:"1.5px solid #fca5a5", borderRadius:12, padding:"12px 16px"}}>
            <p style={{color:"#dc2626", fontSize:13, fontWeight:600, margin:0}}>{visibleError}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          style={{
            width: "100%",
            background: ACCENT,
            color: INK,
            borderRadius: 14,
            padding: "15px 0",
            fontWeight: 800,
            fontSize: 15,
            border: "none",
            cursor: isLoading ? "not-allowed" : "pointer",
            opacity: isLoading ? 0.65 : 1,
            transition: "opacity 0.15s, transform 0.15s, box-shadow 0.15s",
            boxShadow: "0 6px 20px rgba(246,197,49,0.35)",
            marginTop: 4,
          }}
          onMouseEnter={e => {
            if (!isLoading) {
              e.currentTarget.style.transform = "scale(1.02)";
              e.currentTarget.style.boxShadow = "0 10px 28px rgba(246,197,49,0.45)";
            }
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = "scale(1)";
            e.currentTarget.style.boxShadow = "0 6px 20px rgba(246,197,49,0.35)";
          }}>
          {isLoading ? (
            <span style={{display:"flex",alignItems:"center",justifyContent:"center",gap:10}}>
              <svg style={{animation:"spin 1s linear infinite"}} width="18" height="18" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="rgba(18,33,26,0.25)" strokeWidth="4"/>
                <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill={INK}/>
              </svg>
              {step === "email" ? "Enviando código…" : "Verificando código…"}
            </span>
          ) : (
            step === "email" ? "Enviar código" : "Verificar código"
          )}
        </button>

        <p style={{textAlign:"center", fontSize:13, color:"#64748b", margin:0}}>
          ¿No tienes cuenta?{" "}
          <Link href="/register" style={{color:MAIN, fontWeight:700, textDecoration:"none"}}>
            Regístrate
          </Link>
        </p>
      </form>
    </div>
  );
};
