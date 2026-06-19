"use client";

import ReactMarkdown from "react-markdown";
import { useState, useEffect, useRef } from "react";
import SpeechRecognition, {
useSpeechRecognition,
} from "react-speech-recognition";

export default function Home() {
const [message, setMessage] = useState("");
const [loading, setLoading] = useState(false);

const [messages, setMessages] = useState<
{ role: string; text: string }[]

> ([]);

const messagesEndRef = useRef<HTMLDivElement>(null);

const {
transcript,
resetTranscript,
browserSupportsSpeechRecognition,
} = useSpeechRecognition();

useEffect(() => {
const saved = localStorage.getItem("genxora-chat");

```
if (saved) {
  setMessages(JSON.parse(saved));
}
```

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

useEffect(() => {
if (transcript) {
setMessage(transcript);
}
}, [transcript]);

const sendMessage = async () => {
if (!message.trim()) return;

```
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
```

};

const clearChat = () => {
setMessages([]);
localStorage.removeItem("genxora-chat");
};

const startListening = () => {
if (!browserSupportsSpeechRecognition) {
alert("Speech Recognition not supported");
return;
}

```
resetTranscript();

SpeechRecognition.startListening({
  continuous: false,
  language: "en-US",
});
```

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
<h1
style={{
textAlign: "center",
marginBottom: "20px",
}}
>
🚀 Gen-Xora AI Assistant </h1>

```
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
        marginRight: "10px",
      }}
    >
      🗑 Clear Chat
    </button>

    <button
      onClick={() => {
        setMessages([]);
        localStorage.removeItem(
          "genxora-chat"
        );
      }}
      style={{
        background: "#16a34a",
        color: "white",
        border: "none",
        padding: "10px 15px",
        borderRadius: "8px",
        cursor: "pointer",
      }}
    >
      ➕ New Chat
    </button>
  </div>

  <div
    style={{
      maxWidth: "1000px",
      width: "95%",
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
          whiteSpace: "pre-wrap",
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
          marginBottom: "10px",
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
        padding: "12px",
        borderRadius: "10px",
        border: "none",
        marginTop: "10px",
        fontSize: "16px",
      }}
    />

    <div
      style={{
        marginTop: "10px",
      }}
    >
      <button
        onClick={startListening}
        style={{
          padding: "10px 20px",
          borderRadius: "10px",
          cursor: "pointer",
          marginRight: "10px",
        }}
      >
        🎤 Speak
      </button>

      <button
        onClick={sendMessage}
        style={{
          padding: "10px 20px",
          borderRadius: "10px",
          cursor: "pointer",
        }}
      >
        🚀 Send
      </button>
    </div>
  </div>
</div>
```

);
}
