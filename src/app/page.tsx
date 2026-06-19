"use client";

import ReactMarkdown from "react-markdown";
import { useState, useEffect, useRef } from "react";

export default function Home() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [messages, setMessages] = useState<
    { role: string; text: string }[]
  >([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem("genxora-chat");
    if (saved) {
      setMessages(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "genxora-chat",
      JSON.stringify(messages)
    );
  }, [messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  const sendMessage = async () => {
    if (!message.trim()) return;

    const userMessage = message;

    setMessages((prev) => [
      ...prev,
      { role: "user", text: userMessage },
    ]);

    setMessage("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessage,
        }),
      });

      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        { role: "ai", text: data.reply },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          text: "⚠️ Error connecting to AI.",
        },
      ]);
    }

    setLoading(false);
  };

  const clearChat = () => {
    setMessages([]);
    localStorage.removeItem("genxora-chat");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#111",
        color: "white",
        padding: "20px",
        fontFamily: "Arial",
      }}
    >
      <h1 style={{ textAlign: "center" }}>
        🚀 Gen-Xora AI Assistant
      </h1>

      <div
        style={{
          textAlign: "center",
          marginBottom: "20px",
        }}
      >
        <button
          onClick={clearChat}
          style={{
            background: "#dc2626",
            color: "white",
            border: "none",
            padding: "10px 15px",
            borderRadius: "8px",
            cursor: "pointer",
          }}
        >
          🗑 Clear Chat
        </button>
      </div>

      <div
        style={{
          maxWidth: "1000px",
          margin: "auto",
        }}
      >
        {messages.map((msg, index) => (
          <div
            key={index}
            style={{
              background:
                msg.role === "user"
                  ? "#2563eb"
                  : "#222",
              padding: "15px",
              borderRadius: "10px",
              marginBottom: "10px",
            }}
          >
            <strong>
              {msg.role === "user"
                ? "👤 You"
                : "🤖 Gen-Xora"}
            </strong>

            <ReactMarkdown>
              {msg.text}
            </ReactMarkdown>
          </div>
        ))}

        <div ref={messagesEndRef}></div>

        {loading && (
          <div
            style={{
              background: "#222",
              padding: "12px",
              borderRadius: "10px",
            }}
          >
            🤖 Gen-Xora is thinking...
          </div>
        )}

        <input
          type="text"
          value={message}
          placeholder="Ask anything..."
          onChange={(e) =>
            setMessage(e.target.value)
          }
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              sendMessage();
            }
          }}
          style={{
  width: "100%",
  padding: "15px",
  borderRadius: "10px",
  marginTop: "15px",
  backgroundColor: "#222",
  color: "white",
  border: "1px solid #555",
  outline: "none",
  fontSize: "16px",
  boxSizing: "border-box",
}}
        />

        <button
          onClick={sendMessage}
          style={{
  marginTop: "15px",
  padding: "12px 20px",
  borderRadius: "10px",
  cursor: "pointer",
  backgroundColor: "#2563eb",
  color: "white",
  border: "none",
  fontSize: "16px",
}}
        >
          🚀 Send
        </button>
      </div>
    </div>
  );
}