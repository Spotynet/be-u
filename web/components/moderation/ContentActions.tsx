"use client";

import {useState} from "react";
import {useRouter} from "next/navigation";
import {moderationApi, errorUtils} from "@/lib/api";
import {useAuth} from "@/features/auth/hooks/useAuth";
import {CustomDropdown} from "@/components/ui/CustomDropdown";

export type ReportTargetType = "post" | "comment" | "review" | "profile";

const REASONS: {key: string; label: string}[] = [
  {key: "spam", label: "Spam"},
  {key: "acoso", label: "Acoso"},
  {key: "inapropiado", label: "Contenido inapropiado"},
  {key: "estafa", label: "Estafa"},
  {key: "otro", label: "Otro"},
];

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
            className="w-full max-w-[360px] rounded-[var(--r-card)] bg-[var(--surface-raised)] p-5 text-foreground shadow-[var(--shadow-float)]">
            <div className="mb-3 text-[15px] font-extrabold text-foreground">
              {step === "menu" && "Opciones"}
              {step === "report" && "Reportar"}
              {step === "block" && "Bloquear usuario"}
            </div>

            {feedback ? (
              <p className="mb-2.5 text-[14px] text-primary">{feedback}</p>
            ) : null}

            {step === "menu" && (
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => setStep("report")}
                  className="rounded-[var(--r-ctl)] bg-[var(--glass-light-1)] px-3.5 py-3 text-left text-[14px] font-bold text-foreground hover:bg-[var(--surface-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary">
                  Reportar
                </button>
                {authorUserId ? (
                  <button
                    type="button"
                    onClick={() => setStep("block")}
                    className="rounded-[var(--r-ctl)] bg-error-light px-3.5 py-3 text-left text-[14px] font-bold text-error hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary">
                    Bloquear
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={close}
                  className="px-2.5 py-2.5 text-[14px] font-semibold text-foreground-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary">
                  Cancelar
                </button>
              </div>
            )}

            {step === "report" && (
              <div className="flex flex-col gap-2.5">
                <CustomDropdown
                  value={reason}
                  onChange={(value) => {
                    if (value) setReason(value);
                  }}
                  options={REASONS.map((r) => ({value: r.key, label: r.label}))}
                  searchable={false}
                  size="md"
                />
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Detalle opcional"
                  rows={3}
                  className="resize-y rounded-[var(--r-ctl)] border border-[var(--hairline-strong)] bg-[var(--surface-card)] px-3 py-2.5 text-[14px] text-foreground placeholder:text-foreground-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-text)]"
                />
                <button
                  type="button"
                  disabled={busy}
                  onClick={sendReport}
                  className="rounded-xl bg-primary px-4 py-3 text-[14px] font-extrabold text-primary-foreground disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary">
                  {busy ? "Enviando…" : "Enviar reporte"}
                </button>
                <button
                  type="button"
                  onClick={() => setStep("menu")}
                  className="px-2.5 py-2.5 text-[14px] font-semibold text-foreground-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary">
                  Atrás
                </button>
              </div>
            )}

            {step === "block" && (
              <div className="flex flex-col gap-2.5">
                <p className="m-0 text-[14px] text-foreground-muted">
                  Dejarás de ver su contenido. Esta persona tampoco verá el tuyo.
                </p>
                <button
                  type="button"
                  disabled={busy}
                  onClick={blockUser}
                  className="rounded-xl bg-error px-4 py-3 text-[14px] font-extrabold text-error-foreground disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary">
                  {busy ? "Bloqueando…" : "Confirmar bloqueo"}
                </button>
                <button
                  type="button"
                  onClick={() => setStep("menu")}
                  className="px-2.5 py-2.5 text-[14px] font-semibold text-foreground-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary">
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
