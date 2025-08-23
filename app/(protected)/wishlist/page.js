"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Header from "app/components/Header";
import LoadingSpinner from "app/components/LoadingSpinner";
import { HeartIcon } from "@heroicons/react/24/solid";
import SiteFooter from "@/app/components/SiteFooter";

function EmptyWishlist() {
  const router = useRouter();
  return (
    <div className="text-center py-16 px-6 w-110 bg-white/5 backdrop-blur-lg border border-white/20 rounded-xl shadow-lg text-white max-w-xl mx-auto">
      <HeartIcon className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
      <p className="text-white text-lg mb-4">Your wishlist is empty.</p>
      <button
        onClick={() => router.push("/")}
        className="inline-block bg-yellow-500 text-black px-6 py-2 rounded-md font-medium hover:bg-yellow-600 transition"
      >
        Browse Products
      </button>
    </div>
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
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <LoadingSpinner />
      </div>
    );
  }
  if (!user) return null;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      <Header />

      <h1 className="text-3xl mt-40 font-bold text-yellow-300 text-center">
        Your Wishlist
      </h1>

      <main className="flex-1 container mx-auto px-6 py-10">
        {error && (
          <div className="bg-red-100/10 border-l-4 border-red-400 text-red-300 p-4 mb-6 rounded-lg">
            {error}
          </div>
        )}

        {items.length === 0 ? (
          <div className="flex justify-center items-center w-full h-96">
            <EmptyWishlist />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {items.map(({ id, products }) => (
              <div
                key={id}
                className="flex flex-col md:flex-row bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl shadow-md hover:shadow-lg transition overflow-hidden"
              >
                <div className="relative w-full md:w-1/4 h-48 bg-gray-900">
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
              </div>
            ))}
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
