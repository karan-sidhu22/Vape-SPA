"use client";
import { useState } from "react";
import ReviewForm from "@/app/components/ReviewForm";
import ReviewList from "@/app/components/ReviewList";

export default function ProductClient({ product }) {
  const [refreshFlag, setRefreshFlag] = useState(false);

  return (
    <div className="p-8">
      {/* … your existing product details markup here … */}

      <section className="mt-12">
        <h2 className="text-2xl font-semibold mb-4">Customer Reviews</h2>
        <ReviewForm
          productId={product.id}
          onSuccess={() => setRefreshFlag((f) => !f)}
        />
        <div className="mt-6">
          <ReviewList productId={product.id} refreshFlag={refreshFlag} />
        </div>
      </section>
    </div>
  );
}
