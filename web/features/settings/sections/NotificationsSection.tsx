"use client";

import {useId, useMemo} from "react";
import {
  AtSymbolIcon,
  BellIcon,
  CalendarDaysIcon,
  ChatBubbleLeftIcon,
  EnvelopeIcon,
  HeartIcon,
  InformationCircleIcon,
  MapPinIcon,
  MegaphoneIcon,
  SparklesIcon,
  StarIcon,
  TagIcon,
  UserPlusIcon,
} from "@heroicons/react/24/outline";
import {SettingsCard} from "../components/SettingsCard";
import {SettingsRow} from "../components/SettingsRow";
import {
  SettingsPeersGrid,
  SettingsSectionGrid,
} from "../components/SettingsSectionGrid";
import {
  PREFERENCE_GROUPS,
  resolvePrefMeta,
  type PrefMeta,
} from "../preferenceLabels";

const ICONS: Record<PrefMeta["icon"], typeof BellIcon> = {
  bell: BellIcon,
  calendar: CalendarDaysIcon,
  heart: HeartIcon,
  chat: ChatBubbleLeftIcon,
  at: AtSymbolIcon,
  userPlus: UserPlusIcon,
  star: StarIcon,
  mapPin: MapPinIcon,
  tag: TagIcon,
  megaphone: MegaphoneIcon,
  sparkles: SparklesIcon,
  envelope: EnvelopeIcon,
};

type Props = {
  draft: Record<string, boolean>;
  disabled?: boolean;
  onToggle: (key: string, next: boolean) => void;
  onBulk: (keys: string[], next: boolean) => void;
};

export function NotificationsSection({
  draft,
  disabled,
  onToggle,
  onBulk,
}: Props) {
  const noteId = useId();
  const keys = useMemo(() => Object.keys(draft), [draft]);

  const grouped = useMemo(() => {
    const claimed = new Set<string>();
    const groups = PREFERENCE_GROUPS.map((g) => {
      const present = g.keys.filter((k) => keys.includes(k));
      present.forEach((k) => claimed.add(k));
      return {...g, present};
    }).filter((g) => g.present.length > 0);

    const other = keys.filter((k) => !claimed.has(k));
    if (other.length) {
      groups.push({
        id: "other",
        title: "Otras preferencias",
        keys: other,
        present: other,
        showBulkToggle: true,
      });
    }
    return groups;
  }, [keys]);

  const channelGroup = grouped.find((g) => g.id === "channels");
  const contentGroups = grouped.filter((g) => g.id !== "channels");
  const channelsOff =
    draft.channel_push === false && draft.channel_email === false;

  return (
    <SettingsSectionGrid layout="grid">
      {channelGroup ? (
        <SettingsCard
          title={channelGroup.title}
          description="Elige por donde recibes tus notificaciones."
          span="full"
          headingAs="h3">
          <div className="nabbi-settings-channels">
            {channelGroup.present.map((key) => {
              const meta = resolvePrefMeta(key);
              const Icon = ICONS[meta.icon] ?? BellIcon;
              const on = draft[key] !== false;
              return (
                <div key={key} className="nabbi-settings-channels__cell">
                  <SettingsRow
                    title={meta.label}
                    description={meta.description}
                    icon={Icon}
                    checked={on}
                    disabled={disabled}
                    dense
                    onCheckedChange={(next) => onToggle(key, next)}
                  />
                </div>
              );
            })}
          </div>
          <div
            className={[
              "nabbi-settings-note-wrap",
              channelsOff ? "is-open" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            aria-hidden={!channelsOff}>
            <div className="nabbi-settings-note-wrap__inner">
              <p id={noteId} className="nabbi-settings-inline-note" role="note">
                <InformationCircleIcon
                  className="nabbi-settings-inline-note__icon h-4 w-4 shrink-0"
                  strokeWidth={1.75}
                  aria-hidden
                />
                <span>
                  Con ambos canales desactivados solo verás los avisos dentro de
                  la app.
                </span>
              </p>
            </div>
          </div>
        </SettingsCard>
      ) : null}

      {contentGroups.length > 0 ? (
        <SettingsPeersGrid>
          {contentGroups.map((group) => {
            const allOn = group.present.every((k) => draft[k] !== false);
            const bulkLabel = allOn ? "Desactivar todo" : "Activar todo";
            const bulkAria = allOn
              ? `Desactivar todas las notificaciones de ${group.title}`
              : `Activar todas las notificaciones de ${group.title}`;

            return (
              <SettingsCard
                key={group.id}
                title={group.title}
                headingAs="h3"
                className="nabbi-settings-card--group"
                actionTone="compact"
                action={
                  group.showBulkToggle ? (
                    <button
                      type="button"
                      disabled={disabled}
                      className="nabbi-settings-group__bulk"
                      aria-label={bulkAria}
                      onClick={() =>
                        onBulk(group.present, allOn ? false : true)
                      }>
                      {bulkLabel}
                    </button>
                  ) : undefined
                }>
                <div className="nabbi-settings-group__list">
                  {group.present.map((key) => {
                    const meta = resolvePrefMeta(key);
                    const Icon = ICONS[meta.icon] ?? BellIcon;
                    const on = draft[key] !== false;
                    return (
                      <SettingsRow
                        key={key}
                        title={meta.label}
                        description={meta.description}
                        icon={Icon}
                        checked={on}
                        disabled={disabled}
                        onCheckedChange={(next) => onToggle(key, next)}
                      />
                    );
                  })}
                </div>
              </SettingsCard>
            );
          })}
        </SettingsPeersGrid>
      ) : null}

      {keys.length === 0 ? (
        <p className="nabbi-settings-empty">No hay preferencias disponibles.</p>
      ) : null}
    </SettingsSectionGrid>
  );
}

export function NotificationsSkeleton() {
  return (
    <div aria-busy="true" aria-label="Cargando preferencias">
      <SettingsSectionGrid layout="grid">
        <div className="nabbi-settings-card nabbi-settings-card--span-full p-4">
          <div className="nabbi-settings-channels">
            {[0, 1].map((i) => (
              <div key={i} className="nabbi-settings-channels__cell">
                <div className="nabbi-settings-row nabbi-settings-row--channel">
                  <div className="h-10 w-10 animate-pulse rounded-xl bg-foreground-muted/15" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="h-3.5 w-2/5 animate-pulse rounded bg-foreground-muted/15" />
                    <div className="h-3 w-3/5 animate-pulse rounded bg-foreground-muted/15" />
                  </div>
                  <div className="h-[26px] w-11 shrink-0 animate-pulse rounded-full bg-foreground-muted/15" />
                </div>
              </div>
            ))}
          </div>
        </div>
        <SettingsPeersGrid>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="nabbi-settings-card p-4">
              <div className="mb-3 h-4 w-24 animate-pulse rounded bg-foreground-muted/15" />
              {[0, 1].map((j) => (
                <div key={j} className="mb-2 flex min-h-14 items-center gap-3.5">
                  <div className="h-9 w-9 animate-pulse rounded-xl bg-foreground-muted/15" />
                  <div className="h-3 w-1/2 animate-pulse rounded bg-foreground-muted/15" />
                </div>
              ))}
            </div>
          ))}
        </SettingsPeersGrid>
      </SettingsSectionGrid>
    </div>
  );
}
