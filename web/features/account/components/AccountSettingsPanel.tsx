"use client";

import {
  AdjustmentsHorizontalIcon,
  BellIcon,
  DocumentTextIcon,
  QuestionMarkCircleIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import {AccountGroupCard, AccountRow} from "@/components/account";
import {useAuth} from "@/features/auth/hooks/useAuth";
import {Card} from "@/components/ui/Card";

/** Shared Ajustes content for all account roles — links into Configuración hub. */
export function AccountSettingsPanel() {
  const {logout} = useAuth();

  return (
    <div className="flex flex-col gap-4">
      <AccountGroupCard label="Preferencias">
        <li>
          <AccountRow
            href="/notification-preferences?seccion=notificaciones"
            icon={BellIcon}
            title="Notificaciones"
            description="Cómo y cuándo te avisamos"
          />
        </li>
        <li>
          <AccountRow
            href="/notification-preferences?seccion=preferencias"
            icon={AdjustmentsHorizontalIcon}
            title="Preferencias de cuenta"
            description="Tema, ubicación y radio"
          />
        </li>
      </AccountGroupCard>

      <AccountGroupCard label="Seguridad y privacidad">
        <li>
          <AccountRow
            href="/notification-preferences?seccion=seguridad"
            icon={ShieldCheckIcon}
            title="Seguridad"
            description="Correo, contraseña y sesiones"
          />
        </li>
        <li>
          <AccountRow
            href="/notification-preferences?seccion=privacidad"
            icon={DocumentTextIcon}
            title="Privacidad y datos"
            description="Términos y aviso de privacidad"
          />
        </li>
        <li>
          <AccountRow
            href="/aviso-de-privacidad"
            icon={DocumentTextIcon}
            title="Aviso de privacidad"
            external
          />
        </li>
        <li>
          <AccountRow
            href="/terminos-y-condiciones"
            icon={DocumentTextIcon}
            title="Términos y condiciones"
            external
          />
        </li>
      </AccountGroupCard>

      <AccountGroupCard label="Ayuda">
        <li>
          <AccountRow
            href="/help"
            icon={QuestionMarkCircleIcon}
            title="Ayuda y soporte"
          />
        </li>
      </AccountGroupCard>

      <Card padding="md" className="rounded-[20px] border-card-border/60">
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-foreground-muted">
          Sesión
        </p>
        <button
          type="button"
          onClick={logout}
          className="mt-3 inline-flex h-11 w-full items-center justify-center rounded-full bg-error/10 px-4 text-[13px] font-bold text-error outline-none transition-colors hover:bg-error/15 focus-visible:ring-2 focus-visible:ring-primary @min-[480px]:w-auto">
          Cerrar sesión
        </button>
      </Card>
    </div>
  );
}
