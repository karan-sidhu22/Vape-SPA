'use client';

import Image from 'next/image';
import Link from 'next/link';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [user, setUser] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setUser(data.session.user);
    });
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  return (
    <header className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 bg-white/10 backdrop-blur-md border border-white/20 px-6 py-4 shadow-xl rounded-3xl w-[90%] max-w-7xl">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div className="flex items-center justify-center md:justify-start w-full md:w-auto">
          <Link href="/" className="flex items-center space-x-3">
            <Image src="/Logo.png" alt="Vape Vault Logo" width={60} height={60} />
            <h1 className="text-2xl font-bold text-yellow-300">Vape Vault</h1>
          </Link>
        </div>

        

        <nav className="space-x-6 text-lg flex items-center justify-center md:justify-end w-full md:w-auto">
          <Link href="/account" className="hover:text-yellow-400">My Account</Link>
          <Link href="/wishlist" className="hover:text-yellow-400">Wishlist</Link>
          <Link href="/cart" className="hover:text-yellow-400">Cart</Link>
          {user && (
            <button
              onClick={handleLogout}
              className="bg-yellow-300 hover:bg-yellow-400 text-black px-4 py-2 rounded-full font-medium shadow-sm"
            >
              Logout
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
