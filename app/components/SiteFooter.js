// app/components/SiteFooter.js
import Link from "next/link";
import { Github, Instagram, MessageCircle } from "lucide-react";

export default function SiteFooter() {
  return (
    <footer
      className="text-white/70 border-t border-white/10"
      style={{ backgroundColor: "#131826" }}
    >
      {/* Top section */}
      <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 px-4 md:px-6 py-8 md:py-12">
        <div>
          <h4 className="text-base md:text-lg font-semibold mb-2 md:mb-3 text-white">
            Company
          </h4>
          <ul className="space-y-1.5 md:space-y-2 text-sm md:text-base">
            <li>
              <Link href="/about" className="hover:text-yellow-400 transition">
                About Us
              </Link>
            </li>
            <li>
              <Link href="/careers" className="hover:text-yellow-400 transition">
                Careers
              </Link>
            </li>
            <li>
              <Link href="/press" className="hover:text-yellow-400 transition">
                Press
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-base md:text-lg font-semibold mb-2 md:mb-3 text-white">
            Support
          </h4>
          <ul className="space-y-1.5 md:space-y-2 text-sm md:text-base">
            <li>
              <Link href="/help" className="hover:text-yellow-400 transition">
                Help Center
              </Link>
            </li>
            <li>
              <Link href="/faq" className="hover:text-yellow-400 transition">
                FAQ
              </Link>
            </li>
            <li>
              <Link
                href="/contact"
                className="hover:text-yellow-400 transition"
              >
                Contact Us
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-base md:text-lg font-semibold mb-2 md:mb-3 text-white">
            Legal
          </h4>
          <ul className="space-y-1.5 md:space-y-2 text-sm md:text-base">
            <li>
              <Link href="/terms" className="hover:text-yellow-400 transition">
                Terms &amp; Conditions
              </Link>
            </li>
            <li>
              <Link href="/privacy" className="hover:text-yellow-400 transition">
                Privacy Policy
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-base md:text-lg font-semibold mb-2 md:mb-3 text-white">
            Follow Us
          </h4>
          <div className="flex items-center gap-3 md:gap-4">
            <a
              href="https://wa.me/14036901169"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-green-400 transition"
              aria-label="WhatsApp"
            >
              <MessageCircle className="h-5 w-5 md:h-6 md:w-6" />
            </a>
            <a
              href="https://github.com/karan-sidhu22"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-yellow-400 transition"
              aria-label="GitHub"
            >
              <Github className="h-5 w-5 md:h-6 md:w-6" />
            </a>
            <a
              href="https://www.instagram.com/855_harkaran/?next=%2F"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-yellow-400 transition"
              aria-label="Instagram"
            >
              <Instagram className="h-5 w-5 md:h-6 md:w-6" />
            </a>
          </div>
        </div>
      </div>

      {/* Bottom section */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-6 text-center">
          <p className="text-xs md:text-sm text-white/80 tracking-wide">
            © {new Date().getFullYear()} Vape-SPA. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
