// app/(protected)/api/getProducts/route.js
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET() {
  // select * will give you id, category_id, name, brand, description,
  // price, image_url, features, stock_quantity, created_at, etc.
  const { data, error } = await supabase.from("products").select("*");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
