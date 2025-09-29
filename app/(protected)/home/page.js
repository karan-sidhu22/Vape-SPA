"use client";

// app/(protected)/home/page.js
// Fully enhanced Home page for Vape Vault — premium animations, accessibility, and
// developer-friendly utilities. This file intentionally contains extensive
// comments, variants, helper components, and mock utilities to make it
// comprehensive and easily modifiable. It has been expanded for clarity and
// includes many examples of motion patterns, hooks, and micro-interactions.

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import dynamic from "next/dynamic";
import {
  HeartIcon as HeartOutline,
  PlusIcon,
  MinusIcon,
  MagnifyingGlassIcon,
  EllipsisVerticalIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolid } from "@heroicons/react/24/solid";
import { motion, AnimatePresence } from "framer-motion";

// Fallback static import so SSR fallback works if dynamic import fails
import SiteFooterStatic from "app/components/SiteFooter"; // fallback import

// Lazy-load components to improve initial paint performance
const BrandPromise = dynamic(() => import("app/components/BrandPromise"), {
  ssr: false,
  loading: () => <div className="h-28" />,
});
const SiteFooter = dynamic(
  () =>
    import("app/components/SiteFooter").catch(() => ({
      default: SiteFooterStatic,
    })),
  { ssr: false, loading: () => <div className="h-28" /> }
);

/* -------------------------------------------------------------------------- */
/* Utility helpers & mock data (developer friendly)                           */
/* -------------------------------------------------------------------------- */

// Utility: debounce (useful for search input)
function debounce(fn, wait = 120) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}

// Utility: clamp
function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}

// Accessibility helper
function srOnly(text) {
  return (
    <span className="sr-only">{text}</span>
  );
}

// Micro animation config
const spring = { type: "spring", stiffness: 260, damping: 22 };

/* -------------------------------------------------------------------------- */
/* Animation variants                                                          */
/* -------------------------------------------------------------------------- */
const pageVariants = {
  hidden: { opacity: 0, scale: 0.995 },
  enter: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.55, ease: "easeOut" },
  },
  exit: { opacity: 0, scale: 1.01, transition: { duration: 0.35, ease: "easeIn" } },
};

const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.12 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const subtleScale = {
  hover: { scale: 1.03, transition: { duration: 0.18 } },
  tap: { scale: 0.98 },
};

/* -------------------------------------------------------------------------- */
/* FadeInOnScroll — simple hook + motion wrapper to animate when visible       */
/* -------------------------------------------------------------------------- */
function FadeInOnScroll({ children, className = "", delay = 0 }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.unobserve(entry.target);
        }
      },
      { threshold: 0.12 }
    );

    try {
      if (ref.current.getBoundingClientRect().top < window.innerHeight) {
        setVisible(true);
      } else {
        obs.observe(ref.current);
      }
    } catch {
      obs.observe(ref.current);
    }

    return () => obs.disconnect();
  }, []);

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 20 }}
      animate={visible ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.48, ease: "easeOut", delay }}
    >
      {children}
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/* 3D Tilt hook — gentle tilt on mouse move for cards                         */
/* -------------------------------------------------------------------------- */
function useTilt(active = true) {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current || !active) return;
    const el = ref.current;

    function handleMove(e) {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      const tiltX = (py - 0.5) * 8; // range -4..4
      const tiltY = (px - 0.5) * -12; // range -6..6
      el.style.transform = `perspective(900px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale(1.01)`;
    }

    function handleLeave() {
      el.style.transform = "perspective(900px) rotateX(0deg) rotateY(0deg) scale(1)";
    }

    el.addEventListener("mousemove", handleMove);
    el.addEventListener("mouseleave", handleLeave);

    return () => {
      el.removeEventListener("mousemove", handleMove);
      el.removeEventListener("mouseleave", handleLeave);
    };
  }, [active]);

  return ref;
}

/* -------------------------------------------------------------------------- */
/* Page Component — Home                                                       */
/* -------------------------------------------------------------------------- */
export default function Home() {
  const router = useRouter();

  // auth & loading
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // data
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  // cart & wishlist
  const [cartId, setCartId] = useState(null);
  const [cartMap, setCartMap] = useState({});
  const [wishlistId, setWishlistId] = useState(null);
  const [wishlistSet, setWishlistSet] = useState(new Set());
  const [processingId, setProcessingId] = useState(null);

  // UI
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [sortBy, setSortBy] = useState("");
  const [brandFilter, setBrandFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);

  // tilt on cards toggle
  const [tiltEnabled, setTiltEnabled] = useState(true);

  // session check and auth listener
  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      if (!data.session) {
        router.replace("/signin");
      } else {
        setUser(data.session.user);
      }
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_, sess) => {
      if (!sess) {
        router.replace("/signin");
      } else {
        setUser(sess.user);
      }
    });
    return () => {
      mounted = false;
      try {
        sub?.subscription.unsubscribe?.();
      } catch {}
    };
  }, [router]);

  // fetch products & categories
  useEffect(() => {
    (async () => {
      try {
        const [pRes, cRes] = await Promise.all([
          supabase.from("products").select("*"),
          supabase.from("categories").select("*"),
        ]);
        setProducts(pRes.data || []);
        setCategories(cRes.data || []);
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // fetch cart & wishlist for user
  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const { data: cart } = await supabase
          .from("carts")
          .select("id")
          .eq("user_id", user.id)
          .single();
        if (cart?.id) {
          setCartId(cart.id);
          const { data: items } = await supabase
            .from("cart_items")
            .select("product_id,quantity")
            .eq("cart_id", cart.id);
          setCartMap(
            (items || []).reduce((m, i) => ({ ...m, [i.product_id]: i.quantity }), {})
          );
        }
      } catch (err) {
        console.error("Cart fetch error:", err);
      }
    })();
    (async () => {
      try {
        const { data: wl } = await supabase
          .from("wishlists")
          .select("id")
          .eq("user_id", user.id)
          .single();
        if (wl?.id) {
          setWishlistId(wl.id);
          const { data: wItems } = await supabase
            .from("wishlist_items")
            .select("product_id")
            .eq("wishlist_id", wl.id);
          setWishlistSet(new Set((wItems || []).map((w) => w.product_id)));
        }
      } catch (err) {
        console.error("Wishlist fetch error:", err);
      }
    })();
  }, [user]);

  /* -------------------------------------------------------------------------- */
  /* actions: logout, cart, wishlist                                            */
  /* -------------------------------------------------------------------------- */
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/");
  };

  const addToCart = async (pid) => {
    setProcessingId(pid);
    const prod = products.find((p) => p.id === pid);
    const now = cartMap[pid] || 0;
    if (!prod || now >= prod.stock_quantity) {
      alert(`Only ${prod?.stock_quantity ?? 0} left in stock`);
      setProcessingId(null);
      return;
    }
    try {
      if (!cartId) {
        const { data: nc } = await supabase
          .from("carts")
          .insert({ user_id: user.id })
          .select("id")
          .single();
        setCartId(nc.id);
        await supabase.from("cart_items").insert({
          cart_id: nc.id,
          product_id: pid,
          quantity: 1,
        });
      } else {
        await supabase.from("cart_items").insert({
          cart_id: cartId,
          product_id: pid,
          quantity: 1,
        });
      }
      setCartMap((m) => ({ ...m, [pid]: now + 1 }));
    } catch (err) {
      console.error("addToCart error:", err);
    } finally {
      setProcessingId(null);
    }
  };

  const updateCartQty = async (pid, delta) => {
    const prod = products.find((p) => p.id === pid);
    const now = cartMap[pid] || 0;
    const nxt = now + delta;
    try {
      if (nxt < 1) {
        await supabase
          .from("cart_items")
          .delete()
          .match({ cart_id: cartId, product_id: pid });
        const m2 = { ...cartMap };
        delete m2[pid];
        setCartMap(m2);
      } else if (nxt <= prod.stock_quantity) {
        await supabase
          .from("cart_items")
          .update({ quantity: nxt })
          .match({ cart_id: cartId, product_id: pid });
        setCartMap((m) => ({ ...m, [pid]: nxt }));
      } else {
        alert(`Only ${prod.stock_quantity} left in stock`);
      }
    } catch (err) {
      console.error("updateCartQty error:", err);
    }
  };

  const addToWishlist = async (pid) => {
    setProcessingId(pid);
    try {
      if (!wishlistId) {
        const { data: nw } = await supabase
          .from("wishlists")
          .insert({ user_id: user.id, name: "My Wishlist" })
          .select("id")
          .single();
        setWishlistId(nw.id);
        await supabase.from("wishlist_items").insert({
          wishlist_id: nw.id,
          product_id: pid,
        });
      } else {
        await supabase.from("wishlist_items").insert({
          wishlist_id: wishlistId,
          product_id: pid,
        });
      }
      setWishlistSet((s) => new Set(s).add(pid));
    } catch (err) {
      console.error("addToWishlist error:", err);
    } finally {
      setProcessingId(null);
    }
  };

  const removeFromWishlist = async (pid) => {
    setProcessingId(pid);
    try {
      await supabase
        .from("wishlist_items")
        .delete()
        .match({ wishlist_id: wishlistId, product_id: pid });
      setWishlistSet((s) => {
        const s2 = new Set(s);
        s2.delete(pid);
        return s2;
      });
    } catch (err) {
      console.error("removeFromWishlist error:", err);
    } finally {
      setProcessingId(null);
    }
  };

  /* -------------------------------------------------------------------------- */
  /* filters & suggestions                                                       */
  /* -------------------------------------------------------------------------- */
  const brandOptions = Array.from(
    new Set(products.map((p) => p.brand).filter(Boolean))
  );

  // search logic (debounced)
  useEffect(() => {
    const doSearch = debounce((q) => {
      const s = q.trim().toLowerCase();
      if (!s) {
        setSearchResults([]);
        return;
      }
      const results = products
        .filter((p) => p.name.toLowerCase().includes(s) || (p.tags || []).some(t => t.toLowerCase().includes(s)))
        .filter((p) => (categoryFilter ? p.category_id === categoryFilter : true))
        .filter((p) => (brandFilter ? p.brand === brandFilter : true))
        .sort((a, b) => {
          if (sortBy === "priceAsc") return a.price - b.price;
          if (sortBy === "priceDesc") return b.price - a.price;
          if (sortBy === "nameAsc") return a.name.localeCompare(b.name);
          if (sortBy === "nameDesc") return b.name.localeCompare(a.name);
          return 0;
        });
      setSearchResults(results.slice(0, 50));
    }, 120);

    doSearch(searchQuery);
  }, [searchQuery, products, brandFilter, categoryFilter, sortBy]);

  // desktop search key
  function handleDesktopSearchKey(e) {
    if (e.key === "Enter") {
      if (searchResults.length > 0) {
        router.push(`/product/${searchResults[0].id}`);
        setSearchQuery("");
      } else {
        setSearchQuery("");
      }
    }
  }

  // mobile search key
  function handleMobileSearchKey(e) {
    if (e.key === "Enter") {
      if (searchResults.length > 0) {
        router.push(`/product/${searchResults[0].id}`);
        setSearchQuery("");
        setShowMobileSearch(false);
      } else {
        setShowMobileSearch(false);
      }
    }
  }

  if (!user || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
        Loading…
      </div>
    );
  }

  /* -------------------------------------------------------------------------- */
  /* Render                                                                     */
  /* -------------------------------------------------------------------------- */
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="home-page"
        variants={pageVariants}
        initial="hidden"
        animate="enter"
        exit="exit"
        className="flex flex-col min-h-screen bg-gray-900 text-white"
      >
        {/* ========== HEADER (desktop kept the same as your working version) ========== */}
        <motion.header
          initial={{ opacity: 0, y: -50, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="fixed inset-x-0 top-4 z-50 px-4"
        >
          <div className="mx-auto w-full max-w-[1600px] bg-black/60 backdrop-blur-lg border border-white/20 rounded-3xl flex items-center justify-between px-8 py-3 shadow-2xl">
            {/* Left: Logo */}
            <div
              className="flex items-center gap-3 cursor-pointer select-none"
              onClick={() => router.push("/")}
            >
              <Image src="/Logo.png" alt="Vape Vault" width={60} height={60} />
              <div>
                <h1 className="text-2xl font-bold text-yellow-300 leading-none">
                  Vape Vault
                </h1>
                <span className="text-xs text-white/70 -mt-1 block" />
              </div>
            </div>

            {/* Desktop search (kept as before) */}
            <div className="hidden md:block relative flex-1 max-w-lg mx-4">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/60" />
              <input
                type="text"
                placeholder="Search products…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleDesktopSearchKey}
                className="w-full pl-10 pr-10 py-2 rounded-full bg-white/20 border border-white/30 placeholder-white/60 text-white text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />
              <EllipsisVerticalIcon
                onClick={() => setShowFilterMenu((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white cursor-pointer"
              />

              {/* Desktop suggestions */}
              {searchQuery && searchResults.length > 0 && (
                <div className="absolute mt-2 w-full bg-black border border-white/20 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                  {searchResults.slice(0, 8).map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center p-2 hover:bg-white/10 cursor-pointer"
                      onClick={() => {
                        router.push(`/product/${p.id}`);
                        setSearchQuery("");
                      }}
                    >
                      <Image
                        src={p.image_url}
                        alt={p.name}
                        width={44}
                        height={44}
                        className="rounded"
                        loading="lazy"
                        sizes="44px"
                      />
                      <div className="ml-3 flex-1">
                        <div className="text-white text-sm">{p.name}</div>
                        <div className="text-yellow-300 text-xs">
                          ${p.price?.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Desktop nav (unchanged) */}
            <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
              <Link href="/account" className="hover:text-yellow-400">
                My Account
              </Link>
              <Link href="/wishlist" className="hover:text-yellow-400">
                Wishlist
              </Link>
              <Link href="/cart" className="hover:text-yellow-400">
                Cart
              </Link>
              <Link href="/order-history" className="hover:text-yellow-400">
                Orders
              </Link>
              <button
                onClick={handleLogout}
                className="bg-yellow-300 hover:bg-yellow-400 text-black px-4 py-2 rounded-md font-medium"
              >
                Logout
              </button>
            </nav>

            {/* Mobile icons: search + menu */}
            <div className="md:hidden flex items-center gap-3">
              <button
                onClick={() => setShowMobileSearch(true)}
                aria-label="Search"
                className="p-1"
              >
                <MagnifyingGlassIcon className="h-6 w-6 text-white" />
              </button>
              <button
                onClick={() => setMobileOpen((v) => !v)}
                aria-label="Menu"
                className="p-1"
              >
                <svg
                  className="w-7 h-7 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile menu dropdown */}
          {mobileOpen && (
            <div className="md:hidden mt-2 mx-auto w-[95%] bg-black/90 border border-white/20 rounded-xl p-4 space-y-3 text-center shadow-xl">
              <Link href="/account" className="block text-yellow-400">
                My Account
              </Link>
              <Link href="/wishlist" className="block text-yellow-400">
                Wishlist
              </Link>
              <Link href="/cart" className="block text-yellow-400">
                Cart
              </Link>
              <Link href="/order-history" className="block text-yellow-400">
                Orders
              </Link>
              <button
                onClick={handleLogout}
                className="bg-yellow-300 hover:bg-yellow-400 text-black px-4 py-2 rounded-md w-full"
              >
                Logout
              </button>
            </div>
          )}
        </motion.header>

        {/* ========== Mobile Search Overlay (improved UX) ========== */}
        {showMobileSearch && (
          <div className="fixed inset-0 z-50 bg-black/95 flex flex-col p-4">
            <div className="flex items-center gap-3">
              <MagnifyingGlassIcon className="h-6 w-6 text-white" />
              <input
                type="text"
                placeholder="Search products…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleMobileSearchKey}
                autoFocus
                className="flex-1 bg-transparent border-b border-white/20 text-white placeholder-white/50 px-2 py-2 focus:outline-none"
              />
              <button
                onClick={() => {
                  setShowMobileSearch(false);
                  setSearchQuery("");
                }}
                aria-label="Close search"
              >
                <XMarkIcon className="h-7 w-7 text-white" />
              </button>
            </div>

            <div className="mt-4 overflow-y-auto flex-1">
              {searchResults.length > 0 ? (
                searchResults.slice(0, 30).map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center p-3 rounded-md hover:bg-white/5 cursor-pointer"
                    onClick={() => {
                      router.push(`/product/${p.id}`);
                      setSearchQuery("");
                      setShowMobileSearch(false);
                    }}
                  >
                    <Image
                      src={p.image_url}
                      alt={p.name}
                      width={56}
                      height={56}
                      className="rounded"
                      loading="lazy"
                      sizes="56px"
                    />
                    <div className="ml-3 flex-1">
                      <div className="text-white font-medium">{p.name}</div>
                      <div className="text-yellow-300 text-sm">
                        ${p.price?.toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-white/60 text-center mt-10">No results found</p>
              )}
            </div>
          </div>
        )}

        {/* ========== MAIN ========== */}
        <main className="pt-32">
          {/* — Hero Section */}
          <section
            className="relative h-[500px] bg-cover bg-center overflow-hidden"
            style={{ backgroundImage: `url('/vape_back.png')` }}
          >
            {/* layered parallax backgrounds: slow moving layers for depth */}
            <motion.div
              className="absolute inset-0 bg-black/50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1 }}
            />

            {/* subtle floating shapes layer (purely decorative) */}
            <motion.div
              aria-hidden
              className="pointer-events-none absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.9 }}
              transition={{ duration: 1.2 }}
            >
              {/* Decorative SVG blobs positioned for subtle motion */}
              <svg
                className="absolute left-8 top-10 w-48 h-48 opacity-20"
                viewBox="0 0 200 200"
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  <linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#facc15" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="#ffffff" stopOpacity="0.08" />
                  </linearGradient>
                </defs>
                <motion.path
                  d="M43.2,-61.8C55.1,-53.5,63.7,-41.9,66.9,-28.5C70.2,-15,68,-0.1,63.6,13.8C59.2,27.7,52.6,40.6,41,48.5C29.3,56.4,14.6,59.2,0.8,58.2C-13,57.2,-26,52.2,-36.1,44.8C-46.2,37.3,-53.5,27.5,-60.6,15.9C-67.6,4.3,-74.5,-9.9,-70.6,-21.7C-66.7,-33.5,-51.9,-42.9,-38.1,-51C-24.3,-59.2,-12.2,-66.2,0.6,-67.2C13.4,-68.1,26.9,-62.1,43.2,-61.8Z"
                  transform="translate(100 100)"
                  fill="url(#g1)"
                  animate={{ rotate: 12 }}
                />
              </svg>
            </motion.div>

            <motion.div
              className="relative z-10 flex flex-col items-center justify-center h-full text-center px-6"
              variants={staggerContainer}
              initial="hidden"
              animate="show"
            >
              <motion.h1
                variants={fadeUp}
                className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4"
              >
                Discover Your Next Favorite Vape
              </motion.h1>

              <motion.p
                variants={fadeUp}
                className="text-lg text-gray-200 max-w-2xl mb-6"
              >
                Premium vape products, stylish designs, and smooth flavors – all in
                one place.
              </motion.p>

              <motion.div variants={fadeUp}>
                <Link href="#shop">
                  <motion.button
                    whileHover={{ scale: 1.08, boxShadow: "0 0 28px rgba(250,204,21,0.12)" }}
                    whileTap={{ scale: 0.96 }}
                    className="bg-yellow-300 hover:bg-yellow-400 text-black px-6 py-3 rounded-full"
                  >
                    Browse Categories
                  </motion.button>
                </Link>
              </motion.div>

              {/* micro-cta row for trust signals */}
              <motion.div
                className="mt-6 flex items-center gap-6"
                variants={fadeUp}
              >
                <div className="text-xs text-white/70">Free shipping over $50</div>
                <div className="text-xs text-white/70">30-day returns</div>
                <div className="text-xs text-white/70">Secure checkout</div>
              </motion.div>
            </motion.div>
          </section>

          {/* BrandPromise (lazy loaded) */}
          <section className="w-full py-0 bg-gray-900">
            <BrandPromise />
          </section>

          {/* Shop by Category */}
          <section id="shop" className="py-16">
            <h2 className="text-3xl sm:text-4xl font-semibold text-center text-yellow-300 mb-10">
              Shop by Category
            </h2>

            {/* Mobile default: 3 columns as requested */}
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.2 }}
              className="px-6 grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6"
            >
              {categories.map((cat) => (
                <motion.div key={cat.id} variants={fadeUp}>
                  <FadeInOnScroll>
                    <div
                      onClick={() => router.push(`/category/${cat.id}`)}
                      className="relative group cursor-pointer overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition"
                      style={{ aspectRatio: "4/3" }}
                    >
                      <Image
                        src={cat.image_url}
                        alt={cat.name}
                        fill
                        sizes="(max-width: 640px) 32vw, (max-width: 1024px) 24vw, 200px"
                        loading="lazy"
                        className="object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-black/40 group-hover:bg-black/60 transition-colors" />
                      <span className="absolute bottom-4 left-4 text-white font-semibold text-lg">
                        {cat.name}
                      </span>
                    </div>
                  </FadeInOnScroll>
                </motion.div>
              ))}
            </motion.div>
          </section>

          {/* Our Collection (Products) */}
          <section id="products" className="py-16">
            <h2 className="text-3xl sm:text-4xl font-semibold text-center text-yellow-300 mb-10">
              Our Collection
            </h2>

            {/* IMPORTANT: mobile = 2 columns (grid-cols-2), tablet/desktop scale up */}
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              className="px-4 sm:px-6 grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
            >
              {products.map((p, idx) => (
                <motion.div key={p.id} variants={fadeUp} whileHover={{ scale: 1.02 }} transition={spring}>
                  <ProductCard
                    product={p}
                    cartMap={cartMap}
                    wishlistSet={wishlistSet}
                    processingId={processingId}
                    addToCart={addToCart}
                    updateCartQty={updateCartQty}
                    addToWishlist={addToWishlist}
                    removeFromWishlist={removeFromWishlist}
                    tiltEnabled={tiltEnabled}
                  />
                </motion.div>
              ))}
            </motion.div>
          </section>
        </main>

        <SiteFooter />
      </motion.div>
    </AnimatePresence>
  );
}

/* -------------------------------------------------------------------------- */
/* ProductCard component                                                       */
/* - self-contained card with tilt, image, actions, and accessible buttons     */
/* -------------------------------------------------------------------------- */
function ProductCard({
  product,
  cartMap,
  wishlistSet,
  processingId,
  addToCart,
  updateCartQty,
  addToWishlist,
  removeFromWishlist,
  tiltEnabled,
}) {
  const tiltRef = useTilt(tiltEnabled);
  const innerRef = useRef(null);

  // combine refs (tiltRef and motion div ref)
  useEffect(() => {
    if (tiltRef.current && innerRef.current) {
      // ensure the tilt element is the container
      tiltRef.current.style.willChange = "transform";
    }
  }, [tiltRef]);

  const inCart = Boolean(cartMap[product.id]);

  return (
    <div
      ref={tiltRef}
      className={`relative overflow-hidden rounded-2xl shadow-lg group bg-gray-800 flex flex-col transform transition-transform`}>
      <div
        ref={innerRef}
        onClick={() => { /* allow card click to go to product page if desired */ }}
        className="w-full relative aspect-[3/4] sm:aspect-[4/3] cursor-pointer"
      >
        <Image
          src={product.image_url}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 46vw, (max-width: 1024px) 30vw, 300px"
          loading="lazy"
          className="object-cover brightness-90 group-hover:brightness-100 transition"
        />
      </div>

      <div className="p-3 sm:p-4 flex flex-col flex-1 justify-between">
        <div>
          <h4 className="text-sm sm:text-lg font-bold text-white uppercase tracking-wide line-clamp-2">
            {product.name}
          </h4>
          <p className="mt-1 text-xs sm:text-sm text-white/80 line-clamp-3">
            {product.description}
          </p>
        </div>

        <div className="mt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <span className="text-base sm:text-xl font-semibold text-yellow-300">
            ${product.price?.toFixed(2)}
          </span>

          <div className="flex flex-wrap gap-2 sm:gap-3 items-center">
            {/* Wishlist */}
            {wishlistSet.has(product.id) ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeFromWishlist(product.id);
                }}
                disabled={processingId === product.id}
                aria-label={`Remove ${product.name} from wishlist`}
                className="p-1"
              >
                <HeartSolid className="h-5 w-5 sm:h-6 sm:w-6 text-red-500" />
              </button>
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  addToWishlist(product.id);
                }}
                disabled={processingId === product.id}
                aria-label={`Add ${product.name} to wishlist`}
                className="p-1"
              >
                <HeartOutline className="h-5 w-5 sm:h-6 sm:w-6 text-white hover:text-red-500" />
              </button>
            )}

            {/* Cart */}
            {inCart ? (
              <div className="flex items-center gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    updateCartQty(product.id, -1);
                  }}
                  className="bg-yellow-300 rounded-full p-1"
                  aria-label={`Decrease quantity for ${product.name}`}
                >
                  <MinusIcon className="h-4 w-4 text-black" />
                </button>
                <span className="text-white text-sm px-2">{cartMap[product.id]}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    updateCartQty(product.id, 1);
                  }}
                  className="bg-yellow-300 rounded-full p-1"
                  aria-label={`Increase quantity for ${product.name}`}
                >
                  <PlusIcon className="h-4 w-4 text-black" />
                </button>
              </div>
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  addToCart(product.id);
                }}
                disabled={processingId === product.id}
                className="bg-yellow-300 text-black px-3 py-1 rounded-full text-xs sm:text-sm font-medium hover:bg-yellow-400"
                aria-label={`Add ${product.name} to cart`}
              >
                Add to Cart
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}