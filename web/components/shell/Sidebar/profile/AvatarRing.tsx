"use client";

import {Avatar} from "@/components/ui/Avatar";

/** Photo size; ring outer = size + 8 (2px gap + 2px ring each side). */
type Size = 36 | 48 | 64;

type Props = {
  size: Size;
  src?: string | null;
  name?: string | null;
  /** Presence / unread dot */
  showDot?: boolean;
  className?: string;
};

/** Map to nearest Avatar token size; CSS locks exact px. */
const AVATAR_SIZE: Record<Size, "md" | "lg" | "xl"> = {
  36: "md",
  48: "xl",
  64: "xl",
};

export function AvatarRing({
  size,
  src,
  name,
  showDot = false,
  className = "",
}: Props) {
  return (
    <span
      className={["nb-profile-ring", className].filter(Boolean).join(" ")}
      data-size={size}>
      <span className="nb-profile-ring__gap">
        <Avatar
          src={src}
          name={name}
          size={AVATAR_SIZE[size]}
          fallbackTone="cta"
          className="nb-profile-ring__avatar ring-0"
          ringClassName="ring-0"
        />
      </span>
      {showDot ? (
        <span className="nb-profile-ring__dot" aria-hidden />
      ) : null}
    </span>
  );
}
