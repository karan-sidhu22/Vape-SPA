"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

export default function SigninForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const signupName = searchParams.get("name") || "";
  const signupEmail = searchParams.get("email") || "";

  const [formData, setFormData] = useState({
    email: signupEmail,
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) =>
    setFormData((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error: signInError } =
        await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });
      if (signInError) throw signInError;
      const user = data.user;
      if (!user) throw new Error("No user returned");

      const { error: upsertError } = await supabase.from("users").upsert({
        id: user.id,
        email: user.email,
        full_name: signupName,
      });
      if (upsertError) throw upsertError;

      router.push("/home");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-lg p-8">
      <h2 className="text-3xl font-bold text-center text-yellow-300 mb-6">
        Sign In to Your Account
      </h2>

      {error && (
        <div className="mb-4 p-3 bg-red-100/20 border-l-4 border-red-400 text-red-300 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-white mb-1">
            Email Address <span className="text-red-500">*</span>
          </label>
          <input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full px-4 py-2 bg-white/20 border border-white/30 text-white placeholder-white/70 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 transition"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-white mb-1">
            Password <span className="text-red-500">*</span>
          </label>
          <input
            id="password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            className="w-full px-4 py-2 bg-white/20 border border-white/30 text-white placeholder-white/70 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 transition"
            placeholder="Your password"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-3 rounded-lg font-medium transition ${
            loading
              ? "bg-yellow-200 cursor-not-allowed text-black"
              : "bg-yellow-300 hover:bg-yellow-400 text-black"
          }`}
        >
          {loading ? "Signing In…" : "Sign In"}
        </button>
      </form>

      <div className="mt-6 text-center text-sm text-white/80">
        Don’t have an account?{" "}
        <Link
          href="/signup"
          className="text-yellow-400 hover:underline font-medium"
        >
          Sign Up
        </Link>
      </div>
    </div>
  );
}
