import {Suspense} from "react";
import {RegisterForm} from "@/components/auth/RegisterForm";

function RegisterPageInner() {
  return <RegisterForm compact embedded />;
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="auth-form-panel auth-form-panel--embedded">
          <p className="auth-subtitle">Cargando...</p>
        </div>
      }>
      <RegisterPageInner />
    </Suspense>
  );
}
