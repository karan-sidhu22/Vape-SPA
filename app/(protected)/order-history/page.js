// app/order-history/page.js
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import Header from "@/app/components/Header";
import { motion, AnimatePresence } from "framer-motion";

export default function OrderHistoryPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);

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

  if (loading)
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen flex items-center justify-center text-white text-lg"
        style={{ backgroundColor: "#141825" }}
      >
        Loading your order history…
      </motion.div>
    );

  if (error)
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen flex items-center justify-center text-red-400 text-lg"
        style={{ backgroundColor: "#141825" }}
      >
        Error: {error}
      </motion.div>
    );

  return (
    <div
      className="min-h-screen flex flex-col text-white"
      style={{
        background: "linear-gradient(160deg, #141825 0%, #0f1320 100%)",
      }}
    >
      {/* Header */}
      <Header title="Your Order History" />

      {/* Content */}
      <main className="flex-1 pt-45 px-6 pb-20 max-w-7xl mx-auto w-full">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="text-4xl font-extrabold text-yellow-300 mb-10 tracking-wide drop-shadow-md text-center"
        >
          Your Order History
        </motion.h1>

        <AnimatePresence>
          {orders.length === 0 ? (
            <motion.p
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="text-gray-400 text-center"
            >
              No orders found.
            </motion.p>
          ) : (
            <motion.div
              initial="hidden"
              animate="show"
              variants={{
                hidden: { opacity: 0 },
                show: {
                  opacity: 1,
                  transition: { staggerChildren: 0.15 },
                },
              }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {orders.map((o) => (
                <motion.div
                  key={o.id}
                  variants={{
                    hidden: { opacity: 0, y: 30 },
                    show: { opacity: 1, y: 0 },
                  }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  whileHover={{ scale: 1.03 }}
                  className="relative bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl p-6 flex flex-col justify-between transition-transform hover:shadow-2xl"
                >
                  {/* Glow overlay */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-yellow-400/10 via-transparent to-transparent pointer-events-none"></div>

                  <div className="relative">
                    <h2 className="text-xl font-bold text-yellow-300 mb-2">
                      Order #{o.id.slice(0, 8)}
                    </h2>
                    <p className="text-sm text-gray-400 mb-1">
                      {new Date(o.order_date).toLocaleDateString()} •{" "}
                      {new Date(o.order_date).toLocaleTimeString()}
                    </p>
                    <span className="inline-block text-xs uppercase px-2 py-1 rounded-full bg-yellow-400/20 text-yellow-300 mb-4">
                      {o.status}
                    </span>

                    <div className="space-y-2 mb-6">
                      {o.order_items.map((item) => (
                        <div
                          key={item.id}
                          className="flex justify-between text-sm text-white/80"
                        >
                          <span>
                            {item.quantity}× {item.products.name}
                          </span>
                          <span className="text-gray-300">
                            ${item.price_at_purchase.toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="relative mt-auto">
                    <p className="text-lg font-bold mb-4 text-white">
                      Total: ${o.total_amount.toFixed(2)}
                    </p>
                    <Link
                      href={`/orders/${o.id}`}
                      className="inline-block px-4 py-2 bg-yellow-300 text-black font-medium rounded-lg hover:bg-yellow-400 transition shadow-md hover:shadow-lg"
                    >
                      View Details
                    </Link>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer
        className="text-white/60 text-center p-6 text-sm border-t border-white/10"
        style={{ backgroundColor: "#141825" }}
      >
        &copy; {new Date().getFullYear()} Vape-SPA. All rights reserved.
      </footer>
    </div>
  );
}
