"use client";

import {useState} from "react";
import {useRouter} from "next/navigation";
import {useAuth} from "@/features/auth/hooks/useAuth";
import {RegisterData} from "@/features/auth/types";

export const RegisterForm = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const {register, error, clearError, isLoading} = useAuth();
  const router = useRouter();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const {name, value} = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (error) clearError();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (formData.password !== formData.confirmPassword) {
      // Use the auth hook's error handling
      return;
    }

    if (formData.password.length < 6) {
      // Use the auth hook's error handling
      return;
    }

    try {
      const registerData: RegisterData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
      };

      await register(registerData);
      // Redirect to dashboard after successful registration
      router.push("/dashboard");
    } catch (err) {
      // Error is handled by the auth hook
      console.error("Registration failed:", err);
    }
  };

  return (
    <div className="bg-background/90 p-12 flex flex-col justify-center">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-2">Crear Cuenta</h1>
      </div>

      <form className="space-y-8" onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Name Fields */}
          <div className="grid grid-cols-2 gap-6">
            {/* First Name Input */}
            <div className="relative">
              <label className="block text-foreground-secondary text-sm font-medium mb-2">
                Nombre
              </label>
              <div className="relative">
                <input
                  name="firstName"
                  type="text"
                  required
                  placeholder="Nombre"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  className="w-full bg-transparent border-0 border-b-2 border-primary/50 text-foreground placeholder-foreground-muted focus:border-primary focus:outline-none py-3 px-0 transition-colors"
                />
                <div className="absolute right-0 top-1/2 transform -translate-y-1/2">
                  <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* Last Name Input */}
            <div className="relative">
              <label className="block text-foreground-secondary text-sm font-medium mb-2">
                Apellido
              </label>
              <div className="relative">
                <input
                  name="lastName"
                  type="text"
                  required
                  placeholder="Apellido"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  className="w-full bg-transparent border-0 border-b-2 border-primary/50 text-foreground placeholder-foreground-muted focus:border-primary focus:outline-none py-3 px-0 transition-colors"
                />
                <div className="absolute right-0 top-1/2 transform -translate-y-1/2">
                  <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Email Input */}
          <div className="relative">
            <label className="block text-foreground-secondary text-sm font-medium mb-2">
              Correo Electrónico
            </label>
            <div className="relative">
              <input
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="Ingresa tu email"
                value={formData.email}
                onChange={handleInputChange}
                disabled={isLoading}
                className="w-full bg-transparent border-0 border-b-2 border-primary/50 text-foreground placeholder-foreground-muted focus:border-primary focus:outline-none py-3 px-0 transition-colors"
              />
              <div className="absolute right-0 top-1/2 transform -translate-y-1/2">
                <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"
                  />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Password Input */}
          <div className="relative">
            <label className="block text-foreground-secondary text-sm font-medium mb-2">
              Contraseña
            </label>
            <div className="relative">
              <input
                name="password"
                type="password"
                autoComplete="new-password"
                required
                placeholder="Contraseña (min. 6 caracteres)"
                value={formData.password}
                onChange={handleInputChange}
                disabled={isLoading}
                className="w-full bg-transparent border-0 border-b-2 border-primary/50 text-foreground placeholder-foreground-muted focus:border-primary focus:outline-none py-3 px-0 transition-colors"
              />
              <div className="absolute right-0 top-1/2 transform -translate-y-1/2">
                <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Confirm Password Input */}
          <div className="relative">
            <label className="block text-foreground-secondary text-sm font-medium mb-2">
              Confirmar Contraseña
            </label>
            <div className="relative">
              <input
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                placeholder="Confirma tu contraseña"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                disabled={isLoading}
                className="w-full bg-transparent border-0 border-b-2 border-primary/50 text-foreground placeholder-foreground-muted focus:border-primary focus:outline-none py-3 px-0 transition-colors"
              />
              <div className="absolute right-0 top-1/2 transform -translate-y-1/2">
                <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-error-light border border-error/50 rounded-lg p-4">
            <div className="text-sm text-error">{error}</div>
          </div>
        )}

        {/* Register Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-primary to-primary-dark hover:from-primary-hover hover:to-primary text-primary-foreground font-semibold py-4 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg shadow-primary/25 hover:shadow-primary/40 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none">
          {isLoading ? (
            <div className="flex items-center justify-center">
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Creando cuenta...
            </div>
          ) : (
            "Crear Cuenta"
          )}
        </button>

        {/* Sign In Link */}
        <div className="text-center">
          <p className="text-foreground-muted text-sm">
            ¿Ya tienes una cuenta?{" "}
            <a
              href="/login"
              className="text-primary hover:text-primary-hover font-medium transition-colors">
              Inicia sesión aquí
            </a>
          </p>
        </div>
      </form>
    </div>
  );
};

