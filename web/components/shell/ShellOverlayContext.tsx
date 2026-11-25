/**
 * Re-exports the OverlayProvider API.
 * Prefer importing from `@/components/shell/overlay`.
 */
export {
  OverlayProvider as ShellOverlayProvider,
  useShellOverlay,
  useManagedOverlay,
  useOverlay,
} from "./overlay";
export type {ShellOverlayId} from "./overlay";
