"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import Image from "next/image";
import LoadingSpinner from "app/components/LoadingSpinner";
import EmptyCart from "app/components/EmptyCart";
import Header from "app/components/Header";
import SiteFooter from "app/components/SiteFooter";
import { motion, AnimatePresence } from "framer-motion";

export default function CartPage() {
  const [user, setUser] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [updatingItemId, setUpdatingItemId] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const fetchUserAndCart = async () => {
      try {
        const { data: authData, error: authError } =
          await supabase.auth.getUser();
        if (authError || !authData?.user) {
          router.push("/signin?redirect=/cart");
          return;
        }
        setUser(authData.user);
        await fetchCartItems(authData.user.id);
      } catch (err) {
        setError("Failed to load cart. Please try again.");
        console.error("Authentication error:", err);
      }
    };
    fetchUserAndCart();
  }, [router]);

  const fetchCartItems = async (userId) => {
    setLoading(true);
    try {
      const { data: cart, error: cartError } = await supabase
        .from("carts")
        .select("id")
        .eq("user_id", userId)
        .single();

      if (cartError || !cart) throw new Error("Cart not found");

      const { data: items, error: itemsError } = await supabase
        .from("cart_items")
        .select(
          `
          id,
          quantity,
          product_id,
          products:products(
            id,
            name,
            description,
            image_url,
            price,
            stock_quantity
          )
        `
        )
        .eq("cart_id", cart.id);

      if (itemsError) throw itemsError;

      const validItems = items.filter((item) => item.products);
      setCartItems(validItems);
    } catch (err) {
      setError(err.message || "Failed to load cart items");
      setCartItems([]);
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId, change) => {
    const item = cartItems.find((i) => i.id === itemId);
    if (!item) return;

    const newQuantity = item.quantity + change;
    if (newQuantity > (item.products?.stock_quantity || 0)) {
      setError(`Only ${item.products.stock_quantity} available in stock`);
      return;
    }
    if (newQuantity <= 0) {
      await deleteItem(itemId);
      return;
    }

    try {
      setUpdatingItemId(itemId);
      const { error } = await supabase
        .from("cart_items")
        .update({ quantity: newQuantity })
        .eq("id", itemId);

      if (error) throw error;

      setCartItems((prev) =>
        prev.map((i) => (i.id === itemId ? { ...i, quantity: newQuantity } : i))
      );
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to update quantity");
    } finally {
      setUpdatingItemId(null);
    }
  };

  const deleteItem = async (itemId) => {
    try {
      const { error } = await supabase
        .from("cart_items")
        .delete()
        .eq("id", itemId);

      if (error) throw error;

      setCartItems((prev) => prev.filter((i) => i.id !== itemId));
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to remove item");
    }
  };

  const handleCheckout = async () => {
    setCheckoutLoading(true);
    try {
      const outOfStock = cartItems.filter(
        (item) => item.quantity > (item.products?.stock_quantity || 0)
      );
      if (outOfStock.length > 0) {
        setError("Some items exceed available stock. Update quantities.");
        setCheckoutLoading(false);
        return;
      }
      router.push("/checkout");
    } catch (err) {
      setError(err.message || "Checkout failed");
      setCheckoutLoading(false);
    }
  };

  const calculateTotal = () =>
    cartItems.reduce(
      (total, item) => total + item.quantity * (item.products?.price || 0),
      0
    );

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

      {/* Animated heading */}
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="text-3xl mt-40 font-bold text-yellow-300 text-center"
      >
        Your Cart
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

        {cartItems.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="flex justify-center items-center w-full h-96"
          >
            <EmptyCart />
          </motion.div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Cart items */}
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
              className="flex-1 space-y-6"
            >
              {cartItems.map((item) => (
                <motion.div
                  key={item.id}
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    show: { opacity: 1, y: 0 },
                  }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="flex flex-col md:flex-row bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl shadow-md"
                >
                  <div className="relative w-full md:w-1/4 h-48">
                    <Image
                      src={
                        item.products?.image_url || "/placeholder-product.png"
                      }
                      alt={item.products?.name}
                      fill
                      className="object-contain p-4"
                    />
                  </div>
                  <div className="p-6 flex flex-col flex-1">
                    <div className="flex justify-between">
                      <h2 className="text-xl font-semibold hover:text-yellow-400 cursor-pointer">
                        {item.products?.name}
                      </h2>
                      <button
                        onClick={() => deleteItem(item.id)}
                        className="text-gray-400 hover:text-red-400"
                      >
                        ✕
                      </button>
                    </div>
                    <p className="text-white/70 text-sm">
                      {item.products?.description}
                    </p>
                    <div className="mt-auto flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.id, -1)}
                          disabled={updatingItemId === item.id}
                          className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded"
                        >
                          −
                        </button>
                        <span>{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, 1)}
                          disabled={updatingItemId === item.id}
                          className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded"
                        >
                          +
                        </button>
                      </div>
                      <div className="text-right">
                        <p className="text-yellow-400 font-medium">
                          ${item.products?.price?.toFixed(2)}
                        </p>
                        <p className="text-green-400 font-semibold">
                          Subtotal: $
                          {(item.quantity * item.products?.price).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* Order summary */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="lg:w-96 w-full"
            >
              <div className="bg-white/10 backdrop-blur-lg border border-white/20 p-6 rounded-lg shadow-md sticky top-28">
                <h2 className="text-2xl font-bold mb-4 text-yellow-300">
                  Order Summary
                </h2>
                <div className="space-y-3 text-white/90">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>${calculateTotal().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span className="text-green-400">Free</span>
                  </div>
                  <hr className="border-white/20 my-2" />
                  <div className="flex justify-between font-bold text-lg text-yellow-300">
                    <span>Total</span>
                    <span>${calculateTotal().toFixed(2)}</span>
                  </div>
                </div>
                <button
                  onClick={handleCheckout}
                  disabled={checkoutLoading || cartItems.length === 0}
                  className={`w-full mt-6 py-3 rounded-lg font-medium text-black transition ${
                    checkoutLoading
                      ? "bg-yellow-200 cursor-not-allowed"
                      : "bg-yellow-300 hover:bg-yellow-400"
                  }`}
                >
                  {checkoutLoading ? "Processing..." : "Proceed to Checkout"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
