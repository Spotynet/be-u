import {LoginForm, WelcomeSection, AuthLayout} from "@/components/auth";
import {RedirectIfAuthenticated} from "@/components/auth/RedirectIfAuthenticated";

export default function LoginPage() {
  return (
    <RedirectIfAuthenticated>
      <AuthLayout>
        <LoginForm />
        <WelcomeSection
          title="nabbi"
          description="Tu cita en automático. Reserva con los mejores profesionales de belleza, bienestar y mascotas — sin llamadas, sin esperas."
        />
      </AuthLayout>
    </RedirectIfAuthenticated>
  );
}
