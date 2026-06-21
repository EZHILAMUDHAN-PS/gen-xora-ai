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
    width: "280px",
    background: "#1a1a1a",
    padding: "20px",
    borderRight: "1px solid #333",
  }}
>
 <h2
  style={{
    color: "white",
    marginBottom: "20px",
    fontSize: "24px",
  }}
>
   Gen-Xora
</h2>

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
  style={{
    width: "100%",
    background: "#2d2d2d",
    color: "white",
    border: "1px solid #444",
    padding: "12px",
    borderRadius: "10px",
    cursor: "pointer",
    marginBottom: "20px",
    fontSize: "15px",
  }}
>
   New Chat
</button>

  {Object.keys(chats).map((chat) => (
  <div
    key={chat}
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "10px",
      marginBottom: "8px",
      borderRadius: "8px",
      background:
        currentChat === chat
          ? "#333"
          : "transparent",
    }}
  >
    <span
      onClick={() => setCurrentChat(chat)}
      style={{
        cursor: "pointer",
        flex: 1,
      }}
    >
       {chat}
    </span>

    <span
      onClick={() => {
        const updated = { ...chats };

        delete updated[chat];

        if (
          Object.keys(updated).length === 0
        ) {
          updated["Chat 1"] = [];
          setCurrentChat("Chat 1");
        } else {
          setCurrentChat(
            Object.keys(updated)[0]
          );
        }

        setChats(updated);
      }}
      style={{
        cursor: "pointer",
        color: "red",
      }}
    >
      Delete
    </span>
  </div>
))}
</div>
      

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
padding: "30px",
maxWidth: "900px",
width: "100%",
margin: "0 auto",
  }}
>
  <h2
  style={{
    marginBottom: "20px",
    color: "#ddd",
  }}
>
  {currentChat}
</h2>
        {messages.map((msg, index) => (
          <div
            key={index}
            style={{
            background:
  msg.role === "user"
    ? "#2f2f2f"
    : "#1f1f1f",
             padding: "15px",
borderRadius: "12px",
maxWidth: "80%",
              marginBottom: "10px",
            }}
          >
            <strong>
              {msg.role === "user"
                ? " You"
                : " Assistant"}
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
             Thinking...
          </div>
        )}
     <div
  style={{
    display: "flex",
    alignItems: "center",
    gap: "10px",
    background: "#2a2a2a",
    border: "1px solid #444",
    borderRadius: "14px",
    padding: "10px",
    marginTop: "20px",
  }}
>
  <label
    style={{
      cursor: "pointer",
      color: "#aaa",
      whiteSpace: "nowrap",
    }}
  >
    Attach
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

  <input
    type="text"
    value={message}
    placeholder="Message Gen-Xora..."
    onChange={(e) =>
      setMessage(e.target.value)
    }
    onKeyDown={(e) => {
      if (e.key === "Enter") {
        sendMessage();
      }
    }}
    style={{
      flex: 1,
      background: "transparent",
      border: "none",
      outline: "none",
      color: "white",
      fontSize: "15px",
    }}
  />

  <button
    onClick={startListening}
    style={{
      background: "transparent",
      border: "none",
      color: "#aaa",
      cursor: "pointer",
    }}
  >
    Voice
  </button>

  <button
    onClick={sendMessage}
    style={{
      background: "#fff",
      color: "#000",
      border: "none",
      borderRadius: "8px",
      padding: "8px 14px",
      cursor: "pointer",
    }}
  >
    Send
  </button>
</div>
      </div>
    </div>
  );
}