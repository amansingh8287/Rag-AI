import { useState } from "react";
import { Send, Bot, User, Sparkles } from "lucide-react";

export default function AdvancedRagChatbot() {
  // ========================================
  // STATES
  // ========================================

  const [message, setMessage] = useState("");

  const [messages, setMessages] = useState([]);

  const [loading, setLoading] = useState(false);

  // ========================================
  // SEND MESSAGE
  // ========================================

  const sendMessage = async () => {
    if (!message.trim()) return;

    // USER MESSAGE

    const userMessage = {
      role: "user",
      text: message,
    };

    setMessages((prev) => [...prev, userMessage]);

    setLoading(true);

    try {
      // API CALL

      const response = await fetch(`${import.meta.env.VITE_API_URL}/chat`, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          message,
        }),
      });

      const data = await response.json();

      // AI MESSAGE

      const aiMessage = {
        role: "assistant",
        text: data.answer,
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.log(error);

      const errorMessage = {
        role: "assistant",
        text: "Something went wrong.",
      };

      setMessages((prev) => [...prev, errorMessage]);
    }

    setLoading(false);

    setMessage("");
  };

  return (
    <div className="min-h-screen bg-black text-white flex overflow-hidden">
      {/* ======================================== */}
      {/* SIDEBAR */}
      {/* ======================================== */}

      <div className="w-[280px] border-r border-zinc-800 bg-zinc-950 hidden md:flex flex-col">
        {/* LOGO */}

        <div className="p-6 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center text-black font-bold text-xl">
              AI
            </div>

            <div>
              <h1 className="text-2xl font-bold">RAGBASE</h1>

              <p className="text-zinc-400 text-sm">Gemini + Pinecone</p>
            </div>
          </div>
        </div>

        {/* NEW CHAT */}

        <div className="p-5">
          <button className="w-full bg-emerald-500 hover:bg-emerald-400 transition-all rounded-2xl py-4 font-semibold text-black flex items-center justify-center gap-2">
            <Sparkles size={18} />
            New Chat
          </button>
        </div>

        {/* MODEL */}

        <div className="mt-auto p-5 border-t border-zinc-800">
          <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800">
            <p className="text-sm font-medium">Model</p>

            <p className="text-emerald-400 text-sm mt-1">gemini-3.5-flash</p>
          </div>
        </div>
      </div>

      {/* ======================================== */}
      {/* MAIN CHAT */}
      {/* ======================================== */}

      <div className="flex-1 flex flex-col">
        {/* HEADER */}

        <div className="border-b border-zinc-800 px-6 py-5 bg-zinc-950">
          <h2 className="text-3xl font-bold">AI PDF Chatbot</h2>

          <p className="text-zinc-400 text-sm mt-2">
            Ask questions from your Pinecone indexed PDF.
          </p>
        </div>

        {/* ======================================== */}
        {/* CHAT AREA */}
        {/* ======================================== */}

        <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-gradient-to-b from-black to-zinc-950">
          {/* WELCOME MESSAGE */}

          {messages.length === 0 && (
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center text-black">
                <Bot size={22} />
              </div>

              <div className="bg-zinc-900 border border-zinc-800 rounded-3xl px-6 py-5 text-sm">
                Hello 👋
                <br />
                Ask me anything about DSA.
              </div>
            </div>
          )}

          {/* CHAT MESSAGES */}

          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`flex items-start gap-4 max-w-3xl ${
                  msg.role === "user" ? "flex-row-reverse" : ""
                }`}
              >
                {/* ICON */}

                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                    msg.role === "user"
                      ? "bg-white text-black"
                      : "bg-emerald-500 text-black"
                  }`}
                >
                  {msg.role === "user" ? <User size={20} /> : <Bot size={20} />}
                </div>

                {/* MESSAGE */}

                <div
                  className={`rounded-3xl px-6 py-5 text-sm leading-8 border ${
                    msg.role === "user"
                      ? "bg-emerald-500 text-black border-emerald-400"
                      : "bg-zinc-900 border-zinc-800 text-zinc-100"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            </div>
          ))}

          {/* ======================================== */}
          {/* LOADING ANIMATION */}
          {/* ======================================== */}

          {loading && (
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center text-black">
                <Bot size={20} />
              </div>

              <div className="bg-zinc-900 border border-zinc-800 rounded-3xl px-6 py-5 flex gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-400 animate-bounce"></div>

                <div
                  className="w-3 h-3 rounded-full bg-emerald-400 animate-bounce"
                  style={{
                    animationDelay: "0.2s",
                  }}
                ></div>

                <div
                  className="w-3 h-3 rounded-full bg-emerald-400 animate-bounce"
                  style={{
                    animationDelay: "0.4s",
                  }}
                ></div>
              </div>
            </div>
          )}
        </div>

        {/* ======================================== */}
        {/* INPUT AREA */}
        {/* ======================================== */}

        <div className="border-t border-zinc-800 bg-zinc-950 p-6">
          <div className="flex items-center gap-4 bg-zinc-900 border border-zinc-800 rounded-3xl px-5 py-4">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ask your PDF anything..."
              className="flex-1 bg-transparent outline-none text-sm placeholder:text-zinc-500"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  sendMessage();
                }
              }}
            />

            {/* SEND BUTTON */}

            <button
              onClick={sendMessage}
              className="w-14 h-14 rounded-2xl bg-emerald-500 hover:bg-emerald-400 transition-all flex items-center justify-center text-black"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
