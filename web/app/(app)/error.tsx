"use client";

import {ExclamationTriangleIcon} from "@heroicons/react/24/outline";
import {EmptyState} from "@/components/ui/EmptyState";

export default function AppError({
  reset,
}: {
  error: Error & {digest?: string};
  reset: () => void;
}) {
  return (
    <EmptyState
      icon={ExclamationTriangleIcon}
      title="Algo salió mal"
      description="No pudimos cargar esta pantalla. Revisa tu conexión e inténtalo de nuevo."
      primaryAction={{label: "Intentar de nuevo", onClick: reset}}
      size="lg"
    />
  );
}
