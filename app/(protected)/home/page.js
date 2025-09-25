// app/(protected)/home/page.js
"use client";

import React, { useState, useEffect, useRef } from "react";
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
import { motion } from "framer-motion";
import SiteFooterStatic from "app/components/SiteFooter"; // fallback direct import just in case

// Lazy-load BrandPromise and SiteFooter for faster initial paint
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
      { threshold: 0.12 }
    );

    // ensure visible if already in viewport at load
    try {
      if (ref.current.getBoundingClientRect().top < window.innerHeight) {
        setVisible(true);
      } else {
        obs.observe(ref.current);
      }
    } catch (e) {
      // ignore in non-browser envs
      obs.observe(ref.current);
    }

    return () => obs.disconnect();
  }, []);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={visible ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.45, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

export default function Home() {
  const router = useRouter();

  // — auth & loading
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // — data
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  // — cart & wishlist
  const [cartId, setCartId] = useState(null);
  const [cartMap, setCartMap] = useState({});
  const [wishlistId, setWishlistId] = useState(null);
  const [wishlistSet, setWishlistSet] = useState(new Set());
  const [processingId, setProcessingId] = useState(null);

  // — UI state
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("");
  const [brandFilter, setBrandFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);

  // Session check & auth listener
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
        sub?.subscription?.unsubscribe();
      } catch (e) {}
    };
  }, [router]);

  // Fetch products & categories (initial)
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

  // Fetch cart & wishlist for logged-in user
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

  // — logout
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/");
  };

  // — cart ops
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
        // insert item after cart created
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

  // — wishlist ops
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

  // — filter & suggestions logic
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

  // keyboard handler used in desktop search
  function handleDesktopSearchKey(e) {
    if (e.key === "Enter") {
      if (suggestions.length > 0) {
        router.push(`/product/${suggestions[0].id}`);
        setSearchQuery("");
      } else {
        // fallback: maybe go to search page or just clear
        setSearchQuery("");
      }
    }
  }

  // mobile search enter handler
  function handleMobileSearchKey(e) {
    if (e.key === "Enter") {
      if (suggestions.length > 0) {
        router.push(`/product/${suggestions[0].id}`);
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

  return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-white">
      {/* ——— Animated Header ——— */}
      <motion.header
        initial={{ opacity: 0, y: -50, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="fixed inset-x-0 top-4 z-50 px-4"
      >
        <div className="mx-auto w-full max-w-[1600px] bg-black/60 backdrop-blur-lg border border-white/20 rounded-3xl flex items-center justify-between px-8 py-3 shadow-2xl">
          {/* left: logo */}
          <div className="flex items-center gap-3 cursor-pointer select-none" onClick={() => router.push("/")}>
            <Image src="/Logo.png" alt="Vape Vault" width={60} height={60} />
            <div>
              <h1 className="text-2xl font-bold text-yellow-300 leading-none">Vape Vault</h1>
              <span className="text-xs text-white/70 -mt-1 block" />
            </div>
          </div>

          {/* search - desktop only */}
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

            {/* suggestions dropdown desktop */}
            {searchQuery && suggestions.length > 0 && (
              <div className="absolute mt-2 w-full bg-black border border-white/20 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                {suggestions.slice(0, 8).map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center p-2 hover:bg-white/10 cursor-pointer"
                    onClick={() => {
                      router.push(`/product/${p.id}`);
                      setSearchQuery("");
                    }}
                  >
                    <Image src={p.image_url} alt={p.name} width={44} height={44} className="rounded" loading="lazy" sizes="44px" />
                    <div className="ml-3 flex-1">
                      <div className="text-white text-sm">{p.name}</div>
                      <div className="text-yellow-300 text-xs">${p.price?.toFixed(2)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* right: nav - desktop */}
          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
            <Link href="/account" className="hover:text-yellow-400">My Account</Link>
            <Link href="/wishlist" className="hover:text-yellow-400">Wishlist</Link>
            <Link href="/cart" className="hover:text-yellow-400">Cart</Link>
            <Link href="/order-history" className="hover:text-yellow-400">Orders</Link>
            <button onClick={handleLogout} className="bg-yellow-300 hover:bg-yellow-400 text-black px-4 py-2 rounded-md font-medium">Logout</button>
          </nav>

          {/* mobile icons (search + hamburger) */}
          <div className="md:hidden flex items-center gap-3">
            <button onClick={() => setShowMobileSearch(true)} aria-label="Search" className="p-1">
              <MagnifyingGlassIcon className="h-6 w-6 text-white" />
            </button>
            <button onClick={() => setMobileOpen((v) => !v)} aria-label="Menu" className="p-1">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* mobile dropdown menu (below header) */}
        {mobileOpen && (
          <div className="md:hidden mt-2 mx-auto w-[95%] bg-black/90 border border-white/20 rounded-xl p-4 space-y-3 text-center shadow-xl">
            <Link href="/account" className="block text-yellow-400">My Account</Link>
            <Link href="/wishlist" className="block text-yellow-400">Wishlist</Link>
            <Link href="/cart" className="block text-yellow-400">Cart</Link>
            <Link href="/order-history" className="block text-yellow-400">Orders</Link>
            <button onClick={handleLogout} className="bg-yellow-300 hover:bg-yellow-400 text-black px-4 py-2 rounded-md w-full">Logout</button>
          </div>
        )}
      </motion.header>

      {/* Mobile Search Overlay */}
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
            <button onClick={() => { setShowMobileSearch(false); setSearchQuery(""); }}>
              <XMarkIcon className="h-7 w-7 text-white" />
            </button>
          </div>

          <div className="mt-4 overflow-y-auto flex-1">
            {suggestions.length > 0 ? (
              suggestions.slice(0, 30).map((p) => (
                <div
                  key={p.id}
                  className="flex items-center p-3 rounded-md hover:bg-white/5 cursor-pointer"
                  onClick={() => {
                    router.push(`/product/${p.id}`);
                    setSearchQuery("");
                    setShowMobileSearch(false);
                  }}
                >
                  <Image src={p.image_url} alt={p.name} width={56} height={56} className="rounded" loading="lazy" sizes="56px" />
                  <div className="ml-3 flex-1">
                    <div className="text-white font-medium">{p.name}</div>
                    <div className="text-yellow-300 text-sm">${p.price?.toFixed(2)}</div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-white/60 text-center mt-10">No results found</p>
            )}
          </div>
        </div>
      )}

      {/* MAIN */}
      <main className="pt-32">
        {/* — Hero Section */}
        <section className="relative h-[500px] bg-cover bg-center" style={{ backgroundImage: `url('/vape_back.png')` }}>
          <div className="absolute inset-0 bg-black/50" />
          <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-6">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">Discover Your Next Favorite Vape</h1>
            <p className="text-lg text-gray-200 max-w-2xl mb-6">Premium vape products, stylish designs, and smooth flavors – all in one place.</p>
            <Link href="#shop">
              <button className="bg-yellow-300 hover:bg-yellow-400 text-black px-6 py-3 rounded-full">Browse Categories</button>
            </Link>
          </div>
        </section>

        {/* BrandPromise */}
        <section className="w-full py-0 bg-gray-900">
          <BrandPromise />
        </section>

        {/* Shop by Category */}
        <section id="shop" className="py-16">
          <h2 className="text-3xl sm:text-4xl font-semibold text-center text-yellow-300 mb-10">Shop by Category</h2>
          {/* MOBILE DEFAULT: 3 columns (grid-cols-3) as requested */}
          <div className="px-6 grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
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
                    sizes="(max-width: 640px) 32vw, (max-width: 1024px) 24vw, 200px"
                    loading="lazy"
                    className="object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/60 transition-colors" />
                  <span className="absolute bottom-4 left-4 text-white font-semibold text-lg">{cat.name}</span>
                </div>
              </FadeInOnScroll>
            ))}
          </div>
        </section>

        {/* Our Collection (Products) */}
        <section id="products" className="py-16">
          <h2 className="text-3xl sm:text-4xl font-semibold text-center text-yellow-300 mb-10">Our Collection</h2>

          {/* Use a container-level motion to reduce per-card animation overhead */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="px-6 grid grid-cols-3 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-8"
          >
            {products.map((p, idx) => (
              <FadeInOnScroll key={p.id}>
                <div
                  onClick={() => router.push(`/product/${p.id}`)}
                  className={`relative overflow-hidden rounded-2xl shadow-lg group transition-transform hover:scale-[1.03] ${idx === 0 ? "lg:col-span-2" : ""}`}
                >
                  <div className="w-full aspect-[4/3] relative bg-gray-800">
                    <Image
                      src={p.image_url}
                      alt={p.name}
                      fill
                      sizes="(max-width: 640px) 33vw, (max-width: 1024px) 30vw, 300px"
                      loading="lazy"
                      className="object-cover brightness-90 group-hover:brightness-100 transition"
                    />
                  </div>

                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 p-4 sm:p-6 flex flex-col justify-end">
                    <h4 className="text-base sm:text-2xl font-bold text-white uppercase tracking-wide drop-shadow-lg">{p.name}</h4>
                    <p className="mt-2 text-xs sm:text-sm text-white/80 line-clamp-2">{p.description}</p>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-sm sm:text-xl font-semibold text-yellow-300">${p.price?.toFixed(2)}</span>
                      <div className="flex items-center space-x-2">
                        {wishlistSet.has(p.id) ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeFromWishlist(p.id);
                            }}
                            disabled={processingId === p.id}
                          >
                            <HeartSolid className="h-5 w-5 sm:h-6 sm:w-6 text-red-500" />
                          </button>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              addToWishlist(p.id);
                            }}
                            disabled={processingId === p.id}
                          >
                            <HeartOutline className="h-5 w-5 sm:h-6 sm:w-6 text-white hover:text-red-500" />
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
                            <span className="text-white text-sm px-2">{cartMap[p.id]}</span>
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
                            className="bg-yellow-300 text-black px-3 py-1 rounded-full text-xs sm:text-sm font-medium hover:bg-yellow-400"
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
          </motion.div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
