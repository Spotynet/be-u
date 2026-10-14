"use client";

import Link from "next/link";
import {useAuth} from "@/features/auth/hooks/useAuth";
import {isProviderRole} from "@/lib/roles";

const INK = "#12211A";
const MAIN = "#558367";

export default function CreatePostHubPage() {
  const {user} = useAuth();
  const provider = isProviderRole(user?.role);

  return (
    <div style={{maxWidth: 480, margin: "0 auto"}}>
      <h1 style={{color: INK, fontWeight: 900, fontSize: 28, margin: "0 0 8px"}}>Crear publicación</h1>
      <p style={{color: "#64748b", margin: "0 0 20px", fontSize: 14}}>
        Elige un formato. Fase 2: foto y carrusel.
      </p>

      <div style={{display: "flex", flexDirection: "column", gap: 10}}>
        <FormatLink href="/posts/create/photo" title="Foto" desc="Una imagen con texto" />
        {provider && (
          <FormatLink
            href="/posts/create/carousel"
            title="Carrusel"
            desc="Hasta 5 imágenes (profesionales y lugares)"
          />
        )}
      </div>

      <Link href="/feed" style={{display: "inline-block", marginTop: 20, color: MAIN, fontWeight: 700, textDecoration: "none"}}>
        ← Volver al feed
      </Link>
    </div>
  );
}

function FormatLink({href, title, desc}: {href: string; title: string; desc: string}) {
  return (
    <Link
      href={href}
      style={{
        display: "block",
        background: "white",
        border: "1px solid rgba(18,33,26,0.08)",
        borderRadius: 16,
        padding: 18,
        textDecoration: "none",
        color: INK,
      }}>
      <div style={{fontWeight: 900, fontSize: 17}}>{title}</div>
      <div style={{color: "#64748b", fontSize: 13, marginTop: 4}}>{desc}</div>
    </Link>
  );
}
