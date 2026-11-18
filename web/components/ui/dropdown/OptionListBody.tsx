"use client";

import {Fragment, type ReactNode} from "react";
import type {DropdownOption, OptionRenderFn} from "./types";
import {OptionRow} from "./OptionRow";

type Props<T extends string | number> = {
  listId: string;
  options: DropdownOption<T>[];
  activeIndex: number;
  isSelected: (opt: DropdownOption<T>) => boolean;
  onPick: (index: number) => void;
  onHover: (index: number) => void;
  loading: boolean;
  loadingMore: boolean;
  loadError: boolean;
  loadingText: string;
  emptyText: string;
  query: string;
  onRetry: () => void;
  renderOption?: OptionRenderFn<T>;
  checkbox?: boolean;
  trailing?: ReactNode;
};

export function OptionListBody<T extends string | number>({
  listId,
  options,
  activeIndex,
  isSelected,
  onPick,
  onHover,
  loading,
  loadingMore,
  loadError,
  loadingText,
  emptyText,
  query,
  onRetry,
  renderOption,
  checkbox,
  trailing,
}: Props<T>) {
  if (loading && options.length === 0) {
    return (
      <div className="cd-skeleton" aria-busy="true" aria-label={loadingText}>
        <div className="cd-skeleton__row" />
        <div className="cd-skeleton__row" />
        <div className="cd-skeleton__row" />
      </div>
    );
  }
  if (loadError && options.length === 0) {
    return (
      <div className="cd-empty" role="alert">
        <p>No pudimos cargar las opciones. Inténtalo de nuevo.</p>
        <button type="button" className="cd-retry" onClick={onRetry}>
          Reintentar
        </button>
      </div>
    );
  }
  if (!options.length) {
    return (
      <div className="cd-empty" role="status">
        {emptyText}
        {query ? ` “${query}”` : ""}
      </div>
    );
  }

  let lastGroup: string | undefined;
  return (
    <>
      {options.map((opt, i) => {
        const showGroup = Boolean(opt.group && opt.group !== lastGroup);
        if (opt.group) lastGroup = opt.group;
        return (
          <Fragment key={`${String(opt.value)}-${i}`}>
            {showGroup ? (
              <div className="cd-group" role="presentation">
                {opt.group}
              </div>
            ) : null}
            <OptionRow
              option={opt}
              selected={isSelected(opt)}
              active={i === activeIndex}
              id={`${listId}-opt-${i}`}
              onPick={() => onPick(i)}
              onHover={() => onHover(i)}
              renderOption={renderOption}
              checkbox={checkbox}
            />
          </Fragment>
        );
      })}
      {loadingMore ? (
        <div className="cd-loading-more" role="status">
          {loadingText}
        </div>
      ) : null}
      {trailing}
    </>
  );
}
