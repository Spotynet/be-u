"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import {ChevronDownIcon, XMarkIcon} from "@heroicons/react/24/outline";
import {FieldError} from "@/components/auth/errors/FieldError";
import {useScrollFade} from "@/hooks/useScrollFade";
import {
  DEFAULT_PAGE_SIZE,
  DropdownSurface,
  OptionListBody,
  isCoarseOrNarrowViewport,
  shouldShowSearch,
  useLazyOptions,
  useListboxKeyboard,
  usePopoverPosition,
  type DropdownOption,
  type LoadOptionsFn,
  type OptionRenderFn,
  type PopoverPlacement,
} from "./dropdown";

export type {DropdownOption};

export type CustomMultiSelectProps<T extends string | number = string> = {
  id?: string;
  name?: string;
  label?: string;
  optionalLabel?: boolean;
  required?: boolean;
  value: T[];
  onChange: (values: T[], options: DropdownOption<T>[]) => void;
  options?: DropdownOption<T>[];
  loadOptions?: LoadOptionsFn<T>;
  pageSize?: number;
  placeholder?: string;
  leadingIcon?: ReactNode;
  searchable?: boolean | "auto";
  searchPlaceholder?: string;
  emptyText?: string;
  loadingText?: string;
  min?: number;
  max?: number;
  maxVisibleChips?: number;
  showSelectAll?: boolean;
  disabled?: boolean;
  disabledReason?: string;
  error?: string | null;
  helperText?: string;
  size?: "md" | "lg";
  placement?: PopoverPlacement;
  renderOption?: OptionRenderFn<T>;
  className?: string;
  onBlur?: () => void;
  "data-testid"?: string;
};

export type CustomMultiSelectHandle = {focus: () => void};

function CustomMultiSelectInner<T extends string | number>(
  props: CustomMultiSelectProps<T>,
  ref: React.ForwardedRef<CustomMultiSelectHandle>
) {
  const {
    id: idProp,
    name,
    label,
    optionalLabel,
    required = false,
    value,
    onChange,
    options: staticOptions,
    loadOptions,
    pageSize = DEFAULT_PAGE_SIZE,
    placeholder = "Selecciona…",
    leadingIcon,
    searchable = "auto",
    searchPlaceholder = "Buscar…",
    emptyText = "Sin resultados",
    loadingText = "Cargando…",
    min,
    max,
    maxVisibleChips = 3,
    showSelectAll = false,
    disabled = false,
    disabledReason,
    error,
    helperText,
    size = "lg",
    placement = "auto",
    renderOption,
    className = "",
    onBlur,
    "data-testid": dataTestId,
  } = props;

  const autoId = useId();
  const listId = `${autoId}-list`;
  const searchId = `${autoId}-search`;
  const triggerId = idProp || `${autoId}-trigger`;
  const liveId = `${autoId}-live`;

  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const selectedMapRef = useRef<Map<T, DropdownOption<T>>>(new Map());

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [sheet, setSheet] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [chipFocus, setChipFocus] = useState(-1);
  const [liveMsg, setLiveMsg] = useState("");

  const {ref: scrollRef, update: updateFade} = useScrollFade<HTMLDivElement>([
    open,
    query,
    value.length,
  ]);

  const {
    isAsync,
    debouncedQuery,
    allOptions,
    renderedOptions,
    loading,
    loadingMore,
    loadError,
    fetchPage,
    resetAsync,
    setVisibleCount,
  } = useLazyOptions({
    open,
    options: staticOptions,
    loadOptions,
    pageSize,
    query,
    scrollRootRef: scrollRef,
    sentinelRef,
    onFadeUpdate: updateFade,
  });

  const showSearch = useMemo(
    () => shouldShowSearch(searchable, isAsync, staticOptions?.length ?? 0),
    [searchable, isAsync, staticOptions]
  );

  const closeFromScroll = useCallback(() => setOpen(false), []);
  const {pos} = usePopoverPosition({
    open,
    sheet,
    placement,
    triggerRef,
    onScrolledAway: closeFromScroll,
  });

  const {handleTypeAhead, handleNavKeys} = useListboxKeyboard({
    listId,
    activeIndex,
    setActiveIndex,
    options: renderedOptions,
    showSearch,
  });

  useImperativeHandle(ref, () => ({
    focus: () => triggerRef.current?.focus(),
  }));

  // Keep selected option objects resolvable
  useEffect(() => {
    for (const opt of allOptions) {
      if (value.includes(opt.value)) selectedMapRef.current.set(opt.value, opt);
    }
    for (const opt of staticOptions ?? []) {
      if (value.includes(opt.value)) selectedMapRef.current.set(opt.value, opt);
    }
    for (const v of [...selectedMapRef.current.keys()]) {
      if (!value.includes(v)) selectedMapRef.current.delete(v);
    }
  }, [allOptions, staticOptions, value]);

  const selectedOptions = useMemo(() => {
    return value
      .map((v) => selectedMapRef.current.get(v) ?? staticOptions?.find((o) => o.value === v) ?? {
        value: v,
        label: String(v),
      })
      .filter(Boolean) as DropdownOption<T>[];
  }, [value, staticOptions, allOptions]);

  const atMax = max !== undefined && value.length >= max;
  const visibleChips = selectedOptions.slice(0, maxVisibleChips);
  const overflowCount = Math.max(0, selectedOptions.length - maxVisibleChips);

  const announce = (msg: string) => setLiveMsg(msg);

  const emitChange = useCallback(
    (next: T[], opts: DropdownOption<T>[], label?: string, added?: boolean) => {
      onChange(next, opts);
      if (label) {
        const n = next.length;
        const count =
          n === 1 ? "1 seleccionada" : `${n} seleccionadas`;
        announce(
          `${label} ${added ? "seleccionada" : "quitada"}. ${count}.`
        );
      }
    },
    [onChange]
  );

  const resolveOpts = (vals: T[]) =>
    vals.map(
      (v) =>
        selectedMapRef.current.get(v) ??
        allOptions.find((o) => o.value === v) ??
        staticOptions?.find((o) => o.value === v) ?? {
          value: v,
          label: String(v),
        }
    );

  const toggleValue = (opt: DropdownOption<T>) => {
    if (opt.disabled) return;
    const exists = value.includes(opt.value);
    if (!exists && atMax) return;
    selectedMapRef.current.set(opt.value, opt);
    const next = exists
      ? value.filter((v) => v !== opt.value)
      : [...value, opt.value];
    emitChange(next, resolveOpts(next), opt.label, !exists);
  };

  const removeValue = (v: T, e?: React.MouseEvent) => {
    e?.stopPropagation();
    e?.preventDefault();
    const opt = selectedMapRef.current.get(v);
    const next = value.filter((x) => x !== v);
    emitChange(next, resolveOpts(next), opt?.label ?? String(v), false);
  };

  const clearAll = () => {
    emitChange([], [], undefined, false);
    announce("Selección limpiada. 0 seleccionadas.");
  };

  const selectAllVisible = () => {
    const enabled = renderedOptions.filter((o) => !o.disabled);
    const nextSet = new Set(value);
    for (const o of enabled) {
      if (max !== undefined && nextSet.size >= max) break;
      nextSet.add(o.value);
      selectedMapRef.current.set(o.value, o);
    }
    const next = Array.from(nextSet);
    emitChange(next, resolveOpts(next));
  };

  const openMenu = useCallback(() => {
    if (disabled) return;
    setSheet(isCoarseOrNarrowViewport());
    setOpen(true);
    setQuery("");
    setVisibleCount(pageSize);
    setActiveIndex(0);
    setChipFocus(-1);
    if (isAsync) resetAsync();
  }, [disabled, pageSize, isAsync, resetAsync, setVisibleCount]);

  const closeMenu = useCallback(
    (opts?: {skipFocus?: boolean}) => {
      setOpen(false);
      setQuery("");
      if (!opts?.skipFocus) triggerRef.current?.focus();
      onBlur?.();
    },
    [onBlur]
  );

  useEffect(() => {
    if (!open || !showSearch || sheet) return;
    const t = window.setTimeout(() => searchRef.current?.focus(), 20);
    return () => window.clearTimeout(t);
  }, [open, showSearch, sheet]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (triggerRef.current?.contains(t)) return;
      if (panelRef.current?.contains(t)) return;
      closeMenu({skipFocus: true});
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open, closeMenu]);

  const onTriggerKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;

    if (chipFocus >= 0 && (e.key === "Backspace" || e.key === "Delete")) {
      e.preventDefault();
      const chip = visibleChips[chipFocus];
      if (chip) {
        removeValue(chip.value);
        setChipFocus((i) => Math.max(0, i - 1));
      }
      return;
    }
    if (chipFocus >= 0 && e.key === "ArrowLeft") {
      e.preventDefault();
      setChipFocus((i) => Math.max(0, i - 1));
      return;
    }
    if (chipFocus >= 0 && e.key === "ArrowRight") {
      e.preventDefault();
      if (chipFocus >= visibleChips.length - 1) setChipFocus(-1);
      else setChipFocus((i) => i + 1);
      return;
    }

    if (
      e.key === "Backspace" &&
      !open &&
      value.length > 0 &&
      chipFocus < 0
    ) {
      e.preventDefault();
      removeValue(value[value.length - 1]);
      return;
    }

    if (
      e.key === "Enter" ||
      e.key === " " ||
      e.key === "ArrowDown" ||
      e.key === "ArrowUp"
    ) {
      e.preventDefault();
      if (!open) {
        openMenu();
        return;
      }
      if (e.key === "Enter" || e.key === " ") {
        const opt = renderedOptions[activeIndex];
        if (opt) toggleValue(opt);
        return;
      }
      handleNavKeys(e.key);
      return;
    }
    if (e.key === "Escape" && open) {
      e.preventDefault();
      closeMenu();
      return;
    }
    if (
      showSelectAll &&
      open &&
      (e.ctrlKey || e.metaKey) &&
      e.key.toLowerCase() === "a"
    ) {
      e.preventDefault();
      selectAllVisible();
      return;
    }
    if (open && !e.ctrlKey && !e.metaKey) handleTypeAhead(e.key);
  };

  const onPanelKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      closeMenu();
      return;
    }
    if (e.key === "Backspace" && !query && value.length > 0) {
      e.preventDefault();
      removeValue(value[value.length - 1]);
      return;
    }
    if (
      showSelectAll &&
      (e.ctrlKey || e.metaKey) &&
      e.key.toLowerCase() === "a"
    ) {
      e.preventDefault();
      selectAllVisible();
      return;
    }
    if (handleNavKeys(e.key)) {
      e.preventDefault();
      return;
    }
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      const opt = renderedOptions[activeIndex];
      if (opt) toggleValue(opt);
    }
    if (e.key === "Tab") closeMenu({skipFocus: true});
  };

  const countLabel =
    value.length === 1
      ? "1 seleccionada"
      : `${value.length} seleccionadas`;

  const footer = (
    <div className={`cms-footer${sheet ? " cms-footer--sheet" : ""}`}>
      {!sheet ? (
        <>
          <div className="cms-footer__left">
            <span className="cms-footer__count">
              {atMax && max !== undefined ? `Máximo ${max}` : countLabel}
            </span>
            {value.length > 0 ? (
              <button type="button" className="cms-footer__clear" onClick={clearAll}>
                Limpiar
              </button>
            ) : null}
            {showSelectAll ? (
              <button
                type="button"
                className="cms-footer__clear"
                onClick={selectAllVisible}>
                Seleccionar todo
              </button>
            ) : null}
          </div>
          <button type="button" className="cms-footer__done" onClick={() => closeMenu()}>
            Listo
          </button>
        </>
      ) : (
        <button
          type="button"
          className="cms-footer__done cms-footer__done--full"
          onClick={() => closeMenu()}>
          Listo ({value.length})
        </button>
      )}
    </div>
  );

  const helper =
    disabled && disabledReason
      ? disabledReason
      : helperText && !error
        ? helperText
        : null;

  return (
    <div
      data-nabbi-field={name || undefined}
      data-testid={dataTestId}
      className={`nabbi-field cd-field cms-field${error ? " nabbi-field--error" : ""}${leadingIcon ? " nabbi-field--icon" : ""} ${className}`.trim()}>
      {label ? (
        <label htmlFor={triggerId} className="nabbi-field__label">
          {label}
          {optionalLabel ? (
            <span className="nabbi-field__label-optional"> (opcional)</span>
          ) : null}
        </label>
      ) : null}

      <div className="nabbi-field__control-wrap">
        {leadingIcon ? (
          <span className="nabbi-field__icon" aria-hidden="true">
            {leadingIcon}
          </span>
        ) : null}
        <button
          ref={triggerRef}
          type="button"
          id={triggerId}
          className={`cd-trigger cms-trigger nabbi-field__control cd-trigger--${size}${open ? " is-open" : ""}`}
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={open ? listId : undefined}
          aria-activedescendant={
            open && renderedOptions[activeIndex]
              ? `${listId}-opt-${activeIndex}`
              : undefined
          }
          aria-invalid={error ? true : undefined}
          aria-required={required || undefined}
          aria-describedby={
            error
              ? `${triggerId}-error`
              : helper
                ? `${triggerId}-helper`
                : undefined
          }
          role="combobox"
          onClick={() => (open ? closeMenu() : openMenu())}
          onKeyDown={onTriggerKeyDown}
          onBlur={(e) => {
            const next = e.relatedTarget as Node | null;
            if (panelRef.current?.contains(next)) return;
            if (triggerRef.current?.contains(next)) return;
            if (!open) onBlur?.();
          }}>
          <span className="cms-trigger__body">
            {selectedOptions.length === 0 ? (
              <span className="cd-trigger__value is-placeholder">{placeholder}</span>
            ) : (
              <span className="cms-chips" role="list" aria-label="Seleccionadas">
                {visibleChips.map((opt, i) => (
                  <span
                    key={String(opt.value)}
                    role="listitem"
                    className={`cms-chip${chipFocus === i ? " is-focused" : ""}`}
                    tabIndex={chipFocus === i ? 0 : -1}
                    onClick={(e) => e.stopPropagation()}
                    onFocus={() => setChipFocus(i)}>
                    {opt.icon ? (
                      <span className="cms-chip__icon">{opt.icon}</span>
                    ) : null}
                    <span className="cms-chip__label">{opt.label}</span>
                    <button
                      type="button"
                      className="cms-chip__remove"
                      aria-label={`Quitar ${opt.label}`}
                      disabled={disabled}
                      onClick={(e) => removeValue(opt.value, e)}>
                      <XMarkIcon />
                    </button>
                  </span>
                ))}
                {overflowCount > 0 ? (
                  <span className="cms-chip cms-chip--more" role="listitem">
                    +{overflowCount}
                  </span>
                ) : null}
              </span>
            )}
          </span>
          <ChevronDownIcon className="cd-trigger__chevron" aria-hidden="true" />
        </button>
      </div>

      {name
        ? value.map((v) => (
            <input key={String(v)} type="hidden" name={`${name}[]`} value={String(v)} />
          ))
        : null}

      <span id={liveId} className="sr-only" aria-live="polite">
        {liveMsg}
      </span>

      <FieldError id={`${triggerId}-error`} message={error} />
      {helper ? (
        <p id={`${triggerId}-helper`} className="nabbi-field__hint">
          {helper}
        </p>
      ) : null}

      <DropdownSurface
        open={open}
        sheet={sheet}
        pos={pos}
        panelRef={panelRef}
        scrollRef={scrollRef}
        sentinelRef={sentinelRef}
        listId={listId}
        searchId={searchId}
        searchRef={searchRef}
        showSearch={showSearch}
        query={query}
        onQueryChange={setQuery}
        searchPlaceholder={searchPlaceholder}
        onKeyDown={onPanelKeyDown}
        onClose={() => closeMenu()}
        multiSelectable
        footer={footer}>
        <OptionListBody
          listId={listId}
          options={renderedOptions.map((o) =>
            atMax && !value.includes(o.value)
              ? {...o, disabled: true, description: o.description || `Máximo ${max}`}
              : o
          )}
          activeIndex={activeIndex}
          isSelected={(opt) => value.includes(opt.value)}
          onPick={(i) => {
            const opt = renderedOptions[i];
            if (opt) toggleValue(opt);
          }}
          onHover={setActiveIndex}
          loading={loading}
          loadingMore={loadingMore}
          loadError={loadError}
          loadingText={loadingText}
          emptyText={emptyText}
          query={debouncedQuery}
          onRetry={() => void fetchPage(1, debouncedQuery, false)}
          renderOption={renderOption}
          checkbox
        />
      </DropdownSurface>
    </div>
  );
}

export const CustomMultiSelect = forwardRef(CustomMultiSelectInner) as <
  T extends string | number = string,
>(
  props: CustomMultiSelectProps<T> & {ref?: React.Ref<CustomMultiSelectHandle>}
) => React.ReactElement;
