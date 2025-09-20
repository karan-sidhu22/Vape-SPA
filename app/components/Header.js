"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { motion, useMotionValue, useTransform } from "framer-motion";

export default function Header() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const containerRef = useRef(null);

  // motion values for parallax
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

  // mouse move parallax
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
      {/* background gradient / particle canvas */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-0 z-40 flex justify-center"
        style={{ height: 160 }}
      >
        <div className="w-[90%] max-w-7xl relative">
          <div
            className="absolute inset-0 rounded-3xl blur-2xl opacity-30 -z-10"
            style={{
              background:
                "radial-gradient(1200px 300px at 10% 10%, rgba(255,200,70,0.08), transparent 8%), radial-gradient(400px 160px at 90% 40%, rgba(255,255,255,0.03), transparent 12%)",
              animation: "bgShift 10s linear infinite",
            }}
          />
          <div className="absolute inset-0 -z-20 overflow-hidden rounded-3xl">
            {Array.from({ length: 8 }).map((_, i) => (
              <span
                key={i}
                className="particle"
                style={{
                  left: `${10 + i * 10}%`,
                  top: `${10 + (i % 3) * 12}%`,
                  animationDelay: `${i * 0.8}s`,
                }}
              />
            ))}
          </div>
        </div>
      </div>

      <motion.header
        ref={containerRef}
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 w-[90%] max-w-7xl"
      >
        <div className="relative rounded-3xl bg-white/6 backdrop-blur-md border border-white/8 shadow-2xl overflow-hidden">
          <div
            className="absolute inset-0 opacity-40 mix-blend-screen pointer-events-none"
            style={{
              background:
                "linear-gradient(120deg, rgba(255,214,102,0.04) 0%, rgba(255,255,255,0.02) 40%, rgba(255, 255, 255, 0.00) 100%)",
              animation: "overlayShift 8s linear infinite",
            }}
          />

          <div className="flex items-center justify-between px-6 py-3 relative">
            {/* left: logo + title */}
            <motion.div
              style={{ x: logoX, y: logoY }}
              initial={{ scale: 0.98 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 180, damping: 16 }}
              className="flex items-center gap-3 cursor-pointer select-none"
              onClick={() => router.push("/")}
              aria-label="Home"
            >
              <Image
                src="/Logo.png"
                alt="Vape Vault Logo"
                width={60}
                height={60}
              />
              <div>
                <motion.h1
                  className="text-2xl font-bold text-yellow-300 leading-none"
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 }}
                >
                  Vape-SPA
                </motion.h1>
                <motion.span
                  className="text-xs text-white/70 -mt-1 block"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.25 }}
                >
                
                </motion.span>
              </div>
            </motion.div>

            {/* right: nav */}
            <motion.nav
              style={{ x: navX, y: navY }}
              initial="hidden"
              animate="show"
              className="flex items-center gap-6"
            >
              {navItems.map((it, idx) => (
                <motion.div
                  key={it.href}
                  variants={{
                    hidden: { opacity: 0, y: -8 },
                    show: {
                      opacity: 1,
                      y: 0,
                      transition: {
                        delay: 0.15 + idx * 0.06,
                        type: "spring",
                        stiffness: 220,
                      },
                    },
                  }}
                >
                  <Link
                    href={it.href}
                    className="relative inline-block px-2 py-1 text-white/90 hover:text-yellow-300 transition-transform transform hover:scale-105"
                  >
                    {it.label}
                  </Link>
                </motion.div>
              ))}
              {user ? (
                <motion.button
                  initial={{ scale: 0.96, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.45, type: "spring", stiffness: 260 }}
                  onClick={handleLogout}
                  className="bg-yellow-300 hover:bg-yellow-400 text-black px-4 py-2 rounded-full font-medium shadow-sm"
                >
                  Logout
                </motion.button>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.45 }}
                  className="flex gap-3"
                >
                  <Link href="/signin" className="text-white/90 hover:text-yellow-300">
                    Sign In
                  </Link>
                  <Link href="/signup" className="text-white/90 hover:text-yellow-300">
                    Sign Up
                  </Link>
                </motion.div>
              )}
            </motion.nav>
          </div>
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
        @keyframes overlayShift {
          0% {
            transform: translateY(0) translateX(0);
          }
          50% {
            transform: translateY(-6px) translateX(6px);
          }
          100% {
            transform: translateY(0) translateX(0);
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
            transform: translateY(-28px) translateX(18px) scale(1.15);
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
