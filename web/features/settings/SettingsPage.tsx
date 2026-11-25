"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {ChevronLeftIcon} from "@heroicons/react/24/outline";
import {PageHeaderRow, TabsGridLayout} from "@/components/layout";
import {EmptyState} from "@/components/ui/EmptyState";
import {Button} from "@/components/ui/Button";
import {Dialog} from "@/components/ui/Dialog";
import {useToast} from "@/components/ui/Toast";
import {useAuth} from "@/features/auth/hooks/useAuth";
import {errorUtils, notificationApi} from "@/lib/api";
import {StickySaveBar} from "./components/StickySaveBar";
import {SettingsTabs} from "./components/SettingsTabs";
import {SettingsMasterList} from "./components/SettingsMasterList";
import {
  CLIENT_CAPABILITIES,
  visibleSections,
  type SettingsSectionId,
} from "./settingsConfig";
import {findUnmappedKeys} from "./preferenceLabels";
import {useSettingsSection} from "./useSettingsSection";
import {useSettingsLayoutMode} from "./useSettingsLayoutMode";
import {
  NotificationsSection,
  NotificationsSkeleton,
} from "./sections/NotificationsSection";
import {PreferencesSection} from "./sections/PreferencesSection";
import {SecuritySection} from "./sections/SecuritySection";
import {PrivacySection} from "./sections/PrivacySection";
import {AccountSection} from "./sections/AccountSection";

function prefsEqual(
  a: Record<string, boolean>,
  b: Record<string, boolean>,
): boolean {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const k of keys) {
    if ((a[k] !== false) !== (b[k] !== false)) return false;
  }
  return true;
}

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function SettingsPage() {
  const caps = CLIENT_CAPABILITIES;
  const sections = useMemo(() => visibleSections(caps), [caps]);
  const validIds = useMemo(() => sections.map((s) => s.id), [sections]);
  const {seccion, setSeccion} = useSettingsSection(validIds);
  const toast = useToast();
  const {user} = useAuth();

  const rootRef = useRef<HTMLDivElement | null>(null);
  const headingRef = useRef<HTMLHeadingElement | null>(null);
  const listScrollRef = useRef(0);
  const mode = useSettingsLayoutMode(rootRef);

  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const [draft, setDraft] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [pendingNav, setPendingNav] = useState<string | null | "list">(null);
  const unmappedRef = useRef<string[]>([]);

  const dirty = useMemo(() => !prefsEqual(draft, saved), [draft, saved]);
  const dirtyIds = useMemo(() => {
    const set = new Set<string>();
    if (dirty) set.add("notificaciones");
    return set;
  }, [dirty]);

  const activeDesktop =
    seccion ?? (sections[0]?.id as SettingsSectionId | undefined) ?? "notificaciones";

  /* Desktop/mid: ensure ?seccion= always set */
  useEffect(() => {
    if (mode === "mobile") return;
    if (!seccion && sections[0]) {
      setSeccion(sections[0].id, {method: "replace"});
    }
  }, [mode, seccion, sections, setSeccion]);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await notificationApi.getPreferences();
      const prefs = res.data?.preferences || {};
      setSaved(prefs);
      setDraft(prefs);
      unmappedRef.current = findUnmappedKeys(Object.keys(prefs));
    } catch (err) {
      setLoadError(errorUtils.getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  /* Focus + scroll top on section change (detail / tabs) */
  useEffect(() => {
    if (mode === "mobile" && !seccion) return;
    const id = mode === "mobile" ? seccion : activeDesktop;
    if (!id) return;
    const reduce = prefersReducedMotion();
    const scrollRoot =
      document.querySelector(".nabbi-shell-panel__scroll") || window;
    if (scrollRoot === window) {
      window.scrollTo({top: 0, behavior: reduce ? "auto" : "smooth"});
    } else {
      (scrollRoot as HTMLElement).scrollTo({
        top: 0,
        behavior: reduce ? "auto" : "smooth",
      });
    }
    window.requestAnimationFrame(() => {
      headingRef.current?.focus();
    });
  }, [seccion, activeDesktop, mode]);

  const requestNav = (id: string | null, opts?: {push?: boolean}) => {
    const leavingDirty =
      dirty &&
      (mode === "mobile"
        ? seccion === "notificaciones"
        : activeDesktop === "notificaciones") &&
      id !== "notificaciones";

    if (leavingDirty) {
      setPendingNav(id === null ? "list" : id);
      return;
    }

    if (mode === "mobile") {
      if (id === null) {
        listScrollRef.current =
          (document.querySelector(".nabbi-shell-panel__scroll") as HTMLElement)
            ?.scrollTop ?? window.scrollY;
        setSeccion(null, {method: "replace"});
        window.requestAnimationFrame(() => {
          const root = document.querySelector(
            ".nabbi-shell-panel__scroll",
          ) as HTMLElement | null;
          if (root) root.scrollTop = listScrollRef.current;
          else window.scrollTo(0, listScrollRef.current);
        });
      } else {
        listScrollRef.current =
          (document.querySelector(".nabbi-shell-panel__scroll") as HTMLElement)
            ?.scrollTop ?? window.scrollY;
        setSeccion(id, {method: opts?.push ? "push" : "push"});
      }
      return;
    }

    setSeccion(id ?? sections[0]?.id ?? "notificaciones", {
      method: "replace",
    });
  };

  const confirmDiscard = () => {
    setDraft(saved);
    setSaveError(null);
    const target = pendingNav;
    setPendingNav(null);
    if (target === "list") {
      setSeccion(null, {method: "replace"});
    } else if (typeof target === "string") {
      setSeccion(target, {
        method: mode === "mobile" ? "push" : "replace",
      });
    }
  };

  const onToggle = (key: string, next: boolean) => {
    setDraft((d) => ({...d, [key]: next}));
    setSaveError(null);
  };

  const onBulk = (keys: string[], next: boolean) => {
    setDraft((d) => {
      const copy = {...d};
      keys.forEach((k) => {
        copy[k] = next;
      });
      return copy;
    });
    setSaveError(null);
  };

  const discard = () => {
    setDraft(saved);
    setSaveError(null);
  };

  const save = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      const res = await notificationApi.savePreferences(draft);
      const next = res.data?.preferences || draft;
      setSaved(next);
      setDraft(next);
      toast.success("Preferencias guardadas");
    } catch (err) {
      const msg = errorUtils.getErrorMessage(err);
      setSaveError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const activeSection = sections.find(
    (s) => s.id === (mode === "mobile" ? seccion : activeDesktop),
  );

  const statusById = useMemo(() => {
    const out: Partial<Record<string, string>> = {};
    if (user?.emailVerified) out.seguridad = "Verificado";
    return out;
  }, [user?.emailVerified]);

  const renderSectionBody = (id: string) => {
    switch (id) {
      case "notificaciones":
        if (loading) return <NotificationsSkeleton />;
        if (loadError) {
          return (
            <div className="nabbi-settings-card nabbi-settings-card--span-full">
              <EmptyState
                title="No pudimos cargar las preferencias"
                description={loadError}
                primaryAction={{label: "Reintentar", onClick: () => void load()}}
                size="sm"
              />
            </div>
          );
        }
        return (
          <>
            <NotificationsSection
              draft={draft}
              disabled={saving}
              onToggle={onToggle}
              onBulk={onBulk}
            />
            {saveError ? (
              <p className="mt-2 text-[13px] font-medium text-error" role="alert">
                {saveError}
              </p>
            ) : null}
          </>
        );
      case "preferencias":
        return <PreferencesSection caps={caps} />;
      case "seguridad":
        return <SecuritySection caps={caps} />;
      case "privacidad":
        return <PrivacySection />;
      case "cuenta":
        return <AccountSection caps={caps} />;
      default:
        return null;
    }
  };

  const showMobileList = mode === "mobile" && !seccion;
  const showMobileDetail = mode === "mobile" && !!seccion;
  const showTabs = mode !== "mobile";
  const showSaveBar =
    dirty &&
    !loading &&
    !loadError &&
    (mode === "mobile"
      ? seccion === "notificaciones"
      : activeDesktop === "notificaciones");

  return (
    <TabsGridLayout>
    <div ref={rootRef} className="nabbi-settings @container/settings">
      {showMobileDetail ? (
        <div className="nabbi-settings-detail-head">
          <button
            type="button"
            className="nabbi-settings-back"
            aria-label="Volver a Configuración"
            onClick={() => {
              if (dirty && seccion === "notificaciones") {
                setPendingNav("list");
                return;
              }
              /* UI back clears seccion; hardware back uses history from push. */
              setSeccion(null, {method: "replace"});
              window.requestAnimationFrame(() => {
                const root = document.querySelector(
                  ".nabbi-shell-panel__scroll",
                ) as HTMLElement | null;
                if (root) root.scrollTop = listScrollRef.current;
                else window.scrollTo(0, listScrollRef.current);
              });
            }}>
            <ChevronLeftIcon className="h-5 w-5" aria-hidden />
          </button>
          <h1 className="sr-only">Configuración</h1>
          <h2
            ref={headingRef}
            tabIndex={-1}
            className="nabbi-settings-detail-title outline-none">
            {activeSection?.label ?? "Configuración"}
          </h2>
        </div>
      ) : (
        <PageHeaderRow title="Configuración" />
      )}

      {showTabs ? (
        <SettingsTabs
          sections={sections}
          active={activeDesktop}
          dirtyIds={dirtyIds}
          onSelect={(id) => requestNav(id)}
          variant={mode === "desktop" ? "tabs" : "chips"}
        />
      ) : null}

      <span className="sr-only" aria-live="polite">
        {showMobileList
          ? ""
          : activeSection
            ? activeSection.label
            : ""}
      </span>

      {showMobileList ? (
        <div className="nabbi-settings-master-wrap nabbi-settings-enter">
          <SettingsMasterList
            sections={sections}
            dirtyIds={dirtyIds}
            statusById={statusById}
            onSelect={(id) => requestNav(id, {push: true})}
          />
        </div>
      ) : null}

      {showMobileDetail && seccion ? (
        <div
          id={`settings-panel-${seccion}`}
          role="region"
          aria-label={activeSection?.label}
          className={[
            "nabbi-settings-panel nabbi-settings-enter",
            showSaveBar ? "has-savebar" : "",
          ].join(" ")}>
          {renderSectionBody(seccion)}
        </div>
      ) : null}

      {showTabs ? (
        <div
          id={`settings-panel-${activeDesktop}`}
          role="tabpanel"
          aria-labelledby={`settings-tab-${activeDesktop}`}
          className={[
            "nabbi-settings-panel nabbi-settings-enter",
            showSaveBar ? "has-savebar" : "",
          ].join(" ")}>
          <h2 ref={headingRef} tabIndex={-1} className="sr-only outline-none">
            {activeSection?.label}
          </h2>
          {renderSectionBody(activeDesktop)}
        </div>
      ) : null}

      <StickySaveBar
        visible={showSaveBar}
        saving={saving}
        onDiscard={discard}
        onSave={() => void save()}
      />

      <Dialog
        open={pendingNav !== null}
        onClose={() => setPendingNav(null)}
        title="Descartar cambios?"
        description="Tienes cambios sin guardar en Notificaciones."
        size="sm"
        footer={
          <>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setPendingNav(null)}>
              Cancelar
            </Button>
            <Button
              type="button"
              variant="error"
              size="sm"
              onClick={confirmDiscard}>
              Descartar
            </Button>
          </>
        }
      />
    </div>
    </TabsGridLayout>
  );
}
