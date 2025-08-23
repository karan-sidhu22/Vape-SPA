// app/components/ReviewForm.js
"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function ReviewForm({ productId, onSuccess }) {
  const [rating, setRating]   = useState(5);
  const [text, setText]       = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // grab the logged‑in user on the client
    const {
      data: { user },
      error: userErr
    } = await supabase.auth.getUser();

    if (userErr || !user) {
      setError("You must be signed in to submit a review.");
      setLoading(false);
      return;
    }

    // insert directly into product_reviews
    const { error: insertError } = await supabase
      .from("product_reviews")
      .insert({
        product_id: productId,
        user_id:    user.id,
        rating,
        review_text: text,
      });

    if (insertError) {
      setError(insertError.message);
    } else {
      setText("");
      setRating(5);
      onSuccess?.();
    }

    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && <p className="text-red-400">{error}</p>}
      <label className="block">
        Rating:
        <select
          value={rating}
          onChange={(e) => setRating(+e.target.value)}
          className="ml-2 bg-gray-800 text-white rounded px-2"
        >
          {[5,4,3,2,1].map((n) => (
            <option key={n} value={n}>
              {n} Star{n>1?"s":""}
            </option>
          ))}
        </select>
      </label>
      <textarea
        rows={3}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Write your review..."
        className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-white"
      />
      <button
        type="submit"
        disabled={loading}
        className="bg-yellow-300 hover:bg-yellow-400 text-black py-1 px-4 rounded"
      >
        {loading ? "Submitting…" : "Submit Review"}
      </button>
    </form>
  );
}
