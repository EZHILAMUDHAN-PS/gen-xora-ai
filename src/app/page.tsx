"use client";

import ReactMarkdown from "react-markdown";
import { useState, useEffect, useRef } from "react";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";
export default function Home() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState<File | null>(null);

  const [currentChat, setCurrentChat] = useState("Chat 1");

const [chats, setChats] = useState<{
  [key: string]: { role: string; text: string }[];
}>({
  "Chat 1": [],
});

const messages = chats[currentChat] || [];

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const {
  transcript,
  resetTranscript,
  browserSupportsSpeechRecognition,
} = useSpeechRecognition();

 useEffect(() => {
  const saved = localStorage.getItem("genxora-chats");

  if (saved) {
    setChats(JSON.parse(saved));
  }
}, []);

 useEffect(() => {
  localStorage.setItem(
    "genxora-chats",
    JSON.stringify(chats)
  );
}, [chats]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);
  useEffect(() => {
  if (transcript) {
    setMessage(transcript);
  }
}, [transcript]);
const convertToBase64 = (
  file: File
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.readAsDataURL(file);

    reader.onload = () => {
      resolve(reader.result as string);
    };

    reader.onerror = (error) => {
      reject(error);
    };
  });
};
  const sendMessage = async () => {
    if (!message.trim()) return;

    const userMessage = message;

   setChats((prev) => ({
  ...prev,
  [currentChat]: [
    ...(prev[currentChat] || []),
    { role: "user", text: userMessage },
  ],
}));

    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
  message: userMessage,
  image: image
    ? await convertToBase64(image)
    : null,
}),
      });

      const data = await res.json();
      const utterance = new SpeechSynthesisUtterance(
  data.reply
);

utterance.lang = "en-US";

window.speechSynthesis.speak(
  utterance
);

      setChats((prev) => ({
  ...prev,
  [currentChat]: [
    ...(prev[currentChat] || []),
    { role: "ai", text: data.reply },
  ],
}));
    } catch {
      setChats((prev) => ({
  ...prev,
  [currentChat]: [
    ...(prev[currentChat] || []),
    {
      role: "ai",
      text: "⚠️ Error connecting to AI.",
    },
  ],
}));
    }

    setLoading(false);
  };

  const clearChat = () => {
    setChats((prev) => ({
  ...prev,
  [currentChat]: [],
}));
    localStorage.removeItem("genxora-chat");
  };
  const startListening = () => {
  if (!browserSupportsSpeechRecognition) {
    alert("Speech Recognition not supported");
    return;
  }

  resetTranscript();

  SpeechRecognition.startListening({
    continuous: false,
    language: "en-US",
  });
};

 return (
  <div
    style={{
      display: "flex",
      minHeight: "100vh",
      background: "#111",
      color: "white",
      fontFamily: "Arial",
    }}
  >
    <div
  style={{
    width: "250px",
    background: "#1a1a1a",
    padding: "20px",
    borderRight: "1px solid #333",
  }}
>
  <h2>🚀 Gen-Xora</h2>

  <button
  onClick={() => {
    const newChat =
      "Chat " +
      (Object.keys(chats).length + 1);

    setChats((prev) => ({
      ...prev,
      [newChat]: [],
    }));

    setCurrentChat(newChat);
  }}
>
  ➕ New Chat
</button>

  {Object.keys(chats).map((chat) => (
  <div
    key={chat}
    onClick={() => setCurrentChat(chat)}
    style={{
      padding: "10px",
      cursor: "pointer",
      background:
        currentChat === chat
          ? "#333"
          : "transparent",
      borderRadius: "5px",
      marginBottom: "5px",
    }}
  >
    💬 {chat}
  </div>
))}
</div>
      <h1 style={{ textAlign: "center" }}>
        🚀 Gen-Xora AI Assistant
      </h1>

      <div
        style={{
          textAlign: "center",
          marginBottom: "20px",
        }}
      >
        
        

      </div>

      <div
  style={{
    flex: 1,
    padding: "20px",
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
            <button
  onClick={() =>
    navigator.clipboard.writeText(msg.text)
  }
  style={{
    marginTop: "10px",
    background: "#444",
    color: "white",
    border: "none",
    padding: "5px 10px",
    borderRadius: "5px",
    cursor: "pointer",
  }}
>
  📋 Copy
</button>
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
            🤖 Typing...
          </div>
        )}
      <label
  style={{
    display: "inline-block",
    background: "#2563eb",
    color: "white",
    padding: "10px 15px",
    borderRadius: "8px",
    cursor: "pointer",
    marginBottom: "10px",
  }}
>
  📷 Upload Image
  <input
    type="file"
    accept="image/*"
    onChange={(e) => {
      if (e.target.files?.[0]) {
        setImage(e.target.files[0]);
      }
    }}
    hidden
  />
</label>
{image && (
  <p
    style={{
      color: "#aaa",
      marginTop: "10px",
    }}
  >
    📎 {image.name}
  </p>
)}
{image && (
  <img
    src={URL.createObjectURL(image)}
    alt="Preview"
    style={{
      width: "200px",
      borderRadius: "10px",
      marginTop: "10px",
      marginBottom: "10px",
    }}
  />
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
  onClick={startListening}
  style={{
    marginTop: "10px",
    marginRight: "10px",
    padding: "10px 20px",
    borderRadius: "10px",
    cursor: "pointer",
  }}
>
  🎤 Speak
</button>

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