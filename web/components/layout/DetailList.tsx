"use client";

import type {ComponentType, ReactNode, SVGProps} from "react";
import {PencilSquareIcon} from "@heroicons/react/24/outline";
import {IconButton} from "./IconButton";

export type DetailListItem = {
  id: string;
  label: string;
  value: ReactNode;
  icon?: ComponentType<SVGProps<SVGSVGElement>>;
  onEdit?: () => void;
  editLabel?: string;
};

type Props = {
  items: DetailListItem[];
  className?: string;
};

/** Key-value rows with leading icon and optional edit (Ref B detail card). */
export function DetailList({items, className = ""}: Props) {
  return (
    <ul
      className={["nabbi-detail-list", className].filter(Boolean).join(" ")}>
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <li key={item.id} className="nabbi-detail-list__row">
            {Icon ? (
              <span className="nabbi-card-header__icon !h-9 !w-9" aria-hidden>
                <Icon className="h-4 w-4" strokeWidth={1.75} />
              </span>
            ) : (
              <span className="h-9 w-9" aria-hidden />
            )}
            <span className="min-w-0">
              <span className="nabbi-detail-list__label">{item.label}</span>
              <span className="nabbi-detail-list__value">{item.value}</span>
            </span>
            {item.onEdit ? (
              <IconButton
                aria-label={item.editLabel ?? `Editar ${item.label}`}
                onClick={item.onEdit}>
                <PencilSquareIcon className="h-4 w-4" aria-hidden />
              </IconButton>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
