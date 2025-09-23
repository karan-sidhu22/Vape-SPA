"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import {
  HeartIcon as HeartOutline,
  PlusIcon,
  MinusIcon,
  MagnifyingGlassIcon,
  EllipsisVerticalIcon,
} from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolid } from "@heroicons/react/24/solid";
import { motion } from "framer-motion";
import BrandPromise from "app/components/BrandPromise";
import SiteFooter from "app/components/SiteFooter";

// FadeInOnScroll — wraps children and fades them in when scrolled into view
function FadeInOnScroll({ children }) {
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
      { threshold: 0.1 }
    );

    if (ref.current.getBoundingClientRect().top < window.innerHeight) {
      setVisible(true);
    } else {
      obs.observe(ref.current);
    }

    return () => obs.disconnect();
  }, []);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={visible ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

export default function Home() {
  const router = useRouter();

  // Auth & loading
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Data
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  // Cart & wishlist
  const [cartId, setCartId] = useState(null);
  const [cartMap, setCartMap] = useState({});
  const [wishlistId, setWishlistId] = useState(null);
  const [wishlistSet, setWishlistSet] = useState(new Set());
  const [processingId, setProcessingId] = useState(null);

  // UI state
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("");
  const [brandFilter, setBrandFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Session check
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) router.replace("/signin");
      else setUser(data.session.user);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_, sess) => {
      if (!sess) router.replace("/signin");
      else setUser(sess.user);
    });

    return () => sub?.subscription.unsubscribe();
  }, [router]);

  // Fetch products & categories
  useEffect(() => {
    (async () => {
      const [pRes, cRes] = await Promise.all([
        supabase.from("products").select("*"),
        supabase.from("categories").select("*"),
      ]);
      setProducts(pRes.data || []);
      setCategories(cRes.data || []);
      setLoading(false);
    })();
  }, []);

  // Fetch cart & wishlist
  useEffect(() => {
    if (!user) return;

    (async () => {
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
          items.reduce((m, i) => ({ ...m, [i.product_id]: i.quantity }), {})
        );
      }
    })();

    (async () => {
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
        setWishlistSet(new Set(wItems.map((w) => w.product_id)));
      }
    })();
  }, [user]);

  // Logout
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/");
  };

  // Cart operations
  const addToCart = async (pid) => {
    setProcessingId(pid);
    const prod = products.find((p) => p.id === pid);
    const now = cartMap[pid] || 0;
    if (!prod || now >= prod.stock_quantity) {
      alert(`Only ${prod?.stock_quantity ?? 0} left in stock`);
      setProcessingId(null);
      return;
    }
    if (!cartId) {
      const { data: nc } = await supabase
        .from("carts")
        .insert({ user_id: user.id })
        .select("id")
        .single();
      setCartId(nc.id);
    }
    await supabase
      .from("cart_items")
      .insert({ cart_id: cartId, product_id: pid, quantity: 1 });
    setCartMap((m) => ({ ...m, [pid]: now + 1 }));
    setProcessingId(null);
  };

  const updateCartQty = async (pid, delta) => {
    const prod = products.find((p) => p.id === pid);
    const now = cartMap[pid] || 0;
    const nxt = now + delta;
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
  };

  // Wishlist operations
  const addToWishlist = async (pid) => {
    setProcessingId(pid);
    if (!wishlistId) {
      const { data: nw } = await supabase
        .from("wishlists")
        .insert({ user_id: user.id, name: "My Wishlist" })
        .select("id")
        .single();
      setWishlistId(nw.id);
    }
    await supabase
      .from("wishlist_items")
      .insert({ wishlist_id: wishlistId, product_id: pid });
    setWishlistSet((s) => new Set(s).add(pid));
    setProcessingId(null);
  };

  const removeFromWishlist = async (pid) => {
    setProcessingId(pid);
    await supabase
      .from("wishlist_items")
      .delete()
      .match({ wishlist_id: wishlistId, product_id: pid });
    setWishlistSet((s) => {
      const s2 = new Set(s);
      s2.delete(pid);
      return s2;
    });
    setProcessingId(null);
  };

  // Filters
  const brandOptions = Array.from(
    new Set(products.map((p) => p.brand).filter(Boolean))
  );

  const suggestions = products
    .filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .filter((p) => (categoryFilter ? p.category_id === categoryFilter : true))
    .filter((p) => (brandFilter ? p.brand === brandFilter : true))
    .sort((a, b) => {
      if (sortBy === "priceAsc") return a.price - b.price;
      if (sortBy === "priceDesc") return b.price - a.price;
      if (sortBy === "nameAsc") return a.name.localeCompare(b.name);
      if (sortBy === "nameDesc") return b.name.localeCompare(a.name);
      return 0;
    });

  if (!user || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
        Loading…
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{
          duration: 0.9,
          ease: [0.25, 0.1, 0.25, 1],
          type: "spring",
          stiffness: 80,
          damping: 15,
        }}
        className="fixed inset-x-0 top-4 z-50 px-4"
      >
        <div className="mx-auto w-full max-w-[1600px] bg-black/60 backdrop-blur-lg border border-white/20 rounded-3xl flex items-center justify-between px-4 py-2 sm:px-8 sm:py-4 shadow-2xl">
          {/* Hamburger for mobile */}
          <div className="sm:hidden">
            <button
              onClick={() => setShowMobileMenu((v) => !v)}
              className="flex items-center justify-center w-8 h-8 bg-white/20 rounded-md text-white hover:bg-yellow-300 hover:text-black transition"
              aria-label="Menu"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>

          {/* Logo */}
          <div
            className="flex items-center space-x-2 cursor-pointer"
            onClick={() => router.push("/")}
          >
            <Image src="/Logo.png" width={50} height={50} alt="Vape Vault" />
            <h1 className="text-xl sm:text-2xl font-bold text-yellow-300">
              Vape Vault
            </h1>
          </div>

          {/* Desktop Search & Filters */}
          <div className="hidden sm:flex relative flex-1 max-w-lg mx-4">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/60" />
            <input
              type="text"
              placeholder="Search products…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2 rounded-full bg-white/20 border border-white/30 placeholder-white/60 text-white text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
            <EllipsisVerticalIcon
              onClick={() => setShowFilterMenu((v) => !v)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white cursor-pointer"
            />
          </div>

          {/* Desktop Nav */}
          <nav className="hidden sm:flex items-center space-x-4 text-sm sm:text-lg">
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
              className="bg-yellow-300 hover:bg-yellow-400 text-black px-3 py-1 rounded-md font-medium text-sm sm:text-base"
            >
              Logout
            </button>
          </nav>
        </div>

        {/* Mobile Menu */}
        {showMobileMenu && (
          <div className="sm:hidden absolute top-full left-0 w-full bg-black/95 backdrop-blur-md border-t border-white/20 z-40 flex flex-col space-y-4 p-4">
            <input
              type="text"
              placeholder="Search products…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 rounded-full bg-white/20 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
            <Link href="/account" className="hover:text-yellow-400 text-white">
              My Account
            </Link>
            <Link href="/wishlist" className="hover:text-yellow-400 text-white">
              Wishlist
            </Link>
            <Link href="/cart" className="hover:text-yellow-400 text-white">
              Cart
            </Link>
            <Link
              href="/order-history"
              className="hover:text-yellow-400 text-white"
            >
              Orders
            </Link>
            <button
              onClick={handleLogout}
              className="bg-yellow-300 hover:bg-yellow-400 text-black px-4 py-2 rounded-md font-medium"
            >
              Logout
            </button>
          </div>
        )}
      </motion.header>

      {/* Main Content */}
      <main className="pt-32">
        {/* Hero Section */}
        <section
          className="relative h-[500px] bg-cover bg-center"
          style={{ backgroundImage: `url('/vape_back.png')` }}
        >
          <div className="absolute inset-0 bg-black/50" />
          <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-6">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
              Discover Your Next Favorite Vape
            </h1>
            <p className="text-lg text-gray-200 max-w-2xl mb-6">
              Premium vape products, stylish designs, and smooth flavors – all in
              one place.
            </p>
            <Link href="#shop">
              <button className="bg-yellow-300 hover:bg-yellow-400 text-black px-6 py-3 rounded-full">
                Browse Categories
              </button>
            </Link>
          </div>
        </section>

        {/* BrandPromise Section */}
        <section className="w-full py-0 bg-gray-900">
          <BrandPromise />
        </section>

        {/* Shop by Category */}
        <section id="shop" className="py-16">
          <h2 className="text-3xl sm:text-4xl font-semibold text-center text-yellow-300 mb-10">
            Shop by Category
          </h2>
          <div className="px-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-8">
            {categories.map((cat) => (
              <FadeInOnScroll key={cat.id}>
                <div
                  onClick={() => router.push(`/category/${cat.id}`)}
                  className="relative group cursor-pointer overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition"
                  style={{ aspectRatio: "4/3" }}
                >
                  <Image
                    src={cat.image_url}
                    alt={cat.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/60 transition-colors" />
                  <span className="absolute bottom-4 left-4 text-white font-semibold text-lg">
                    {cat.name}
                  </span>
                </div>
              </FadeInOnScroll>
            ))}
          </div>
        </section>

        {/* Collection */}
        <section id="products" className="py-16">
          <h2 className="text-3xl sm:text-4xl font-semibold text-center text-yellow-300 mb-10">
            Our Collection
          </h2>
          <div className="px-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-10">
            {products.map((p, idx) => (
              <FadeInOnScroll key={p.id}>
                <div
                  onClick={() => router.push(`/product/${p.id}`)}
                  className={`relative overflow-hidden rounded-2xl shadow-lg group transition-transform hover:scale-[1.03] ${
                    idx === 0 ? "lg:col-span-2" : ""
                  }`}
                >
                  <div className="w-full aspect-[4/3] relative">
                    <Image
                      src={p.image_url}
                      alt={p.name}
                      fill
                      className="object-cover brightness-90 group-hover:brightness-100 transition"
                    />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 p-6 flex flex-col justify-end">
                    <h4 className="text-2xl font-bold text-white uppercase tracking-wide drop-shadow-lg">
                      {p.name}
                    </h4>
                    <p className="mt-2 text-sm text-white/80 line-clamp-2">
                      {p.description}
                    </p>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-xl font-semibold text-yellow-300">
                        ${p.price.toFixed(2)}
                      </span>
                      <div className="flex items-center space-x-2">
                        {wishlistSet.has(p.id) ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeFromWishlist(p.id);
                            }}
                            disabled={processingId === p.id}
                          >
                            <HeartSolid className="h-6 w-6 text-red-500" />
                          </button>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              addToWishlist(p.id);
                            }}
                            disabled={processingId === p.id}
                          >
                            <HeartOutline className="h-6 w-6 text-white hover:text-red-500" />
                          </button>
                        )}
                        {cartMap[p.id] ? (
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                updateCartQty(p.id, -1);
                              }}
                              className="bg-yellow-300 rounded-full p-1"
                            >
                              <MinusIcon className="h-4 w-4 text-black" />
                            </button>
                            <span className="text-white text-sm px-2">
                              {cartMap[p.id]}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                updateCartQty(p.id, 1);
                              }}
                              className="bg-yellow-300 rounded-full p-1"
                            >
                              <PlusIcon className="h-4 w-4 text-black" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              addToCart(p.id);
                            }}
                            disabled={processingId === p.id}
                            className="bg-yellow-300 text-black px-3 py-1 rounded-full text-sm font-medium hover:bg-yellow-400"
                          >
                            Add to Cart
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </FadeInOnScroll>
            ))}
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
