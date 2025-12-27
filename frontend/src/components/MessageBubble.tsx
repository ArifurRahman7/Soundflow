interface MessageBubbleProps {
  text: string;
  type: "user" | "ai";
}

export default function MessageBubble({ text, type }: MessageBubbleProps) {
  const isUser = type === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[75%] p-3 rounded-xl my-1 text-white text-sm shadow ${
          isUser ? "bg-blue-600 rounded-br-none" : "bg-gray-700 rounded-bl-none"
        }`}
      >
        <pre className="whitespace-pre-wrap">{text}</pre>
      </div>
    </div>
  );
}