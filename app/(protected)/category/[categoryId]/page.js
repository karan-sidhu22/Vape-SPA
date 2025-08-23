// app/(protected)/category/[categoryId]/page.js
"use client";

import { useRouter, useParams } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import Header from "app/components/Header";
import SiteFooter from "app/components/SiteFooter";
import {
  HeartIcon as HeartOutline,
  PlusIcon,
  MinusIcon,
} from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolid } from "@heroicons/react/24/solid";

// FadeInOnScroll — wraps children and fades them in when scrolled into view
function FadeInOnScroll({ children }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.unobserve(ref.current);
        }
      },
      { threshold: 0.1 }
    );
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      }`}
    >
      {children}
    </div>
  );
}

export default function CategoryPage() {
  const router = useRouter();
  const { categoryId } = useParams();
  const [category, setCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [cartMap, setCartMap] = useState({});
  const [wishlistSet, setWishlistSet] = useState(new Set());
  const [cartId, setCartId] = useState(null);
  const [wishlistId, setWishlistId] = useState(null);
  const [processingId, setProcessingId] = useState(null);
  const [loading, setLoading] = useState(true);

  // 1) Load category & its products
  useEffect(() => {
    (async () => {
      const { data: cat, error: catErr } = await supabase
        .from("categories")
        .select("id,name")
        .eq("id", categoryId)
        .single();
      if (catErr) {
        console.error(catErr);
        router.replace("/home");
        return;
      }
      setCategory(cat);

      const { data: prods, error: prodErr } = await supabase
        .from("products")
        .select("*")
        .eq("category_id", categoryId);
      if (prodErr) console.error(prodErr);
      setProducts(prods || []);
      setLoading(false);
    })();
  }, [categoryId, router]);

  // 2) Load cart & wishlist state
  useEffect(() => {
    (async () => {
      // fetch current session first
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      const uid = session.user.id;

      // --- Cart ---
      const { data: cart } = await supabase
        .from("carts")
        .select("id")
        .eq("user_id", uid)
        .single();
      if (cart?.id) {
        setCartId(cart.id);
        const { data: items } = await supabase
          .from("cart_items")
          .select("product_id,quantity")
          .eq("cart_id", cart.id);
        setCartMap(
          items.reduce((m, i) => {
            m[i.product_id] = i.quantity;
            return m;
          }, {})
        );
      }

      // --- Wishlist ---
      const { data: wl } = await supabase
        .from("wishlists")
        .select("id")
        .eq("user_id", uid)
        .single();
      if (wl?.id) {
        setWishlistId(wl.id);
        const { data: wItems } = await supabase
          .from("wishlist_items")
          .select("product_id")
          .eq("wishlist_id", wl.id);
        setWishlistSet(new Set(wItems.map((w) => w.product_id)));
      }
    })();
  }, []);

  // 3) Add to cart with stock check
  const addToCart = async (pid) => {
    setProcessingId(pid);
    const prod = products.find((p) => p.id === pid);
    const curr = cartMap[pid] || 0;
    if (curr >= prod.stock_quantity) {
      alert(`Only ${prod.stock_quantity} left in stock`);
      setProcessingId(null);
      return;
    }
    if (!cartId) {
      const { data: nc } = await supabase
        .from("carts")
        .insert({ user_id: supabase.auth.user().id })
        .select("id")
        .single();
      setCartId(nc.id);
    }
    await supabase.from("cart_items").insert({
      cart_id: cartId,
      product_id: pid,
      quantity: 1,
    });
    setCartMap((m) => ({ ...m, [pid]: curr + 1 }));
    setProcessingId(null);
  };

  // 4) Update cart quantity
  const updateCartQty = async (pid, delta) => {
    const prod = products.find((p) => p.id === pid);
    const curr = cartMap[pid] || 0;
    const nxt = curr + delta;
    if (nxt < 1) {
      await supabase
        .from("cart_items")
        .delete()
        .match({ cart_id: cartId, product_id: pid });
      const m2 = { ...cartMap };
      delete m2[pid];
      setCartMap(m2);
    } else if (nxt <= prod.stock_quantity) {
      await supabase
        .from("cart_items")
        .update({ quantity: nxt })
        .match({ cart_id: cartId, product_id: pid });
      setCartMap((m) => ({ ...m, [pid]: nxt }));
    } else {
      alert(`Only ${prod.stock_quantity} left in stock`);
    }
  };

  // 5) Toggle wishlist
  const toggleWishlist = async (pid) => {
    setProcessingId(pid);
    if (!wishlistId) {
      const { data: nw } = await supabase
        .from("wishlists")
        .insert({ user_id: supabase.auth.user().id, name: "My Wishlist" })
        .select("id")
        .single();
      setWishlistId(nw.id);
    }
    if (wishlistSet.has(pid)) {
      await supabase
        .from("wishlist_items")
        .delete()
        .match({ wishlist_id: wishlistId, product_id: pid });
      setWishlistSet((s) => {
        const s2 = new Set(s);
        s2.delete(pid);
        return s2;
      });
    } else {
      await supabase
        .from("wishlist_items")
        .insert({ wishlist_id: wishlistId, product_id: pid });
      setWishlistSet((s) => new Set(s).add(pid));
    }
    setProcessingId(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        Loading…
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-white">
      <Header />

      <main className="flex-1 px-6 pt-24 pb-12">
        <h1 className="text-3xl font-bold text-yellow-300 mb-6">
          Shop by: {category.name}
        </h1>

        {products.length === 0 ? (
          <p className="text-gray-400">No products in this category.</p>
        ) : (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((p) => (
              <FadeInOnScroll key={p.id}>
                <div
                  onClick={() => router.push(`/product/${p.id}`)}
                  className="cursor-pointer bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition flex flex-col"
                >
                  <div className="relative h-64 bg-black/20">
                    <Image
                      src={p.image_url}
                      alt={p.name}
                      fill
                      className="object-contain p-4 transition-transform duration-300 hover:scale-105"
                    />
                  </div>
                  <div className="p-4 flex flex-col flex-1">
                    <h2 className="text-xl font-bold text-white mb-1">
                      {p.name}
                    </h2>
                    <p className="text-yellow-300 text-lg font-semibold mb-2">
                      ${p.price.toFixed(2)}
                    </p>

                    {p.stock_quantity > 0 ? (
                      <p className="text-green-400 text-sm mb-4">
                        In stock: {p.stock_quantity}
                      </p>
                    ) : (
                      <p className="text-red-500 text-sm mb-4">Out of stock</p>
                    )}

                    <div className="mt-auto flex items-center space-x-2">
                      {cartMap[p.id] ? (
                        <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateCartQty(p.id, -1);
                            }}
                            className="p-1 hover:bg-white/20 rounded-full transition"
                          >
                            <MinusIcon className="h-4 w-4 text-white" />
                          </button>
                          <span className="px-2 text-white">
                            {cartMap[p.id]}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateCartQty(p.id, 1);
                            }}
                            className="p-1 hover:bg-white/20 rounded-full transition"
                          >
                            <PlusIcon className="h-4 w-4 text-white" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            addToCart(p.id);
                          }}
                          disabled={processingId === p.id}
                          className="flex-1 bg-yellow-300 hover:bg-yellow-400 py-2 rounded-md text-sm font-medium text-black disabled:opacity-50 transition"
                        >
                          Add to Cart
                        </button>
                      )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleWishlist(p.id);
                        }}
                        disabled={processingId === p.id}
                        className="p-2 hover:bg-yellow-100 rounded-full transition disabled:opacity-50"
                      >
                        {wishlistSet.has(p.id) ? (
                          <HeartSolid className="h-5 w-5 text-yellow-400" />
                        ) : (
                          <HeartOutline className="h-5 w-5 text-yellow-400" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </FadeInOnScroll>
            ))}
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
