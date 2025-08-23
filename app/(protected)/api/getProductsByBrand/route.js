import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const brand = searchParams.get("brand");
  if (!brand) {
    return NextResponse.json({ error: "Missing brand" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("brand", brand);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}
