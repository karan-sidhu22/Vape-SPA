"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import { motion } from "framer-motion"; // ✅ Added

export default function SignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [passwordStrength, setPasswordStrength] = useState(0);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((f) => ({ ...f, [name]: value }));
    if (name === "password") calculatePasswordStrength(value);
  };

  const calculatePasswordStrength = (pwd) => {
    let s = 0;
    if (pwd.length >= 8) s++;
    if (/[A-Z]/.test(pwd)) s++;
    if (/[0-9]/.test(pwd)) s++;
    if (/[^A-Za-z0-9]/.test(pwd)) s++;
    setPasswordStrength(s);
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError("Please enter your full name");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError("Please enter a valid email");
      return false;
    }
    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters");
      return false;
    }
    if (passwordStrength < 3) {
      setError("Password too weak; include uppercase, numbers & symbols");
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return false;
    }
    setError(null);
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);

    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: { full_name: formData.name },
          emailRedirectTo: `${window.location.origin}/signin`,
        },
      });
      if (signUpError) throw signUpError;

      const params = new URLSearchParams({
        name: formData.name,
        email: formData.email,
      });
      router.push(`/signin?${params.toString()}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Animation Variants
  const formVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "#131826" }}
    >
      {/* Header */}
      <motion.header
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="flex justify-center items-center px-6 py-4 border-b border-white/10"
        style={{ backgroundColor: "#141825" }}
      >
        <Link href="/" className="flex items-center space-x-3">
          <img src="/Logo.png" alt="Vape-SPA Logo" className="w-20 h-20" />
          <h1 className="text-3xl font-bold text-yellow-300">Vape-SPA</h1>
        </Link>
      </motion.header>

      {/* Main Form */}
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-lg p-8"
        >
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-3xl font-bold text-center text-yellow-300 mb-6"
          >
            Create an Account
          </motion.h2>

          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mb-4 p-3 bg-red-500/20 border border-red-400 text-red-300 rounded"
            >
              {error}
            </motion.div>
          )}

          <motion.form
            onSubmit={handleSubmit}
            className="space-y-4 text-white"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.15 } },
            }}
          >
            {/* Name */}
            <motion.div variants={formVariants}>
              <label htmlFor="name" className="block mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 text-white placeholder-white/60 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                placeholder="Harkaran Singh"
              />
            </motion.div>

            {/* Email */}
            <motion.div variants={formVariants}>
              <label htmlFor="email" className="block mb-1">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 text-white placeholder-white/60 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                placeholder="you@example.com"
              />
            </motion.div>

            {/* Password */}
            <motion.div variants={formVariants}>
              <label htmlFor="password" className="block mb-1">
                Password <span className="text-red-500">*</span>
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 text-white placeholder-white/60 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                placeholder="At least 8 characters"
              />
              <div className="mt-1 flex gap-1">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-sm ${
                      passwordStrength >= i
                        ? i >= 3
                          ? "bg-green-500"
                          : "bg-yellow-400"
                        : "bg-gray-700"
                    }`}
                  />
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Include uppercase, numbers, and symbols for stronger security
              </p>
            </motion.div>

            {/* Confirm Password */}
            <motion.div variants={formVariants}>
              <label htmlFor="confirmPassword" className="block mb-1">
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 text-white placeholder-white/60 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                placeholder="Re-enter your password"
              />
            </motion.div>

            {/* Button */}
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`w-full py-3 rounded-lg font-medium text-black transition ${
                loading
                  ? "bg-yellow-200 cursor-not-allowed"
                  : "bg-yellow-300 hover:bg-yellow-400"
              }`}
            >
              {loading ? "Creating Account…" : "Sign Up"}
            </motion.button>
          </motion.form>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="mt-6 text-center text-sm text-white/70"
          >
            Already have an account?{" "}
            <Link
              href="/signin"
              className="text-yellow-300 hover:underline font-medium"
            >
              Sign In
            </Link>
          </motion.div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer
        className="text-white/60 text-center p-6 text-sm border-t border-white/10"
        style={{ backgroundColor: "#141825" }}
      >
        &copy; {new Date().getFullYear()} Vape-SPA. All rights reserved.
      </footer>
    </div>
  );
}
