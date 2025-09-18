// app/(protected)/checkout/page.js
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import Header from "app/components/Header";
import SiteFooter from "app/components/SiteFooter";

export default function CheckoutPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState({
    full_name: "",
    email: "",
    address: "",
  });
  const [cartId, setCartId] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [placing, setPlacing] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [error, setError] = useState(null);

  // Load user, profile, cart & items
  useEffect(() => {
    (async () => {
      const { data: authData, error: authErr } = await supabase.auth.getUser();
      if (authErr || !authData.user) {
        router.push("/signin?redirect=/cart");
        return;
      }
      const u = authData.user;
      setUser(u);

      const { data: prof } = await supabase
        .from("users")
        .select("full_name, email, address")
        .eq("id", u.id)
        .single();

      setProfile({
        full_name: prof?.full_name || u.user_metadata?.full_name || "",
        email: prof?.email || u.email,
        address: prof?.address || "",
      });

      const { data: cart } = await supabase
        .from("carts")
        .select("id")
        .eq("user_id", u.id)
        .single();

      if (!cart?.id) {
        setError("No cart found.");
        setLoading(false);
        return;
      }
      setCartId(cart.id);

      const { data: items } = await supabase
        .from("cart_items")
        .select(
          `
          id,
          quantity,
          products:products(
            id, name, price, image_url, stock_quantity
          )
        `
        )
        .eq("cart_id", cart.id);

      setCartItems(items || []);
      setLoading(false);
    })();
  }, [router]);

  const calculateTotal = () =>
    cartItems.reduce(
      (sum, it) => sum + it.quantity * (it.products?.price || 0),
      0
    );

  // Place order
  const handlePlaceOrder = async () => {
    setPlacing(true);
    setError(null);
    try {
      const { data: order, error: ordErr } = await supabase
        .from("orders")
        .insert({
          user_id: user.id,
          order_date: new Date().toISOString(),
          status: "pending",
          total_amount: calculateTotal(),
          shipping_address: profile.address,
        })
        .select("id")
        .single();
      if (ordErr) throw ordErr;

      const orderItemsPayload = cartItems.map((it) => ({
        order_id: order.id,
        product_id: it.products.id,
        quantity: it.quantity,
        price_at_purchase: it.products.price,
      }));
      const { error: oiErr } = await supabase
        .from("order_items")
        .insert(orderItemsPayload);
      if (oiErr) throw oiErr;

      for (const it of cartItems) {
        const newStock = it.products.stock_quantity - it.quantity;
        const { error: updErr } = await supabase
          .from("products")
          .update({ stock_quantity: newStock })
          .eq("id", it.products.id);
        if (updErr) throw updErr;
      }

      await supabase.from("cart_items").delete().eq("cart_id", cartId);
      setOrderPlaced(true);
    } catch (err) {
      setError(err.message || "Failed to place order");
      setPlacing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#131826] text-white">
        Loading…
      </div>
    );
  }

  if (orderPlaced) {
    return (
      <div className="min-h-screen flex flex-col bg-[#131826] text-white">
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center px-6 py-24">
          <h1 className="text-4xl font-extrabold text-yellow-300 mb-4">
            🎉 Thank you!
          </h1>
          <p className="text-lg text-white/80">
            Your order has been placed successfully.
          </p>
          <button
            onClick={() => router.push("/")}
            className="mt-8 bg-yellow-400 hover:bg-yellow-500 text-black px-8 py-3 rounded-lg font-semibold shadow-lg transition"
          >
            Return Home
          </button>
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#131826] text-white">
      <Header />

      <main className="flex-1 container mx-auto px-6 pt-32 pb-20">
        <h1 className="text-3xl font-extrabold text-yellow-300 mb-12 text-center">
          Secure Checkout
        </h1>

        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-400 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Left: Details & Items */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8 shadow-xl">
              <h2 className="text-xl font-semibold mb-4 text-yellow-300">
                Delivery Details
              </h2>
              <ul className="space-y-2 text-white/90">
                <li>
                  <span className="font-medium">Name:</span> {profile.full_name}
                </li>
                <li>
                  <span className="font-medium">Email:</span> {profile.email}
                </li>
                <li>
                  <span className="font-medium">Address:</span>{" "}
                  {profile.address}
                </li>
              </ul>
            </div>

            <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8 shadow-xl">
              <h2 className="text-xl font-semibold mb-6 text-yellow-300">
                Items in Your Order
              </h2>
              <ul className="divide-y divide-white/10">
                {cartItems.map((it) => (
                  <li
                    key={it.id}
                    className="flex justify-between items-center py-4"
                  >
                    <span>
                      {it.products.name}{" "}
                      <span className="text-white/60">× {it.quantity}</span>
                    </span>
                    <span className="text-yellow-400 font-medium">
                      ${(it.quantity * it.products.price).toFixed(2)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right: Summary */}
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8 shadow-xl h-fit">
            <h2 className="text-xl font-semibold mb-6 text-yellow-300">
              Order Summary
            </h2>
            <div className="space-y-4 text-white/90">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>${calculateTotal().toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span className="text-green-400">Free</span>
              </div>
              <hr className="border-white/20" />
              <div className="flex justify-between text-lg font-bold text-yellow-300">
                <span>Total</span>
                <span>${calculateTotal().toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={handlePlaceOrder}
              disabled={placing}
              className={`w-full mt-8 py-3 rounded-lg font-semibold transition ${
                placing
                  ? "bg-gray-500 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-700"
              }`}
            >
              {placing ? "Placing Order…" : "Confirm & Place Order"}
            </button>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
