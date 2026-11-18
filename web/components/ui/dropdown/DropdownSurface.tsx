"use client";

import {type KeyboardEvent, type ReactNode, type Ref} from "react";
import {createPortal} from "react-dom";
import type {PopoverPos} from "./types";
import {SearchBox} from "./SearchBox";

type Props = {
  open: boolean;
  sheet: boolean;
  pos: PopoverPos | null;
  panelRef: Ref<HTMLDivElement>;
  scrollRef: Ref<HTMLDivElement>;
  sentinelRef: Ref<HTMLDivElement>;
  listId: string;
  searchId: string;
  searchRef?: Ref<HTMLInputElement>;
  showSearch: boolean;
  query: string;
  onQueryChange: (q: string) => void;
  searchPlaceholder?: string;
  onKeyDown: (e: KeyboardEvent) => void;
  onClose: () => void;
  listRole?: "listbox";
  multiSelectable?: boolean;
  footer?: ReactNode;
  children: ReactNode;
};

export function DropdownSurface({
  open,
  sheet,
  pos,
  panelRef,
  scrollRef,
  sentinelRef,
  listId,
  searchId,
  searchRef,
  showSearch,
  query,
  onQueryChange,
  searchPlaceholder,
  onKeyDown,
  onClose,
  multiSelectable,
  footer,
  children,
}: Props) {
  if (!open || typeof document === "undefined") return null;

  const search = showSearch ? (
    <SearchBox
      id={searchId}
      inputRef={searchRef}
      value={query}
      onChange={onQueryChange}
      placeholder={searchPlaceholder}
    />
  ) : null;

  const list = (
    <div
      ref={scrollRef}
      className="cd-list scroll-premium"
      id={listId}
      role="listbox"
      aria-multiselectable={multiSelectable || undefined}
      style={
        !sheet && pos
          ? {
              maxHeight: Math.max(
                80,
                pos.maxHeight - (showSearch ? 52 : 0) - (footer ? 52 : 0)
              ),
            }
          : undefined
      }>
      {children}
      <div ref={sentinelRef} className="cd-sentinel" aria-hidden="true" />
    </div>
  );

  if (sheet) {
    return createPortal(
      <div className="cd-sheet-root" role="presentation">
        <button
          type="button"
          className="cd-sheet-backdrop"
          aria-label="Cerrar"
          onClick={onClose}
        />
        <div
          ref={panelRef}
          className="cd-sheet"
          role="dialog"
          aria-modal="true"
          onKeyDown={onKeyDown}>
          <div className="cd-sheet__handle" aria-hidden="true" />
          {search}
          {list}
          {footer}
        </div>
      </div>,
      document.body
    );
  }

  if (!pos) return null;

  return createPortal(
    <div
      ref={panelRef}
      className={`cd-popover cd-popover--${pos.side}`}
      style={{
        top: pos.side === "bottom" ? pos.top : undefined,
        bottom: pos.side === "top" ? window.innerHeight - pos.top : undefined,
        left: pos.left,
        width: pos.width,
        maxHeight: pos.maxHeight + (footer ? 52 : 0),
      }}
      onKeyDown={onKeyDown}>
      {search}
      {list}
      {footer}
    </div>,
    document.body
  );
}
