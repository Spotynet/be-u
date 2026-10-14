"use client";

import {PageContainer} from "@/components/layout/PageContainer";

import {useCallback, useEffect, useState} from "react";
import {useRouter} from "next/navigation";
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

const INK = "#12211A";
const MAIN = "#558367";

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

  const [placeId, setPlaceId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepted, setAccepted] = useState<PlaceProfessionalLink[]>([]);
  const [invited, setInvited] = useState<PlaceProfessionalLink[]>([]);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{type: "ok" | "err"; text: string} | null>(null);

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

  if (!provider) return <p style={{color: "#64748b"}}>Redirigiendo…</p>;

  return (
    <PageContainer size="lg">
      <h1 className="nabbi-page-title">{isPlace ? "Equipo" : "Vinculaciones"}</h1>
      <p className="nabbi-page-sub">
        {isPlace
          ? "Invita profesionales a tu establecimiento."
          : "Acepta o gestiona invitaciones de lugares."}
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

      {isPlace && (
        <div
          style={{
            background: "white",
            border: "1px solid rgba(18,33,26,0.08)",
            borderRadius: 16,
            padding: 16,
            marginBottom: 20,
          }}>
          <div style={{fontWeight: 800, marginBottom: 10}}>Invitar profesional</div>
          <div className="nabbi-stack-row">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre o email"
              style={{
                flex: "1 1 180px",
                border: "1px solid rgba(18,33,26,0.15)",
                borderRadius: 10,
                padding: "10px 12px",
              }}
            />
            <button type="button" onClick={performSearch} disabled={busy} style={primaryBtn}>
              Buscar
            </button>
          </div>
          {results.length > 0 && (
            <ul style={{listStyle: "none", padding: 0, marginTop: 12}}>
              {results.map((p) => {
                const name =
                  p.name ||
                  [p.first_name, p.last_name].filter(Boolean).join(" ") ||
                  p.user?.username ||
                  `Pro #${p.id}`;
                return (
                  <li
                    key={p.id}
                    className="nabbi-stack-row"
                    style={{
                      justifyContent: "space-between",
                      padding: "10px 0",
                      borderBottom: "1px solid rgba(18,33,26,0.06)",
                    }}>
                    <div style={{flex: "1 1 140px", minWidth: 0}}>
                      <div style={{fontWeight: 700, wordBreak: "break-word"}}>{name}</div>
                      <div style={{fontSize: 12, color: "#64748b", wordBreak: "break-all"}}>
                        {p.user?.email || p.email || ""}
                      </div>
                    </div>
                    <button type="button" onClick={() => invite(p.id)} disabled={busy} style={outlineBtn}>
                      Invitar
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {loading ? (
        <p style={{color: "#64748b"}}>Cargando…</p>
      ) : (
        <>
          <Section title="Aceptados">
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
                      <button type="button" onClick={() => remove(link.id)} style={dangerText}>
                        Quitar
                      </button>
                    ) : null
                  }
                />
              ))
            )}
          </Section>

          <Section title="Invitaciones">
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
                      <span style={{display: "flex", gap: 8}}>
                        <button type="button" onClick={() => accept(link.id)} disabled={busy} style={outlineBtn}>
                          Aceptar
                        </button>
                        <button type="button" onClick={() => reject(link.id)} disabled={busy} style={dangerText}>
                          Rechazar
                        </button>
                      </span>
                    ) : (
                      <button type="button" onClick={() => remove(link.id)} style={dangerText}>
                        Cancelar
                      </button>
                    )
                  }
                />
              ))
            )}
          </Section>
        </>
      )}
    </PageContainer>
  );
}

function Section({title, children}: {title: string; children: React.ReactNode}) {
  return (
    <div style={{marginBottom: 24}}>
      <h2 style={{fontSize: 16, fontWeight: 800, color: INK, marginBottom: 10}}>{title}</h2>
      <div style={{display: "flex", flexDirection: "column", gap: 8}}>{children}</div>
    </div>
  );
}

function Empty() {
  return <p style={{color: "#64748b", fontSize: 14}}>Ninguno por ahora.</p>;
}

function LinkRow({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div
      className="nabbi-stack-row"
      style={{
        background: "white",
        border: "1px solid rgba(18,33,26,0.08)",
        borderRadius: 12,
        padding: "12px 14px",
        justifyContent: "space-between",
      }}>
      <div style={{flex: "1 1 140px", minWidth: 0}}>
        <div style={{fontWeight: 700, color: INK, wordBreak: "break-word"}}>{title}</div>
        {subtitle && <div style={{fontSize: 12, color: "#64748b"}}>{subtitle}</div>}
      </div>
      {actions}
    </div>
  );
}

const primaryBtn: React.CSSProperties = {
  background: MAIN,
  color: "white",
  border: "none",
  borderRadius: 10,
  padding: "10px 14px",
  fontWeight: 800,
  cursor: "pointer",
};

const outlineBtn: React.CSSProperties = {
  background: "rgba(85,131,103,0.12)",
  color: MAIN,
  border: "none",
  borderRadius: 10,
  padding: "8px 12px",
  fontWeight: 700,
  cursor: "pointer",
  fontSize: 13,
};

const dangerText: React.CSSProperties = {
  background: "transparent",
  border: "none",
  color: "#dc2626",
  fontWeight: 700,
  cursor: "pointer",
  fontSize: 13,
};
