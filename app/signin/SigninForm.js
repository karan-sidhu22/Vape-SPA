"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import { motion } from "framer-motion"; // ✅ Added animations

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

  // 🔹 Animation variants
  const fieldVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-md bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-lg p-8"
    >
      {/* Heading */}
      <motion.h2
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="text-3xl font-bold text-center text-yellow-300 mb-6"
      >
        Sign In to Your Account
      </motion.h2>

      {/* Error */}
      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-4 p-3 bg-red-500/20 border border-red-400 text-red-300 rounded"
        >
          {error}
        </motion.div>
      )}

      {/* Form */}
      <motion.form
        onSubmit={handleSubmit}
        className="space-y-4"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: {},
          visible: { transition: { staggerChildren: 0.15 } },
        }}
      >
        {/* Email */}
        <motion.div variants={fieldVariants}>
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
        </motion.div>

        {/* Password */}
        <motion.div variants={fieldVariants}>
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
        </motion.div>

        {/* Submit Button */}
        <motion.button
          type="submit"
          disabled={loading}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`w-full py-3 rounded-lg font-medium transition ${
            loading
              ? "bg-yellow-200 cursor-not-allowed text-black"
              : "bg-yellow-300 hover:bg-yellow-400 text-black"
          }`}
        >
          {loading ? "Signing In…" : "Sign In"}
        </motion.button>
      </motion.form>

      {/* Footer Link */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="mt-6 text-center text-sm text-white/80"
      >
        Don’t have an account?{" "}
        <Link
          href="/signup"
          className="text-yellow-400 hover:underline font-medium"
        >
          Sign Up
        </Link>
      </motion.div>
    </motion.div>
  );
}
