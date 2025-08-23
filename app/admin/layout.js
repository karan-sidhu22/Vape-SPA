// app/admin/layout.js
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function AdminLayout({ children }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data, error }) => {
      // 1️⃣ Not signed in at all?
      if (error || !data?.session) {
        return router.replace("/signin");
      }

      // 2️⃣ Look up your custom users table
      const { data: profile, error: profErr } = await supabase
        .from("users")
        .select("role")
        .eq("id", data.session.user.id)
        .single();

      if (profErr || profile?.role !== "admin") {
        // either error or not an admin → back to home
        return router.replace("/");
      }

      // 3️⃣ OK — let the page render
      setReady(true);
    });
  }, [router]);

  // while we check session/role, render nothing or a spinner
  if (!ready) return null;

  // once ready, render the admin subtree
  return <>{children}</>;
}
