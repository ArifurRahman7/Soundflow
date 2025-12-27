interface ChatMessageProps {
  text: string;
  type: "user" | "ai";
}

const ChatMessage: React.FC<ChatMessageProps> = ({ text, type }) => {
  const isUser = type === "user";

  return (
    <div className={`w-full flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`whitespace-pre-wrap max-w-[80%] p-4 rounded-lg text-sm shadow ${
          isUser
            ? "bg-blue-600 text-white rounded-br-none"
            : "bg-[#1f1f1f] text-white rounded-bl-none"
        }`}
      >
        {text}
      </div>
    </div>
  );
};

export default ChatMessage;