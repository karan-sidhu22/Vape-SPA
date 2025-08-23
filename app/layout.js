import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Vape Vault", // ← whatever you want the tab text to be
  description: "Your one‑stop vape shop",
  icons: {
    icon: "/logo.png", // this will be used as your favicon
    shortcut: "/logo.png", // for browsers that look for shortcut icon
    apple: "/logo.png", // for iOS home‑screen icon
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* load Maps + Places Autocomplete */}
        <script
          src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`}
          async
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
