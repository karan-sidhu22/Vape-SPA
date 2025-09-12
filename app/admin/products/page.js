// app/admin/products/page.js
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

export default function ManageProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);

    const { data, error } = await supabase
      .from("products")
      .select(
        `
        id,
        name,
        price,
        categories:categories ( name )
      `
      )
      .order("name", { ascending: true });

    if (error) {
      setError(error.message);
    } else {
      setProducts(data);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    setDeletingId(id);
    const { error } = await supabase.from("products").delete().eq("id", id);

    if (error) {
      setError(error.message);
    } else {
      fetchProducts();
    }
    setDeletingId(null);
  };

  return (
    <div className="p-8 space-y-6">
      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition"
      >
        &larr; Back
      </button>

      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-yellow-300">
          Manage Products
        </h1>
        <Link
          href="/admin/products/new"
          className="px-4 py-2 bg-yellow-400 text-black rounded-lg font-medium hover:bg-yellow-300 transition"
        >
          + Add Product
        </Link>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-10">
          <div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-500/20 border border-red-400 text-red-300 rounded-lg">
          ⚠️ Error: {error}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && products.length === 0 && (
        <p className="text-gray-400 text-center py-10">
          No products found. Start by adding one!
        </p>
      )}

      {/* Table */}
      {!loading && !error && products.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-700 rounded-lg overflow-hidden">
            <thead className="bg-gray-800 text-left text-gray-300 uppercase text-sm">
              <tr>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p, i) => (
                <tr
                  key={p.id}
                  className={`${
                    i % 2 === 0 ? "bg-gray-900/50" : "bg-gray-800/50"
                  } hover:bg-gray-700/50 transition`}
                >
                  <td className="px-4 py-3 font-mono text-sm text-gray-400">
                    {p.id.slice(0, 8)}
                  </td>
                  <td className="px-4 py-3">{p.name}</td>
                  <td className="px-4 py-3">${p.price.toFixed(2)}</td>
                  <td className="px-4 py-3">
                    {p.categories?.name ?? (
                      <span className="italic text-gray-400">
                        Uncategorized
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 flex justify-center space-x-2">
                    <Link
                      href={`/admin/products/${p.id}/edit`}
                      className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-500 text-sm transition"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(p.id)}
                      disabled={deletingId === p.id}
                      className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-500 text-sm disabled:opacity-50 transition"
                    >
                      {deletingId === p.id ? "Deleting…" : "Delete"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
