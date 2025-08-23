"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function ReviewList({ productId, refreshFlag }) {
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from("product_reviews")
        .select(`
          id,
          rating,
          review_text,
          created_at,
          users!inner(full_name)
        `)
        .eq("product_id", productId)
        .order("created_at", { ascending: false });
      if (!error) setReviews(data);
    }
    load();
  }, [productId, refreshFlag]);

  return (
    <div className="space-y-4">
      {reviews.map((r) => (
        <div key={r.id} className="border-t border-gray-700 pt-2">
          <p className="font-semibold">{r.users.full_name}</p>
          <p>
            {"★".repeat(r.rating)}
            {"☆".repeat(5 - r.rating)}
          </p>
          <p>{r.review_text}</p>
        </div>
      ))}
      {reviews.length === 0 && (
        <p className="text-gray-400">No reviews yet.</p>
      )}
    </div>
  );
}
