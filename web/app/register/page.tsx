import {RegisterForm, WelcomeSection, AuthLayout} from "@/components/auth";

export default function RegisterPage() {
  return (
    <AuthLayout>
      <RegisterForm />
      <WelcomeSection
        title="¡ÚNETE A nabbi!"
        description="Crea tu cuenta y comienza tu transformación personal. Accede a servicios exclusivos, reserva citas con expertos y forma parte de una comunidad que te ayuda a brillar."
      />
    </AuthLayout>
  );
}
