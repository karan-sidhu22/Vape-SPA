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
      desc: "Love it or return it — your happiness is our promise. Enjoy risk-free shopping with our satisfaction guarantee.",
    },
  ];

  return (
    <section
      className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 border-t border-white/20"
      style={{ backgroundColor: "#121827" }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Title */}
        <div className="text-center mb-10 sm:mb-12 px-2">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-yellow-400">
            OUR COMMITMENT TO EXCELLENCE
          </h2>
          <div className="mt-2 h-1 w-16 sm:w-20 lg:w-24 bg-yellow-400 mx-auto rounded-full" />
        </div>

        {/* Grid of features */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {features.map(({ title, Icon, desc }) => (
            <div
              key={title}
              className="group bg-white/10 backdrop-blur-lg border border-white/20 p-6 sm:p-8 rounded-2xl shadow-md hover:shadow-lg transform transition hover:scale-105 flex flex-col items-center text-center"
            >
              <div className="bg-yellow-400 p-3 sm:p-4 rounded-full mb-4 inline-block transition group-hover:rotate-12">
                <Icon className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-white mb-2">
                {title}
              </h3>
              <p className="text-white/80 text-sm sm:text-base leading-relaxed">
                {desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
