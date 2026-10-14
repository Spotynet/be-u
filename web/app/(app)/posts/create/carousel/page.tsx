"use client";

import {useEffect, useState} from "react";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {useAuth} from "@/features/auth/hooks/useAuth";
import {isProviderRole} from "@/lib/roles";
import {postApi, errorUtils} from "@/lib/api";

const INK = "#12211A";
const DARK = "#1F3328";
const MAIN = "#558367";
const ACCENT = "#F6C531";

export default function CreateCarouselPostPage() {
  const router = useRouter();
  const {user, isLoading} = useAuth();
  const [content, setContent] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && user && !isProviderRole(user.role)) {
      router.replace("/posts/create/photo");
    }
  }, [user, isLoading, router]);

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
    <div style={{maxWidth: 480, margin: "0 auto"}}>
      <Link href="/posts/create" style={{color: MAIN, fontWeight: 700, textDecoration: "none", fontSize: 14}}>
        ← Formatos
      </Link>
      <h1 style={{color: INK, fontWeight: 900, fontSize: 26, margin: "12px 0 16px"}}>Nuevo carrusel</h1>

      <form onSubmit={handleSubmit} style={{display: "flex", flexDirection: "column", gap: 14}}>
        <label style={{display: "flex", flexDirection: "column", gap: 6}}>
          <span style={{fontWeight: 700, color: DARK, fontSize: 13}}>Imágenes (2–5)</span>
          <input type="file" accept="image/*" multiple onChange={(e) => onFiles(e.target.files)} />
        </label>
        {previews.length > 0 && (
          <div style={{display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))", gap: 8}}>
            {previews.map((src) => (
              <img key={src} src={src} alt="" style={{width: "100%", aspectRatio: "1", objectFit: "cover", borderRadius: 10}} />
            ))}
          </div>
        )}
        <label style={{display: "flex", flexDirection: "column", gap: 6}}>
          <span style={{fontWeight: 700, color: DARK, fontSize: 13}}>Texto (opcional)</span>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
            placeholder="Describe tu trabajo…"
            style={{
              padding: 12,
              borderRadius: 12,
              border: "1.5px solid rgba(85,131,103,0.22)",
              fontSize: 14,
              resize: "vertical",
            }}
          />
        </label>
        {error && (
          <div style={{background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 12, padding: 12, color: "#dc2626", fontSize: 14}}>
            {error}
          </div>
        )}
        <button
          type="submit"
          disabled={submitting}
          style={{
            background: ACCENT,
            color: INK,
            border: "none",
            borderRadius: 14,
            padding: "14px 0",
            fontWeight: 800,
            fontSize: 15,
            cursor: submitting ? "not-allowed" : "pointer",
            opacity: submitting ? 0.65 : 1,
          }}>
          {submitting ? "Publicando…" : "Publicar carrusel"}
        </button>
      </form>
    </div>
  );
}
