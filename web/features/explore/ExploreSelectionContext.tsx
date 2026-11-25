"use client";

/**
 * Store-based selection/hover so marker hover does not re-render the full list.
 */

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useSyncExternalStore,
  type ReactNode,
} from "react";

type SelectionState = {
  selectedId: number | null;
  hoveredId: number | null;
};

type SelectionApi = {
  getSnapshot: () => SelectionState;
  subscribe: (cb: () => void) => () => void;
  setSelectedId: (id: number | null) => void;
  setHoveredId: (id: number | null) => void;
  clear: () => void;
  /** Last focused card element — Esc returns focus here. */
  lastCardElRef: React.MutableRefObject<HTMLElement | null>;
  cardElsRef: React.MutableRefObject<Map<number, HTMLElement>>;
  registerCard: (id: number, el: HTMLElement | null) => void;
  scrollCardIntoView: (id: number) => void;
};

const SelectionApiContext = createContext<SelectionApi | null>(null);

function createStore(): Omit<
  SelectionApi,
  "lastCardElRef" | "cardElsRef" | "registerCard" | "scrollCardIntoView"
> & {
  getState: () => SelectionState;
} {
  let state: SelectionState = {selectedId: null, hoveredId: null};
  const listeners = new Set<() => void>();
  const emit = () => listeners.forEach((l) => l());
  return {
    getSnapshot: () => state,
    getState: () => state,
    subscribe: (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    setSelectedId: (id) => {
      if (state.selectedId === id) return;
      state = {...state, selectedId: id};
      emit();
    },
    setHoveredId: (id) => {
      if (state.hoveredId === id) return;
      state = {...state, hoveredId: id};
      emit();
    },
    clear: () => {
      if (state.selectedId == null && state.hoveredId == null) return;
      state = {selectedId: null, hoveredId: null};
      emit();
    },
  };
}

export function ExploreSelectionProvider({children}: {children: ReactNode}) {
  const storeRef = useRef<ReturnType<typeof createStore> | null>(null);
  if (!storeRef.current) storeRef.current = createStore();
  const store = storeRef.current;
  const lastCardElRef = useRef<HTMLElement | null>(null);
  const cardElsRef = useRef<Map<number, HTMLElement>>(new Map());

  const registerCard = useCallback((id: number, el: HTMLElement | null) => {
    if (el) cardElsRef.current.set(id, el);
    else cardElsRef.current.delete(id);
  }, []);

  const scrollCardIntoView = useCallback((id: number) => {
    const el = cardElsRef.current.get(id);
    el?.scrollIntoView({behavior: "smooth", block: "nearest"});
  }, []);

  const api: SelectionApi = {
    getSnapshot: store.getSnapshot,
    subscribe: store.subscribe,
    setSelectedId: store.setSelectedId,
    setHoveredId: store.setHoveredId,
    clear: store.clear,
    lastCardElRef,
    cardElsRef,
    registerCard,
    scrollCardIntoView,
  };

  return (
    <SelectionApiContext.Provider value={api}>
      {children}
    </SelectionApiContext.Provider>
  );
}

function useSelectionApi(): SelectionApi {
  const api = useContext(SelectionApiContext);
  if (!api) {
    throw new Error(
      "Explore selection hooks require ExploreSelectionProvider",
    );
  }
  return api;
}

export function useExploreSelectionApi(): SelectionApi {
  return useSelectionApi();
}

export function useExploreSelectedId(): number | null {
  const api = useSelectionApi();
  return useSyncExternalStore(
    api.subscribe,
    () => api.getSnapshot().selectedId,
    () => null,
  );
}

export function useExploreHoveredId(): number | null {
  const api = useSelectionApi();
  return useSyncExternalStore(
    api.subscribe,
    () => api.getSnapshot().hoveredId,
    () => null,
  );
}

export function useExploreSelectionState(): SelectionState {
  const api = useSelectionApi();
  return useSyncExternalStore(
    api.subscribe,
    api.getSnapshot,
    () => ({selectedId: null, hoveredId: null}),
  );
}
