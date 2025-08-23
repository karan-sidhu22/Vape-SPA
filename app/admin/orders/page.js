// app/admin/orders/page.js
"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

const STATUS_OPTIONS = ["pending", "shipped", "delivered", "cancelled"];

export default function OrderManagementPage() {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dirtyMap, setDirtyMap] = useState({}); // { [orderId]: { status } }
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // 1️⃣ Load all orders + related customer + items
  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("orders")
      .select(
        `
        id,
        order_date,
        status,
        total_amount,
        shipping_address,
        users:users ( full_name, email ),
        order_items:order_items (
          id,
          product_id,
          quantity,
          price_at_purchase,
          products:products ( name )
        )
      `
      )
      .order("order_date", { ascending: false });

    if (error) {
      setError(error.message);
    } else {
      setOrders(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleStatusChange = (orderId, newStatus) => {
    setDirtyMap((m) => ({
      ...m,
      [orderId]: { ...(m[orderId] || {}), status: newStatus },
    }));
  };

  const handleSaveAll = async () => {
    setSaving(true);
    setError(null);

    try {
      // Update each changed order
      for (let [orderId, { status }] of Object.entries(dirtyMap)) {
        const normalized = status.trim().toLowerCase();

        // Optional: validate against allowed statuses
        if (!STATUS_OPTIONS.includes(normalized)) {
          throw new Error(`Invalid status "${status}"`);
        }

        const { error: updateError } = await supabase
          .from("orders")
          .update({ status: normalized })
          .eq("id", orderId);

        if (updateError) {
          throw updateError;
        }
      }

      // Refresh the list
      await fetchOrders();
      setDirtyMap({});
      alert("Order statuses updated!");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="p-8">Loading orders…</p>;
  if (error) return <p className="p-8 text-red-400">Error: {error}</p>;

  return (
    <div className="p-8 space-y-6">
      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="px-4 py-2 bg-yellow-300 text-black rounded hover:bg-yellow-600"
      >
        &larr; Back
      </button>
      <h1 className="text-2xl font-bold text-yellow-300">Order Management</h1>

      <table className="min-w-full bg-white/10 rounded-lg overflow-hidden">
        <thead className="bg-gray-800 text-left">
          <tr>
            <th className="px-4 py-2">Order ID</th>
            <th className="px-4 py-2">Customer</th>
            <th className="px-4 py-2">Date</th>
            <th className="px-4 py-2">Status</th>
            <th className="px-4 py-2">Total</th>
            <th className="px-4 py-2">Ship To</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => {
            const dirty = dirtyMap[o.id] || {};
            const currentStatus = dirty.status ?? o.status;
            return (
              <tr key={o.id} className="border-b border-gray-700">
                <td className="px-4 py-2 align-top">{o.id.slice(0, 8)}</td>
                <td className="px-4 py-2">
                  <div>{o.users.full_name}</div>
                  <div className="text-sm text-gray-400">{o.users.email}</div>
                </td>
                <td className="px-4 py-2">
                  {new Date(o.order_date).toLocaleString()}
                </td>
                <td className="px-4 py-2">
                  <select
                    value={currentStatus}
                    onChange={(e) => handleStatusChange(o.id, e.target.value)}
                    className="bg-gray-700 text-white px-2 py-1 rounded"
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-2">${o.total_amount.toFixed(2)}</td>
                <td className="px-4 py-2 max-w-xs truncate">
                  {o.shipping_address}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="pt-4 border-t border-white/20">
        <button
          onClick={handleSaveAll}
          disabled={saving || !Object.keys(dirtyMap).length}
          className={`px-6 py-2 rounded-lg font-semibold transition ${
            saving || !Object.keys(dirtyMap).length
              ? "bg-gray-500 cursor-not-allowed"
              : "bg-yellow-300 hover:bg-yellow-400 text-black"
          }`}
        >
          {saving ? "Saving…" : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
