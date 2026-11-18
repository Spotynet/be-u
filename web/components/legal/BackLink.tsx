"use client";

import {useRouter} from "next/navigation";
import {useEffect, useState} from "react";

/** Ghost “Volver atrás” — hidden when there is no history to go back to. */
export function BackLink() {
  const router = useRouter();
  const [canGoBack, setCanGoBack] = useState(false);

  useEffect(() => {
    setCanGoBack(typeof window !== "undefined" && window.history.length > 1);
  }, []);

  if (!canGoBack) return null;

  return (
    <button type="button" className="nf-back" onClick={() => router.back()}>
      Volver atrás
    </button>
  );
}
