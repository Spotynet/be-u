"use client";

import {useCallback, useEffect, useState} from "react";
import Link from "next/link";
import {useParams, useRouter} from "next/navigation";
import {
  CalendarDaysIcon,
  PencilSquareIcon,
  UserGroupIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
import {
  CardHeader,
  PageHeaderRow,
  StackLayout,
} from "@/components/layout";
import {Button} from "@/components/ui/Button";
import {usePageHeader} from "@/components/shell/usePageHeader";
import {useAuth} from "@/features/auth/hooks/useAuth";
import {isProviderRole} from "@/lib/roles";
import {
  groupSessionApi,
  type GroupSessionParticipant,
  errorUtils,
} from "@/lib/api";

const fieldClass =
  "w-full rounded-[var(--control-radius)] border border-card-border bg-background px-3 py-2.5 text-[14px] font-medium text-foreground";

const sessionsBackLink = (
  <Link
    href="/group-sessions"
    className="text-[13px] font-bold text-primary hover:underline">
    ← Sesiones
  </Link>
);

export default function GroupSessionDetailPage() {
  const params = useParams();
  const id = Number(params?.id);
  const router = useRouter();
  const {user, isAuthenticated} = useAuth();
  const provider = isProviderRole(user?.role);

  const [session, setSession] = useState<any>(null);
  const [participants, setParticipants] = useState<GroupSessionParticipant[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState<{type: "ok" | "err"; text: string} | null>(
    null,
  );
  const [edit, setEdit] = useState({date: "", time: "", capacity: 1, notes: ""});

  const pageTitle =
    session?.service_name || session?.service?.name || "Sesión grupal";

  usePageHeader({title: pageTitle, pageOwnsTitle: true});

  const load = useCallback(async () => {
    if (!id || Number.isNaN(id)) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await groupSessionApi.get(id);
      const s = res.data;
      setSession(s);
      setEdit({
        date: s.date || "",
        time: String(s.time || "14:00").slice(0, 5),
        capacity: s.capacity ?? 1,
        notes: s.notes || "",
      });
      try {
        const p = await groupSessionApi.participants(id);
        setParticipants(p.data?.results || []);
      } catch {
        setParticipants([]);
      }
    } catch (err) {
      setMessage({type: "err", text: errorUtils.getErrorMessage(err)});
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleReserve = async () => {
    if (!isAuthenticated) {
      router.push(`/login?next=${encodeURIComponent(`/group-sessions/${id}`)}`);
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      await groupSessionApi.reserve(id, notes.trim() || undefined);
      setMessage({type: "ok", text: "Reservaste tu lugar en la sesión."});
      setNotes("");
      await load();
    } catch (err) {
      setMessage({type: "err", text: errorUtils.getErrorMessage(err)});
    } finally {
      setBusy(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      await groupSessionApi.update(id, {
        date: edit.date,
        time: edit.time.length === 5 ? `${edit.time}:00` : edit.time,
        capacity: Math.max(1, edit.capacity),
        notes: edit.notes.trim() || undefined,
      });
      setMessage({type: "ok", text: "Sesión actualizada."});
      await load();
    } catch (err) {
      setMessage({type: "err", text: errorUtils.getErrorMessage(err)});
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("¿Cancelar / eliminar esta sesión?")) return;
    setBusy(true);
    try {
      await groupSessionApi.delete(id);
      router.push("/group-sessions");
    } catch (err) {
      setMessage({type: "err", text: errorUtils.getErrorMessage(err)});
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <StackLayout>
        <PageHeaderRow title="Sesión grupal" meta={sessionsBackLink} />
        <p className="text-foreground-secondary">Cargando…</p>
      </StackLayout>
    );
  }

  if (!session) {
    return (
      <StackLayout>
        <PageHeaderRow title="Sesión grupal" meta={sessionsBackLink} />
        <p className="text-error">{message?.text || "Sesión no encontrada."}</p>
      </StackLayout>
    );
  }

  const spotsLeft =
    typeof session.capacity === "number" && typeof session.spots_taken === "number"
      ? Math.max(0, session.capacity - session.spots_taken)
      : null;

  const subtitleParts = [
    session.date,
    String(session.time || "").slice(0, 5),
    session.capacity != null
      ? `cupo ${session.spots_taken ?? 0}/${session.capacity}`
      : null,
    session.status || null,
  ].filter(Boolean);

  return (
    <StackLayout>
      <PageHeaderRow
        title={pageTitle}
        description={subtitleParts.join(" · ")}
        meta={sessionsBackLink}
      />

      {message ? (
        <div
          className={[
            "rounded-[var(--control-radius)] border px-3 py-2.5 text-[14px]",
            message.type === "ok"
              ? "border-success/30 bg-success/10 text-success"
              : "border-error/40 bg-error/10 text-error",
          ].join(" ")}>
          {message.text}
        </div>
      ) : null}

      {session.notes ? (
        <section className="rounded-[var(--card-radius)] border border-card-border bg-card p-[var(--card-pad)] shadow-card">
          <CardHeader title="Notas" icon={CalendarDaysIcon} />
          <p className="mt-4 mb-0 text-[14px] leading-relaxed text-foreground">
            {session.notes}
          </p>
        </section>
      ) : null}

      {provider ? (
        <>
          <section className="rounded-[var(--card-radius)] border border-card-border bg-card p-[var(--card-pad)] shadow-card">
            <CardHeader title="Editar" icon={PencilSquareIcon} />
            <form
              onSubmit={handleUpdate}
              className="mt-4 flex flex-col gap-2.5">
              <input
                type="date"
                value={edit.date}
                onChange={(e) => setEdit({...edit, date: e.target.value})}
                className={fieldClass}
              />
              <input
                type="time"
                value={edit.time}
                onChange={(e) => setEdit({...edit, time: e.target.value})}
                className={fieldClass}
              />
              <input
                type="number"
                min={1}
                value={edit.capacity}
                onChange={(e) =>
                  setEdit({...edit, capacity: Number(e.target.value) || 1})
                }
                className={fieldClass}
              />
              <textarea
                value={edit.notes}
                onChange={(e) => setEdit({...edit, notes: e.target.value})}
                rows={3}
                className={[fieldClass, "resize-y"].join(" ")}
                placeholder="Notas"
              />
              <Button type="submit" variant="secondary" disabled={busy}>
                Guardar cambios
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={busy}
                onClick={handleDelete}
                className="border-error/40 text-error">
                Eliminar sesión
              </Button>
            </form>
          </section>

          <section className="rounded-[var(--card-radius)] border border-card-border bg-card p-[var(--card-pad)] shadow-card">
            <CardHeader
              title={`Participantes (${participants.length})`}
              icon={UsersIcon}
            />
            {participants.length === 0 ? (
              <p className="mt-4 text-foreground-secondary">Aún no hay inscritos.</p>
            ) : (
              <ul className="m-0 mt-4 list-none p-0">
                {participants.map((p) => (
                  <li
                    key={p.id}
                    className="mb-2 rounded-[var(--control-radius)] border border-card-border bg-background p-3 last:mb-0">
                    <div className="font-bold text-foreground">
                      {p.client_name || "Cliente"}
                    </div>
                    <div className="text-[13px] text-foreground-secondary">
                      {p.client_email} · {p.status}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      ) : (
        <section className="rounded-[var(--card-radius)] border border-card-border bg-card p-[var(--card-pad)] shadow-card">
          <CardHeader title="Reservar lugar" icon={UserGroupIcon} />
          <div className="mt-4">
            {spotsLeft === 0 ? (
              <p className="text-foreground-secondary">Sin lugares disponibles.</p>
            ) : (
              <>
                {spotsLeft != null ? (
                  <p className="text-[14px] text-foreground-secondary">
                    {spotsLeft} lugares libres
                  </p>
                ) : null}
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="Notas (opcional)"
                  className={[fieldClass, "mb-2.5 resize-y"].join(" ")}
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleReserve}
                  disabled={busy}>
                  {busy ? "Reservando…" : "Reservar"}
                </Button>
              </>
            )}
          </div>
        </section>
      )}
    </StackLayout>
  );
}