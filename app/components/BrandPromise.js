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
    <section
      className="py-10 sm:py-16 px-3 sm:px-6 lg:px-8 border-t border-white/20"
      style={{ backgroundColor: "#121827" }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Section Title */}
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-xl sm:text-3xl lg:text-4xl font-extrabold text-yellow-400">
            OUR COMMITMENT TO EXCELLENCE
          </h2>
          <div className="mt-2 sm:mt-3 h-1 w-16 sm:w-24 bg-yellow-400 mx-auto rounded-full" />
        </div>

        {/* Features Grid - always 3 columns */}
        <div className="grid grid-cols-3 gap-3 sm:gap-6 md:gap-8">
          {features.map(({ title, Icon, desc }) => (
            <div
              key={title}
              className="group bg-white/10 backdrop-blur-lg border border-white/20 p-4 sm:p-6 lg:p-8 rounded-xl shadow-md hover:shadow-xl transform transition hover:scale-105 text-center"
            >
              <div className="bg-yellow-400 p-2 sm:p-4 rounded-full mb-3 sm:mb-4 inline-block transition group-hover:rotate-12">
                <Icon className="h-5 w-5 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-white" />
              </div>
              <h3 className="text-sm sm:text-lg lg:text-xl font-semibold text-white mb-1 sm:mb-2">
                {title}
              </h3>
              <p className="text-white/80 sm:text-white/90 leading-relaxed text-xs sm:text-sm lg:text-base">
                {desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
