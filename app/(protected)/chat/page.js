"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ChatPage() {
  const router = useRouter();
  const [messages, setMessages] = useState([
    {
      role: "system",
      content:
        "You are Vape Vault’s friendly assistant. Answer user questions about our products and categories.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef();

  // scroll to bottom on new message
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage() {
    if (!input.trim()) return;
    const userMsg = { role: "user", content: input.trim() };
    const updated = [...messages, userMsg];

    setMessages(updated);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updated }),
      });
      const body = await res.json();
      const assistantMsg = body.choices?.[0]?.message;
      if (assistantMsg) {
        setMessages((m) => [...updated, assistantMsg]);
      } else {
        // fallback
        setMessages((m) => [
          ...updated,
          { role: "assistant", content: "Sorry, I had trouble responding." },
        ]);
      }
    } catch (err) {
      console.error(err);
      setMessages((m) => [
        ...updated,
        {
          role: "assistant",
          content:
            "Oops—something went wrong on our end. Please try again in a moment.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  // handle Enter (no shift) to send
  function handleKey(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto p-4 bg-gray-900 text-white">
      <nav className="mb-4">
        <button
          onClick={() => router.back()}
          className="px-3 py-1 bg-yellow-300 text-black rounded"
        >
          ← Back
        </button>
      </nav>
      <div className="flex-1 overflow-y-auto space-y-4 px-2">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`p-3 rounded max-w-[80%] ${
              m.role === "user"
                ? "bg-yellow-300 text-black self-end ml-auto"
                : "bg-gray-800 self-start"
            }`}
          >
            {m.content}
          </div>
        ))}
        <div ref={endRef} />
      </div>
      <div className="mt-4 flex items-end">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          rows={1}
          placeholder="Ask me about our products…"
          className="flex-1 p-2 rounded bg-gray-800 resize-none focus:outline-yellow-400"
        />
        <button
          onClick={sendMessage}
          disabled={loading}
          className="ml-2 px-4 py-2 bg-yellow-300 text-black rounded disabled:opacity-50"
        >
          {loading ? "…" : "Send"}
        </button>
      </div>
    </div>
  );
}
