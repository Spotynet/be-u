"use client";

import {
  DocumentTextIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import {AccountGroupCard, AccountRow} from "@/components/account";

/** Seguridad tab — links into Configuración hub (no duplicated password form). */
export function SecurityPanel() {
  return (
    <div className="flex flex-col gap-4">
      <AccountGroupCard label="Acceso">
        <li>
          <AccountRow
            href="/notification-preferences?seccion=seguridad"
            icon={ShieldCheckIcon}
            title="Seguridad"
            description="Correo, contraseña y sesiones"
          />
        </li>
      </AccountGroupCard>

      <AccountGroupCard label="Privacidad">
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
    </div>
  );
}
