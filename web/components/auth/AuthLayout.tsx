import {ReactNode} from "react";
import {ThemeToggle} from "@/components/ThemeToggle";

interface AuthLayoutProps {
  children: ReactNode;
}

export const AuthLayout = ({children}: AuthLayoutProps) => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/10"></div>
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl"></div>

      {/* Theme Toggle */}
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle variant="compact" />
      </div>

      {/* Main Auth Card */}
      <div className="relative w-full max-w-4xl">
        <div className="bg-card/80 backdrop-blur-sm border border-border rounded-2xl overflow-hidden shadow-2xl shadow-primary/20">
          <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[600px]">{children}</div>
        </div>
      </div>
    </div>
  );
};

