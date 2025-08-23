// app/admin/page.js
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

export default function AdminPage() {
  const router = useRouter();
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    totalUsers: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchStats() {
      setLoading(true);
      try {
        // Total orders
        const { count: totalOrders, error: err1 } = await supabase
          .from("orders")
          .select("id", { count: "exact", head: true });
        if (err1) throw err1;

        // Pending orders
        const { count: pendingOrders, error: err2 } = await supabase
          .from("orders")
          .select("id", { count: "exact", head: true })
          .eq("status", "pending");
        if (err2) throw err2;

        // Total users
        const { count: totalUsers, error: err3 } = await supabase
          .from("users")
          .select("id", { count: "exact", head: true });
        if (err3) throw err3;

        setStats({ totalOrders, pendingOrders, totalUsers });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  if (loading) return <p className="p-8">Loading dashboard…</p>;
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

      <h1 className="text-3xl font-bold">Admin Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/10 p-6 rounded-lg">
          <h2 className="text-xl font-semibold">Total Orders</h2>
          <p className="text-3xl">{stats.totalOrders}</p>
        </div>
        <div className="bg-white/10 p-6 rounded-lg">
          <h2 className="text-xl font-semibold">Pending Orders</h2>
          <p className="text-3xl">{stats.pendingOrders}</p>
        </div>
        <div className="bg-white/10 p-6 rounded-lg">
          <h2 className="text-xl font-semibold">Total Users</h2>
          <p className="text-3xl">{stats.totalUsers}</p>
        </div>
      </div>

      <div className="pt-4 border-t border-white/20 space-x-4">
        <Link
          href="/admin/orders"
          className="px-4 py-2 bg-yellow-300 text-black rounded-lg font-medium hover:bg-yellow-400"
        >
          Manage Orders
        </Link>
        <Link
          href="/admin/products"
          className="px-4 py-2 bg-yellow-300 text-black rounded-lg font-medium hover:bg-yellow-400"
        >
          Manage Products
        </Link>
        <Link
          href="/admin/users"
          className="px-4 py-2 bg-yellow-300 text-black rounded-lg font-medium hover:bg-yellow-400"
        >
          Manage Users
        </Link>
        <Link
          href="/admin/analytics"
          className="px-4 py-2 bg-yellow-300 text-black rounded-lg font-medium hover:bg-yellow-400"
        >
          Analytics & Reporting
        </Link>
      </div>
    </div>
  );
}
