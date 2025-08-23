// app/signin/page.js
"use client";

import { useState, Suspense } from "react";
import SigninForm from "./SigninForm";
import Link from "next/link";

export default function SigninPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white flex flex-col">
      {/* Header */}
      <header className="flex justify-center items-center px-6 py-4 border-b border-white/10 bg-white/10 backdrop-blur-md">
        <Link href="/" className="flex items-center space-x-3">
          <img src="/Logo.png" alt="Vape Vault Logo" className="w-20 h-20" />
          <h1 className="text-3xl font-bold text-yellow-300">Vape Vault</h1>
        </Link>
      </header>

      {/* Form */}
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <Suspense fallback={<div>Loading form…</div>}>
          <SigninForm />
        </Suspense>
      </main>

      {/* Footer */}
      <footer className="bg-white/10 backdrop-blur-md text-white/60 text-center p-6 text-sm border-t border-white/10">
        &copy; {new Date().getFullYear()} Vape Vault. All rights reserved.
      </footer>
    </div>
  );
}
