"use client";

import {useState} from "react";
import {useRouter} from "next/navigation";
import {authApi, tokenUtils, ApiError} from "@/lib/api";
import {LoginCredentials} from "@/types/api";
import {Card, CardContent, CardHeader} from "@/components/ui/Card";
import {Button} from "@/components/ui/Button";
import {Input} from "@/components/ui/Input";
import {ThemeToggle} from "@/components/ThemeToggle";

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const {name, value} = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (error) setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const credentials: LoginCredentials = {
        email: formData.email,
        password: formData.password,
      };

      const response = await authApi.login(credentials);

      // Store the authentication token
      tokenUtils.setToken(response.data.token);

      // Redirect to home page or dashboard
      router.push("/");
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || "Login failed. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
      {/* Theme Toggle */}
      <div className="absolute top-4 right-4">
        <ThemeToggle variant="compact" />
      </div>

      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-foreground">Sign in to Be-U</h2>
          <p className="mt-2 text-sm text-foreground-secondary">
            Welcome back! Please sign in to your account.
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="text-center">
              <h3 className="text-lg font-medium text-card-foreground">Login</h3>
            </div>
          </CardHeader>
          <CardContent>
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-4">
                <Input
                  label="Email address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleInputChange}
                  disabled={isLoading}
                />

                <Input
                  label="Password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleInputChange}
                  disabled={isLoading}
                />
              </div>

              {error && (
                <div className="rounded-md bg-error-light p-4">
                  <div className="text-sm text-error">{error}</div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-primary focus:ring-primary border-border rounded"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-foreground">
                    Remember me
                  </label>
                </div>

                <div className="text-sm">
                  <a href="#" className="font-medium text-primary hover:text-primary-hover">
                    Forgot your password?
                  </a>
                </div>
              </div>

              <Button type="submit" disabled={isLoading} className="w-full" size="lg">
                {isLoading ? (
                  <div className="flex items-center">
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
                    Signing in...
                  </div>
                ) : (
                  "Sign in"
                )}
              </Button>

              <div className="text-center">
                <p className="text-sm text-foreground-secondary">
                  Don&apos;t have an account?{" "}
                  <a href="/register" className="font-medium text-primary hover:text-primary-hover">
                    Sign up here
                  </a>
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
