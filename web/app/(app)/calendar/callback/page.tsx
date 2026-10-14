"use client";

import {Suspense, useEffect, useState} from "react";
import {useRouter, useSearchParams} from "next/navigation";
import {PageContainer} from "@/components/layout/PageContainer";
import {calendarApi, getCalendarRedirectUri, errorUtils} from "@/lib/api";

function CalendarCallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      const code = searchParams.get("code") || undefined;
      const state = searchParams.get("state") || undefined;
      const oauthError = searchParams.get("error");
      if (oauthError) {
        router.replace(
          `/google-calendar?error=${encodeURIComponent(oauthError)}`
        );
        return;
      }
      if (!code) {
        setError("Falta el código de autorización.");
        return;
      }
      try {
        const redirectUri = getCalendarRedirectUri();
        await calendarApi.exchangeCode(code, state, redirectUri);
        router.replace("/google-calendar?connected=1");
      } catch (err) {
        setError(errorUtils.getErrorMessage(err));
      }
    };
    run();
  }, [searchParams, router]);

  if (error) {
    return (
      <PageContainer size="sm">
        <p style={{color: "#dc2626"}}>{error}</p>
        <button
          type="button"
          onClick={() => router.replace("/google-calendar")}
          style={{
            marginTop: 12,
            background: "#558367",
            color: "white",
            border: "none",
            borderRadius: 12,
            padding: "10px 14px",
            fontWeight: 700,
            cursor: "pointer",
          }}>
          Volver a Google Calendar
        </button>
      </PageContainer>
    );
  }

  return (
    <PageContainer size="sm">
      <p style={{color: "#64748b"}}>Conectando Google Calendar…</p>
    </PageContainer>
  );
}

export default function CalendarCallbackPage() {
  return (
    <Suspense fallback={<p style={{color: "#64748b"}}>Conectando…</p>}>
      <CalendarCallbackInner />
    </Suspense>
  );
}
