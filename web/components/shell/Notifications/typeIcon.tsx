"use client";

import {
  CalendarDaysIcon,
  ChatBubbleLeftIcon,
  ClockIcon,
  CreditCardIcon,
  ExclamationTriangleIcon,
  HeartIcon,
  InformationCircleIcon,
  StarIcon,
  UserPlusIcon,
} from "@heroicons/react/24/outline";
import type {AppNotification, NotificationType} from "@/features/notifications";

type IconTone = "brand" | "warning" | "error" | "neutral";

const TONE_CLASS: Record<IconTone, string> = {
  brand: "bg-primary/15 text-primary",
  warning: "bg-warning/15 text-warning",
  error: "bg-error/15 text-error",
  neutral: "bg-foreground-muted/12 text-foreground-secondary",
};

export function typeIconMeta(
  n: Pick<AppNotification, "type" | "subType">,
): {tone: IconTone; Icon: typeof CalendarDaysIcon} {
  const t: NotificationType = n.type;
  const sub = String(n.subType || "").toLowerCase();

  if (t === "reservation") {
    if (sub === "cancelled")
      return {tone: "error", Icon: ExclamationTriangleIcon};
    if (sub === "reminder") return {tone: "warning", Icon: ClockIcon};
    return {tone: "brand", Icon: CalendarDaysIcon};
  }
  if (t === "review") return {tone: "warning", Icon: StarIcon};
  if (t === "message") return {tone: "brand", Icon: ChatBubbleLeftIcon};
  if (t === "social") {
    if (sub === "saved") return {tone: "brand", Icon: UserPlusIcon};
    return {tone: "error", Icon: HeartIcon};
  }
  if (t === "payment") return {tone: "brand", Icon: CreditCardIcon};
  return {tone: "neutral", Icon: InformationCircleIcon};
}

export function NotificationTypeTile({
  n,
  className = "",
}: {
  n: Pick<AppNotification, "type" | "subType">;
  className?: string;
}) {
  const {tone, Icon} = typeIconMeta(n);
  return (
    <span
      className={[
        "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px]",
        TONE_CLASS[tone],
        className,
      ].join(" ")}
      aria-hidden>
      <Icon className="h-5 w-5" strokeWidth={1.75} />
    </span>
  );
}
