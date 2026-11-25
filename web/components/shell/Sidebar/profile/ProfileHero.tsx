"use client";

import {useEffect, useState} from "react";
import {useAuth} from "@/features/auth/hooks/useAuth";
import {roleLabelEs} from "@/lib/roles";
import {UserMenu} from "@/components/shell/UserMenu";
import {Tooltip} from "@/components/ui/Tooltip";
import {useNotificationsOptional} from "@/features/notifications";
import {AvatarRing} from "./AvatarRing";

export type ProfileHeroVariant = "full" | "compact" | "rail";

type Props = {
  variant?: ProfileHeroVariant;
  mountPopover?: boolean;
  active?: boolean;
  className?: string;
};

function useShortViewport(): "full" | "compact" | "tiny" {
  const [mode, setMode] = useState<"full" | "compact" | "tiny">("full");
  useEffect(() => {
    const apply = () => {
      const h = window.innerHeight;
      if (h < 640) setMode("tiny");
      else if (h < 760) setMode("compact");
      else setMode("full");
    };
    apply();
    window.addEventListener("resize", apply);
    return () => window.removeEventListener("resize", apply);
  }, []);
  return mode;
}

export function ProfileHero({
  variant = "full",
  mountPopover = true,
  active = false,
  className = "",
}: Props) {
  const {user} = useAuth();
  const notifications = useNotificationsOptional();
  const unread = (notifications?.unreadCount ?? 0) > 0;
  const short = useShortViewport();

  const displayName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    user?.username ||
    "Usuario";
  const handle = user?.username ? `@${user.username}` : null;
  const role = roleLabelEs(user?.role);

  if (variant === "rail") {
    return (
      <section
        aria-label="Perfil"
        data-variant="rail"
        className={["nb-profile-hero", className].filter(Boolean).join(" ")}>
        <UserMenu
          tone="on-dark"
          variant="profile"
          mountPopover={mountPopover}
          active={active}
          className="nb-profile-hero__hit">
          <Tooltip content={`${displayName} · ${role}`} side="right" delay={300}>
            <span className="inline-flex">
              <AvatarRing
                size={36}
                src={user?.profilePicture}
                name={displayName}
                showDot={unread || active}
              />
            </span>
          </Tooltip>
        </UserMenu>
      </section>
    );
  }

  const layout: ProfileHeroVariant =
    short === "tiny" || short === "compact"
      ? "compact"
      : variant === "compact"
        ? "compact"
        : "full";
  const showGlow = short !== "tiny";
  const avatarSize = layout === "compact" ? 48 : 64;

  return (
    <section
      aria-label="Perfil"
      data-variant={layout}
      className={["nb-profile-hero", className].filter(Boolean).join(" ")}>
      <UserMenu
        tone="on-dark"
        variant="profile"
        mountPopover={mountPopover}
        active={active}
        className="nb-profile-hero__hit">
        {showGlow ? (
          <span className="nb-profile-hero__glow" aria-hidden />
        ) : null}

        <div className="nb-profile-hero__body">
          <span className="nb-profile-hero__avatar">
            <AvatarRing
              size={avatarSize}
              src={user?.profilePicture}
              name={displayName}
              showDot={unread || active}
            />
          </span>

          <div className="nb-profile-hero__identity">
            <span className="nb-profile-hero__name" title={displayName}>
              {displayName}
            </span>
            {handle ? (
              <span className="nb-profile-hero__handle">{handle}</span>
            ) : null}
            <span className="nb-profile-hero__chip">{role}</span>
          </div>
        </div>
      </UserMenu>
    </section>
  );
}
