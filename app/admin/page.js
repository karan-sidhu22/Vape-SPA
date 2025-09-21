// app/admin/page.js
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { motion } from "framer-motion";

function StatCard({ title, value, subtitle, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, delay, type: "spring", stiffness: 100 }}
      whileHover={{ scale: 1.03, boxShadow: "0px 8px 20px rgba(255, 221, 87, 0.15)" }}
      className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-sm backdrop-blur"
    >
      <div className="flex items-center justify-between">
        <p className="text-sm text-white/70">{title}</p>
      </div>
      <p className="mt-3 text-4xl font-semibold tracking-tight text-yellow-300">
        {value}
      </p>
      {subtitle ? (
        <p className="mt-1 text-xs text-white/60">{subtitle}</p>
      ) : null}
    </motion.div>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 animate-pulse">
      <div className="h-4 w-24 bg-white/20 rounded" />
      <div className="mt-3 h-10 w-20 bg-white/20 rounded" />
      <div className="mt-2 h-3 w-28 bg-white/10 rounded" />
    </div>
  );
}

export default function AdminPage() {
  const router = useRouter();
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    totalUsers: 0,
  });
  const [loading, setLoading] = useState(true);
  const [authChecking, setAuthChecking] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Simple auth gate
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (error) throw error;
        if (!data?.user) router.replace("/login");
      } catch {
        router.replace("/login");
      } finally {
        if (isMounted) setAuthChecking(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [router]);

  const formattedUpdated = useMemo(() => {
    if (!lastUpdated) return null;
    try {
      return new Date(lastUpdated).toLocaleString();
    } catch {
      return null;
    }
  }, [lastUpdated]);

  async function fetchStatsOnce() {
    const totalOrdersQ = supabase
      .from("orders")
      .select("id", { count: "exact", head: true });

    const pendingOrdersQ = supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending");

    const totalUsersQ = supabase
      .from("users")
      .select("id", { count: "exact", head: true });

    const [totalOrdersRes, pendingOrdersRes, totalUsersRes] = await Promise.all(
      [totalOrdersQ, pendingOrdersQ, totalUsersQ]
    );

    if (totalOrdersRes.error) throw totalOrdersRes.error;
    if (pendingOrdersRes.error) throw pendingOrdersRes.error;
    if (totalUsersRes.error) throw totalUsersRes.error;

    return {
      totalOrders: totalOrdersRes.count ?? 0,
      pendingOrders: pendingOrdersRes.count ?? 0,
      totalUsers: totalUsersRes.count ?? 0,
    };
  }

  async function fetchStatsWithRetry(retries = 1) {
    try {
      setError(null);
      setLoading(true);
      const result = await fetchStatsOnce();
      setStats(result);
      setLastUpdated(Date.now());
    } catch (err) {
      if (retries > 0) {
        await new Promise((r) => setTimeout(r, 350));
        return fetchStatsWithRetry(retries - 1);
      }
      setError(err?.message || "Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!authChecking) {
      fetchStatsWithRetry(1);
    }
  }, [authChecking]);

  async function handleSignOut() {
    try {
      await supabase.auth.signOut();
    } finally {
      router.replace("/login");
    }
  }

  if (authChecking) {
    return (
      <div className="p-8 flex items-center gap-3 text-white/80">
        <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-transparent" />
        <span>Checking access…</span>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="p-6 md:p-8 space-y-6 text-white bg-gray-900 min-h-screen"
    >
      {/* Top bar */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="flex items-center justify-between"
      >
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2 transition hover:bg-white/10"
        >
          <span aria-hidden>←</span>
          Back
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchStatsWithRetry(1)}
            className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm transition hover:bg-white/10"
          >
            ↻ Refresh
          </button>
          <button
            onClick={handleSignOut}
            className="inline-flex items-center gap-2 rounded-xl bg-yellow-300 px-3 py-2 text-sm font-medium text-black transition hover:bg-yellow-400"
          >
            ⎋ Sign out
          </button>
        </div>
      </motion.div>

      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="space-y-1"
      >
        <h1 className="text-3xl font-bold tracking-tight text-yellow-300">
          Admin Dashboard
        </h1>
        <p className="text-sm text-white/60">
          Overview of orders and users.{" "}
          {formattedUpdated ? `Last updated: ${formattedUpdated}` : null}
        </p>
      </motion.div>

      {/* Error */}
      {error ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm"
        >
          <p className="font-medium text-red-200">Error</p>
          <p className="text-red-100/90 mt-1">{error}</p>
          <div className="mt-3">
            <button
              onClick={() => fetchStatsWithRetry(1)}
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm transition hover:bg-white/10"
            >
              Try again
            </button>
          </div>
        </motion.div>
      ) : null}

      {/* Stats */}
      {loading ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <StatCard title="Total Orders" value={stats.totalOrders} subtitle="All-time order count" delay={0.1} />
          <StatCard title="Pending Orders" value={stats.pendingOrders} subtitle="Awaiting fulfillment" delay={0.2} />
          <StatCard title="Total Users" value={stats.totalUsers} subtitle="Registered accounts" delay={0.3} />
        </div>
      )}

      {/* Links */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-6"
      >
        <p className="text-sm font-semibold tracking-wide text-white/70">
          Management
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/orders"
            className="rounded-xl bg-yellow-300 px-4 py-2 text-sm font-medium text-black transition hover:bg-yellow-400"
          >
            Manage Orders
          </Link>
          <Link
            href="/admin/products"
            className="rounded-xl bg-yellow-300 px-4 py-2 text-sm font-medium text-black transition hover:bg-yellow-400"
          >
            Manage Products
          </Link>
          <Link
            href="/admin/users"
            className="rounded-xl bg-yellow-300 px-4 py-2 text-sm font-medium text-black transition hover:bg-yellow-400"
          >
            Manage Users
          </Link>
          <Link
            href="/admin/analytics"
            className="rounded-xl bg-yellow-300 px-4 py-2 text-sm font-medium text-black transition hover:bg-yellow-400"
          >
            Analytics &amp; Reporting
          </Link>
        </div>
      </motion.div>

      <p className="pt-2 text-xs text-white/50">
        Tip: Use RLS policies so only admins can access this route, and consider
        moving this to a server component if you later surface sensitive data.
      </p>
    </motion.div>
  );
}
