import {RegisterForm, WelcomeSection, AuthLayout} from "@/components/auth";

export default function RegisterPage() {
  return (
    <AuthLayout>
      <RegisterForm />
      <WelcomeSection
        title="nabbi"
        description="En 2 minutos tienes tu cuenta lista. Belleza, bienestar y mascotas — nabbi lo gestiona todo por ti."
      />
    </AuthLayout>
  );
}
