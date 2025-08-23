// app/(protected)/account/page.js
"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import Header from "app/components/Header";
import SiteFooter from "app/components/SiteFooter";
import AddressAutocomplete from "app/components/AddressAutocomplete";

export default function MyAccountPage() {
  const router = useRouter();

  // ── User & Profile State ──
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState({
    full_name: "",
    email: "",
    phone_number: "",
    address: "",
  });
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);

  // ── Map & Geocoding State ──
  const [mapScriptLoaded, setMapScriptLoaded] = useState(false);
  const [lastPlace, setLastPlace] = useState(null);

  // ── Map Refs ──
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markerRef = useRef(null);

  // 1️⃣ Load current user & profile
  useEffect(() => {
    (async () => {
      const { data: { user: currentUser } = {}, error: userErr } =
        await supabase.auth.getUser();
      if (userErr || !currentUser) {
        router.push("/signin");
        return;
      }
      setUser(currentUser); // fixed typo here

      const { data: userProfile, error: profErr } = await supabase
        .from("users")
        .select("full_name, email, phone_number, address")
        .eq("id", currentUser.id)
        .single();
      if (profErr) console.error("Profile fetch:", profErr.message);

      setProfile({
        full_name:
          userProfile?.full_name || currentUser.user_metadata?.full_name || "",
        email: userProfile?.email || currentUser.email || "",
        phone_number: userProfile?.phone_number || "",
        address: userProfile?.address || "",
      });

      setLoading(false);
    })();
  }, [router]);

  // 2️⃣ Load Google Maps JS once
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.google?.maps) {
      setMapScriptLoaded(true);
      return;
    }
    const existing = document.querySelector(
      'script[src*="maps.googleapis.com"]'
    );
    if (existing) {
      existing.addEventListener("load", () => setMapScriptLoaded(true));
      if (window.google?.maps) setMapScriptLoaded(true);
      return;
    }
    const tag = document.createElement("script");
    tag.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY}&libraries=places`;
    tag.async = true;
    tag.onload = () => setMapScriptLoaded(true);
    document.head.appendChild(tag);
  }, []);

  // 3️⃣ Geocode saved address on load, and always update on valid selection
  useEffect(() => {
    if (!mapScriptLoaded) return;

    if (!profile.address) {
      setLastPlace(null);
      return;
    }
    if (lastPlace?.formatted_address === profile.address) {
      return;
    }

    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ address: profile.address }, (results, status) => {
      if (status === "OK" && results[0]) {
        setLastPlace(results[0]);
      } else if (status !== "ZERO_RESULTS") {
        console.error("Geocode error:", status);
      }
    });
  }, [mapScriptLoaded, profile.address, lastPlace]);

  // 4️⃣ Initialize or reinitialize map when we get a new place
  useEffect(() => {
    if (!mapScriptLoaded || !lastPlace || !mapRef.current) return;

    const center = {
      lat: lastPlace.geometry.location.lat(),
      lng: lastPlace.geometry.location.lng(),
    };

    if (!mapInstance.current) {
      mapInstance.current = new window.google.maps.Map(mapRef.current, {
        center,
        zoom: 15,
      });
      markerRef.current = new window.google.maps.Marker({
        position: center,
        map: mapInstance.current,
      });
    } else {
      mapInstance.current.setCenter(center);
      markerRef.current.setPosition(center);
    }
  }, [mapScriptLoaded, lastPlace]);

  // Handlers
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);

    if (
      profile.address &&
      (!lastPlace || lastPlace.formatted_address !== profile.address)
    ) {
      alert("Please select your address from the suggestions.");
      setSaving(false);
      return;
    }

    const authUpdates = {};
    if (profile.full_name !== user.user_metadata?.full_name) {
      authUpdates.data = { full_name: profile.full_name };
    }
    if (password) authUpdates.password = password;

    if (Object.keys(authUpdates).length) {
      const { error: authErr } = await supabase.auth.updateUser(authUpdates);
      if (authErr) {
        alert("Auth error: " + authErr.message);
        setSaving(false);
        return;
      }
    }

    const { error: dbErr } = await supabase.from("users").upsert([
      {
        id: user.id,
        full_name: profile.full_name,
        email: profile.email,
        phone_number: profile.phone_number,
        address: profile.address,
      },
    ]);
    if (dbErr) {
      alert("DB error: " + dbErr.message);
    } else {
      alert("Profile saved!");
      setPassword("");
    }

    setSaving(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <p>Loading account…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      <Header />

      <main className="flex-1 pt-32 pb-16 px-4">
        <div
          className={`max-w-5xl mx-auto ${
            lastPlace
              ? "grid grid-cols-1 lg:grid-cols-2 gap-8"
              : "flex justify-center"
          }`}
        >
          {/* Form */}
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8 shadow-xl w-full max-w-md">
            <h1 className="text-3xl font-bold text-center text-yellow-300 mb-8">
              My Account
            </h1>

            <form onSubmit={handleSave} className="space-y-6">
              <InputField
                label="Full Name"
                id="full_name"
                value={profile.full_name}
                onChange={(e) =>
                  setProfile((p) => ({ ...p, full_name: e.target.value }))
                }
              />

              <InputField
                label="Email"
                id="email"
                value={profile.email}
                readOnly
              />

              <InputField
                label="Password"
                id="password"
                type="password"
                value={password}
                placeholder="••••••••"
                onChange={(e) => setPassword(e.target.value)}
              />

              <InputField
                label="Phone Number"
                id="phone_number"
                value={profile.phone_number}
                onChange={(e) =>
                  setProfile((p) => ({ ...p, phone_number: e.target.value }))
                }
              />

              <AddressAutocomplete
                value={profile.address}
                onChange={(addr, place) => {
                  setProfile((p) => ({ ...p, address: addr }));
                  if (place) setLastPlace(place);
                }}
              />

              <div className="flex justify-between items-center pt-4 border-t border-white/20">
                <button
                  type="submit"
                  disabled={saving}
                  className={`bg-yellow-400 hover:bg-yellow-500 text-black px-6 py-2 rounded-lg font-semibold shadow transition ${
                    saving ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  {saving ? "Saving…" : "Save Changes"}
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg font-semibold shadow"
                >
                  Logout
                </button>
              </div>
            </form>
          </div>

          {/* Map */}
          {lastPlace && (
            <div className="h-80 lg:h-auto rounded-2xl overflow-hidden border border-white/20 shadow-lg">
              <div
                ref={mapRef}
                className="w-full h-full"
                style={{ minHeight: "300px" }}
              />
            </div>
          )}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

// InputField helper
function InputField({
  label,
  id,
  value,
  onChange,
  readOnly,
  type = "text",
  placeholder,
}) {
  return (
    <div>
      <label htmlFor={id} className="block mb-1 font-medium text-white">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        readOnly={readOnly}
        placeholder={placeholder}
        className={`w-full px-4 py-2 rounded-lg border border-white/30 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition ${
          readOnly
            ? "bg-white/10 cursor-not-allowed text-white/50"
            : "bg-white/10 text-white"
        }`}
      />
    </div>
  );
}
