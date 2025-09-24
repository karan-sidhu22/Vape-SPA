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
      className="py-20 px-4 sm:px-6 lg:px-8 border-t border-white/20"
      style={{ backgroundColor: "#121827" }}
    >
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
