import {LoginForm, WelcomeSection, AuthLayout} from "@/components/auth";

export default function LoginPage() {
  return (
    <AuthLayout>
      <LoginForm />
      <WelcomeSection
        title="¡BIENVENIDO A nabbi!"
        description="Tu plataforma personal de bienestar y belleza. Descubre servicios, reserva citas y conéctate con profesionales que te ayudan a ser tu mejor versión."
      />
    </AuthLayout>
  );
}
