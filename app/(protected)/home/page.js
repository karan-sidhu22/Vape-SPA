// app/(protected)/home/page.js
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
import BrandPromise from "app/components/BrandPromise";
import SiteFooter from "app/components/SiteFooter";

// FadeInOnScroll — wraps children and fades them in when scrolled into view
function FadeInOnScroll({ children }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVisible(true);
          obs.unobserve(ref.current);
        }
      },
      { threshold: 0.1 }
    );
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      }`}
    >
      {children}
    </div>
  );
}

export default function Home() {
  const router = useRouter();

  // — auth & loading
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // — role check for Admin link
  const [userRole, setUserRole] = useState(null);

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

  // — session check
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.replace("/signin");
      } else {
        setUser(data.session.user);
        // fetch user role
        supabase
          .from("users")
          .select("role")
          .eq("id", data.session.user.id)
          .single()
          .then(({ data: d }) => {
            if (d?.role) setUserRole(d.role);
          });
      }
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_, sess) => {
      if (!sess) {
        router.replace("/signin");
      } else {
        setUser(sess.user);
        supabase
          .from("users")
          .select("role")
          .eq("id", sess.user.id)
          .single()
          .then(({ data: d }) => {
            if (d?.role) setUserRole(d.role);
          });
      }
    });
    return () => sub?.subscription.unsubscribe();
  }, [router]);

  // — fetch products & categories
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

  // — fetch cart & wishlist
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

  // — wishlist ops
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

  // — dropdown logic
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
      {/* ——— Header ——— */}
      <header className="fixed inset-x-0 top-4 z-50 px-4">
        <div className="mx-auto w-full max-w-[1600px] bg-black/60 backdrop-blur-lg border border-white/20 rounded-3xl flex items-center justify-between px-8 py-4 shadow-2xl">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <Image src="/Logo.png" width={60} height={60} alt="Vape Vault" />
            <h1 className="text-2xl font-bold text-yellow-300">Vape Vault</h1>
          </div>

          {/* Search + Filters */}
          <div className="relative flex-1 max-w-lg mx-4">
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

            {/* Filter Menu */}
            {showFilterMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-black text-white border border-white/30 rounded-xl p-4 z-60 shadow-xl">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full mb-2 rounded bg-black border border-white/20 p-2 text-sm"
                >
                  <option value="">Sort by…</option>
                  <option value="priceAsc">Price: Low → High</option>
                  <option value="priceDesc">Price: High → Low</option>
                  <option value="nameAsc">Name: A → Z</option>
                  <option value="nameDesc">Name: Z → A</option>
                </select>
                <select
                  value={categoryFilter}
                  onChange={(e) => {
                    setCategoryFilter(e.target.value);
                    setBrandFilter("");
                  }}
                  className="w-full mb-2 rounded bg-black border border-white/20 p-2 text-sm"
                >
                  <option value="">All Categories</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <select
                  value={brandFilter}
                  onChange={(e) => setBrandFilter(e.target.value)}
                  className="w-full rounded bg-black border border-white/20 p-2 text-sm"
                >
                  <option value="">All Brands</option>
                  {brandOptions.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Suggestions Dropdown */}
            {searchQuery && suggestions.length > 0 && (
              <div className="absolute mt-2 w-full bg-black border border-white/20 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                {suggestions.slice(0, 5).map((p) => (
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
                      width={40}
                      height={40}
                      className="rounded"
                    />
                    <div className="ml-3 flex-1">
                      <div className="text-white">{p.name}</div>
                      <div className="text-yellow-300 text-sm">
                        ${p.price.toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Nav */}
          <nav className="flex items-center space-x-8 text-lg">
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
              Order History
            </Link>
            {/* only show for admins */}
            {userRole === "admin" && (
              <Link href="/admin" className="hover:text-yellow-400 text-lg">
                Admin Dashboard
              </Link>
            )}
            <button
              onClick={handleLogout}
              className="bg-yellow-300 hover:bg-yellow-400 text-black px-4 py-2 rounded-md font-medium"
            >
              Logout
            </button>
          </nav>
        </div>
      </header>

      <main className="pt-32">
        {/* — Hero Section */}
        <section
          className="relative h-[500px] bg-cover bg-center"
          style={{ backgroundImage: `url('/vape_back.png')` }}
        >
          <div className="absolute inset-0 bg-black/50" />
          <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-6">
            <h1 className="text-5xl font-bold text-white mb-4">
              Discover Your Next Favorite Vape
            </h1>
            <p className="text-lg text-gray-200 max-w-2xl mb-6">
              Premium vape products, stylish designs, and smooth flavors – all
              in one place.
            </p>
            <Link href="#shop">
              <button className="bg-yellow-300 hover:bg-yellow-400 text-black px-6 py-3 rounded-full">
                Browse Categories
              </button>
            </Link>
          </div>
        </section>

        {/* — BrandPromise (full width) */}
        <section className="w-full py-16 bg-gray-900">
          <BrandPromise />
        </section>

        {/* — Shop by Category (full width, larger cards) */}
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

        {/* — Our Collection (full width, larger cards) */}
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
                            className="p-1 rounded-full bg-white/20 hover:bg-white/30 transition"
                          >
                            <HeartSolid className="h-5 w-5 text-yellow-300" />
                          </button>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              addToWishlist(p.id);
                            }}
                            disabled={processingId === p.id}
                            className="p-1 rounded-full bg-white/20 hover:bg-white/30 transition"
                          >
                            <HeartOutline className="h-5 w-5 text-yellow-300" />
                          </button>
                        )}
                        {cartMap[p.id] ? (
                          <div className="flex items-center space-x-1 bg-white/20 rounded-full px-2 py-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                updateCartQty(p.id, -1);
                              }}
                            >
                              <MinusIcon className="h-4 w-4 text-white" />
                            </button>
                            <span className="px-2 text-white">
                              {cartMap[p.id]}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                updateCartQty(p.id, +1);
                              }}
                            >
                              <PlusIcon className="h-4 w-4 text-white" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              addToCart(p.id);
                            }}
                            disabled={processingId === p.id}
                            className="bg-yellow-300 hover:bg-yellow-400 text-black px-3 py-1 rounded-full text-sm font-medium transition"
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

      {/* — Footer */}
      <SiteFooter />
    </div>
  );
}
