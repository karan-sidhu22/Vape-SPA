"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import Image from "next/image";
import LoadingSpinner from "app/components/LoadingSpinner";
import EmptyCart from "app/components/EmptyCart";
import Header from "app/components/Header";
import SiteFooter from "app/components/SiteFooter";

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
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <LoadingSpinner />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white relative">
      <Header />

      <h1 className="text-3xl mt-40 font-bold text-yellow-300 text-center">
        Your Cart
      </h1>

      <main className="flex-1 container mx-30 px-6 py-10 pt-10">
        {error && (
          <div className="bg-red-100/10 border-l-4 border-red-400 text-red-300 p-4 mb-6 rounded-lg">
            {error}
          </div>
        )}

        {cartItems.length === 0 ? (
          <div className="flex justify-center items-center w-full h-96">
            <EmptyCart />
          </div>
        ) : (
          <div className="flex flex-col md:flex-row gap-8 mr-40">
            <div className="flex-1 space-y-6">
              {cartItems.map((item) => (
                <div
                  key={item.id}
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
                </div>
              ))}
            </div>

            <div className="md:w-96 w-full md:fixed md:bottom-18 md:right-6 z-60">
              <div className="bg-white/10 backdrop-blur-lg border border-white/20 p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4 text-yellow-300">
                  Order Summary
                </h2>
                <div className="space-y-2 text-white/90">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>${calculateTotal().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span className="text-green-400">Free</span>
                  </div>
                  <hr className="border-white/20 my-2" />
                  <div className="flex justify-between font-semibold text-yellow-400 text-lg">
                    <span>Total</span>
                    <span>${calculateTotal().toFixed(2)}</span>
                  </div>
                </div>
                <button
                  onClick={handleCheckout}
                  disabled={checkoutLoading || cartItems.length === 0}
                  className={`w-full mt-6 py-3 rounded-lg font-medium text-white transition ${
                    checkoutLoading
                      ? "bg-blue-400 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700"
                  }`}
                >
                  {checkoutLoading ? "Processing..." : "Proceed to Checkout"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
