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

  if (loading) return <p className="p-8">Loading products…</p>;
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

      <h1 className="text-3xl font-bold">Manage Products</h1>

      <div className="flex justify-between items-center">
        <Link
          href="/admin/products/new"
          className="px-4 py-2 bg-yellow-300 text-black rounded-lg font-medium hover:bg-yellow-400"
        >
          + Add Product
        </Link>
      </div>

      <table className="min-w-full bg-white/10 rounded-lg overflow-hidden">
        <thead className="bg-gray-800 text-left">
          <tr>
            <th className="px-4 py-2">ID</th>
            <th className="px-4 py-2">Name</th>
            <th className="px-4 py-2">Price</th>
            <th className="px-4 py-2">Category</th>
            <th className="px-4 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id} className="border-b border-gray-700">
              <td className="px-4 py-2 align-top">{p.id.slice(0, 8)}</td>
              <td className="px-4 py-2">{p.name}</td>
              <td className="px-4 py-2">${p.price.toFixed(2)}</td>
              <td className="px-4 py-2">
                {p.categories?.name ?? "Uncategorized"}
              </td>
              <td className="px-4 py-2 space-x-2">
                <Link
                  href={`/admin/products/${p.id}/edit`}
                  className="px-2 py-1 bg-gray-700 text-white rounded hover:bg-gray-600 text-sm"
                >
                  Edit
                </Link>
                <button
                  onClick={() => handleDelete(p.id)}
                  disabled={deletingId === p.id}
                  className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm disabled:opacity-50"
                >
                  {deletingId === p.id ? "Deleting…" : "Delete"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
