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

  // 1️⃣ Load user, profile, cart & items
  useEffect(() => {
    (async () => {
      const { data: authData, error: authErr } = await supabase.auth.getUser();
      if (authErr || !authData.user) {
        router.push("/signin?redirect=/cart");
        return;
      }
      const u = authData.user;
      setUser(u);

      // profile
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

      // cart
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

      // cart items
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

  // 2️⃣ Place order: insert into orders, order_items, decrement stock, clear cart
  const handlePlaceOrder = async () => {
    setPlacing(true);
    setError(null);

    try {
      // 1) Insert the order
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

      // 2) Insert order_items
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

      // 3) Decrement stock — now with error checking
      for (const it of cartItems) {
        const newStock = it.products.stock_quantity - it.quantity;

        const { data: updated, error: updErr } = await supabase
          .from("products")
          .update({ stock_quantity: newStock })
          .eq("id", it.products.id)
          .select("stock_quantity")
          .single();

        if (updErr) {
          console.error(
            `Failed to update stock for product ${it.products.id}:`,
            updErr
          );
          throw new Error(`Could not update stock for ${it.products.name}`);
        } else {
          console.log(
            `Product ${it.products.id} stock updated from ${it.products.stock_quantity} to ${updated.stock_quantity}`
          );
        }
      }

      // 4) Clear the cart
      const { error: delErr } = await supabase
        .from("cart_items")
        .delete()
        .eq("cart_id", cartId);
      if (delErr) throw delErr;

      // 5) Success!
      setOrderPlaced(true);
    } catch (err) {
      console.error("Order placement error:", err);
      setError(err.message || "Failed to place order");
      setPlacing(false);
    }
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        Loading…
      </div>
    );

  if (orderPlaced) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 to-black text-white">
        <Header />
        <h1 className="text-4xl text-yellow-300 mb-4">Thank you!</h1>
        <p>Your order has been placed successfully.</p>
        <button
          onClick={() => router.push("/")}
          className="mt-6 bg-yellow-300 hover:bg-yellow-400 text-black px-6 py-2 rounded"
        >
          Return Home
        </button>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-900 to-black text-white">
      <Header />

      <main className="flex-1 container mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold text-yellow-300 mb-6">
          Order Summary
        </h1>

        {error && <div className="mb-6 text-red-400">{error}</div>}

        {/* Delivery Details */}
        <div className="bg-white/10 border border-white/20 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-2">Delivery Details</h2>
          <p>
            <strong>Name:</strong> {profile.full_name}
          </p>
          <p>
            <strong>Email:</strong> {profile.email}
          </p>
          <p>
            <strong>Address:</strong> {profile.address}
          </p>
        </div>

        {/* Items */}
        <div className="bg-white/10 border border-white/20 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Items</h2>
          <ul className="space-y-4">
            {cartItems.map((it) => (
              <li key={it.id} className="flex justify-between">
                <div>
                  {it.products.name} x {it.quantity}
                </div>
                <div>${(it.quantity * it.products.price).toFixed(2)}</div>
              </li>
            ))}
          </ul>
        </div>

        {/* Total & Place Order */}
        <div className="bg-white/10 border border-white/20 rounded-lg p-6">
          <div className="flex justify-between text-lg font-semibold mb-4">
            <span>Total:</span>
            <span>${calculateTotal().toFixed(2)}</span>
          </div>
          <button
            onClick={handlePlaceOrder}
            disabled={placing}
            className={`w-full py-3 rounded-lg font-medium text-white transition ${
              placing
                ? "bg-gray-500 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700"
            }`}
          >
            {placing ? "Placing order…" : "Place Order"}
          </button>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
