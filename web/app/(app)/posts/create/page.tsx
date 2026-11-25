"use client";

import Link from "next/link";
import {PageHeaderRow, StackLayout} from "@/components/layout";
import {usePageHeader} from "@/components/shell/usePageHeader";
import {useAuth} from "@/features/auth/hooks/useAuth";
import {isProviderRole} from "@/lib/roles";

export default function CreatePostHubPage() {
  usePageHeader({title: "Crear publicación", pageOwnsTitle: true});
  const {user} = useAuth();
  const provider = isProviderRole(user?.role);

  return (
    <StackLayout>
      <PageHeaderRow
        title="Crear publicación"
        description="Elige un formato. Fase 2: foto y carrusel."
      />

      <div className="flex flex-col gap-2.5">
        <FormatLink href="/posts/create/photo" title="Foto" desc="Una imagen con texto" />
        {provider ? (
          <FormatLink
            href="/posts/create/carousel"
            title="Carrusel"
            desc="Hasta 5 imágenes (profesionales y lugares)"
          />
        ) : null}
      </div>

      <Link
        href="/feed"
        className="text-sm font-bold text-primary no-underline">
        ← Volver al feed
      </Link>
    </StackLayout>
  );
}

function FormatLink({href, title, desc}: {href: string; title: string; desc: string}) {
  return (
    <Link
      href={href}
      className="block rounded-[var(--card-radius)] border border-card-border bg-card p-[18px] text-foreground no-underline shadow-card transition-shadow hover:shadow-card-hover">
      <div className="text-[17px] font-black">{title}</div>
      <div className="mt-1 text-[13px] text-foreground-secondary">{desc}</div>
    </Link>
  );
}