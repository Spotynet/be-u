"use client";

import {useAuth} from "@/features/auth/hooks/useAuth";
import {ProtectedRoute} from "@/components/layout/ProtectedRoute";
import {Card, CardContent, CardHeader} from "@/components/ui/Card";
import {Button} from "@/components/ui/Button";
import {ThemeToggle} from "@/components/ThemeToggle";

export default function DashboardPage() {
  const {user, logout} = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b border-border bg-card">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <h1 className="text-xl font-bold text-foreground">nabbi Dashboard</h1>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-sm text-foreground-secondary">
                  Welcome, {user?.firstName} {user?.lastName}
                </div>
                <ThemeToggle variant="compact" />
                <Button variant="secondary" size="sm" onClick={handleLogout}>
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center min-h-[60vh]">
            <h1 className="text-6xl font-bold text-foreground text-center">Bienvenid@ a nabbi</h1>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
