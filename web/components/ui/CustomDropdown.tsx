"use client";

import {
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  forwardRef,
  type ReactNode,
  type KeyboardEvent,
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

export type CustomDropdownProps<T extends string | number = string> = {
  id?: string;
  name?: string;
  label?: string;
  optionalLabel?: boolean;
  value: T | null;
  onChange: (value: T | null, option: DropdownOption<T> | null) => void;
  options?: DropdownOption<T>[];
  loadOptions?: LoadOptionsFn<T>;
  pageSize?: number;
  placeholder?: string;
  leadingIcon?: ReactNode;
  searchable?: boolean | "auto";
  searchPlaceholder?: string;
  emptyText?: string;
  loadingText?: string;
  clearable?: boolean;
  disabled?: boolean;
  required?: boolean;
  error?: string | null;
  helperText?: string;
  size?: "md" | "lg";
  placement?: PopoverPlacement;
  renderOption?: OptionRenderFn<T>;
  className?: string;
  onBlur?: () => void;
  "data-testid"?: string;
};

export type CustomDropdownHandle = {
  focus: () => void;
};

function CustomDropdownInner<T extends string | number>(
  props: CustomDropdownProps<T>,
  ref: React.ForwardedRef<CustomDropdownHandle>
) {
  const {
    id: idProp,
    name,
    label,
    optionalLabel,
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
    clearable = false,
    disabled = false,
    required = false,
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

  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [sheet, setSheet] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedCache, setSelectedCache] = useState<DropdownOption<T> | null>(
    null
  );

  const {ref: scrollRef, update: updateFade} = useScrollFade<HTMLDivElement>([
    open,
    query,
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

  const selectedOption = useMemo(() => {
    const fromList = allOptions.find((o) => o.value === value);
    if (fromList) return fromList;
    if (selectedCache && selectedCache.value === value) return selectedCache;
    return staticOptions?.find((o) => o.value === value) ?? null;
  }, [allOptions, value, selectedCache, staticOptions]);

  useEffect(() => {
    if (selectedOption) setSelectedCache(selectedOption);
  }, [selectedOption]);

  const openMenu = useCallback(() => {
    if (disabled) return;
    setSheet(isCoarseOrNarrowViewport());
    setOpen(true);
    setQuery("");
    setVisibleCount(pageSize);
    setActiveIndex(0);
    if (isAsync) resetAsync();
  }, [disabled, pageSize, isAsync, resetAsync, setVisibleCount]);

  const closeMenu = useCallback(
    (opts?: {skipFocus?: boolean; fireBlur?: boolean}) => {
      setOpen(false);
      setQuery("");
      if (!opts?.skipFocus) triggerRef.current?.focus();
      if (opts?.fireBlur) onBlur?.();
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
      setOpen(false);
      setQuery("");
      onBlur?.();
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open, onBlur]);

  const selectAt = (index: number) => {
    const opt = renderedOptions[index];
    if (!opt || opt.disabled) return;
    onChange(opt.value, opt);
    setSelectedCache(opt);
    closeMenu();
  };

  const onTriggerKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;
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
      if (handleNavKeys(e.key)) return;
      if (e.key === "Enter" || e.key === " ") selectAt(activeIndex);
      return;
    }
    if (e.key === "Escape" && open) {
      e.preventDefault();
      closeMenu();
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
    if (handleNavKeys(e.key)) {
      e.preventDefault();
      return;
    }
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      selectAt(activeIndex);
    }
    if (e.key === "Tab") setOpen(false);
  };

  const activeDesc =
    open && renderedOptions[activeIndex]
      ? `${listId}-opt-${activeIndex}`
      : undefined;

  const hiddenValue =
    value === null || value === undefined ? "" : String(value);

  return (
    <div
      data-nabbi-field={name || undefined}
      data-testid={dataTestId}
      className={`nabbi-field cd-field${error ? " nabbi-field--error" : ""}${leadingIcon ? " nabbi-field--icon" : ""} ${className}`.trim()}>
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
          className={`cd-trigger nabbi-field__control cd-trigger--${size}${open ? " is-open" : ""}`}
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={open ? listId : undefined}
          aria-activedescendant={activeDesc}
          aria-invalid={error ? true : undefined}
          aria-required={required || undefined}
          aria-describedby={
            error
              ? `${triggerId}-error`
              : helperText
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
          <span
            className={`cd-trigger__value${selectedOption ? "" : " is-placeholder"}`}>
            {selectedOption?.label ?? placeholder}
          </span>
          <ChevronDownIcon className="cd-trigger__chevron" aria-hidden="true" />
        </button>
        {clearable && value !== null && value !== undefined && value !== ("" as T) ? (
          <button
            type="button"
            className="cd-clear"
            aria-label="Limpiar selección"
            disabled={disabled}
            onClick={(e) => {
              e.stopPropagation();
              onChange(null, null);
              setSelectedCache(null);
            }}>
            <XMarkIcon />
          </button>
        ) : null}
      </div>

      {name ? <input type="hidden" name={name} value={hiddenValue} /> : null}

      <FieldError id={`${triggerId}-error`} message={error} />
      {helperText && !error ? (
        <p id={`${triggerId}-helper`} className="nabbi-field__hint">
          {helperText}
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
        onClose={() => closeMenu()}>
        <OptionListBody
          listId={listId}
          options={renderedOptions}
          activeIndex={activeIndex}
          isSelected={(opt) => opt.value === value}
          onPick={selectAt}
          onHover={setActiveIndex}
          loading={loading}
          loadingMore={loadingMore}
          loadError={loadError}
          loadingText={loadingText}
          emptyText={emptyText}
          query={debouncedQuery}
          onRetry={() => void fetchPage(1, debouncedQuery, false)}
          renderOption={renderOption}
        />
      </DropdownSurface>
    </div>
  );
}

export const CustomDropdown = forwardRef(CustomDropdownInner) as <
  T extends string | number = string,
>(
  props: CustomDropdownProps<T> & {ref?: React.Ref<CustomDropdownHandle>}
) => React.ReactElement;
