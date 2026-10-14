"use client";

import {useState} from "react";
import {useRouter} from "next/navigation";
import {moderationApi, errorUtils} from "@/lib/api";
import {useAuth} from "@/features/auth/hooks/useAuth";

export type ReportTargetType = "post" | "comment" | "review" | "profile";

const REASONS: {key: string; label: string}[] = [
  {key: "spam", label: "Spam"},
  {key: "acoso", label: "Acoso"},
  {key: "inapropiado", label: "Contenido inapropiado"},
  {key: "estafa", label: "Estafa"},
  {key: "otro", label: "Otro"},
];

const INK = "#12211A";
const MAIN = "#558367";

type Props = {
  targetType: ReportTargetType;
  targetId: number;
  authorUserId?: number | null;
  onBlocked?: (userId: number) => void;
  loginNext?: string;
};

export function ContentActions({
  targetType,
  targetId,
  authorUserId,
  onBlocked,
  loginNext,
}: Props) {
  const {isAuthenticated} = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"menu" | "report" | "block">("menu");
  const [reason, setReason] = useState(REASONS[0].key);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const openModal = () => {
    if (!isAuthenticated) {
      router.push(`/login?next=${encodeURIComponent(loginNext || window.location.pathname)}`);
      return;
    }
    setFeedback(null);
    setStep("menu");
    setOpen(true);
  };

  const close = () => {
    setOpen(false);
    setStep("menu");
    setNote("");
  };

  const sendReport = async () => {
    setBusy(true);
    setFeedback(null);
    try {
      await moderationApi.report({
        target_type: targetType,
        target_id: targetId,
        reason,
        note: note.trim() || undefined,
      });
      setFeedback("Reporte enviado. Gracias.");
      setTimeout(close, 1200);
    } catch (err) {
      setFeedback(errorUtils.getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const blockUser = async () => {
    if (!authorUserId) return;
    setBusy(true);
    setFeedback(null);
    try {
      await moderationApi.blockUser(authorUserId);
      onBlocked?.(authorUserId);
      setFeedback("Usuario bloqueado.");
      setTimeout(close, 1200);
    } catch (err) {
      setFeedback(errorUtils.getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        aria-label="Opciones de contenido"
        style={{
          background: "transparent",
          border: "1px solid rgba(18,33,26,0.12)",
          borderRadius: 8,
          padding: "4px 10px",
          fontWeight: 800,
          color: "#64748b",
          cursor: "pointer",
          fontSize: 14,
          lineHeight: 1,
        }}>
        ···
      </button>

      {open && (
        <div
          role="dialog"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(18,33,26,0.45)",
            zIndex: 80,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
          onClick={close}>
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "white",
              borderRadius: 16,
              padding: 20,
              width: "100%",
              maxWidth: 360,
            }}>
            <div style={{fontWeight: 900, color: INK, marginBottom: 12}}>
              {step === "menu" && "Opciones"}
              {step === "report" && "Reportar"}
              {step === "block" && "Bloquear usuario"}
            </div>

            {feedback && (
              <p style={{color: MAIN, fontSize: 14, marginBottom: 10}}>{feedback}</p>
            )}

            {step === "menu" && (
              <div style={{display: "flex", flexDirection: "column", gap: 8}}>
                <button type="button" onClick={() => setStep("report")} style={itemBtn}>
                  Reportar
                </button>
                {authorUserId ? (
                  <button type="button" onClick={() => setStep("block")} style={{...itemBtn, color: "#dc2626"}}>
                    Bloquear
                  </button>
                ) : null}
                <button type="button" onClick={close} style={ghostBtn}>
                  Cancelar
                </button>
              </div>
            )}

            {step === "report" && (
              <div style={{display: "flex", flexDirection: "column", gap: 10}}>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  style={inputStyle}>
                  {REASONS.map((r) => (
                    <option key={r.key} value={r.key}>
                      {r.label}
                    </option>
                  ))}
                </select>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Detalle opcional"
                  rows={3}
                  style={{...inputStyle, resize: "vertical"}}
                />
                <button type="button" disabled={busy} onClick={sendReport} style={primaryBtn}>
                  {busy ? "Enviando…" : "Enviar reporte"}
                </button>
                <button type="button" onClick={() => setStep("menu")} style={ghostBtn}>
                  Atrás
                </button>
              </div>
            )}

            {step === "block" && (
              <div style={{display: "flex", flexDirection: "column", gap: 10}}>
                <p style={{color: "#64748b", fontSize: 14, margin: 0}}>
                  Dejarás de ver su contenido. Esta persona tampoco verá el tuyo.
                </p>
                <button type="button" disabled={busy} onClick={blockUser} style={{...primaryBtn, background: "#dc2626"}}>
                  {busy ? "Bloqueando…" : "Confirmar bloqueo"}
                </button>
                <button type="button" onClick={() => setStep("menu")} style={ghostBtn}>
                  Atrás
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

const itemBtn: React.CSSProperties = {
  background: "rgba(18,33,26,0.04)",
  border: "none",
  borderRadius: 10,
  padding: "12px 14px",
  fontWeight: 700,
  textAlign: "left",
  cursor: "pointer",
  color: INK,
};

const ghostBtn: React.CSSProperties = {
  background: "transparent",
  border: "none",
  padding: "10px",
  fontWeight: 600,
  color: "#64748b",
  cursor: "pointer",
};

const inputStyle: React.CSSProperties = {
  border: "1px solid rgba(18,33,26,0.15)",
  borderRadius: 10,
  padding: "10px 12px",
  fontSize: 14,
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
