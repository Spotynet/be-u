"use client";

import {PageContainer} from "@/components/layout/PageContainer";

import {useCallback, useEffect, useState} from "react";
import {useRouter} from "next/navigation";
import {useAuth} from "@/features/auth/hooks/useAuth";
import {isProviderRole} from "@/lib/roles";
import {publicProfileApi, reviewApi, errorUtils} from "@/lib/api";

const INK = "#12211A";
const DARK = "#1F3328";
const MAIN = "#558367";

export default function MisResenasPage() {
  const {user, isLoading} = useAuth();
  const router = useRouter();
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profileId, setProfileId] = useState<number | null>(null);

  useEffect(() => {
    if (!isLoading && user && !isProviderRole(user.role)) {
      router.replace("/me");
    }
  }, [user, isLoading, router]);

  const load = useCallback(async () => {
    if (!user || !isProviderRole(user.role)) return;
    setLoading(true);
    setError(null);
    try {
      const myProfile = await publicProfileApi.getMyProfile();
      const pid = myProfile.data?.id;
      setProfileId(pid || null);
      if (!pid) {
        setReviews([]);
        return;
      }
      const res = await reviewApi.getReviews({public_profile: pid});
      setReviews(res.data.results || (Array.isArray(res.data) ? res.data : []));
    } catch (err) {
      setError(errorUtils.getErrorMessage(err));
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const avg =
    reviews.length > 0
      ? reviews.reduce((s, r) => s + Number(r.rating || 0), 0) / reviews.length
      : 0;

  return (
    <PageContainer size="md">
      <h1 className="nabbi-page-title">Mis reseñas</h1>
      <p className="nabbi-page-sub">
        Lo que dicen tus clientes{profileId ? ` · perfil #${profileId}` : ""}.
      </p>

      {!loading && reviews.length > 0 && (
        <div
          style={{
            background: "white",
            borderRadius: 14,
            border: "1px solid rgba(18,33,26,0.08)",
            padding: 16,
            marginBottom: 16,
            fontWeight: 800,
            color: INK,
          }}>
          Promedio {avg.toFixed(1)}★ · {reviews.length} reseña{reviews.length === 1 ? "" : "s"}
        </div>
      )}

      {loading && <p style={{color: "#64748b"}}>Cargando…</p>}
      {error && (
        <div style={{background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 12, padding: 12, color: "#dc2626"}}>
          {error}
        </div>
      )}
      {!loading && !error && reviews.length === 0 && (
        <p style={{color: "#64748b"}}>Todavía no tienes reseñas.</p>
      )}

      <div style={{display: "flex", flexDirection: "column", gap: 10}}>
        {reviews.map((r) => (
          <div
            key={r.id}
            style={{
              background: "white",
              borderRadius: 14,
              border: "1px solid rgba(18,33,26,0.08)",
              padding: 16,
            }}>
            <div style={{fontWeight: 800, color: MAIN}}>
              {"★".repeat(Math.round(Number(r.rating) || 0))}
            </div>
            <div style={{fontSize: 13, color: "#64748b", marginTop: 4, fontWeight: 600}}>
              {r.from_user_name || r.author_name || "Cliente"}
            </div>
            {(r.message || r.comment) && (
              <p style={{margin: "8px 0 0", color: DARK, fontSize: 14, lineHeight: 1.5}}>
                {r.message || r.comment}
              </p>
            )}
          </div>
        ))}
      </div>
    </PageContainer>
  );
}
