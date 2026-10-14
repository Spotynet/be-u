"use client";

import {useState} from "react";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {useAuth} from "@/features/auth/hooks/useAuth";
import {useFeed} from "@/features/posts/hooks/useFeed";
import {PostCard} from "@/components/posts/PostCard";
import {MAIN_CATEGORIES} from "@/constants/categories";

const INK = "#12211A";
const DARK = "#1F3328";
const MAIN = "#558367";
const ACCENT = "#F6C531";

export default function FeedPage() {
  const [category, setCategory] = useState<string>("");
  const [blockedUsers, setBlockedUsers] = useState<number[]>([]);
  const {posts, loading, error, toggleLike} = useFeed(category || undefined);
  const {isAuthenticated} = useAuth();
  const router = useRouter();

  const handleLike = async (id: number) => {
    if (!isAuthenticated) {
      router.push(`/login?next=${encodeURIComponent("/feed")}`);
      return;
    }
    await toggleLike(id);
  };

  const visiblePosts = posts.filter((post) => {
    const authorId = Number(post.author || post.author_id || post.user || post.user_id);
    return !authorId || !blockedUsers.includes(authorId);
  });

  return (
    <div className="nabbi-page" style={{maxWidth: 560, margin: "0 auto", width: "100%"}}>
      <div className="nabbi-stack-row" style={{justifyContent: "space-between", marginBottom: 16}}>
        <div style={{flex: "1 1 180px", minWidth: 0}}>
          <h1 className="nabbi-page-title" style={{marginBottom: 0}}>
            Feed
          </h1>
          <p className="nabbi-page-sub" style={{margin: "6px 0 0"}}>
            Descubre lo que pasa en nabbi.
          </p>
        </div>
        <Link
          href="/posts/create"
          style={{
            background: ACCENT,
            color: INK,
            textDecoration: "none",
            fontWeight: 800,
            fontSize: 14,
            padding: "10px 16px",
            borderRadius: 12,
            whiteSpace: "nowrap",
          }}>
          + Crear
        </Link>
      </div>

      <div style={{display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 18}}>
        <Chip active={!category} onClick={() => setCategory("")} label="Todas" />
        {MAIN_CATEGORIES.map((c) => (
          <Chip key={c.id} active={category === c.id} onClick={() => setCategory(c.id)} label={c.name} />
        ))}
      </div>

      {loading && <p style={{color: "#64748b"}}>Cargando…</p>}
      {error && (
        <div style={{background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 12, padding: 12, color: "#dc2626"}}>
          {error}
        </div>
      )}
      {!loading && !error && visiblePosts.length === 0 && (
        <p style={{color: "#64748b"}}>
          Aún no hay publicaciones.{" "}
          <Link href="/posts/create" style={{color: MAIN, fontWeight: 700}}>
            Crea la primera
          </Link>
        </p>
      )}

      <div style={{display: "flex", flexDirection: "column", gap: 14}}>
        {visiblePosts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            onLike={handleLike}
            onBlocked={(userId) => setBlockedUsers((prev) => [...prev, userId])}
          />
        ))}
      </div>
    </div>
  );
}

function Chip({label, active, onClick}: {label: string; active: boolean; onClick: () => void}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        border: active ? `1.5px solid ${MAIN}` : "1.5px solid rgba(85,131,103,0.2)",
        background: active ? "rgba(85,131,103,0.12)" : "white",
        color: DARK,
        borderRadius: 999,
        padding: "7px 14px",
        fontSize: 13,
        fontWeight: 700,
        cursor: "pointer",
      }}>
      {label}
    </button>
  );
}
