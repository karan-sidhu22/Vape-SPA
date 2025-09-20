"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Header from "app/components/Header";
import LoadingSpinner from "app/components/LoadingSpinner";
import { HeartIcon } from "@heroicons/react/24/solid";
import SiteFooter from "@/app/components/SiteFooter";
import { motion, AnimatePresence } from "framer-motion";

function EmptyWishlist() {
  const router = useRouter();
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="text-center py-16 px-6 bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl shadow-lg text-white max-w-xl mx-auto"
    >
      <HeartIcon className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
      <p className="text-white text-lg mb-4">Your wishlist is empty.</p>
      <button
        onClick={() => router.push("/")}
        className="inline-block bg-yellow-400 text-black px-6 py-2 rounded-md font-medium hover:bg-yellow-500 transition"
      >
        Browse Products
      </button>
    </motion.div>
  );
}

export default function WishlistPage() {
  const [user, setUser] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const { data: auth, error: authErr } = await supabase.auth.getUser();
      if (authErr || !auth?.user) {
        router.push("/signin?redirect=/wishlist");
        return;
      }
      setUser(auth.user);

      const { data: wl, error: wlErr } = await supabase
        .from("wishlists")
        .select("id")
        .eq("user_id", auth.user.id)
        .single();

      if (wlErr || !wl) {
        setItems([]);
        setLoading(false);
        return;
      }

      const { data: witems, error: itemsErr } = await supabase
        .from("wishlist_items")
        .select(
          `
          id,
          products:products (
            id,
            name,
            description,
            image_url,
            price,
            stock_quantity
          )
        `
        )
        .eq("wishlist_id", wl.id);

      if (itemsErr) {
        setError(itemsErr.message);
        setItems([]);
      } else {
        setItems(witems.filter((wi) => wi.products));
      }
      setLoading(false);
    })();
  }, [router]);

  const deleteItem = async (id) => {
    try {
      await supabase.from("wishlist_items").delete().eq("id", id);
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch (e) {
      setError(e.message);
    }
  };

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center text-white"
        style={{ backgroundColor: "#141825" }}
      >
        <LoadingSpinner />
      </div>
    );
  }
  if (!user) return null;

  return (
    <div
      className="min-h-screen flex flex-col text-white"
      style={{ backgroundColor: "#131826" }}
    >
      <Header />

      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="text-3xl mt-40 font-bold text-yellow-300 text-center"
      >
        Your Wishlist
      </motion.h1>

      <main className="flex-1 container mx-auto px-6 py-10">
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4 }}
              className="bg-red-100/10 border-l-4 border-red-400 text-red-300 p-4 mb-6 rounded-lg"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {items.length === 0 ? (
          <div className="flex justify-center items-center w-full h-96">
            <EmptyWishlist />
          </div>
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
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {items.map(({ id, products }) => (
              <motion.div
                key={id}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  show: { opacity: 1, y: 0 },
                }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="flex flex-col md:flex-row bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl shadow-md hover:shadow-lg transition overflow-hidden"
              >
                <div className="relative w-full md:w-1/4 h-48 bg-black/40">
                  <Image
                    src={products.image_url || "/placeholder-product.png"}
                    alt={products.name}
                    fill
                    className="object-contain p-4 cursor-pointer"
                    onClick={() => router.push(`/product/${products.id}`)}
                  />
                </div>
                <div className="p-6 flex flex-col justify-between flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2
                        className="text-xl font-semibold cursor-pointer hover:text-yellow-400"
                        onClick={() => router.push(`/product/${products.id}`)}
                      >
                        {products.name}
                      </h2>
                      <p className="text-white/70 mt-2 line-clamp-2">
                        {products.description}
                      </p>
                    </div>
                    <button
                      onClick={() => deleteItem(id)}
                      className="text-white/50 hover:text-red-500 text-2xl"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="mt-4 flex justify-between items-center">
                    <p className="text-yellow-400 font-medium">
                      ${products.price.toFixed(2)}
                    </p>
                    {products.stock_quantity > 0 ? (
                      <span className="text-green-400 font-semibold">
                        In Stock
                      </span>
                    ) : (
                      <span className="text-red-400 font-semibold">
                        Out of Stock
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
