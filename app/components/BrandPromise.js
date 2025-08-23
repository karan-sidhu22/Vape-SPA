// "use client";

// import { useEffect, useState } from "react";
// import Image from "next/image";
// import Link from "next/link";
// import Head from "next/head";
// import { useRouter } from "next/navigation";
// import { supabase } from "@/lib/supabaseClient";

// const BrandPromise = () => (
//   <section className="bg-gradient-to-br from-gray-900 via-gray-800 to-black py-16 px-4 sm:px-6 lg:px-8 border-t border-white/10">
//     <div className="max-w-7xl mx-auto">
//       <div className="text-center mb-12">
//         <h2 className="text-3xl font-extrabold text-yellow-300 sm:text-4xl">
//           OUR COMMITMENT TO EXCELLENCE
//         </h2>
//         <div className="mt-3 h-1 w-20 bg-yellow-500 mx-auto rounded-full"></div>
//       </div>

//       <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
//         {/* Quality Products */}
//         <div className="bg-white/10 backdrop-blur-md border border-white/20 p-8 rounded-xl shadow-lg hover:shadow-2xl transition-all flex flex-col items-center text-center">
//           <div className="bg-yellow-100 p-4 rounded-full mb-4">
//             <svg className="h-8 w-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
//             </svg>
//           </div>
//           <h3 className="text-lg font-semibold text-white mb-2">PREMIUM QUALITY</h3>
//           <p className="text-white/80">
//             We strive to serve our customers with the highest quality products.
//             Every item is carefully selected to meet strict standards.
//           </p>
//         </div>

//         {/* Customer Service */}
//         <div className="bg-white/10 backdrop-blur-md border border-white/20 p-8 rounded-xl shadow-lg hover:shadow-2xl transition-all flex flex-col items-center text-center">
//           <div className="bg-yellow-100 p-4 rounded-full mb-4">
//             <svg className="h-8 w-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
//             </svg>
//           </div>
//           <h3 className="text-lg font-semibold text-white mb-2">WORLD-CLASS SUPPORT</h3>
//           <p className="text-white/80">
//             Our specialists provide exceptional service and expert advice
//             to ensure you get the perfect vaping experience.
//           </p>
//         </div>

//         {/* Satisfaction */}
//         <div className="bg-white/10 backdrop-blur-md border border-white/20 p-8 rounded-xl shadow-lg hover:shadow-2xl transition-all flex flex-col items-center text-center">
//           <div className="bg-yellow-100 p-4 rounded-full mb-4">
//             <svg className="h-8 w-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
//             </svg>
//           </div>
//           <h3 className="text-lg font-semibold text-white mb-2">100% SATISFACTION</h3>
//           <p className="text-white/80">
//             With premium products, our customers leave happy and satisfied.
//             Your satisfaction is our top priority.
//           </p>
//         </div>
//       </div>
//     </div>
//   </section>
// );

// export default BrandPromise;
// app/components/BrandPromise.js
"use client";

import React from "react";
import {
  BoltIcon,
  PhoneIcon,
  FaceSmileIcon,
} from "@heroicons/react/24/outline";

export default function BrandPromise() {
  const features = [
    {
      title: "PREMIUM QUALITY",
      Icon: BoltIcon,
      desc: "We hand-select only the finest vape devices and e-liquids, ensuring every product meets our rigorous quality standards.",
    },
    {
      title: "WORLD-CLASS SUPPORT",
      Icon: PhoneIcon,
      desc: "Our dedicated team is here 24/7 to answer your questions and guide you to the perfect setup.",
    },
    {
      title: "100% SATISFACTION",
      Icon: FaceSmileIcon,
      desc: "Love it or return it—your happiness is our promise. Enjoy risk-free shopping with our satisfaction guarantee.",
    },
  ];

  return (
    <section className="bg-gradient-to-br from-gray-900 via-gray-800 to-black py-20 px-4 sm:px-6 lg:px-8 border-t border-white/20">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-yellow-400">
            OUR COMMITMENT TO EXCELLENCE
          </h2>
          <div className="mt-3 h-1 w-24 bg-yellow-400 mx-auto rounded-full" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map(({ title, Icon, desc }) => (
            <div
              key={title}
              className="group bg-white/20 backdrop-blur-lg border border-white/30 p-8 rounded-2xl shadow-lg transform transition hover:scale-105"
            >
              <div className="bg-yellow-400 p-5 rounded-full mb-4 inline-block transition group-hover:rotate-12">
                <Icon className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
              <p className="text-white/90 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
