"use client";

import {
  Suspense,
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import {TOPBAR_BTN_BASE, TOPBAR_BTN_ICON} from "../TopbarButton";
import {useSearchChrome} from "./SearchChromeContext";
import {useAppSearchQuery} from "./useAppSearchQuery";

function useModKeyLabel(): string {
  const [label, setLabel] = useState("Ctrl");
  useEffect(() => {
    setLabel(/Mac|iPhone|iPad|iPod/i.test(navigator.userAgent) ? "⌘" : "Ctrl");
  }, []);
  return label;
}

function Keycap({children}: {children: string}) {
  return (
    <kbd className="inline-flex h-[22px] min-w-[22px] items-center justify-center rounded-md border border-card-border bg-card px-1.5 text-[11px] font-semibold tabular-nums text-foreground-secondary">
      {children}
    </kbd>
  );
}

type Props = {
  variant?: "desktop" | "mobile";
  className?: string;
};

function SearchBarInner({variant = "desktop", className = ""}: Props) {
  const {
    value,
    setQuery,
    clear,
    submit,
    setFocused,
    onExplore,
    shortHint,
  } = useAppSearchQuery();
  const {
    setSearchActive,
    mobileSearchOpen,
    setMobileSearchOpen,
    registerDesktopInput,
    registerMobileOpen,
  } = useSearchChrome();
  const mod = useModKeyLabel();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const iconBtnRef = useRef<HTMLButtonElement | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);
  const helperId = useId();
  const [focused, setFocusedLocal] = useState(false);
  const pointerInBar = useRef(false);

  const hasValue = value.trim().length > 0;
  const showSubmit = focused && hasValue && !onExplore;
  const showKeycap = !focused && !hasValue;
  const active = focused;

  useEffect(() => {
    if (variant !== "desktop") return;
    registerDesktopInput(inputRef.current);
    return () => registerDesktopInput(null);
  }, [variant, registerDesktopInput]);

  useEffect(() => {
    if (variant !== "mobile") return;
    registerMobileOpen(() => {
      setMobileSearchOpen(true);
      window.setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 20);
    });
  }, [variant, registerMobileOpen, setMobileSearchOpen]);

  const onFocus = () => {
    setFocusedLocal(true);
    setFocused(true);
    if (variant === "desktop") setSearchActive(true);
  };

  const onBlur = () => {
    window.setTimeout(() => {
      if (document.activeElement === inputRef.current) return;
      if (pointerInBar.current) return;
      if (formRef.current?.contains(document.activeElement)) return;
      setFocusedLocal(false);
      setFocused(false);
      if (variant === "desktop") setSearchActive(false);
    }, 120);
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    submit();
    if (variant === "mobile") closeMobile();
  };

  const onInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.nativeEvent.isComposing) return;
    if (e.key === "Escape") {
      e.preventDefault();
      if (hasValue) clear();
      else {
        inputRef.current?.blur();
        if (variant === "mobile") closeMobile();
      }
    }
  };

  const closeMobile = () => {
    setMobileSearchOpen(false);
    setFocusedLocal(false);
    setFocused(false);
    window.setTimeout(() => iconBtnRef.current?.focus(), 0);
  };

  const openMobile = () => {
    setMobileSearchOpen(true);
    window.setTimeout(() => inputRef.current?.focus(), 20);
  };

  /* —— Mobile morph: full-width header row —— */
  if (variant === "mobile") {
    if (!mobileSearchOpen) {
      return (
        <button
          ref={iconBtnRef}
          type="button"
          className={`${TOPBAR_BTN_ICON} ${className}`.trim()}
          aria-label="Buscar profesionales o lugares"
          aria-keyshortcuts="Control+K Meta+K /"
          onClick={openMobile}>
          <MagnifyingGlassIcon className="h-[18px] w-[18px]" aria-hidden />
        </button>
      );
    }

    return (
      <form
        role="search"
        aria-label="Buscar profesionales y lugares"
        onSubmit={onSubmit}
        className={`nabbi-searchbar nabbi-searchbar--mobile flex h-12 w-full min-w-0 flex-1 items-center gap-1 ${className}`}>
        <button
          type="button"
          onClick={closeMobile}
          className="inline-flex h-12 w-11 shrink-0 items-center justify-center rounded-full text-foreground-secondary hover:bg-foreground-muted/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          aria-label="Cerrar búsqueda">
          <ArrowLeftIcon className="h-5 w-5" aria-hidden />
        </button>
        <div className="flex h-12 min-w-0 flex-1 items-center gap-2 rounded-full border border-primary bg-card px-3.5 shadow-sm">
          <MagnifyingGlassIcon
            className="h-[18px] w-[18px] shrink-0 text-primary"
            aria-hidden
          />
          <input
            ref={inputRef}
            type="search"
            name="q"
            value={value}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={onFocus}
            onBlur={onBlur}
            onKeyDown={onInputKeyDown}
            placeholder="Buscar profesionales o lugares"
            aria-label="Buscar profesionales o lugares"
            aria-keyshortcuts="Control+K Meta+K /"
            aria-describedby={shortHint ? helperId : undefined}
            autoComplete="off"
            spellCheck={false}
            inputMode="search"
            enterKeyHint="search"
            className="nabbi-searchbar__input min-w-0 flex-1 bg-transparent text-[16px] font-medium text-foreground outline-none placeholder:font-normal placeholder:text-foreground-muted"
          />
          {hasValue ? (
            <button
              type="button"
              onClick={clear}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full text-foreground-muted hover:text-foreground"
              aria-label="Limpiar búsqueda">
              <span className="inline-flex h-7 w-7 items-center justify-center">
                <XMarkIcon className="h-4 w-4" />
              </span>
            </button>
          ) : null}
        </div>
        {hasValue && !onExplore ? (
          <button
            type="submit"
            className="inline-flex h-12 w-11 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
            aria-label="Buscar">
            <ArrowRightIcon className="h-5 w-5" aria-hidden />
          </button>
        ) : null}
        {shortHint ? (
          <span id={helperId} className="sr-only">
            Escribe al menos 2 caracteres
          </span>
        ) : null}
      </form>
    );
  }

  /* —— Desktop: slot reserves rest width; bar absolute expands LEFT —— */
  return (
    <div
      className={`nabbi-search-slot relative shrink-0 ${className}`.trim()}
      data-active={active ? "true" : "false"}>
      <form
        ref={formRef}
        role="search"
        aria-label="Buscar profesionales y lugares"
        onSubmit={onSubmit}
        onPointerDown={() => {
          pointerInBar.current = true;
        }}
        onPointerUp={() => {
          pointerInBar.current = false;
        }}
        onPointerLeave={() => {
          pointerInBar.current = false;
        }}
        data-focused={focused ? "true" : "false"}
        data-filled={hasValue ? "true" : "false"}
        className={[
          "nabbi-searchbar nabbi-searchbar--desktop group/search absolute right-0 top-0 z-[1] flex items-center gap-2 rounded-full border border-card-border bg-card px-3.5",
          "text-foreground outline-none",
          active ? "nabbi-searchbar--desktop-active" : "",
        ].join(" ")}>
        <MagnifyingGlassIcon
          className={[
            "h-5 w-5 shrink-0",
            active ? "text-primary" : "text-foreground-secondary",
          ].join(" ")}
          aria-hidden
        />
        <div className="relative min-w-0 flex-1">
          {!hasValue ? (
            <span
              className="nabbi-searchbar__ph pointer-events-none absolute inset-0 flex items-center font-normal text-foreground-muted"
              aria-hidden>
              <span className="nabbi-searchbar__ph-full truncate">
                Buscar profesionales o lugares
              </span>
              <span className="nabbi-searchbar__ph-short truncate">Buscar</span>
            </span>
          ) : null}
          <input
            ref={inputRef}
            type="search"
            name="q"
            value={value}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={onFocus}
            onBlur={onBlur}
            onKeyDown={onInputKeyDown}
            placeholder=""
            aria-label="Buscar profesionales o lugares"
            aria-keyshortcuts="Control+K Meta+K /"
            aria-describedby={shortHint ? helperId : undefined}
            autoComplete="off"
            spellCheck={false}
            inputMode="search"
            enterKeyHint="search"
            className="nabbi-searchbar__input relative z-[1] w-full min-w-0 bg-transparent font-medium text-foreground outline-none [@media(pointer:coarse)]:text-[16px]"
          />
        </div>
        {hasValue ? (
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={clear}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-foreground-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="Limpiar búsqueda">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full hover:bg-foreground-muted/10">
              <XMarkIcon className="h-4 w-4" />
            </span>
          </button>
        ) : null}
        {showSubmit ? (
          <button
            type="submit"
            onMouseDown={(e) => e.preventDefault()}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
            aria-label="Buscar">
            <ArrowRightIcon className="h-4 w-4" aria-hidden />
          </button>
        ) : null}
        {showKeycap ? (
          <span
            className="nabbi-searchbar__keycap ml-0.5 hidden items-center gap-0.5"
            aria-hidden>
            <Keycap>{mod}</Keycap>
            <Keycap>K</Keycap>
          </span>
        ) : null}
        {shortHint ? (
          <span id={helperId} className="sr-only">
            Escribe al menos 2 caracteres
          </span>
        ) : null}
      </form>
    </div>
  );
}

function SearchBarFallback({
  variant = "desktop",
}: {
  variant?: "desktop" | "mobile";
}) {
  if (variant === "mobile") {
    return (
      <div
        className={`${TOPBAR_BTN_ICON} pointer-events-none opacity-60`}
        aria-hidden
      />
    );
  }
  return (
    <div
      className={`${TOPBAR_BTN_BASE} nabbi-search-slot pointer-events-none opacity-60`}
      aria-hidden
    />
  );
}

export function SearchBar(props: Props) {
  return (
    <Suspense fallback={<SearchBarFallback variant={props.variant} />}>
      <SearchBarInner {...props} />
    </Suspense>
  );
}
