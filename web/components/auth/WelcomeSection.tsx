"use client";

import {useTheme} from "@/components/ThemeProvider";
import {getSurfaces} from "@/constants/brand";

interface WelcomeSectionProps {
  title: string;
  description: string;
}

export const WelcomeSection = ({description}: WelcomeSectionProps) => {
  const {theme} = useTheme();
  const surf = getSurfaces(theme === "dark" ? "dark" : "light");

  return (
    <div
      className="auth-welcome"
      style={{
        background: surf.mode === "dark" ? surf.elevated : surf.forestMid,
      }}>
      <div style={{display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 20, position: "relative", maxWidth: 320}}>
        <div style={{display: "flex", alignItems: "center", gap: 12}}>
          <img
            src="/nabbi_logo_t.png"
            alt=""
            width={67}
            height={67}
            style={{
              display: "block",
              width: 67,
              height: 67,
            }}
          />
          <span style={{color: "white", fontWeight: 700, fontSize: 22, letterSpacing: "-0.03em"}}>nabbi</span>
        </div>

        <p style={{color: "rgba(255,255,255,0.82)", fontSize: 16, lineHeight: 1.65, margin: 0, fontWeight: 400}}>
          {description}
        </p>

        <ul style={{listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 10}}>
          {["Sin llamadas ni esperas", "Reserva automática las 24 horas", "Gratis para usuarios"].map((feat) => (
            <li key={feat} style={{display: "flex", alignItems: "center", gap: 10}}>
              <span
                aria-hidden="true"
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: surf.cta,
                  flexShrink: 0,
                }}
              />
              <span style={{color: "rgba(255,255,255,0.65)", fontSize: 13, fontWeight: 500}}>{feat}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
