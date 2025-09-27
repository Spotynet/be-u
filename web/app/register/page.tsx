"use client";

import {useState} from "react";
import {useRouter} from "next/navigation";
import {authApi, tokenUtils, ApiError} from "@/lib/api";
import {RegisterData} from "@/types/api";
import {Card, CardContent, CardHeader} from "@/components/ui/Card";
import {Button} from "@/components/ui/Button";
import {Input} from "@/components/ui/Input";
import {ThemeToggle} from "@/components/ThemeToggle";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
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

    // Basic validation
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long");
      setIsLoading(false);
      return;
    }

    try {
      const registerData: RegisterData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
      };

      const response = await authApi.register(registerData);

      // Store the authentication token
      tokenUtils.setToken(response.data.token);

      // Redirect to home page or dashboard
      router.push("/");
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || "Registration failed. Please try again.");
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
          <h2 className="text-3xl font-extrabold text-foreground">Create your Be-U account</h2>
          <p className="mt-2 text-sm text-foreground-secondary">
            Join Be-U and start your journey today.
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="text-center">
              <h3 className="text-lg font-medium text-card-foreground">Register</h3>
            </div>
          </CardHeader>
          <CardContent>
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="First Name"
                    name="firstName"
                    type="text"
                    required
                    placeholder="First name"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    disabled={isLoading}
                  />
                  <Input
                    label="Last Name"
                    name="lastName"
                    type="text"
                    required
                    placeholder="Last name"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    disabled={isLoading}
                  />
                </div>

                <Input
                  label="Email Address"
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
                  autoComplete="new-password"
                  required
                  placeholder="Password (min. 6 characters)"
                  value={formData.password}
                  onChange={handleInputChange}
                  disabled={isLoading}
                />

                <Input
                  label="Confirm Password"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  placeholder="Confirm password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  disabled={isLoading}
                />
              </div>

              {error && (
                <div className="rounded-md bg-error-light p-4">
                  <div className="text-sm text-error">{error}</div>
                </div>
              )}

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
                    Creating account...
                  </div>
                ) : (
                  "Create Account"
                )}
              </Button>

              <div className="text-center">
                <p className="text-sm text-foreground-secondary">
                  Already have an account?{" "}
                  <a href="/login" className="font-medium text-primary hover:text-primary-hover">
                    Sign in here
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
