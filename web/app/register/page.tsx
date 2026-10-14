import {Suspense} from "react";
import {RegisterForm, WelcomeSection, AuthLayout} from "@/components/auth";
import {RedirectIfAuthenticated} from "@/components/auth/RedirectIfAuthenticated";

export default function RegisterPage() {
  return (
    <RedirectIfAuthenticated>
      <AuthLayout>
        <Suspense
          fallback={
            <div style={{padding: 48, color: "#64748b", fontFamily: "var(--font-geist-sans)"}}>
              Cargando…
            </div>
          }>
          <RegisterForm />
        </Suspense>
        <WelcomeSection
          title="nabbi"
          description="En 2 minutos tienes tu cuenta lista. Belleza, bienestar y mascotas — nabbi lo gestiona todo por ti."
        />
      </AuthLayout>
    </RedirectIfAuthenticated>
  );
}
