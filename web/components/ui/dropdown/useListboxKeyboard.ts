"use client";

import {useCallback, useRef} from "react";
import {fold} from "./utils";

type OptionLike = {disabled?: boolean; label: string};

type Args = {
  listId: string;
  activeIndex: number;
  setActiveIndex: (i: number | ((prev: number) => number)) => void;
  options: OptionLike[];
  showSearch: boolean;
};

export function useListboxKeyboard({
  listId,
  activeIndex,
  setActiveIndex,
  options,
  showSearch,
}: Args) {
  const typeBuf = useRef({chars: "", at: 0});

  const scrollToIndex = useCallback(
    (i: number) => {
      document
        .getElementById(`${listId}-opt-${i}`)
        ?.scrollIntoView({block: "nearest"});
    },
    [listId]
  );

  const moveActive = useCallback(
    (delta: number) => {
      if (!options.length) return;
      let i = activeIndex;
      for (let n = 0; n < options.length; n++) {
        i = (i + delta + options.length) % options.length;
        if (!options[i]?.disabled) {
          setActiveIndex(i);
          scrollToIndex(i);
          return;
        }
      }
    },
    [activeIndex, options, setActiveIndex, scrollToIndex]
  );

  const handleTypeAhead = useCallback(
    (key: string) => {
      if (showSearch || key.length !== 1) return;
      const now = Date.now();
      if (now - typeBuf.current.at > 500) typeBuf.current.chars = "";
      typeBuf.current.chars += key;
      typeBuf.current.at = now;
      const f = fold(typeBuf.current.chars);
      const idx = options.findIndex(
        (o) => !o.disabled && fold(o.label).startsWith(f)
      );
      if (idx >= 0) {
        setActiveIndex(idx);
        scrollToIndex(idx);
      }
    },
    [options, setActiveIndex, showSearch, scrollToIndex]
  );

  const handleNavKeys = useCallback(
    (key: string): boolean => {
      if (key === "ArrowDown") {
        moveActive(1);
        return true;
      }
      if (key === "ArrowUp") {
        moveActive(-1);
        return true;
      }
      if (key === "Home") {
        setActiveIndex(0);
        scrollToIndex(0);
        return true;
      }
      if (key === "End") {
        const i = Math.max(0, options.length - 1);
        setActiveIndex(i);
        scrollToIndex(i);
        return true;
      }
      if (key === "PageDown") {
        setActiveIndex((prev) => {
          const next = Math.min(options.length - 1, prev + 5);
          scrollToIndex(next);
          return next;
        });
        return true;
      }
      if (key === "PageUp") {
        setActiveIndex((prev) => {
          const next = Math.max(0, prev - 5);
          scrollToIndex(next);
          return next;
        });
        return true;
      }
      return false;
    },
    [moveActive, options.length, setActiveIndex, scrollToIndex]
  );

  return {moveActive, handleTypeAhead, handleNavKeys, scrollToIndex};
}
