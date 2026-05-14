import {LoginForm, WelcomeSection, AuthLayout} from "@/components/auth";

export default function LoginPage() {
  return (
    <AuthLayout>
      <LoginForm />
      <WelcomeSection
        title="nabbi"
        description="Tu cita en automático. Reserva con los mejores profesionales de belleza, bienestar y mascotas — sin llamadas, sin esperas."
      />
    </AuthLayout>
  );
}
