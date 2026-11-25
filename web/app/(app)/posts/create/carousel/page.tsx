"use client";

import {useEffect, useState} from "react";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {PageHeaderRow, StackLayout} from "@/components/layout";
import {usePageHeader} from "@/components/shell/usePageHeader";
import {useAuth} from "@/features/auth/hooks/useAuth";
import {isProviderRole} from "@/lib/roles";
import {postApi, errorUtils} from "@/lib/api";

export default function CreateCarouselPostPage() {
  usePageHeader({title: "Nuevo carrusel", pageOwnsTitle: true});
  const router = useRouter();
  const {user, isInitializing} = useAuth();
  const [content, setContent] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isInitializing && user && !isProviderRole(user.role)) {
      router.replace("/posts/create/photo");
    }
  }, [user, isInitializing, router]);

  const onFiles = (list: FileList | null) => {
    const next = Array.from(list || []).slice(0, 5);
    setFiles(next);
    setPreviews((prev) => {
      prev.forEach((u) => URL.revokeObjectURL(u));
      return next.map((f) => URL.createObjectURL(f));
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (files.length < 2) {
      setError("El carrusel necesita al menos 2 imágenes (máx. 5).");
      return;
    }
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("content", content.trim());
      formData.append("post_type", "carousel");
      formData.append("allow_comments", "true");
      files.forEach((f) => formData.append("media", f));
      await postApi.createCarouselPost(formData);
      router.push("/feed");
    } catch (err) {
      setError(errorUtils.getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <StackLayout>
      <PageHeaderRow
        title="Nuevo carrusel"
        meta={
          <Link
            href="/posts/create"
            className="text-sm font-bold text-primary no-underline">
            ← Formatos
          </Link>
        }
      />

      <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-bold text-foreground">Imágenes (2–5)</span>
          <input type="file" accept="image/*" multiple onChange={(e) => onFiles(e.target.files)} />
        </label>
        {previews.length > 0 ? (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(90px,1fr))] gap-2">
            {previews.map((src) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={src}
                src={src}
                alt=""
                className="aspect-square w-full rounded-[10px] object-cover"
              />
            ))}
          </div>
        ) : null}
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-bold text-foreground">Texto (opcional)</span>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
            placeholder="Describe tu trabajo…"
            className="rounded-[var(--control-radius)] border-[1.5px] border-primary/25 bg-card px-3 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </label>
        {error ? (
          <div className="rounded-xl border border-error/40 bg-error/10 p-3 text-sm text-error">
            {error}
          </div>
        ) : null}
        <button
          type="submit"
          disabled={submitting}
          className="nabbi-btn nabbi-btn-accent w-full rounded-[var(--control-radius)] py-3.5 text-[15px] font-extrabold disabled:opacity-65">
          {submitting ? "Publicando…" : "Publicar carrusel"}
        </button>
      </form>
    </StackLayout>
  );
}