#!/usr/bin/env node

// scripts/embed_products.mjs

import { config } from "dotenv";
config({ path: ".env.local" });

import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

// ——————————————————————————————————————————————
// ¹ Initialize Supabase (using your NEXT_PUBLIC_ vars)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY;
if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_KEY in .env.local"
  );
}
const supabase = createClient(supabaseUrl, supabaseKey);

// ——————————————————————————————————————————————
// ² Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ——————————————————————————————————————————————
// ³ Constants
const VECTORS_TABLE = "product_vectors";
const BATCH_SIZE = 50;

async function main() {
  console.log("Fetching products…");
  const { data: products, error: prodErr } = await supabase
    .from("products")
    .select("id, name, description")
    .not("name", "is", null);

  if (prodErr) throw prodErr;
  console.log(`Fetched ${products.length} products.`);

  for (let i = 0; i < products.length; i += BATCH_SIZE) {
    const batch = products.slice(i, i + BATCH_SIZE);
    const inputs = batch.map((p) => `${p.name}\n\n${p.description || ""}`);

    console.log(
      `Embedding batch ${i / BATCH_SIZE + 1} (${batch.length} items)…`
    );
    const res = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: inputs,
    });

    // Only upsert id & embedding, since your table has no updated_at column
    const toUpsert = batch.map((p, idx) => ({
      id: p.id,
      embedding: res.data[idx].embedding,
    }));

    const { error: upsertErr } = await supabase
      .from(VECTORS_TABLE)
      .upsert(toUpsert, { onConflict: ["id"] });

    if (upsertErr) {
      console.error("Upsert failed:", upsertErr);
      process.exit(1);
    }

    console.log(`Batch ${i / BATCH_SIZE + 1} upserted.`);
    // small pause to respect rate limits
    await new Promise((r) => setTimeout(r, 1000));
  }

  console.log("✅ All done!");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
