"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import Header from "app/components/Header";
import SiteFooter from "app/components/SiteFooter";
import AddressAutocomplete from "app/components/AddressAutocomplete";

export default function MyAccountPage() {
  const router = useRouter();

  // User & Profile State
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
  const [message, setMessage] = useState(null);

  // Map & Geocoding State
  const [mapScriptLoaded, setMapScriptLoaded] = useState(false);
  const [lastPlace, setLastPlace] = useState(null);

  // Map Refs
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markerRef = useRef(null);

  // Load current user & profile
  useEffect(() => {
    (async () => {
      const { data: { user: currentUser } = {}, error: userErr } =
        await supabase.auth.getUser();
      if (userErr || !currentUser) {
        router.push("/signin");
        return;
      }
      setUser(currentUser);

      const { data: userProfile } = await supabase
        .from("users")
        .select("full_name, email, phone_number, address")
        .eq("id", currentUser.id)
        .single();

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

  // Load Google Maps JS once
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.google?.maps) {
      setMapScriptLoaded(true);
      return;
    }
    const tag = document.createElement("script");
    tag.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY}&libraries=places`;
    tag.async = true;
    tag.onload = () => setMapScriptLoaded(true);
    document.head.appendChild(tag);
  }, []);

  // Geocode saved address
  useEffect(() => {
    if (!mapScriptLoaded || !profile.address) return;
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ address: profile.address }, (results, status) => {
      if (status === "OK" && results[0]) setLastPlace(results[0]);
    });
  }, [mapScriptLoaded, profile.address]);

  // Initialize map
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
    setMessage(null);

    if (
      profile.address &&
      (!lastPlace || lastPlace.formatted_address !== profile.address)
    ) {
      setMessage({ type: "error", text: "Please select a valid address." });
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
        setMessage({ type: "error", text: authErr.message });
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
      setMessage({ type: "error", text: dbErr.message });
    } else {
      setMessage({ type: "success", text: "Profile updated successfully!" });
      setPassword("");
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center text-white"
        style={{ backgroundColor: "#141825" }}
      >
        <p>Loading account…</p>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col text-white"
      style={{ backgroundColor: "#141825" }}
    >
      <Header />

      <main className="flex-1 pt-32 pb-16 px-4">
        <div
          className={`max-w-6xl mx-auto gap-8 ${
            lastPlace ? "grid grid-cols-1 lg:grid-cols-2" : "flex justify-center"
          }`}
        >
          {/* Form */}
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8 shadow-xl w-full max-w-md">
            <h1 className="text-3xl font-bold text-center text-yellow-300 mb-6">
              My Account
            </h1>

            {message && (
              <div
                className={`mb-4 p-3 rounded ${
                  message.type === "error"
                    ? "bg-red-100/10 border border-red-400 text-red-300"
                    : "bg-green-100/10 border border-green-400 text-green-300"
                }`}
              >
                {message.text}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-6">
              <InputField
                label="Full Name"
                id="full_name"
                value={profile.full_name}
                onChange={(e) =>
                  setProfile((p) => ({ ...p, full_name: e.target.value }))
                }
              />

              <InputField label="Email" id="email" value={profile.email} readOnly />

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
            <div className="h-80 lg:h-auto rounded-2xl overflow-hidden bg-white/10 backdrop-blur-lg border border-white/20 shadow-lg">
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
