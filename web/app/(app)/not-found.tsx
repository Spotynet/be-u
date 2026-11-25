import {MagnifyingGlassIcon} from "@heroicons/react/24/outline";
import {EmptyState} from "@/components/ui/EmptyState";

export default function AppNotFound() {
  return (
    <EmptyState
      icon={MagnifyingGlassIcon}
      title="No encontramos esta página"
      description="El enlace puede estar roto o la página ya no existe."
      primaryAction={{label: "Ir a Explorar", href: "/explore"}}
      secondaryAction={{label: "Ir al Feed", href: "/feed"}}
      size="lg"
    />
  );
}
