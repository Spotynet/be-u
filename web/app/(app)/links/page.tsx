"use client";

import {
  useCallback,
  useEffect,
  useState,
  type ComponentType,
  type ReactNode,
  type SVGProps,
} from "react";
import {useRouter} from "next/navigation";
import {
  CheckCircleIcon,
  InboxArrowDownIcon,
  UserPlusIcon,
} from "@heroicons/react/24/outline";
import {
  CardHeader,
  PageHeaderRow,
  StackLayout,
} from "@/components/layout";
import {Button} from "@/components/ui/Button";
import {Input} from "@/components/ui/Input";
import {usePageHeader} from "@/components/shell/usePageHeader";
import {useAuth} from "@/features/auth/hooks/useAuth";
import {isProviderRole, normalizeRole} from "@/lib/roles";
import {
  authApi,
  linkApi,
  profileApi,
  publicProfileApi,
  type PlaceProfessionalLink,
  errorUtils,
} from "@/lib/api";

function normalizeList(response: any): PlaceProfessionalLink[] {
  if (!response) return [];
  const payload = response.data ?? response;
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
}

export default function LinksPage() {
  const {user} = useAuth();
  const router = useRouter();
  const isPlace = normalizeRole(user?.role) === "PLACE";
  const provider = isProviderRole(user?.role);
  const pageTitle = isPlace ? "Equipo" : "Vinculaciones";

  usePageHeader({title: pageTitle, pageOwnsTitle: true});

  const [placeId, setPlaceId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepted, setAccepted] = useState<PlaceProfessionalLink[]>([]);
  const [invited, setInvited] = useState<PlaceProfessionalLink[]>([]);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{type: "ok" | "err"; text: string} | null>(
    null,
  );

  useEffect(() => {
    if (user && !provider) router.replace("/me");
  }, [user, provider, router]);

  const fetchLinks = useCallback(async (pid?: number | null) => {
    try {
      if (pid) {
        const [a, i] = await Promise.all([
          linkApi.listPlaceLinks(pid, "ACCEPTED"),
          linkApi.listPlaceLinks(pid, "INVITED"),
        ]);
        setAccepted(normalizeList(a));
        setInvited(normalizeList(i));
      } else {
        const [a, i] = await Promise.all([
          linkApi.listMyLinks({status: "ACCEPTED"}),
          linkApi.listMyLinks({status: "INVITED"}),
        ]);
        setAccepted(normalizeList(a));
        setInvited(normalizeList(i));
      }
    } catch (err) {
      setMessage({type: "err", text: errorUtils.getErrorMessage(err)});
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      if (!user || !provider) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        let pid: number | null = null;
        if (isPlace) {
          try {
            const profileResp = await authApi.getProfile();
            pid = profileResp.data?.profile?.id ?? null;
          } catch {
            /* ignore */
          }
          if (!pid) {
            try {
              const my = await publicProfileApi.getMyProfile();
              pid =
                my.data?.place_profile_id ||
                my.data?.place_id ||
                my.data?.id ||
                null;
            } catch {
              /* ignore */
            }
          }
          setPlaceId(pid);
        }
        await fetchLinks(isPlace ? pid : undefined);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [user, provider, isPlace, fetchLinks]);

  const performSearch = async () => {
    if (!search.trim()) {
      setResults([]);
      return;
    }
    setBusy(true);
    try {
      const resp = await profileApi.searchProfessionals({search: search.trim()});
      const data = (resp.data?.results ?? resp.data) as any[];
      setResults(Array.isArray(data) ? data : []);
    } catch (err) {
      setMessage({type: "err", text: errorUtils.getErrorMessage(err)});
    } finally {
      setBusy(false);
    }
  };

  const invite = async (professionalId: number) => {
    if (!placeId) {
      setMessage({
        type: "err",
        text: "No encontramos el identificador de tu establecimiento.",
      });
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      await linkApi.inviteProfessionalToPlace(placeId, professionalId);
      setMessage({type: "ok", text: "Invitación enviada."});
      setSearch("");
      setResults([]);
      await fetchLinks(placeId);
    } catch (err) {
      setMessage({type: "err", text: errorUtils.getErrorMessage(err)});
    } finally {
      setBusy(false);
    }
  };

  const accept = async (linkId: number) => {
    setBusy(true);
    try {
      await linkApi.acceptInvite(linkId);
      setMessage({type: "ok", text: "Invitación aceptada."});
      await fetchLinks();
    } catch (err) {
      setMessage({type: "err", text: errorUtils.getErrorMessage(err)});
    } finally {
      setBusy(false);
    }
  };

  const reject = async (linkId: number) => {
    setBusy(true);
    try {
      await linkApi.rejectInvite(linkId);
      await fetchLinks();
    } catch (err) {
      setMessage({type: "err", text: errorUtils.getErrorMessage(err)});
    } finally {
      setBusy(false);
    }
  };

  const remove = async (linkId: number) => {
    if (!confirm("¿Quitar este vínculo?")) return;
    setBusy(true);
    try {
      await linkApi.removeLink(linkId);
      await fetchLinks(placeId);
    } catch (err) {
      setMessage({type: "err", text: errorUtils.getErrorMessage(err)});
    } finally {
      setBusy(false);
    }
  };

  if (!provider) {
    return <p className="text-foreground-secondary">Redirigiendo…</p>;
  }

  return (
    <StackLayout>
      <PageHeaderRow
        title={pageTitle}
        description={
          isPlace
            ? "Invita profesionales a tu establecimiento."
            : "Acepta o gestiona invitaciones de lugares."
        }
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

      {isPlace ? (
        <section className="rounded-[var(--card-radius)] border border-card-border bg-card p-[var(--card-pad)] shadow-card">
          <CardHeader title="Invitar profesional" icon={UserPlusIcon} />
          <div className="mt-4 flex flex-col gap-3">
            <div className="flex flex-wrap items-end gap-2">
              <div className="min-w-[180px] flex-1">
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar por nombre o email"
                />
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={performSearch}
                disabled={busy}>
                Buscar
              </Button>
            </div>
            {results.length > 0 ? (
              <ul className="m-0 list-none p-0">
                {results.map((p) => {
                  const name =
                    p.name ||
                    [p.first_name, p.last_name].filter(Boolean).join(" ") ||
                    p.user?.username ||
                    `Pro #${p.id}`;
                  return (
                    <li
                      key={p.id}
                      className="flex flex-wrap items-center justify-between gap-2 border-b border-card-border py-2.5 last:border-b-0">
                      <div className="min-w-0 flex-1 basis-[140px]">
                        <div className="break-words font-bold text-foreground">
                          {name}
                        </div>
                        <div className="break-all text-[12px] text-foreground-secondary">
                          {p.user?.email || p.email || ""}
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => invite(p.id)}
                        disabled={busy}>
                        Invitar
                      </Button>
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </div>
        </section>
      ) : null}

      {loading ? (
        <p className="text-foreground-secondary">Cargando…</p>
      ) : (
        <>
          <Section title="Aceptados" icon={CheckCircleIcon}>
            {accepted.length === 0 ? (
              <Empty />
            ) : (
              accepted.map((link) => (
                <LinkRow
                  key={link.id}
                  title={isPlace ? link.professional_name : link.place_name}
                  subtitle={link.professional_email || link.status}
                  actions={
                    isPlace ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-error"
                        onClick={() => remove(link.id)}>
                        Quitar
                      </Button>
                    ) : null
                  }
                />
              ))
            )}
          </Section>

          <Section title="Invitaciones" icon={InboxArrowDownIcon}>
            {invited.length === 0 ? (
              <Empty />
            ) : (
              invited.map((link) => (
                <LinkRow
                  key={link.id}
                  title={isPlace ? link.professional_name : link.place_name}
                  subtitle={link.status}
                  actions={
                    !isPlace ? (
                      <span className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => accept(link.id)}
                          disabled={busy}>
                          Aceptar
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-error"
                          onClick={() => reject(link.id)}
                          disabled={busy}>
                          Rechazar
                        </Button>
                      </span>
                    ) : (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-error"
                        onClick={() => remove(link.id)}>
                        Cancelar
                      </Button>
                    )
                  }
                />
              ))
            )}
          </Section>
        </>
      )}
    </StackLayout>
  );
}

function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[var(--card-radius)] border border-card-border bg-card p-[var(--card-pad)] shadow-card">
      <CardHeader title={title} icon={Icon} />
      <div className="mt-4 flex flex-col gap-2">{children}</div>
    </section>
  );
}

function Empty() {
  return <p className="text-[14px] text-foreground-secondary">Ninguno por ahora.</p>;
}

function LinkRow({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-[var(--control-radius)] border border-card-border bg-background px-3.5 py-3">
      <div className="min-w-0 flex-1 basis-[140px]">
        <div className="break-words font-bold text-foreground">{title}</div>
        {subtitle ? (
          <div className="text-[12px] text-foreground-secondary">{subtitle}</div>
        ) : null}
      </div>
      {actions}
    </div>
  );
}