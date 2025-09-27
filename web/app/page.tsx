"use client";

import {Card, CardContent, CardHeader} from "@/components/ui/Card";
import {Button} from "@/components/ui/Button";
import {ThemeToggle} from "@/components/ThemeToggle";
import {useTheme} from "@/components/ThemeProvider";

export default function Home() {
  const {theme, availableThemes} = useTheme();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-foreground">Be-U</h1>
            </div>
            <div className="flex items-center gap-4">
              <ThemeToggle variant="dropdown" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Welcome Section */}
          <div className="text-center">
            <h2 className="text-4xl font-bold text-foreground mb-4">Welcome to Be-U</h2>
            <p className="text-lg text-foreground-secondary max-w-2xl mx-auto">
              Your personal wellness and beauty platform. Discover services, book appointments, and
              connect with professionals who help you be your best self.
            </p>
          </div>

          {/* Theme Demo Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card hover>
              <CardHeader>
                <h3 className="text-lg font-semibold text-card-foreground">Current Theme</h3>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full bg-primary"></div>
                    <span className="text-card-foreground font-medium">
                      {availableThemes.find((t) => t.value === theme)?.label}
                    </span>
                  </div>
                  <p className="text-sm text-foreground-muted">
                    {availableThemes.find((t) => t.value === theme)?.description}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card hover>
              <CardHeader>
                <h3 className="text-lg font-semibold text-card-foreground">Color Palette</h3>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <div className="w-full h-8 bg-primary rounded"></div>
                    <p className="text-xs text-foreground-muted">Primary</p>
                  </div>
                  <div className="space-y-1">
                    <div className="w-full h-8 bg-secondary rounded"></div>
                    <p className="text-xs text-foreground-muted">Secondary</p>
                  </div>
                  <div className="space-y-1">
                    <div className="w-full h-8 bg-accent rounded"></div>
                    <p className="text-xs text-foreground-muted">Accent</p>
                  </div>
                  <div className="space-y-1">
                    <div className="w-full h-8 bg-success rounded"></div>
                    <p className="text-xs text-foreground-muted">Success</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card hover>
              <CardHeader>
                <h3 className="text-lg font-semibold text-card-foreground">Components</h3>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button variant="primary" size="sm" className="w-full">
                    Primary Button
                  </Button>
                  <Button variant="secondary" size="sm" className="w-full">
                    Secondary Button
                  </Button>
                  <Button variant="accent" size="sm" className="w-full">
                    Accent Button
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Available Themes */}
          <div>
            <h3 className="text-2xl font-bold text-foreground mb-6">Available Themes</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {availableThemes.map((themeOption) => (
                <Card key={themeOption.value} hover>
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-primary"></div>
                        <span className="font-medium text-card-foreground">
                          {themeOption.label}
                        </span>
                      </div>
                      <p className="text-xs text-foreground-muted">{themeOption.description}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center gap-4">
            <Button variant="primary" size="lg">
              Get Started
            </Button>
            <Button variant="secondary" size="lg">
              Learn More
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
