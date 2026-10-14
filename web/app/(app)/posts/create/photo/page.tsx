"use client";

import {useState} from "react";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {postApi, errorUtils} from "@/lib/api";

const INK = "#12211A";
const DARK = "#1F3328";
const MAIN = "#558367";
const ACCENT = "#F6C531";

export default function CreatePhotoPostPage() {
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
    <div style={{maxWidth: 480, margin: "0 auto"}}>
      <Link href="/posts/create" style={{color: MAIN, fontWeight: 700, textDecoration: "none", fontSize: 14}}>
        ← Formatos
      </Link>
      <h1 style={{color: INK, fontWeight: 900, fontSize: 26, margin: "12px 0 16px"}}>Nueva foto</h1>

      <form onSubmit={handleSubmit} style={{display: "flex", flexDirection: "column", gap: 14}}>
        <label style={{display: "flex", flexDirection: "column", gap: 6}}>
          <span style={{fontWeight: 700, color: DARK, fontSize: 13}}>Imagen</span>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => onFile(e.target.files?.[0] || null)}
            required
          />
        </label>
        {preview && (
          <img src={preview} alt="" style={{width: "100%", borderRadius: 14, maxHeight: 320, objectFit: "cover"}} />
        )}
        <label style={{display: "flex", flexDirection: "column", gap: 6}}>
          <span style={{fontWeight: 700, color: DARK, fontSize: 13}}>Texto (opcional)</span>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
            placeholder="Escribe un pie de foto…"
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
          {submitting ? "Publicando…" : "Publicar"}
        </button>
      </form>
    </div>
  );
}
