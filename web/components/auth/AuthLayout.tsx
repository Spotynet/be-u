"use client";

import {ReactNode} from "react";
import Link from "next/link";

// ─── Brand tokens (mirrors landing page) ────────────────────────────────────
const MAIN = "#558367";  // verde salvia
const ACCENT = "#F6C531"; // amarillo vibrante
const TEAL = "#225D65";  // azul pizarra
/** Fondo pantalla: verde bosque más claro que #12211A (menos “negro”) */
const SCREEN_TOP = "#335548";
const SCREEN_MID = "#254038";
const SCREEN_DEEP = "#1a2f28";

interface AuthLayoutProps {
  children: ReactNode;
}

export const AuthLayout = ({children}: AuthLayoutProps) => {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: `linear-gradient(168deg, ${SCREEN_TOP} 0%, ${SCREEN_MID} 46%, ${SCREEN_DEEP} 100%)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 16px",
        position: "relative",
        overflow: "hidden",
        fontFamily: "var(--font-geist-sans)",
      }}>

      {/* Decorative blobs — más opacos = verde más visible (menos “fantasma”) */}
      <div style={{position:"absolute",top:"-10%",right:"-5%",width:440,height:440,borderRadius:"50%",background:MAIN,opacity:0.22,filter:"blur(72px)",pointerEvents:"none"}}/>
      <div style={{position:"absolute",bottom:"-8%",left:"-6%",width:340,height:340,borderRadius:"50%",background:TEAL,opacity:0.2,filter:"blur(56px)",pointerEvents:"none"}}/>
      <div style={{position:"absolute",top:"38%",left:"18%",width:220,height:220,borderRadius:"50%",background:ACCENT,opacity:0.12,filter:"blur(48px)",pointerEvents:"none"}}/>
      <div style={{position:"absolute",bottom:"20%",right:"12%",width:160,height:160,borderRadius:"50%",background:MAIN,opacity:0.18,filter:"blur(36px)",pointerEvents:"none"}}/>

      {/* Back to home */}
      <div style={{position:"absolute",top:20,left:20,zIndex:10}}>
        <Link
          href="/"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
            color: "rgba(255,255,255,0.6)",
            fontSize: 13,
            fontWeight: 600,
            textDecoration: "none",
            transition: "color 0.15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = ACCENT)}
          onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.6)")}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
          Volver al inicio
        </Link>
      </div>

      {/* Auth Card */}
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 940,
          borderRadius: 28,
          overflow: "hidden",
          boxShadow: "0 48px 120px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06)",
        }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            minHeight: 620,
          }}
          className="grid-cols-1 lg:grid-cols-2">
          {children}
        </div>
      </div>
    </div>
  );
};
