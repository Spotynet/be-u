"use client";

import {PageContainer} from "@/components/layout/PageContainer";

import {useState} from "react";
import {useAuth} from "@/features/auth/hooks/useAuth";
import {supportApi, errorUtils} from "@/lib/api";
import {CONTACT_EMAIL, CONTACT_URL} from "@/constants/legal";

const INK = "#12211A";
const MAIN = "#558367";

const THEMES = [
  "Problema técnico",
  "Cuenta y acceso",
  "Reservas",
  "Pagos",
  "Sugerencia",
  "Otro",
];

export default function HelpPage() {
  const {user} = useAuth();
  const [theme, setTheme] = useState(THEMES[0]);
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState(user?.email || "");
  const [image, setImage] = useState<File | null>(null);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<{type: "ok" | "err"; text: string} | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      setFeedback({type: "err", text: "Escribe un mensaje."});
      return;
    }
    if (!consent) {
      setFeedback({
        type: "err",
        text: "Debes aceptar que el equipo revise los datos técnicos de tu sesión.",
      });
      return;
    }
    setBusy(true);
    setFeedback(null);
    try {
      const fd = new FormData();
      fd.append("theme", theme);
      fd.append("message", message.trim());
      fd.append("email", email.trim() || user?.email || "");
      if (image) fd.append("image", image);
      const res = await supportApi.submitFeedback(fd);
      setFeedback({
        type: "ok",
        text:
          res.data?.message ||
          (res.data?.ticket_id
            ? `Ticket ${res.data.ticket_id} enviado. Gracias.`
            : "Mensaje enviado. Te contactaremos pronto."),
      });
      setMessage("");
      setImage(null);
    } catch (err) {
      setFeedback({type: "err", text: errorUtils.getErrorMessage(err)});
    } finally {
      setBusy(false);
    }
  };

  return (
    <PageContainer size="md">
      <h1 className="nabbi-page-title">Ayuda y soporte</h1>
      <p className="nabbi-page-sub">
        Envíanos un mensaje o escríbenos a{" "}
        <a href={`mailto:${CONTACT_EMAIL}`} style={{color: MAIN, fontWeight: 700}}>
          {CONTACT_EMAIL}
        </a>
        . También:{" "}
        <a href={CONTACT_URL} target="_blank" rel="noreferrer" style={{color: MAIN, fontWeight: 700}}>
          {CONTACT_URL}
        </a>
      </p>

      {feedback && (
        <div
          style={{
            marginBottom: 12,
            padding: 12,
            borderRadius: 12,
            background: feedback.type === "ok" ? "#ecfdf5" : "#fef2f2",
            color: feedback.type === "ok" ? "#047857" : "#dc2626",
            fontSize: 14,
          }}>
          {feedback.text}
        </div>
      )}

      <form
        onSubmit={submit}
        style={{
          background: "white",
          border: "1px solid rgba(18,33,26,0.08)",
          borderRadius: 16,
          padding: 16,
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}>
        <label style={labelStyle}>
          Tema
          <select value={theme} onChange={(e) => setTheme(e.target.value)} style={inputStyle}>
            {THEMES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <label style={labelStyle}>
          Email de contacto
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={inputStyle}
          />
        </label>
        <label style={labelStyle}>
          Mensaje
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={5}
            required
            style={{...inputStyle, resize: "vertical"}}
          />
        </label>
        <label style={labelStyle}>
          Imagen (opcional)
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImage(e.target.files?.[0] || null)}
          />
        </label>
        <label style={{display: "flex", gap: 8, alignItems: "flex-start", fontSize: 13, color: "#64748b"}}>
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            style={{marginTop: 2}}
          />
          Acepto que el equipo de soporte revise los datos técnicos de mi sesión para solucionar el
          problema.
        </label>
        <button type="submit" disabled={busy} style={primaryBtn}>
          {busy ? "Enviando…" : "Enviar"}
        </button>
      </form>
    </PageContainer>
  );
}

const labelStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
  fontSize: 13,
  fontWeight: 700,
  color: INK,
};

const inputStyle: React.CSSProperties = {
  border: "1px solid rgba(18,33,26,0.15)",
  borderRadius: 10,
  padding: "10px 12px",
  fontSize: 14,
  fontWeight: 500,
};

const primaryBtn: React.CSSProperties = {
  background: MAIN,
  color: "white",
  border: "none",
  borderRadius: 12,
  padding: "12px 16px",
  fontWeight: 800,
  cursor: "pointer",
};
