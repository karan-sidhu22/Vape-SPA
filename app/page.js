"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Head from "next/head";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import BrandPromise from "app/components/BrandPromise";
import SiteFooter from "./components/SiteFooter";
import { motion } from "framer-motion";

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
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        router.push("/home");
      } else {
        setLoading(false);
      }
    });
  }, [router]);

  const handleAgeConfirm = () => {
    setAgeVerified(true);
  };

  if (loading) {
    return <div className="p-10 text-center text-lg">Checking session...</div>;
  }

  if (!ageVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black bg-opacity-90 text-white px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="text-center space-y-4 p-6 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg shadow-lg w-full max-w-sm"
        >
          <h2 className="text-2xl font-bold sm:text-3xl">Are you 18 or older?</h2>
          <p className="text-white/80">You must be of legal age to view this site.</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleAgeConfirm}
            className="bg-yellow-400 text-black px-6 py-3 rounded-lg w-full font-semibold hover:bg-yellow-500 transition"
          >
            Yes, I am
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen text-white font-sans flex flex-col scroll-smooth"
      style={{ backgroundColor: "#131826" }}
    >
      <Head>
        <title>Vape Vault – Premium Vape Devices</title>
        <meta
          name="description"
          content="Discover premium vape products at Vape Vault – stylish, powerful, and built for your lifestyle."
        />
      </Head>

      {/* Header */}
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="fixed top-3 left-1/2 transform -translate-x-1/2 z-50 bg-white/10 backdrop-blur-lg border border-white/20 px-4 py-2 sm:px-6 sm:py-3 shadow-2xl rounded-xl w-[94%] max-w-6xl"
      >
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 sm:space-x-3">
            <Image
              src="/Logo.png"
              alt="Vape Vault Logo"
              width={40}
              height={40}
              className="sm:w-[55px] sm:h-[55px]"
            />
            <h1 className="text-xl sm:text-2xl font-bold text-yellow-300">
              Vape Vault
            </h1>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex space-x-6 text-base sm:text-lg">
            <Link href="/signin" className="text-yellow-400 hover:text-yellow-300">
              Sign In
            </Link>
            <Link href="/signup" className="text-yellow-400 hover:text-yellow-300">
              Sign Up
            </Link>
            <Link href="#products" className="text-white hover:text-gray-300">
              Products
            </Link>
            <Link href="#about" className="text-white hover:text-gray-300">
              About
            </Link>
            <Link href="#contact" className="text-white hover:text-gray-300">
              Contact
            </Link>
          </nav>

          {/* Mobile Hamburger */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="text-white focus:outline-none"
            >
              <svg
                className="w-7 h-7"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden mt-3 bg-black/90 border border-white/20 rounded-xl p-5 space-y-4 text-center shadow-lg"
          >
            <Link href="/signin" className="block text-yellow-400 hover:text-yellow-300">
              Sign In
            </Link>
            <Link href="/signup" className="block text-yellow-400 hover:text-yellow-300">
              Sign Up
            </Link>
            <hr className="border-white/10" />
            <Link href="#products" className="block text-white hover:text-gray-300">
              Products
            </Link>
            <Link href="#about" className="block text-white hover:text-gray-300">
              About
            </Link>
            <Link href="#contact" className="block text-white hover:text-gray-300">
              Contact
            </Link>
          </motion.div>
        )}
      </motion.header>

      {/* Hero */}
      <main className="relative pt-44 sm:pt-52 px-5 pb-20 text-center flex-1 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url('/vape_back.png')` }}
        />
        <div className="absolute inset-0 bg-black/50" />
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 mx-auto max-w-3xl sm:max-w-4xl p-6 sm:p-8 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 shadow-lg"
        >
          <h2 className="text-3xl sm:text-5xl font-bold mb-4 sm:mb-6 text-white drop-shadow-lg">
            Discover Your Next Favorite Vape
          </h2>
          <p className="text-base sm:text-xl text-white/90 max-w-2xl mx-auto mb-6 sm:mb-8">
            Premium vape products, stylish designs, and smooth flavors – all in one place.
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() =>
              document.getElementById("products")?.scrollIntoView({ behavior: "smooth" })
            }
            className="bg-yellow-300 hover:bg-yellow-400 px-6 py-3 rounded-full text-base sm:text-lg font-medium text-black transition w-full sm:w-auto"
          >
            Browse Products
          </motion.button>
        </motion.div>
      </main>

      <div className="border-t border-white/10 w-full" />

      {/* Brand Promise */}
      <motion.section
        id="brand"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
        className="pt-0"
      >
        <BrandPromise />
      </motion.section>

      <div className="border-t border-white/10 w-full" />

      {/* Products */}
      <section id="products" className="px-5 py-16">
        <div className="max-w-7xl mx-auto">
          <motion.h3
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-3xl sm:text-4xl font-semibold text-center mb-4 text-yellow-300"
          >
            Our Collection
          </motion.h3>
          <p className="text-center text-gray-300 mb-10 sm:mb-12 max-w-2xl mx-auto text-sm sm:text-base">
            Carefully curated selection of premium vaping devices
          </p>
          <motion.div
            className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-8"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.2 } } }}
          >
            {products.map((product) => (
              <motion.div
                key={product.id}
                variants={{
                  hidden: { opacity: 0, y: 40 },
                  show: { opacity: 1, y: 0 },
                }}
                transition={{ duration: 0.6 }}
                className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg sm:rounded-xl shadow-lg hover:shadow-2xl transition-all flex flex-col"
              >
                <div className="relative h-44 sm:h-64 bg-gray-100">
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-contain p-4 sm:p-6 transition-transform duration-300 hover:scale-105"
                  />
                </div>
                <div className="p-4 sm:p-6 flex flex-col flex-1">
                  <h4 className="text-lg sm:text-2xl font-bold mb-1 sm:mb-2 text-white">
                    {product.name}
                  </h4>
                  <p className="text-white/80 mb-2 text-sm sm:text-base">{product.description}</p>
                  <ul className="text-white/70 text-xs sm:text-sm mb-4 sm:mb-6 space-y-1 flex-1">
                    {product.features.map((feature, i) => (
                      <li key={i} className="flex items-center">
                        <svg
                          className="w-3 sm:w-4 h-3 sm:h-4 mr-2 text-yellow-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => router.push(`/signin?redirect=/product/${product.id}`)}
                    className="mt-auto w-full bg-yellow-300 hover:bg-yellow-400 text-black py-2 sm:py-3 rounded-md sm:rounded-lg font-medium transition text-sm sm:text-base"
                  >
                    View Details
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <div className="border-t border-white/10 w-full" />

      {/* About */}
      <motion.section
        id="about"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
        className="px-5 py-10 sm:py-14 text-center"
      >
        <h3 className="text-3xl sm:text-4xl font-semibold mb-4 sm:mb-6 text-yellow-300">
          About Vape Vault
        </h3>
        <p className="max-w-3xl mx-auto text-white/80 text-base sm:text-lg leading-relaxed">
          At Vape Vault, we’re passionate about providing the best vaping
          experience. Our products are tested, stylish, and built for your lifestyle.
        </p>
      </motion.section>

      <div className="border-t border-white/10 w-full" />

      {/* Contact / Footer */}
      <section id="contact">
        <SiteFooter />
      </section>
    </div>
  );
}
