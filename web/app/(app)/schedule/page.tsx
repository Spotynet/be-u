"use client";

import {useCallback, useEffect, useState} from "react";
import {useRouter} from "next/navigation";
import {ClockIcon} from "@heroicons/react/24/outline";
import {
  CardHeader,
  PageHeaderRow,
  StackLayout,
} from "@/components/layout";
import {usePageHeader} from "@/components/shell/usePageHeader";
import {useAuth} from "@/features/auth/hooks/useAuth";
import {isProviderRole} from "@/lib/roles";
import {profileCustomizationApi, errorUtils} from "@/lib/api";
import {
  ScheduleEditor,
  type DaySchedule,
} from "@/features/schedule/ScheduleEditor";

export default function SchedulePage() {
  usePageHeader({title: "Mis horarios", pageOwnsTitle: true});
  const {user} = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [schedule, setSchedule] = useState<DaySchedule[]>([]);
  const [message, setMessage] = useState<{
    type: "ok" | "err";
    text: string;
  } | null>(null);
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
      const list = Array.isArray(raw)
        ? raw
        : raw?.schedule || raw?.results || [];
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
    return <p className="text-foreground-secondary">Redirigiendo…</p>;
  }

  return (
    <StackLayout>
      <PageHeaderRow
        title="Mis horarios"
        description="Disponibilidad semanal para reservas."
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
      <section className="rounded-[var(--card-radius)] border border-card-border bg-card p-[var(--card-pad)] shadow-card">
        <CardHeader title="Disponibilidad" icon={ClockIcon} />
        <div className="mt-4">
          {loading ? (
            <p className="text-foreground-secondary">Cargando…</p>
          ) : (
            <ScheduleEditor
              key={editorKey}
              initialSchedule={schedule}
              onSave={handleSave}
              saving={saving}
            />
          )}
        </div>
      </section>
    </StackLayout>
  );
}
