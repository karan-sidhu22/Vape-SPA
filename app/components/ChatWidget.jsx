"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef();

  // scroll to bottom on new messages
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage() {
    if (!input.trim() || loading) return;

    const userMsg = { role: "user", content: input.trim() };
    const newMsgs = [...messages, userMsg];
    setMessages(newMsgs);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content:
                "You are Vape Vault’s friendly assistant. Answer questions about our products and categories.",
            },
            ...newMsgs,
          ],
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      const bot = data.choices?.[0]?.message;

      setMessages((m) => [
        ...newMsgs,
        bot ?? {
          role: "assistant",
          content: "Hm, I didn’t get a reply. Could you try again?",
        },
      ]);
    } catch (err) {
      console.error("Chat error:", err);
      setMessages((m) => [
        ...newMsgs,
        {
          role: "assistant",
          content:
            "⚠️ Sorry, I ran into an issue. Please try again in a moment.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKey(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <>
      {/* floating button */}
      <button
        onClick={() => setIsOpen((o) => !o)}
        className="fixed bottom-6 right-6 z-50 flex items-center space-x-2 px-5 py-3 rounded-full shadow-lg bg-[#141825] border border-white/10 hover:border-yellow-400 hover:shadow-yellow-400/30 transition"
        aria-label="Chat"
      >
        {/* Icon */}
        <div className="flex items-center justify-center w-7 h-7 bg-white-400 text-black font-bold rounded-md">
          ✨
        </div>
        <span className="font-semibold text-yellow-300">AI Assistant</span>
      </button>

      {/* chatbox */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.9 }}
            transition={{ duration: 0.25 }}
            className="fixed bottom-20 right-6 w-96 h-[500px] bg-[#141825] text-white rounded-lg shadow-2xl flex flex-col z-50 border border-white/10"
          >
            {/* header */}
            <div className="flex items-center justify-between p-3 border-b border-white/10">
              <span className="font-semibold text-yellow-300">
                Vape Vault Chat
              </span>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white/70 hover:text-red-400"
                aria-label="Close chat"
              >
                ✕
              </button>
            </div>

            {/* messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`max-w-[80%] p-2 rounded-lg whitespace-pre-wrap ${
                    m.role === "user"
                      ? "bg-yellow-300 text-black ml-auto"
                      : "bg-white/10 text-white"
                  }`}
                >
                  {m.content}
                </div>
              ))}

              {/* typing indicator */}
              {loading && (
                <div className="bg-white/10 text-white text-sm px-3 py-2 rounded-lg inline-block">
                  Assistant is typing…
                </div>
              )}
              <div ref={endRef} />
            </div>

            {/* input area */}
            <div className="p-3 border-t border-white/10">
              <textarea
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Ask me about our products…"
                disabled={loading}
                className="w-full bg-white/10 rounded p-2 focus:outline-yellow-400 resize-none text-white text-sm"
              />
              <button
                onClick={sendMessage}
                disabled={loading}
                className="mt-2 w-full bg-yellow-400 text-black rounded py-2 font-semibold hover:bg-yellow-500 disabled:opacity-50"
              >
                {loading ? "…" : "Send"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
