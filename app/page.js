"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Head from "next/head";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import BrandPromise from "app/components/BrandPromise";
import SiteFooter from "./components/SiteFooter";

const products = [
  {
    id: 1,
    name: "Geek Bar Pulse X",
    description: "Massive vapor production with adjustable airflow",
    image: "/vape1.png",
    features: ["200W max power", "8ml tank capacity", "Triple mesh coils"],
  },
  {
    id: 2,
    name: "Flavor Master",
    description: "Enhanced flavor delivery system",
    image: "/vape3.png",
    features: ["Ceramic coils", "Precision temperature control", "5ml tank"],
  },
  {
    id: 3,
    name: "Drip'n EVO",
    description: "Ultra-portable and discreet",
    image: "/vape4.png",
    features: [
      "Pocket-sized design",
      "Leak-proof technology",
      "USB-C charging",
    ],
  },
];

export default function Landing() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [ageVerified, setAgeVerified] = useState(false);

  // search state + suggestions
  const [searchQuery, setSearchQuery] = useState("");
  const suggestions = products.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        router.push("/home");
      } else {
        setLoading(false);
      }
    });
  }, [router]);

  // always prompt on full reload
  const handleAgeConfirm = () => {
    setAgeVerified(true);
  };

  if (loading) {
    return <div className="p-10 text-center text-lg">Checking session...</div>;
  }

  if (!ageVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black bg-opacity-90 text-white">
        <div className="text-center space-y-4 p-6 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg shadow-lg">
          <h2 className="text-3xl font-bold">Are you 19 or older?</h2>
          <p>You must be of legal age to view this site.</p>
          <button
            onClick={handleAgeConfirm}
            className="bg-yellow-400 text-black px-6 py-2 rounded hover:bg-yellow-500 transition"
          >
            Yes, I am
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white font-sans flex flex-col scroll-smooth">
      <Head>
        <title>Vape Vault – Premium Vape Devices</title>
        <meta
          name="description"
          content="Discover premium vape products at Vape Vault – stylish, powerful, and built for your lifestyle."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="canonical" href="https://yourdomain.com/" />
        <meta name="robots" content="index, follow" />
      </Head>

      {/* Header */}
      <header className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 bg-white/10 backdrop-blur-lg border border-white/20 px-8 py-4 shadow-2xl rounded-2xl w-[92%] max-w-6xl">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          {/* Logo + Search */}
          <div className="flex items-center space-x-4 w-full md:w-auto">
            <Link
              href="/"
              className="flex items-center space-x-3"
              aria-label="Home"
            >
              <Image
                src="/Logo.png"
                alt="Vape Vault Logo"
                width={60}
                height={60}
              />
              <h1 className="text-3xl font-bold text-yellow-300">Vape Vault</h1>
            </Link>
            {/* <div className="relative w-full max-w-xs">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/60" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-full border border-white/30 bg-white/10 px-10 py-2 text-sm text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-yellow-400 backdrop-blur-sm"
              />
              {searchQuery && suggestions.length > 0 && (
                <ul className="absolute top-full mt-2 w-full bg-white/10 backdrop-blur-md border border-white/20 rounded-lg shadow-lg max-h-60 overflow-y-auto z-50">
                  {suggestions.slice(0, 5).map((prod) => (
                    <li
                      key={prod.id}
                      onClick={() => router.push(`/product/${prod.id}`)}
                      className="px-4 py-2 hover:bg-white/20 cursor-pointer text-white"
                    >
                      {prod.name}
                    </li>
                  ))}
                </ul>
              )}
            </div> */}
          </div>

          <nav className="space-x-6 text-lg flex items-center justify-center md:justify-end w-full md:w-auto">
            <Link
              href="/signin"
              className="text-yellow-400 hover:text-yellow-300 transition"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="text-yellow-400 hover:text-yellow-300 transition"
            >
              Sign Up
            </Link>
            <Link
              href="#products"
              className="text-white hover:text-gray-300 transition"
            >
              Products
            </Link>
            <Link
              href="#about"
              className="text-white hover:text-gray-300 transition"
            >
              About
            </Link>
            <Link
              href="#contact"
              className="text-white hover:text-gray-300 transition"
            >
              Contact
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <main className="relative pt-52 px-6 pb-20 text-center flex-1 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url('/vape_back.png')` }}
        />
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10 mx-auto max-w-4xl p-8 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 shadow-lg">
          <h2 className="text-5xl font-bold mb-6 text-white drop-shadow-lg">
            Discover Your Next Favorite Vape
          </h2>
          <p className="text-xl text-white max-w-2xl mx-auto mb-8">
            Premium vape products, stylish designs, and smooth flavors – all in
            one place.
          </p>
          <Link href="#products">
            <button
              className="bg-yellow-300 hover:bg-yellow-400 px-6 py-3 rounded-full text-lg font-medium text-black transition"
              aria-label="Browse Products"
            >
              Browse Products
            </button>
          </Link>
        </div>
      </main>

      {/* Brand Promise */}
      <section className="pt-8">
        <BrandPromise />
      </section>

      {/* Products */}
      <section id="products" className="px-6 py-16">
        <div className="max-w-7xl mx-auto">
          <h3 className="text-4xl font-semibold text-center mb-4 text-yellow-300">
            Our Collection
          </h3>
          <p className="text-center text-gray-300 mb-12 max-w-2xl mx-auto">
            Carefully curated selection of premium vaping devices
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map((product) => (
              <div
                key={product.id}
                className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-lg hover:shadow-2xl transition-all flex flex-col"
              >
                <div className="relative h-64 bg-gray-100">
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-contain p-6 transition-transform duration-300 hover:scale-105"
                  />
                </div>
                <div className="p-6 flex flex-col flex-1">
                  <h4 className="text-2xl font-bold mb-2 text-white">
                    {product.name}
                  </h4>
                  <p className="text-white/80 mb-2">{product.description}</p>
                  <ul className="text-white/70 text-sm mb-6 space-y-1 flex-1">
                    {product.features.map((feature, i) => (
                      <li key={i} className="flex items-center">
                        <svg
                          className="w-4 h-4 mr-2 text-yellow-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Link href={`/product/${product.id}`}>
                    <button
                      className="mt-auto w-full bg-yellow-300 hover:bg-yellow-400 text-black py-3 rounded-lg font-medium transition"
                      aria-label={`View details about ${product.name}`}
                    >
                      View Details
                    </button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section
        id="about"
        className="px-6 py-5 text-center bg-white/10 backdrop-blur-md"
      >
        <h3 className="text-4xl font-semibold mb-6 text-yellow-300">
          About Vape Vault
        </h3>
        <p className="max-w-3xl mx-auto text-white/80 text-lg">
          At Vape Vault, we’re passionate about providing the best vaping
          experience. Our products are tested, stylish, and built for your
          lifestyle.
        </p>
      </section>

      {/* Contact */}

      <SiteFooter />
    </div>
  );
}
