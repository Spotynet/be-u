"use client";

import {PageContainer} from "@/components/layout/PageContainer";

import {useCallback, useEffect, useState} from "react";
import Link from "next/link";
import {useParams, useRouter} from "next/navigation";
import {useAuth} from "@/features/auth/hooks/useAuth";
import {isProviderRole} from "@/lib/roles";
import {
  groupSessionApi,
  type GroupSessionParticipant,
  errorUtils,
} from "@/lib/api";

const INK = "#12211A";
const MAIN = "#558367";

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
  const [message, setMessage] = useState<{type: "ok" | "err"; text: string} | null>(null);
  const [edit, setEdit] = useState({date: "", time: "", capacity: 1, notes: ""});

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

  if (loading) return <p style={{color: "#64748b"}}>Cargando…</p>;
  if (!session) {
    return (
      <div>
        <p style={{color: "#dc2626"}}>{message?.text || "Sesión no encontrada."}</p>
        <Link href="/group-sessions" style={{color: MAIN, fontWeight: 700}}>
          ← Volver
        </Link>
      </div>
    );
  }

  const spotsLeft =
    typeof session.capacity === "number" && typeof session.spots_taken === "number"
      ? Math.max(0, session.capacity - session.spots_taken)
      : null;

  return (
    <PageContainer size="md">
      <Link href="/group-sessions" style={{color: MAIN, fontWeight: 700, textDecoration: "none", fontSize: 14}}>
        ← Sesiones
      </Link>
      <h1 className="nabbi-page-title" style={{marginTop: 12}}>
        {session.service_name || session.service?.name || "Sesión grupal"}
      </h1>
      <p className="nabbi-page-sub">
        {session.date} · {String(session.time || "").slice(0, 5)}
        {session.capacity != null ? ` · cupo ${session.spots_taken ?? 0}/${session.capacity}` : ""}
        {session.status ? ` · ${session.status}` : ""}
      </p>

      {message && (
        <div
          style={{
            marginBottom: 12,
            padding: 12,
            borderRadius: 12,
            background: message.type === "ok" ? "#ecfdf5" : "#fef2f2",
            border: `1px solid ${message.type === "ok" ? "#6ee7b7" : "#fca5a5"}`,
            color: message.type === "ok" ? "#047857" : "#dc2626",
            fontSize: 14,
          }}>
          {message.text}
        </div>
      )}

      {session.notes && (
        <p style={{background: "white", borderRadius: 12, padding: 14, border: "1px solid rgba(18,33,26,0.08)"}}>
          {session.notes}
        </p>
      )}

      {provider ? (
        <>
          <form
            onSubmit={handleUpdate}
            style={{
              marginTop: 20,
              background: "white",
              borderRadius: 16,
              border: "1px solid rgba(18,33,26,0.08)",
              padding: 16,
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}>
            <div style={{fontWeight: 800}}>Editar</div>
            <input type="date" value={edit.date} onChange={(e) => setEdit({...edit, date: e.target.value})} style={inputStyle} />
            <input type="time" value={edit.time} onChange={(e) => setEdit({...edit, time: e.target.value})} style={inputStyle} />
            <input
              type="number"
              min={1}
              value={edit.capacity}
              onChange={(e) => setEdit({...edit, capacity: Number(e.target.value) || 1})}
              style={inputStyle}
            />
            <textarea
              value={edit.notes}
              onChange={(e) => setEdit({...edit, notes: e.target.value})}
              rows={3}
              style={{...inputStyle, resize: "vertical"}}
              placeholder="Notas"
            />
            <button type="submit" disabled={busy} style={primaryBtn}>
              Guardar cambios
            </button>
            <button type="button" onClick={handleDelete} disabled={busy} style={dangerBtn}>
              Eliminar sesión
            </button>
          </form>

          <h2 style={{marginTop: 28, fontSize: 18, fontWeight: 800, color: INK}}>
            Participantes ({participants.length})
          </h2>
          {participants.length === 0 ? (
            <p style={{color: "#64748b"}}>Aún no hay inscritos.</p>
          ) : (
            <ul style={{listStyle: "none", padding: 0}}>
              {participants.map((p) => (
                <li
                  key={p.id}
                  style={{
                    background: "white",
                    border: "1px solid rgba(18,33,26,0.08)",
                    borderRadius: 12,
                    padding: 12,
                    marginBottom: 8,
                  }}>
                  <div style={{fontWeight: 700}}>{p.client_name || "Cliente"}</div>
                  <div style={{fontSize: 13, color: "#64748b"}}>
                    {p.client_email} · {p.status}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      ) : (
        <div
          style={{
            marginTop: 20,
            background: "white",
            borderRadius: 16,
            border: "1px solid rgba(18,33,26,0.08)",
            padding: 16,
          }}>
          <div style={{fontWeight: 800, marginBottom: 8}}>Reservar lugar</div>
          {spotsLeft === 0 ? (
            <p style={{color: "#64748b"}}>Sin lugares disponibles.</p>
          ) : (
            <>
              {spotsLeft != null && (
                <p style={{color: "#64748b", fontSize: 14}}>{spotsLeft} lugares libres</p>
              )}
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Notas (opcional)"
                style={{...inputStyle, width: "100%", marginBottom: 10, resize: "vertical"}}
              />
              <button type="button" onClick={handleReserve} disabled={busy} style={primaryBtn}>
                {busy ? "Reservando…" : "Reservar"}
              </button>
            </>
          )}
        </div>
      )}
    </PageContainer>
  );
}

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

const dangerBtn: React.CSSProperties = {
  background: "transparent",
  color: "#dc2626",
  border: "1px solid #fca5a5",
  borderRadius: 12,
  padding: "12px 16px",
  fontWeight: 700,
  cursor: "pointer",
};
