// "use client";

// import { useState, useRef, useEffect } from "react";

// export default function ChatWidget() {
//   const [isOpen, setIsOpen] = useState(false);
//   const [messages, setMessages] = useState([
//     { role: "system", content: "I am your Vape Vault’s friendly assistant.I will answer Your questions about our products and categories." },
//   ]);
//   const [input, setInput] = useState("");
//   const [loading, setLoading] = useState(false);
//   const endRef = useRef();

//   // auto-scroll to bottom
//   useEffect(() => {
//     endRef.current?.scrollIntoView({ behavior: "smooth" });
//   }, [messages]);

//   async function sendMessage() {
//     if (!input.trim()) return;
//     const userMsg = { role: "user", content: input };
//     setMessages((m) => [...m, userMsg]);
//     setInput("");
//     setLoading(true);

//     // send to our /api/chat route
//     const res = await fetch("/api/chat", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ messages: [...messages, userMsg] }),
//     });
//     const { choices } = await res.json();
//     const bot = choices[0].message;
//     setMessages((m) => [...m, bot]);
//     setLoading(false);
//   }

//   function handleKey(e) {
//     if (e.key === "Enter" && !e.shiftKey) {
//       e.preventDefault();
//       sendMessage();
//     }
//   }

//   return (
//     <>
//       {/* toggle button */}
//       <button
//         onClick={() => setIsOpen((o) => !o)}
//         className="fixed bottom-6 right-6 bg-yellow-300 text-black p-3 rounded-full shadow-lg z-50"
//         aria-label="Chat"
//       >
//         💬
//       </button>

//       {isOpen && (
//         <div className="fixed bottom-20 right-6 w-90 h-120 bg-gray-900 text-white rounded-lg shadow-2xl flex flex-col z-50">
//           {/* header */}
//           <div className="flex items-center justify-between p-2 border-b border-gray-700">
//             <span className="font-semibold">Vape Vault Chat</span>
//             <button onClick={() => setIsOpen(false)} aria-label="Close chat">✕</button>
//           </div>

//           {/* message list */}
//           <div className="flex-1 overflow-y-auto p-2 space-y-2">
//             {messages.map((m, i) => (
//               <div
//                 key={i}
//                 className={`max-w-[80%] p-2 rounded ${
//                   m.role === "user"
//                     ? "bg-yellow-300 text-black self-end"
//                     : "bg-gray-800 text-white self-start"
//                 }`}
//               >
//                 {m.content}
//               </div>
//             ))}
//             <div ref={endRef} />
//           </div>

//           {/* input */}
//           <div className="p-2 border-t border-gray-700">
//             <textarea
//               rows={1}
//               value={input}
//               onChange={(e) => setInput(e.target.value)}
//               onKeyDown={handleKey}
//               placeholder="Ask me about our products…"
//               className="w-full bg-gray-800 rounded p-1 focus:outline-yellow-400 resize-none text-white text-sm"
//             />
//             <button
//               onClick={sendMessage}
//               disabled={loading}
//               className="mt-1 w-full bg-yellow-300 text-black rounded py-1 disabled:opacity-50"
//             >
//               {loading ? "…" : "Send"}
//             </button>
//           </div>
//         </div>
//       )}
//     </>
//   );
// }
// app/components/ChatWidget.jsx
"use client";

import { useState, useRef, useEffect } from "react";

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "system",
      content:
        "I am your Vape Vault’s friendly assistant. I will answer your questions about our products and categories.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef();

  // auto-scroll to bottom
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage() {
    if (!input.trim()) return;

    const userMsg = { role: "user", content: input.trim() };
    const allMsgs = [...messages, userMsg];
    setMessages(allMsgs);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: allMsgs }),
      });

      if (!res.ok) {
        console.error("HTTP error", res.status);
        setMessages((m) => [
          ...allMsgs,
          {
            role: "assistant",
            content:
              "Sorry, something went wrong talking to our AI. Please try again.",
          },
        ]);
        return;
      }

      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.error("Invalid JSON:", text);
        setMessages((m) => [
          ...allMsgs,
          {
            role: "assistant",
            content:
              "I got a garbled response—I’m having trouble understanding right now.",
          },
        ]);
        return;
      }

      const bot = data.choices?.[0]?.message;
      if (!bot) {
        setMessages((m) => [
          ...allMsgs,
          {
            role: "assistant",
            content: "Hm, I didn’t get a reply. Could you say that again?",
          },
        ]);
      } else {
        setMessages((m) => [...allMsgs, bot]);
      }
    } catch (err) {
      console.error("Network error:", err);
      setMessages((m) => [
        ...allMsgs,
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

  function handleKey(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <>
      {/* toggle button */}
      <button
        onClick={() => setIsOpen((o) => !o)}
        className="fixed bottom-6 right-6 bg-yellow-300 text-black p-3 rounded-full shadow-lg z-50"
        aria-label="Chat"
      >
        <span className="text-lg">💬</span>
      </button>

      {isOpen && (
        <div className="fixed bottom-20 right-6 w-96 h-[500px] bg-gray-900 text-white rounded-lg shadow-2xl flex flex-col z-50">
          {/* header */}
          <div className="flex items-center justify-between p-2 border-b border-gray-700">
            <span className="font-semibold">Vape Vault Chat</span>
            <button onClick={() => setIsOpen(false)} aria-label="Close chat">
              ✕
            </button>
          </div>

          {/* message list */}
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`max-w-[80%] p-2 rounded ${
                  m.role === "user"
                    ? "bg-yellow-300 text-black self-end"
                    : "bg-gray-800 text-white self-start"
                }`}
              >
                {m.content}
              </div>
            ))}
            <div ref={endRef} />
          </div>

          {/* input */}
          <div className="p-2 border-t border-gray-700">
            <textarea
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask me about our products…"
              className="w-full bg-gray-800 rounded p-1 focus:outline-yellow-400 resize-none text-white text-sm"
            />
            <button
              onClick={sendMessage}
              disabled={loading}
              className="mt-1 w-full bg-yellow-300 text-black rounded py-1 disabled:opacity-50"
            >
              {loading ? "…" : "Send"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
