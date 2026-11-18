import type {ReactNode} from "react";

export type DropdownOption<T extends string | number = string> = {
  value: T;
  label: string;
  description?: string;
  icon?: ReactNode;
  disabled?: boolean;
  group?: string;
  keywords?: string[];
};

export type PopoverPlacement = "bottom" | "top" | "auto";

export type PopoverPos = {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
  side: "top" | "bottom";
};

export type LoadOptionsFn<T extends string | number> = (args: {
  query: string;
  page: number;
  pageSize: number;
  signal?: AbortSignal;
}) => Promise<{options: DropdownOption<T>[]; hasMore: boolean}>;

export type OptionRenderFn<T extends string | number> = (
  option: DropdownOption<T>,
  state: {selected: boolean; active: boolean}
) => ReactNode;
