"use client";

import {useCallback, useEffect, useState} from "react";
import {useRouter} from "next/navigation";
import {useAuth} from "@/features/auth/hooks/useAuth";
import {isProviderRole} from "@/lib/roles";
import {profileCustomizationApi, errorUtils} from "@/lib/api";
import {PageContainer} from "@/components/layout/PageContainer";
import {
  ScheduleEditor,
  type DaySchedule,
} from "@/features/schedule/ScheduleEditor";

export default function SchedulePage() {
  const {user} = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [schedule, setSchedule] = useState<DaySchedule[]>([]);
  const [message, setMessage] = useState<{type: "ok" | "err"; text: string} | null>(null);
  const [editorKey, setEditorKey] = useState(0);

  useEffect(() => {
    if (user && !isProviderRole(user.role)) {
      router.replace("/me");
    }
  }, [user, router]);

  const load = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await profileCustomizationApi.getAvailabilitySchedule();
      const raw = res.data;
      const list = Array.isArray(raw) ? raw : raw?.schedule || raw?.results || [];
      setSchedule(list);
      setEditorKey((k) => k + 1);
    } catch (err) {
      setMessage({type: "err", text: errorUtils.getErrorMessage(err)});
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user && isProviderRole(user.role)) load();
  }, [user, load]);

  const handleSave = async (next: DaySchedule[]) => {
    setSaving(true);
    setMessage(null);
    try {
      await profileCustomizationApi.updateAvailabilitySchedule(next);
      setMessage({type: "ok", text: "Horario guardado correctamente."});
      setSchedule(next);
      setEditorKey((k) => k + 1);
    } catch (err) {
      setMessage({type: "err", text: errorUtils.getErrorMessage(err)});
    } finally {
      setSaving(false);
    }
  };

  if (!user || !isProviderRole(user.role)) {
    return <p style={{color: "#64748b"}}>Redirigiendo…</p>;
  }

  return (
    <PageContainer size="md">
      <h1 className="nabbi-page-title">Mis horarios</h1>
      <p className="nabbi-page-sub">Disponibilidad semanal para reservas.</p>
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
      {loading ? (
        <p style={{color: "#64748b"}}>Cargando…</p>
      ) : (
        <ScheduleEditor
          key={editorKey}
          initialSchedule={schedule}
          onSave={handleSave}
          saving={saving}
        />
      )}
    </PageContainer>
  );
}
