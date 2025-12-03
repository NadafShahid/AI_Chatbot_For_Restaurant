import { useState } from "react";
import ChatWidget from "./ChatWidget";

export default function ChatCTA() {
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <>
      <section className="max-w-6xl mx-auto p-10 my-10 bg-gray-50 rounded-2xl shadow-lg text-center">
        <h2 className="text-4xl font-bold mb-4">AI Chatbot Assistance</h2>

        <p className="mb-6 text-gray-600 text-lg">
          Need help? Our AI assistant is here for menu recommendations, booking,
          and quick answers.
        </p>

        <button
          onClick={() => setIsChatOpen(true)}
          className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 px-6 rounded-lg shadow-md text-lg"
        >
          Start Chat
        </button>
      </section>

      <ChatWidget isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </>
  );
}
