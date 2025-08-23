// app/admin/analytics/page.js
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { format, subDays } from "date-fns";

export default function AnalyticsPage() {
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchAnalytics() {
      setLoading(true);
      try {
        // 1) Fetch all orders
        const { data: orders, error: ordersError } = await supabase
          .from("orders")
          .select("order_date, total_amount, status")
          .order("order_date", { ascending: false });
        if (ordersError) throw ordersError;

        // 2) Compute total revenue & total orders
        const totalRevenue = orders.reduce(
          (sum, o) => sum + parseFloat(o.total_amount),
          0
        );
        const totalOrders = orders.length;

        // 3) Orders by status
        const statusCounts = orders.reduce((acc, o) => {
          acc[o.status] = (acc[o.status] || 0) + 1;
          return acc;
        }, {});

        // 4) Last 7 days breakdown
        const last7Days = Array.from({ length: 7 })
          .map((_, i) => {
            const date = subDays(new Date(), i);
            const dayKey = format(date, "yyyy-MM-dd");
            const dayOrders = orders.filter((o) =>
              o.order_date.startsWith(dayKey)
            );
            const dayRevenue = dayOrders.reduce(
              (sum, o) => sum + parseFloat(o.total_amount),
              0
            );
            return {
              date: dayKey,
              orders: dayOrders.length,
              revenue: dayRevenue,
            };
          })
          .reverse();

        setStats({ totalRevenue, totalOrders, statusCounts, last7Days });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, []);

  if (loading) return <p className="p-8">Loading analytics…</p>;
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

      <h1 className="text-3xl font-bold">Analytics & Reporting</h1>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white/10 p-6 rounded-lg">
          <h2 className="text-xl font-semibold">Total Revenue</h2>
          <p className="text-3xl">${stats.totalRevenue.toFixed(2)}</p>
        </div>
        <div className="bg-white/10 p-6 rounded-lg">
          <h2 className="text-xl font-semibold">Total Orders</h2>
          <p className="text-3xl">{stats.totalOrders}</p>
        </div>
      </div>

      {/* Orders by status */}
      <div className="bg-white/10 p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Orders by Status</h2>
        <ul className="list-disc list-inside">
          {Object.entries(stats.statusCounts).map(([status, count]) => (
            <li key={status} className="capitalize">
              {status}: {count}
            </li>
          ))}
        </ul>
      </div>

      {/* Last 7 days table */}
      <div className="bg-white/10 p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Last 7 Days</h2>
        <table className="min-w-full bg-transparent text-left">
          <thead>
            <tr>
              <th className="px-4 py-2">Date</th>
              <th className="px-4 py-2">Orders</th>
              <th className="px-4 py-2">Revenue</th>
            </tr>
          </thead>
          <tbody>
            {stats.last7Days.map((day) => (
              <tr key={day.date} className="border-b border-gray-700">
                <td className="px-4 py-2">{day.date}</td>
                <td className="px-4 py-2">{day.orders}</td>
                <td className="px-4 py-2">${day.revenue.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
