import { useState, useEffect, useRef } from "react";
import ChatMessage from "./ChatMessage";
import { useUser } from "@clerk/clerk-react";

export default function Lyricify() {
  const [mood, setMood] = useState("");
  const [language, setLanguage] = useState("en");
  const [messages, setMessages] = useState<{ text: string; type: "user" | "ai" }[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);
   const { user } = useUser();
   const userName = user?.fullName;

  const handleSend = async () => {
    if (!mood.trim()) return;

    setMessages((prev) => [...prev, { text: mood, type: "user" }]);

    try {
      const res = await fetch("http://localhost:5000/api/lyrics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mood, language, userName}),
      });

      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { text: data.lyrics || "⚠️ No lyrics generated.", type: "ai" },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { text: "❌ Error generating lyrics.", type: "ai" },
      ]);
    }

    setMood("");
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex flex-col h-screen bg-black text-white">
      {/* Header */}
      <header className="p-4 shadow text-center font-semibold border-b border-gray-800">
        🎵 AI Lyrics Generator
      </header>

      {/* Chat */}
      <main className="flex-1 overflow-y-auto p-15 space-y-4">
        {messages.map((msg, idx) => (
          <ChatMessage key={idx} text={msg.text} type={msg.type} />
        ))}
        <div ref={chatEndRef} />
      </main>

      {/* Input */}
      <footer className="p-4 border-t border-gray-800 flex gap-2 bg-black">
        <input
          type="text"
          value={mood}
          onChange={(e) => setMood(e.target.value)}
          placeholder="Type a mood... (e.g. love, heartbreak)"
          className="flex-1 bg-[#1f1f1f] text-white p-2 rounded outline-none border border-gray-700"
        />
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="bg-[#1f1f1f] text-white p-2 rounded border border-gray-700"
        >
          <option value="en">EN</option>
          <option value="bn">BN</option>
        </select>
        <button
          onClick={handleSend}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Send
        </button>
      </footer>
    </div>
  );
}