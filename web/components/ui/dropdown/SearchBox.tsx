"use client";

import {MagnifyingGlassIcon, XMarkIcon} from "@heroicons/react/24/outline";
import type {Ref} from "react";

type Props = {
  id: string;
  inputRef?: Ref<HTMLInputElement>;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

export function SearchBox({
  id,
  inputRef,
  value,
  onChange,
  placeholder = "Buscar…",
}: Props) {
  return (
    <div className="cd-search">
      <MagnifyingGlassIcon className="cd-search__icon" aria-hidden="true" />
      <input
        ref={inputRef}
        id={id}
        className="cd-search__input"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete="off"
      />
      {value ? (
        <button
          type="button"
          className="cd-search__clear"
          aria-label="Limpiar búsqueda"
          onClick={() => onChange("")}>
          <XMarkIcon />
        </button>
      ) : null}
    </div>
  );
}
