"use client";

import {useCallback, useEffect, useState} from "react";
import {useRouter} from "next/navigation";
import {StarIcon} from "@heroicons/react/24/outline";
import {
  CardHeader,
  PageHeaderRow,
  StackLayout,
} from "@/components/layout";
import {usePageHeader} from "@/components/shell/usePageHeader";
import {useAuth} from "@/features/auth/hooks/useAuth";
import {isProviderRole} from "@/lib/roles";
import {publicProfileApi, reviewApi, errorUtils} from "@/lib/api";

export default function MisResenasPage() {
  usePageHeader({title: "Mis reseñas", pageOwnsTitle: true});
  const {user, isInitializing} = useAuth();
  const router = useRouter();
  const [reviews, setReviews] = useState<
    Array<{
      id: number;
      rating?: number;
      from_user_name?: string;
      author_name?: string;
      message?: string;
      comment?: string;
    }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profileId, setProfileId] = useState<number | null>(null);

  useEffect(() => {
    if (!isInitializing && user && !isProviderRole(user.role)) {
      router.replace("/me");
    }
  }, [user, isInitializing, router]);

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
    <StackLayout>
      <PageHeaderRow
        title="Mis reseñas"
        description={`Lo que dicen tus clientes${profileId ? ` · perfil #${profileId}` : ""}.`}
      />

      {!loading && reviews.length > 0 ? (
        <section className="rounded-[var(--card-radius)] border border-card-border bg-card p-[var(--card-pad)] shadow-card">
          <CardHeader
            title={`Promedio ${avg.toFixed(1)} · ${reviews.length} reseña${reviews.length === 1 ? "" : "s"}`}
            icon={StarIcon}
          />
        </section>
      ) : null}

      {loading ? (
        <p className="text-foreground-secondary">Cargando…</p>
      ) : null}
      {error ? (
        <div className="rounded-[var(--control-radius)] border border-error/40 bg-error/10 px-3 py-2.5 text-error">
          {error}
        </div>
      ) : null}
      {!loading && !error && reviews.length === 0 ? (
        <p className="text-foreground-secondary">Todavía no tienes reseñas.</p>
      ) : null}

      <div className="flex flex-col gap-2.5">
        {reviews.map((r) => (
          <article
            key={r.id}
            className="rounded-[var(--card-radius)] border border-card-border bg-card p-[var(--card-pad)] shadow-card">
            <div className="font-extrabold text-primary">
              {"★".repeat(Math.round(Number(r.rating) || 0))}
            </div>
            <div className="mt-1 text-[13px] font-semibold text-foreground-secondary">
              {r.from_user_name || r.author_name || "Cliente"}
            </div>
            {r.message || r.comment ? (
              <p className="mt-2 mb-0 text-[14px] leading-relaxed text-foreground">
                {r.message || r.comment}
              </p>
            ) : null}
          </article>
        ))}
      </div>
    </StackLayout>
  );
}
