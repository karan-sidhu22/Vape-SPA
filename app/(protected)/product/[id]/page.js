// app/(protected)/product/[id]/page.js
"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Image from "next/image";
import Header from "app/components/Header";
import SiteFooter from "app/components/SiteFooter";
import { HeartIcon } from "@heroicons/react/24/outline";

import ReviewForm from "app/components/ReviewForm";
import ReviewList from "app/components/ReviewList";

export default function ProductDetail() {
  const { id } = useParams();
  const router = useRouter();

  const [product, setProduct] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);
  const [addingToWishlist, setAddingToWishlist] = useState(false);
  const [refreshFlag, setRefreshFlag] = useState(false);

  useEffect(() => {
    (async () => {
      // require logged‑in user
      const {
        data: { user: sessionUser },
      } = await supabase.auth.getUser();
      if (!sessionUser) {
        router.push("/signin");
        return;
      }
      setUser(sessionUser);

      // fetch product
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .single();
      if (error) console.error("Error loading product:", error);
      else setProduct(data);

      setLoading(false);
    })();
  }, [id, router]);

  const addToCart = async () => {
    if (!user || addingToCart) return;
    setAddingToCart(true);
    try {
      let { data: cart, error: cartError } = await supabase
        .from("carts")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (cartError && cartError.code === "PGRST116") {
        const { data: newCart, error: newCartError } = await supabase
          .from("carts")
          .insert({ user_id: user.id })
          .select("id")
          .single();
        if (newCartError) throw newCartError;
        cart = newCart;
      } else if (cartError) {
        throw cartError;
      }

      const { error: itemError } = await supabase.from("cart_items").insert({
        cart_id: cart.id,
        product_id: product.id,
        quantity: 1,
      });
      if (itemError) throw itemError;

      alert("Added to cart!");
    } catch (err) {
      console.error(err);
      alert("Failed to add to cart");
    } finally {
      setAddingToCart(false);
    }
  };

  const addToWishlist = async () => {
    if (!user || addingToWishlist) return;
    setAddingToWishlist(true);
    try {
      let { data: wishlist, error: wlError } = await supabase
        .from("wishlists")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (wlError && wlError.code === "PGRST116") {
        const { data: newWL, error: createError } = await supabase
          .from("wishlists")
          .insert({ user_id: user.id, name: "My Wishlist" })
          .select("id")
          .single();
        if (createError) throw createError;
        wishlist = newWL;
      } else if (wlError) {
        throw wlError;
      }

      const { error: itemError } = await supabase
        .from("wishlist_items")
        .insert({
          wishlist_id: wishlist.id,
          product_id: product.id,
        });
      if (itemError) throw itemError;

      alert("Added to wishlist!");
    } catch (err) {
      console.error(err);
      alert("Failed to add to wishlist");
    } finally {
      setAddingToWishlist(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-grow flex items-center justify-center bg-gray-900 text-white">
          Loading…
        </div>
        <SiteFooter />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-grow flex items-center justify-center bg-gray-900 text-white">
          Product not found.
        </div>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      <Header />

      <main className="flex flex-col-reverse mt-15 px-4 py-10 gap-12 lg:flex-row lg:py-16 lg:px-16 lg:gap-16">
        {/* Product Details & Reviews */}
        <div className="flex-1 space-y-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-yellow-300">
            {product.name}
          </h1>

          <div className="space-y-4">
            <p className="text-yellow-400 text-2xl font-semibold">
              ${product.price.toFixed(2)}
            </p>
            <p className="text-white/80">{product.description}</p>
            {product.features && (
              <ul className="list-disc pl-5 text-white/70 space-y-1">
                {(Array.isArray(product.features)
                  ? product.features
                  : product.features.split(",")
                ).map((f, i) => (
                  <li key={i}>{f.trim()}</li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex flex-wrap gap-4">
            <button
              onClick={addToCart}
              disabled={addingToCart}
              className={`px-5 py-2 rounded-md text-black font-medium transition ${
                addingToCart
                  ? "bg-yellow-200 cursor-not-allowed"
                  : "bg-yellow-300 hover:bg-yellow-400"
              }`}
            >
              {addingToCart ? "Adding…" : "Add to Cart"}
            </button>
            <button
              onClick={addToWishlist}
              disabled={addingToWishlist}
              className={`flex items-center gap-2 px-5 py-2 rounded-md border text-yellow-300 transition ${
                addingToWishlist
                  ? "border-yellow-100 cursor-not-allowed"
                  : "border-yellow-400 hover:bg-white/10"
              }`}
            >
              <HeartIcon className="h-5 w-5" />
              {addingToWishlist ? "Adding…" : "Wishlist"}
            </button>
          </div>

          {/* Customer Reviews */}
          <section className="space-y-6">
            <h2 className="text-2xl font-semibold text-yellow-300">
              Customer Reviews
            </h2>
            <ReviewForm
              productId={product.id}
              onSuccess={() => setRefreshFlag((f) => !f)}
            />
            <ReviewList productId={product.id} refreshFlag={refreshFlag} />
          </section>
        </div>

        {/* Product Image */}
        <div className="w-full max-w-md mx-auto lg:mx-0 flex-shrink-0 bg-gray-800 p-6 rounded-xl">
          <Image
            src={product.image_url}
            alt={product.name}
            width={400}
            height={400}
            className="object-contain rounded mx-auto"
          />
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
