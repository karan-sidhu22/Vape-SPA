// app/order-history/page.js
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import Header from "@/app/components/Header";

export default function OrderHistoryPage() {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);

      // 1️⃣ Get the current user
      const {
        data: { user },
        error: userErr,
      } = await supabase.auth.getUser();
      if (userErr || !user) {
        setError(
          userErr?.message || "You must be signed in to view your orders."
        );
        setLoading(false);
        return;
      }

      // 2️⃣ Fetch this user's orders + items + product names
      const { data, error: fetchErr } = await supabase
        .from("orders")
        .select(
          `
          id,
          order_date,
          status,
          total_amount,
          order_items (
            id,
            quantity,
            price_at_purchase,
            products:products (
              name
            )
          )
        `
        )
        .eq("user_id", user.id)
        .order("order_date", { ascending: false });

      if (fetchErr) {
        setError(fetchErr.message);
      } else {
        setOrders(data);
      }

      setLoading(false);
    })();
  }, []);

  if (loading) return <p className="p-8">Loading your order history…</p>;
  if (error) return <p className="p-8 text-red-400">Error: {error}</p>;

  return (
    <div className="p-8 space-y-6">
      <Header title="Your Order History" />
      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="px-4 py-2 bg-yellow-300 text-black rounded hover:bg-yellow-600"
      >
        &larr; Back
      </button>

      <h1 className="text-3xl mt-5 font-bold">Your Order History</h1>

      {orders.length === 0 ? (
        <p>No orders found.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {orders.map((o) => (
            <div
              key={o.id}
              className="bg-white/10 p-6 rounded-lg flex flex-col justify-between hover:shadow-lg transition-shadow"
            >
              <div>
                <h2 className="text-lg font-semibold mb-2">
                  Order #{o.id.slice(0, 8)}
                </h2>
                <p className="text-sm text-gray-400 mb-1">
                  {new Date(o.order_date).toLocaleDateString()}{" "}
                  {new Date(o.order_date).toLocaleTimeString()}
                </p>
                <span className="inline-block text-xs uppercase px-2 py-1 rounded-full bg-gray-700 text-white mb-4">
                  {o.status}
                </span>

                <div className="space-y-1 mb-4">
                  {o.order_items.map((item) => (
                    <div key={item.id} className="text-sm">
                      {item.quantity}× {item.products.name}
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-auto">
                <p className="text-lg font-bold mb-2">
                  Total: ${o.total_amount.toFixed(2)}
                </p>
                <Link
                  href={`/orders/${o.id}`}
                  className="inline-block px-4 py-2 bg-yellow-300 text-black rounded hover:bg-yellow-400"
                >
                  View Details
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
