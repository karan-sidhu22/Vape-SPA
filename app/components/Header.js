"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { Menu, X } from "lucide-react";

export default function Header() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const containerRef = useRef(null);

  // parallax
  const mvX = useMotionValue(0);
  const mvY = useMotionValue(0);
  const logoX = useTransform(mvX, (v) => v / 20);
  const logoY = useTransform(mvY, (v) => v / 20);
  const navX = useTransform(mvX, (v) => v / 35);
  const navY = useTransform(mvY, (v) => v / 35);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data?.session?.user) setUser(data.session.user);
    });
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    function onMove(e) {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      mvX.set(dx);
      mvY.set(dy);
    }
    function onLeave() {
      mvX.set(0);
      mvY.set(0);
    }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("pointerleave", onLeave);
    };
  }, [mvX, mvY]);

  const navItems = [
    { href: "/account", label: "My Account" },
    { href: "/wishlist", label: "Wishlist" },
    { href: "/cart", label: "Cart" },
    { href: "/order-history", label: "Orders" },
  ];

  return (
    <>
      {/* bg effects */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-0 z-40 flex justify-center"
        style={{ height: 140 }}
      >
        <div className="w-[90%] max-w-7xl relative">
          <div
            className="absolute inset-0 rounded-2xl blur-2xl opacity-30 -z-10"
            style={{
              background:
                "radial-gradient(1200px 300px at 10% 10%, rgba(255,200,70,0.08), transparent 8%), radial-gradient(400px 160px at 90% 40%, rgba(255,255,255,0.03), transparent 12%)",
              animation: "bgShift 10s linear infinite",
            }}
          />
        </div>
      </div>

      <motion.header
        ref={containerRef}
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 px-4 py-2 w-[94%] max-w-7xl"
      >
        <div className="relative rounded-2xl bg-white/6 backdrop-blur-md border border-white/8 shadow-xl overflow-hidden">
          <div
            className="absolute inset-0 opacity-40 mix-blend-screen pointer-events-none"
            style={{
              background:
                "linear-gradient(120deg, rgba(255,214,102,0.04) 0%, rgba(255,255,255,0.02) 40%, rgba(255, 255, 255, 0.00) 100%)",
            }}
          />

          <div className="flex items-center justify-between px-4 py-2 sm:px-6 sm:py-3">
            {/* left: hamburger + logo */}
            <div className="flex items-center gap-3">
              {/* mobile hamburger */}
              <div className="md:hidden">
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="text-white/90 hover:text-yellow-300"
                >
                  {menuOpen ? <X size={26} /> : <Menu size={26} />}
                </button>
              </div>

              <motion.div
                style={{ x: logoX, y: logoY }}
                className="flex items-center gap-2 cursor-pointer select-none"
                onClick={() => router.push("/")}
                aria-label="Home"
              >
                <Image
                  src="/Logo.png"
                  alt="Vape Vault Logo"
                  width={44}
                  height={44}
                  className="sm:w-[60px] sm:h-[60px]"
                />
                <div>
                  <h1 className="text-lg sm:text-2xl font-bold text-yellow-300 leading-none">
                    Vape-SPA
                  </h1>
                </div>
              </motion.div>
            </div>

            {/* desktop nav */}
            <motion.nav
              style={{ x: navX, y: navY }}
              className="hidden md:flex items-center gap-6"
            >
              {navItems.map((it) => (
                <Link
                  key={it.href}
                  href={it.href}
                  className="px-2 py-1 text-white/90 hover:text-yellow-300 transition-transform transform hover:scale-105"
                >
                  {it.label}
                </Link>
              ))}
              {user ? (
                <button
                  onClick={handleLogout}
                  className="bg-yellow-300 hover:bg-yellow-400 text-black px-4 py-2 rounded-full font-medium shadow-sm"
                >
                  Logout
                </button>
              ) : (
                <div className="flex gap-3">
                  <Link href="/signin" className="text-white/90 hover:text-yellow-300">
                    Sign In
                  </Link>
                  <Link href="/signup" className="text-white/90 hover:text-yellow-300">
                    Sign Up
                  </Link>
                </div>
              )}
            </motion.nav>
          </div>

          {/* mobile dropdown */}
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="md:hidden bg-black/80 backdrop-blur-md border-t border-white/10 px-4 py-4 flex flex-col gap-4"
            >
              {navItems.map((it) => (
                <Link
                  key={it.href}
                  href={it.href}
                  className="text-white/90 hover:text-yellow-300"
                  onClick={() => setMenuOpen(false)}
                >
                  {it.label}
                </Link>
              ))}
              {user ? (
                <button
                  onClick={() => {
                    handleLogout();
                    setMenuOpen(false);
                  }}
                  className="bg-yellow-300 hover:bg-yellow-400 text-black px-4 py-2 rounded-full font-medium shadow-sm"
                >
                  Logout
                </button>
              ) : (
                <div className="flex flex-col gap-3">
                  <Link
                    href="/signin"
                    className="text-white/90 hover:text-yellow-300"
                    onClick={() => setMenuOpen(false)}
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/signup"
                    className="text-white/90 hover:text-yellow-300"
                    onClick={() => setMenuOpen(false)}
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </motion.header>

      <style jsx>{`
        @keyframes bgShift {
          0% {
            transform: translateX(-6%) rotate(0deg);
          }
          50% {
            transform: translateX(6%) rotate(2deg);
          }
          100% {
            transform: translateX(-6%) rotate(0deg);
          }
        }
        .particle {
          position: absolute;
          width: 10px;
          height: 10px;
          border-radius: 999px;
          background: linear-gradient(
            180deg,
            rgba(255, 214, 102, 0.95),
            rgba(255, 183, 3, 0.6)
          );
          filter: blur(6px);
          opacity: 0.7;
          animation: floaty 8s ease-in-out infinite;
        }
        @keyframes floaty {
          0% {
            transform: translateY(0) translateX(0) scale(1);
            opacity: 0.6;
          }
          50% {
            transform: translateY(-20px) translateX(14px) scale(1.1);
            opacity: 0.95;
          }
          100% {
            transform: translateY(0) translateX(0) scale(1);
            opacity: 0.6;
          }
        }
      `}</style>
    </>
  );
}
