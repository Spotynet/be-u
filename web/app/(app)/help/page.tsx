"use client";

import {useState} from "react";
import {LifebuoyIcon} from "@heroicons/react/24/outline";
import {
  CardHeader,
  PageHeaderRow,
  StackLayout,
} from "@/components/layout";
import {Button} from "@/components/ui/Button";
import {CustomDropdown} from "@/components/ui/CustomDropdown";
import {usePageHeader} from "@/components/shell/usePageHeader";
import {useAuth} from "@/features/auth/hooks/useAuth";
import {supportApi, errorUtils} from "@/lib/api";
import {CONTACT_EMAIL, CONTACT_URL} from "@/constants/legal";

const THEMES = [
  "Problema técnico",
  "Cuenta y acceso",
  "Reservas",
  "Pagos",
  "Sugerencia",
  "Otro",
];

export default function HelpPage() {
  usePageHeader({title: "Ayuda y soporte", pageOwnsTitle: true});
  const {user} = useAuth();
  const [theme, setTheme] = useState(THEMES[0]);
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState(user?.email || "");
  const [image, setImage] = useState<File | null>(null);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "ok" | "err";
    text: string;
  } | null>(null);

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
    <StackLayout>
      <PageHeaderRow
        title="Ayuda y soporte"
        description={
          <>
            Envíanos un mensaje o escríbenos a{" "}
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="font-bold text-primary hover:underline">
              {CONTACT_EMAIL}
            </a>
            . También:{" "}
            <a
              href={CONTACT_URL}
              target="_blank"
              rel="noreferrer"
              className="font-bold text-primary hover:underline">
              {CONTACT_URL}
            </a>
          </>
        }
      />

      {feedback ? (
        <div
          className={[
            "rounded-[var(--control-radius)] border px-3 py-2.5 text-[14px]",
            feedback.type === "ok"
              ? "border-success/30 bg-success/10 text-success"
              : "border-error/40 bg-error/10 text-error",
          ].join(" ")}>
          {feedback.text}
        </div>
      ) : null}

      <section className="rounded-[var(--card-radius)] border border-card-border bg-card p-[var(--card-pad)] shadow-card">
        <CardHeader title="Contacto" icon={LifebuoyIcon} />
        <form
          onSubmit={submit}
          className="mt-4 flex flex-col gap-3">
          <CustomDropdown
            label="Tema"
            value={theme}
            onChange={(value) => {
              if (value) setTheme(value);
            }}
            options={THEMES.map((t) => ({value: t, label: t}))}
            searchable="auto"
            size="md"
          />
          <label className="flex flex-col gap-1.5 text-[13px] font-bold text-foreground">
            Email de contacto
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-[var(--control-radius)] border border-card-border bg-background px-3 py-2.5 text-[14px] font-medium text-foreground"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-[13px] font-bold text-foreground">
            Mensaje
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              required
              className="resize-y rounded-[var(--control-radius)] border border-card-border bg-background px-3 py-2.5 text-[14px] font-medium text-foreground"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-[13px] font-bold text-foreground">
            Imagen (opcional)
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImage(e.target.files?.[0] || null)}
            />
          </label>
          <label className="flex items-start gap-2 text-[13px] text-foreground-secondary">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-0.5"
            />
            Acepto que el equipo de soporte revise los datos técnicos de mi sesión
            para solucionar el problema.
          </label>
          <Button type="submit" variant="secondary" disabled={busy}>
            {busy ? "Enviando…" : "Enviar"}
          </Button>
        </form>
      </section>
    </StackLayout>
  );
}
