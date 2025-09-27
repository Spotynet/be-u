"use client";

import {useState} from "react";
import {useTheme} from "@/components/ThemeProvider";

interface ThemeToggleProps {
  variant?: "button" | "dropdown" | "compact";
  className?: string;
}

export const ThemeToggle = ({variant = "dropdown", className = ""}: ThemeToggleProps) => {
  const {theme, setTheme, availableThemes} = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const currentTheme = availableThemes.find((t) => t.value === theme);

  if (variant === "button") {
    return (
      <button
        onClick={() => {
          const currentIndex = availableThemes.findIndex((t) => t.value === theme);
          const nextIndex = (currentIndex + 1) % availableThemes.length;
          setTheme(availableThemes[nextIndex].value);
        }}
        className={`inline-flex items-center gap-2 px-3 py-2 rounded-md border border-border bg-card text-card-foreground hover:bg-card-hover transition-colors ${className}`}
        title={`Current theme: ${currentTheme?.label}. Click to cycle themes.`}>
        <div className="w-4 h-4 rounded-full bg-primary"></div>
        <span className="text-sm font-medium">{currentTheme?.label}</span>
      </button>
    );
  }

  if (variant === "compact") {
    return (
      <div className={`relative ${className}`}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex items-center justify-center w-8 h-8 rounded-md border border-border bg-card text-card-foreground hover:bg-card-hover transition-colors"
          title={`Current theme: ${currentTheme?.label}`}>
          <div className="w-3 h-3 rounded-full bg-primary"></div>
        </button>

        {isOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
            <div className="absolute right-0 top-full mt-2 w-48 bg-card border border-border rounded-md shadow-lg z-20 backdrop-blur-sm">
              <div className="p-2">
                <div className="text-xs font-medium text-foreground-muted mb-2 px-2">
                  Choose Theme
                </div>
                {availableThemes.map((themeOption) => (
                  <button
                    key={themeOption.value}
                    onClick={() => {
                      setTheme(themeOption.value);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-2 py-2 text-sm rounded-md transition-colors ${
                      theme === themeOption.value
                        ? "bg-primary text-primary-foreground"
                        : "text-card-foreground hover:bg-background-secondary"
                    }`}>
                    <div
                      className={`w-3 h-3 rounded-full ${
                        theme === themeOption.value ? "bg-primary-foreground" : "bg-primary"
                      }`}
                    />
                    <div className="text-left">
                      <div className="font-medium">{themeOption.label}</div>
                      <div className="text-xs opacity-75">{themeOption.description}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  // Default dropdown variant
  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-border bg-card text-card-foreground hover:bg-card-hover transition-colors">
        <div className="w-4 h-4 rounded-full bg-primary"></div>
        <span className="text-sm font-medium">{currentTheme?.label}</span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-64 bg-card border border-border rounded-md shadow-lg z-20 backdrop-blur-sm">
            <div className="p-3">
              <div className="text-sm font-medium text-foreground mb-3">Choose Theme</div>
              <div className="space-y-1">
                {availableThemes.map((themeOption) => (
                  <button
                    key={themeOption.value}
                    onClick={() => {
                      setTheme(themeOption.value);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors ${
                      theme === themeOption.value
                        ? "bg-primary text-primary-foreground"
                        : "text-card-foreground hover:bg-background-secondary"
                    }`}>
                    <div
                      className={`w-4 h-4 rounded-full ${
                        theme === themeOption.value ? "bg-primary-foreground" : "bg-primary"
                      }`}
                    />
                    <div className="text-left">
                      <div className="font-medium">{themeOption.label}</div>
                      <div className="text-xs opacity-75">{themeOption.description}</div>
                    </div>
                    {theme === themeOption.value && (
                      <svg className="w-4 h-4 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
