"use client";

import {useState} from "react";
import {useRouter} from "next/navigation";
import {useAuth} from "@/hooks/useAuth";
import {LoginCredentials} from "@/types/api";
import {Card, CardContent, CardHeader} from "@/components/ui/Card";
import {Button} from "@/components/ui/Button";
import {Input} from "@/components/ui/Input";
import {ThemeToggle} from "@/components/ThemeToggle";

export default function LoginPage() {
  const [formData, setFormData] = useState<LoginCredentials>({
    email: "",
    password: "",
  });
  const {login, error, clearError, isLoading} = useAuth();
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
    if (!formData.email || !formData.password) {
      console.log("Missing email or password");
      return;
    }

    try {
      await login(formData);
      // Redirect to dashboard after successful login
      router.push("/dashboard");
    } catch (err) {
      // Error is handled by the auth hook
      console.error("Login failed:", err);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-purple-800/20"></div>
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl"></div>

      {/* Theme Toggle */}
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle variant="compact" />
      </div>

      {/* Main Login Card */}
      <div className="relative w-full max-w-4xl">
        <div className="bg-black/80 backdrop-blur-sm border border-purple-500/30 rounded-2xl overflow-hidden shadow-2xl shadow-purple-500/20">
          <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[600px]">
            {/* Left Section - Login Form */}
            <div className="bg-black/90 p-12 flex flex-col justify-center">
              <div className="text-center mb-8">
                <h1 className="text-4xl font-bold text-white mb-2">Iniciar Sesión</h1>
              </div>

              <form className="space-y-8" onSubmit={handleSubmit}>
                <div className="space-y-6">
                  {/* Email Input */}
                  <div className="relative">
                    <label className="block text-gray-300 text-sm font-medium mb-2">Usuario</label>
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
                        className="w-full bg-transparent border-0 border-b-2 border-purple-400/50 text-white placeholder-gray-500 focus:border-purple-400 focus:outline-none py-3 px-0 transition-colors"
                      />
                      <div className="absolute right-0 top-1/2 transform -translate-y-1/2">
                        <svg
                          className="w-5 h-5 text-purple-400"
                          fill="currentColor"
                          viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Password Input */}
                  <div className="relative">
                    <label className="block text-gray-300 text-sm font-medium mb-2">
                      Contraseña
                    </label>
                    <div className="relative">
                      <input
                        name="password"
                        type="password"
                        autoComplete="current-password"
                        required
                        placeholder="Ingresa tu contraseña"
                        value={formData.password}
                        onChange={handleInputChange}
                        disabled={isLoading}
                        className="w-full bg-transparent border-0 border-b-2 border-purple-400/50 text-white placeholder-gray-500 focus:border-purple-400 focus:outline-none py-3 px-0 transition-colors"
                      />
                      <div className="absolute right-0 top-1/2 transform -translate-y-1/2">
                        <svg
                          className="w-5 h-5 text-purple-400"
                          fill="currentColor"
                          viewBox="0 0 20 20">
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
                  <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4">
                    <div className="text-sm text-red-400">{error}</div>
                  </div>
                )}

                {/* Login Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white font-semibold py-4 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none">
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
                      Iniciando sesión...
                    </div>
                  ) : (
                    "Iniciar Sesión"
                  )}
                </button>

                {/* Sign Up Link */}
                <div className="text-center">
                  <p className="text-gray-400 text-sm">
                    ¿No tienes una cuenta?{" "}
                    <a
                      href="/register"
                      className="text-purple-400 hover:text-purple-300 font-medium transition-colors">
                      Regístrate
                    </a>
                  </p>
                </div>
              </form>
            </div>

            {/* Right Section - Welcome Message */}
            <div className="bg-gradient-to-br from-purple-600 via-purple-700 to-purple-800 p-12 flex flex-col justify-center items-center text-center">
              <h2 className="text-2xl font-bold text-white mb-6 tracking-wider">
                ¡BIENVENIDO A BE-U!
              </h2>
              <p className="text-white/90 text-lg leading-relaxed max-w-sm">
                Tu plataforma personal de bienestar y belleza. Descubre servicios, reserva citas y
                conéctate con profesionales que te ayudan a ser tu mejor versión.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
