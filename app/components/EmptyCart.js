import { useRouter } from 'next/navigation';

export default function EmptyCart() {
  const router = useRouter();

  return (
    <div className="ml-147 justify-items-center text-center py-16 px-6 bg-white/5 backdrop-blur-md border border-white/20 rounded-xl shadow-lg text-white max-w-xl mx-auto">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-20 w-20 mx-auto text-white/60"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1}
          d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
        />
      </svg>
      <h2 className="text-2xl font-semibold mt-4 text-white">Your cart is empty</h2>
      <p className="text-white/80 mt-2">
        Looks like you haven't added anything to your cart yet
      </p>
      <button
        onClick={() => router.push('/')}
        className="mt-6 inline-block bg-yellow-400 hover:bg-yellow-500 text-black px-6 py-2 rounded-lg font-medium transition"
      >
        Browse Products
      </button>
    </div>
  );
}
