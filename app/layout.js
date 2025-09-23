import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
  ), // ✅ Fixes OpenGraph warning
  title: "Vape Vault – Premium Vape Devices",
  description:
    "Discover premium vape products at Vape Vault – stylish, powerful, and built for your lifestyle.",
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
  openGraph: {
    title: "Vape Vault",
    description:
      "Premium vape products, stylish designs, and smooth flavors – all in one place.",
    url: "https://yourdomain.com",
    siteName: "Vape Vault",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "Vape Vault Logo",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Vape Vault",
    description:
      "Discover premium vape products at Vape Vault – stylish, powerful, and built for your lifestyle.",
    images: ["/logo.png"],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        {/* Google Maps & Places Autocomplete */}
        <script
          src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`}
          async
        />
        {/* ✅ Manifest for PWA / mobile support (make sure public/site.webmanifest exists) */}
        <link rel="manifest" href="/site.webmanifest" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#131826] text-white min-h-screen flex flex-col`}
      >
        {children}
      </body>
    </html>
  );
}
