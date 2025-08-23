// // app/(protected)/api/chat/route.js
// import { NextResponse } from "next/server";
// import { supabase } from "@/lib/supabaseClient";

// const FUNCTIONS = [
//   {
//     name: "search_products",
//     description: "Find products matching a natural‐language query",
//     parameters: {
//       type: "object",
//       properties: {
//         query: { type: "string", description: "User’s search text" },
//         k: {
//           type: "integer",
//           description: "Number of results to return",
//           default: 5,
//         },
//       },
//       required: ["query"],
//     },
//   },
// ];

// export async function POST(req) {
//   const { messages } = await req.json();

//   // 1️⃣ First GPT call: let it decide if it wants to call our function
//   const firstResp = await fetch("https://api.openai.com/v1/chat/completions", {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//       Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
//     },
//     body: JSON.stringify({
//       model: "gpt-4-turbo",
//       messages,
//       functions: FUNCTIONS,
//       function_call: "auto",
//     }),
//   });
//   const firstJson = await firstResp.json();
//   const choice = firstJson.choices?.[0]?.message;

//   // 2️⃣ If it didn’t call search_products, just return its normal reply
//   if (
//     !choice?.function_call ||
//     choice.function_call.name !== "search_products"
//   ) {
//     return NextResponse.json(firstJson, { status: firstResp.status });
//   }

//   // 3️⃣ Parse function args
//   const { query, k = 5 } = JSON.parse(choice.function_call.arguments || "{}");

//   // 4️⃣ Embed the query
//   const embedRes = await fetch("https://api.openai.com/v1/embeddings", {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//       Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
//     },
//     body: JSON.stringify({ model: "text-embedding-3-small", input: query }),
//   });
//   const embedJson = await embedRes.json();
//   const queryEmbedding = embedJson.data[0].embedding;

//   // 5️⃣ Vector search via Supabase RPC
//   const { data: matches, error: rpcError } = await supabase.rpc(
//     "match_product_vectors",
//     { query_embedding: queryEmbedding, match_count: k }
//   );
//   if (rpcError) {
//     console.error("RPC error:", rpcError);
//     return NextResponse.json(
//       { error: "Vector search failed" },
//       { status: 500 }
//     );
//   }

//   // 6️⃣ Fetch those product rows (only name, brand, price)
//   const ids = matches.map((m) => m.product_id);
//   const { data: products, error: prodError } = await supabase
//     .from("products")
//     .select("name,brand,price")
//     .in("id", ids);
//   if (prodError) {
//     console.error("Fetch products error:", prodError);
//     return NextResponse.json(
//       { error: "Failed to load products" },
//       { status: 500 }
//     );
//   }

//   // 7️⃣ Second GPT call: we inject an extra system prompt *after* the function
//   //    so GPT knows to only output name, brand & price for those items.
//   const secondResp = await fetch("https://api.openai.com/v1/chat/completions", {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//       Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
//     },
//     body: JSON.stringify({
//       model: "gpt-4-turbo",
//       messages: [
//         ...messages,
//         choice, // the assistant’s function call request
//         {
//           role: "function",
//           name: "search_products",
//           content: JSON.stringify(products),
//         },
//         {
//           role: "system",
//           content:
//             "For the products above, reply with a simple bullet list. " +
//             "Each bullet should show the product’s name, brand, and price only.",
//         },
//       ],
//     }),
//   });
//   const secondJson = await secondResp.json();
//   return NextResponse.json(secondJson, { status: secondResp.status });
// }
// app/(protected)/api/chat/route.js
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

const FUNCTIONS = [
  {
    name: "search_products",
    description: "Find products matching a natural-language query",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "User’s search text" },
        k: {
          type: "integer",
          description: "Number of results to return",
          default: 5,
        },
      },
      required: ["query"],
    },
  },
];

export async function POST(req) {
  const { messages } = await req.json();

  // 1️⃣ First GPT call: get intent / function call
  const firstResp = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4-turbo",
      messages,
      functions: FUNCTIONS,
      function_call: "auto",
    }),
  });
  const firstJson = await firstResp.json();
  const choice = firstJson.choices?.[0]?.message;

  // 2️⃣ If no function call, just return GPT’s reply
  if (
    !choice?.function_call ||
    choice.function_call.name !== "search_products"
  ) {
    return NextResponse.json(firstJson, { status: firstResp.status });
  }

  // 3️⃣ Parse arguments
  const { query, k = 5 } = JSON.parse(choice.function_call.arguments || "{}");

  // 4️⃣ Get embedding
  const embedResp = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "text-embedding-3-small",
      input: query,
    }),
  });
  const embedJson = await embedResp.json();
  const queryEmbedding = embedJson.data[0].embedding;

  // 5️⃣ Vector lookup via Supabase RPC
  const { data: matches, error: rpcError } = await supabase.rpc(
    "match_product_vectors",
    { query_embedding: queryEmbedding, match_count: k }
  );
  if (rpcError) {
    console.error("RPC error:", rpcError);
    return NextResponse.json(
      { error: "Failed to run vector search" },
      { status: 500 }
    );
  }

  // 6️⃣ Fetch product rows
  const ids = matches.map((m) => m.product_id);
  const { data: products, error: prodError } = await supabase
    .from("products")
    .select("id,name,brand,price,image_url,stock_quantity")
    .in("id", ids);
  if (prodError) {
    console.error("Fetch products error:", prodError);
    return NextResponse.json(
      { error: "Failed to load products" },
      { status: 500 }
    );
  }

  // 7️⃣ Second GPT call: furnish the function result and formatting instructions
  const secondResp = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4-turbo",
      messages: [
        ...messages,
        choice, // the function call
        {
          role: "function",
          name: "search_products",
          content: JSON.stringify(products),
        },
        // New system prompt to format as bullet list with blank lines
        {
          role: "system",
          content:
            "You now have an array of products, each with `name`, `brand`, and `price`. " +
            "Please format your reply as a Markdown bullet list, **with a blank line between each item**. " +
            "Each bullet should read: `- Name, Brand: <brand>, Price: $<price>`.",
        },
      ],
    }),
  });
  const secondJson = await secondResp.json();
  return NextResponse.json(secondJson, { status: secondResp.status });
}
