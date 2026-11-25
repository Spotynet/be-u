"use client";

import {useState} from "react";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {PageHeaderRow, StackLayout} from "@/components/layout";
import {usePageHeader} from "@/components/shell/usePageHeader";
import {postApi, errorUtils} from "@/lib/api";

export default function CreatePhotoPostPage() {
  usePageHeader({title: "Nueva foto", pageOwnsTitle: true});
  const router = useRouter();
  const [content, setContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onFile = (f: File | null) => {
    setFile(f);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(f ? URL.createObjectURL(f) : null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!file) {
      setError("Selecciona una imagen.");
      return;
    }
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("content", content.trim());
      formData.append("post_type", "photo");
      formData.append("media", file);
      await postApi.createPhotoPost(formData);
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
        title="Nueva foto"
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
          <span className="text-[13px] font-bold text-foreground">Imagen</span>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => onFile(e.target.files?.[0] || null)}
            required
          />
        </label>
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview}
            alt=""
            className="max-h-[320px] w-full rounded-[var(--control-radius)] object-cover"
          />
        ) : null}
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-bold text-foreground">Texto (opcional)</span>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
            placeholder="Escribe un pie de foto…"
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
          {submitting ? "Publicando…" : "Publicar"}
        </button>
      </form>
    </StackLayout>
  );
}