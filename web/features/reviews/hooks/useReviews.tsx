"use client";

import {useCallback, useEffect, useState} from "react";
import {reviewApi, errorUtils} from "@/lib/api";

export function useReviews(publicProfileId?: number) {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(!!publicProfileId);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!publicProfileId) {
      setReviews([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await reviewApi.getReviews({public_profile: publicProfileId});
      setReviews(res.data.results || (Array.isArray(res.data) ? res.data : []));
    } catch (err) {
      setError(errorUtils.getErrorMessage(err));
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }, [publicProfileId]);

  useEffect(() => {
    load();
  }, [load]);

  const createReview = async (data: {
    publicProfileId: number;
    rating: number;
    message?: string;
    images?: File[];
  }) => {
    const formData = new FormData();
    formData.append("to_public_profile", String(data.publicProfileId));
    formData.append("rating", String(data.rating));
    if (data.message) formData.append("message", data.message);
    (data.images || []).forEach((file) => formData.append("images", file));
    const res = await reviewApi.createReview(formData);
    await load();
    return res.data;
  };

  const average =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + Number(r.rating || 0), 0) / reviews.length
      : 0;

  return {reviews, loading, error, reload: load, createReview, average};
}
