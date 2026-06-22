"use client";

import ReactMarkdown from "react-markdown";
import { useState, useEffect, useRef } from "react";
import type { CSSProperties } from "react";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";

type ChatRole = "user" | "ai";

interface ChatMessage {
  role: ChatRole;
  text: string;
}

type ChatStore = Record<string, ChatMessage[]>;
type ChatTitles = Record<string, string>;

interface StoredData {
  chats: ChatStore;
  chatTitles: ChatTitles;
  chatOrder: string[];
  currentChatId: string;
}

const STORAGE_KEY = "genxora-data";
const MAX_TITLE_LENGTH = 40;
const DEFAULT_TITLE = "New chat";

function createChatId(): string {
  return `chat-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function deriveTitle(text: string): string {
  const trimmed = text.trim().replace(/\s+/g, " ");
  if (trimmed.length <= MAX_TITLE_LENGTH) return trimmed;
  return `${trimmed.slice(0, MAX_TITLE_LENGTH)}...`;
}

/* ---------- Icons ---------- */

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}

function PaperclipIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
    </svg>
  );
}

function MicIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

/* ---------- Styles ---------- */

const styles: Record<string, CSSProperties> = {
  app: {
    display: "flex",
    height: "100vh",
    background: "#111111",
    color: "#ececec",
    fontFamily:
      '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    overflow: "hidden",
  },
  sidebar: {
    width: "280px",
    minWidth: "280px",
    background: "#171717",
    borderRight: "1px solid #333333",
    display: "flex",
    flexDirection: "column",
    padding: "16px",
  },
  sidebarHeader: {
    fontSize: "20px",
    fontWeight: 600,
    letterSpacing: "0.2px",
    color: "#ffffff",
    padding: "8px 8px 16px 8px",
  },
  newChatBtn: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    width: "100%",
    background: "transparent",
    color: "#ececec",
    border: "1px solid #333333",
    padding: "10px 12px",
    borderRadius: "10px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: 500,
    marginBottom: "16px",
  },
  chatList: {
    flex: 1,
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: "2px",
    marginRight: "-8px",
    paddingRight: "8px",
  },
  chatItem: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "8px",
    padding: "10px 10px",
    borderRadius: "8px",
    cursor: "pointer",
  },
  chatItemTitle: {
    flex: 1,
    fontSize: "13.5px",
    color: "#d4d4d4",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  deleteBtn: {
    background: "transparent",
    border: "none",
    color: "#888888",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    padding: "4px",
    borderRadius: "6px",
  },
  main: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    background: "#111111",
    minWidth: 0,
  },
  chatScroll: {
    flex: 1,
    overflowY: "auto",
  },
  chatInner: {
    maxWidth: "900px",
    margin: "0 auto",
    padding: "32px 24px 16px 24px",
    display: "flex",
    flexDirection: "column",
    gap: "18px",
    minHeight: "100%",
  },
  emptyState: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    color: "#666666",
    gap: "8px",
    textAlign: "center",
  },
  bubble: {
    maxWidth: "80%",
    padding: "12px 16px",
    borderRadius: "16px",
    fontSize: "15px",
    lineHeight: 1.6,
    color: "#ececec",
  },
  roleLabel: {
    fontSize: "11.5px",
    fontWeight: 600,
    color: "#888888",
    marginBottom: "6px",
    textTransform: "uppercase",
    letterSpacing: "0.4px",
  },
  thinking: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    color: "#888888",
    fontSize: "14px",
    padding: "12px 16px",
    background: "#1f1f1f",
    borderRadius: "16px",
    maxWidth: "80%",
  },
  copyBtn: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    background: "transparent",
    border: "1px solid #333333",
    color: "#888888",
    fontSize: "12px",
    padding: "5px 9px",
    borderRadius: "6px",
    cursor: "pointer",
    marginTop: "8px",
  },
  inputWrap: {
    borderTop: "1px solid #333333",
    background: "#111111",
    padding: "16px 24px 20px 24px",
  },
  inputInner: {
    maxWidth: "900px",
    margin: "0 auto",
  },
  imagePreviewCard: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    background: "#1c1c1c",
    border: "1px solid #333333",
    borderRadius: "12px",
    padding: "8px 12px",
    marginBottom: "10px",
    width: "fit-content",
    maxWidth: "100%",
  },
  imagePreviewThumb: {
    width: "44px",
    height: "44px",
    borderRadius: "8px",
    objectFit: "cover",
    border: "1px solid #333333",
  },
  imagePreviewName: {
    fontSize: "13px",
    color: "#cccccc",
    maxWidth: "220px",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  removeImgBtn: {
    background: "transparent",
    border: "none",
    color: "#888888",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    padding: "4px",
    borderRadius: "6px",
    marginLeft: "4px",
  },
  inputBar: {
    display: "flex",
    alignItems: "flex-end",
    gap: "8px",
    background: "#1c1c1c",
    border: "1px solid #333333",
    borderRadius: "18px",
    padding: "8px 8px 8px 12px",
  },
  iconBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "36px",
    height: "36px",
    minWidth: "36px",
    background: "transparent",
    border: "none",
    color: "#aaaaaa",
    borderRadius: "10px",
    cursor: "pointer",
  },
  textarea: {
    flex: 1,
    background: "transparent",
    border: "none",
    outline: "none",
    color: "#ececec",
    fontSize: "15px",
    resize: "none",
    maxHeight: "200px",
    padding: "8px 4px",
    lineHeight: 1.5,
  },
  sendBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "36px",
    height: "36px",
    minWidth: "36px",
    background: "#ececec",
    color: "#111111",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
  },
};

export default function Home() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
const [voiceEnabled, setVoiceEnabled] = useState(false);    
  const [chats, setChats] = useState<ChatStore>({});
  const [chatTitles, setChatTitles] = useState<ChatTitles>({});
  const [chatOrder, setChatOrder] = useState<string[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string>("");
  const [hydrated, setHydrated] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { transcript, resetTranscript, browserSupportsSpeechRecognition, listening } =
    useSpeechRecognition();

  const messages = chats[currentChatId] || [];

  // Load persisted state on first render
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed: StoredData = JSON.parse(saved);
        setChats(parsed.chats || {});
        setChatTitles(parsed.chatTitles || {});
        setChatOrder(parsed.chatOrder || Object.keys(parsed.chats || {}));
        setCurrentChatId(
          parsed.currentChatId || Object.keys(parsed.chats || {})[0] || ""
        );
      } catch {
        // Corrupt storage, fall back to empty state
      }
    }
    setHydrated(true);
  }, []);

  // Guarantee at least one chat exists once hydration is complete
  useEffect(() => {
    if (!hydrated) return;
    if (chatOrder.length === 0) {
      const id = createChatId();
      setChats({ [id]: [] });
      setChatTitles({ [id]: DEFAULT_TITLE });
      setChatOrder([id]);
      setCurrentChatId(id);
    }
  }, [hydrated, chatOrder.length]);

  // Persist state on every change
  useEffect(() => {
    if (!hydrated) return;
    const data: StoredData = { chats, chatTitles, chatOrder, currentChatId };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [chats, chatTitles, chatOrder, currentChatId, hydrated]);

  // Auto scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Feed speech recognition transcript into the input
  useEffect(() => {
    if (transcript) setMessage(transcript);
  }, [transcript]);

  // Clean up object URL for image preview
  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const removeImage = () => {
    setImage(null);
    setImagePreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleImageSelect = (file: File) => {
    setImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleNewChat = () => {
    const id = createChatId();
    setChats((prev) => ({ ...prev, [id]: [] }));
    setChatTitles((prev) => ({ ...prev, [id]: DEFAULT_TITLE }));
    setChatOrder((prev) => [id, ...prev]);
    setCurrentChatId(id);
    setMessage("");
    removeImage();
  };

  const handleDeleteChat = (id: string) => {
    const remainingOrder = chatOrder.filter((c) => c !== id);

    setChats((prev) => {
      const updated = { ...prev };
      delete updated[id];
      return updated;
    });
    setChatTitles((prev) => {
      const updated = { ...prev };
      delete updated[id];
      return updated;
    });

    if (remainingOrder.length > 0) {
      setChatOrder(remainingOrder);
      if (id === currentChatId) {
        setCurrentChatId(remainingOrder[0]);
      }
    } else {
      const newId = createChatId();
      setChats({ [newId]: [] });
      setChatTitles({ [newId]: DEFAULT_TITLE });
      setChatOrder([newId]);
      setCurrentChatId(newId);
    }
  };

  const sendMessage = async () => {
    if (!message.trim() || loading || !currentChatId) return;

    const userMessage = message.trim();
    const isFirstMessage = messages.length === 0;
    const pendingImage = image;

    setMessage("");
    removeImage();
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    setChats((prev) => ({
      ...prev,
      [currentChatId]: [...(prev[currentChatId] || []), { role: "user", text: userMessage }],
    }));

    if (isFirstMessage) {
      setChatTitles((prev) => ({ ...prev, [currentChatId]: deriveTitle(userMessage) }));
    }

    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          image: pendingImage ? await convertToBase64(pendingImage) : null,
        }),
      });

     if (!res.ok) {
  throw new Error("API Error");
}

const data = await res.json();

     if (
  voiceEnabled &&
  typeof window !== "undefined" &&
  "speechSynthesis" in window
) {
  window.speechSynthesis.cancel();

  const utterance =
    new SpeechSynthesisUtterance(
      data.reply
    );

  utterance.lang = "en-US";

  window.speechSynthesis.speak(
    utterance
  );
}

      setChats((prev) => ({
        ...prev,
        [currentChatId]: [...(prev[currentChatId] || []), { role: "ai", text: data.reply }],
      }));
    } catch {
      setChats((prev) => ({
        ...prev,
        [currentChatId]: [
          ...(prev[currentChatId] || []),
          { role: "ai", text: "Error connecting to AI." },
        ],
      }));
    }

    setLoading(false);
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const startListening = () => {
    if (!browserSupportsSpeechRecognition) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }
    resetTranscript();
    SpeechRecognition.startListening({ continuous: false, language: "en-US" });
  };

  const handleCopy = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => {
        setCopiedIndex((cur) => (cur === index ? null : cur));
      }, 1500);
    } catch {
      // Clipboard API unavailable; ignore
    }
  };

  if (!hydrated) {
    return <div style={{ background: "#111111", minHeight: "100vh" }} />;
  }

  return (
    <div style={styles.app}>
      <style>{`
        .gx-scroll::-webkit-scrollbar { width: 8px; }
        .gx-scroll::-webkit-scrollbar-thumb { background: #333333; border-radius: 8px; }
        .gx-scroll::-webkit-scrollbar-track { background: transparent; }

        .gx-new-chat-btn { transition: background 0.15s ease, border-color 0.15s ease; }
        .gx-new-chat-btn:hover { background: #232323; border-color: #444444; }

        .gx-chat-item { position: relative; transition: background 0.15s ease; }
        .gx-chat-item:hover { background: #232323; }
        .gx-chat-item.active { background: #2a2a2a; }
        .gx-chat-item .gx-delete-btn { opacity: 0; transition: opacity 0.15s ease, color 0.15s ease; }
        .gx-chat-item:hover .gx-delete-btn { opacity: 1; }
        .gx-delete-btn:hover { color: #ff6b6b !important; }

        .gx-icon-btn { transition: background 0.15s ease, color 0.15s ease, opacity 0.15s ease; }
        .gx-icon-btn:hover:not(:disabled) { background: #333333; color: #ffffff; }
        .gx-icon-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .gx-mic-btn.listening { background: #3a1f1f; color: #ff8a8a; }

        .gx-send-btn { transition: background 0.15s ease, opacity 0.15s ease; }
        .gx-send-btn:hover:not(:disabled) { background: #ffffff; }
        .gx-send-btn:disabled { opacity: 0.35; cursor: not-allowed; }

        .gx-textarea::placeholder { color: #777777; }

        .gx-copy-btn { transition: background 0.15s ease, color 0.15s ease; }
        .gx-copy-btn:hover { background: #2a2a2a; color: #ffffff; }

        .gx-remove-img-btn:hover { background: #3a1f1f; color: #ff8a8a; }

        .gx-markdown p { margin: 0 0 10px 0; }
        .gx-markdown p:last-child { margin-bottom: 0; }
        .gx-markdown pre { background: #0d0d0d; border: 1px solid #333333; border-radius: 8px; padding: 12px; overflow-x: auto; }
        .gx-markdown code { background: #0d0d0d; padding: 2px 5px; border-radius: 4px; font-size: 0.9em; }
        .gx-markdown pre code { background: transparent; padding: 0; }
        .gx-markdown ul, .gx-markdown ol { margin: 0 0 10px 20px; }
        .gx-markdown a { color: #8ab4f8; }
      `}</style>

      {/* Sidebar */}
      <aside style={styles.sidebar}>
        <div style={styles.sidebarHeader}>Gen-Xora</div>
        <label
  style={{
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "12px",
    fontSize: "13px",
    color: "#ccc",
  }}
>
  <input
    type="checkbox"
    checked={voiceEnabled}
    onChange={() =>
      setVoiceEnabled(!voiceEnabled)
    }
  />
  Voice Output
</label>
        <button
          type="button"
          className="gx-new-chat-btn"
          style={styles.newChatBtn}
          onClick={handleNewChat}
        >
          <PlusIcon />
          New chat
        </button>

        <div className="gx-scroll" style={styles.chatList}>
          {chatOrder.map((id) => (
            <div
              key={id}
              className={`gx-chat-item${id === currentChatId ? " active" : ""}`}
              style={styles.chatItem}
              onClick={() => setCurrentChatId(id)}
            >
              <span style={styles.chatItemTitle}>{chatTitles[id] || DEFAULT_TITLE}</span>
              <button
                type="button"
                className="gx-delete-btn"
                style={styles.deleteBtn}
                aria-label="Delete chat"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteChat(id);
                }}
              >
                <TrashIcon />
              </button>
            </div>
          ))}
        </div>
      </aside>

      {/* Main chat area */}
      <main style={styles.main}>
        <div className="gx-scroll" style={styles.chatScroll}>
          <div style={styles.chatInner}>
            {messages.length === 0 && !loading && (
              <div style={styles.emptyState}>
                <div style={{ fontSize: "22px", fontWeight: 600, color: "#aaaaaa" }}>
                  Gen-Xora
                </div>
                <div style={{ fontSize: "14px" }}>
                  Start the conversation by sending a message below.
                </div>
              </div>
            )}

            {messages.map((msg, index) => (
              <div
                key={index}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: msg.role === "user" ? "flex-end" : "flex-start",
                }}
              >
                <span style={styles.roleLabel}>{msg.role === "user" ? "You" : "Gen-Xora"}</span>

                <div
                  style={{
                    ...styles.bubble,
                    background: msg.role === "user" ? "#2f2f2f" : "#1f1f1f",
                  }}
                >
                  <div className="gx-markdown">
                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                  </div>
                </div>

                {msg.role === "ai" && (
                  <button
                    type="button"
                    className="gx-copy-btn"
                    style={styles.copyBtn}
                    onClick={() => handleCopy(msg.text, index)}
                  >
                    {copiedIndex === index ? (
                      <>
                        <CheckIcon /> Copied
                      </>
                    ) : (
                      <>
                        <CopyIcon /> Copy
                      </>
                    )}
                  </button>
                )}
              </div>
            ))}

            {loading && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                <span style={styles.roleLabel}>Gen-Xora</span>
                <div style={styles.thinking}>Thinking...</div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input area */}
        <div style={styles.inputWrap}>
          <div style={styles.inputInner}>
            {imagePreview && (
              <div style={styles.imagePreviewCard}>
                <img src={imagePreview} alt={image?.name || "Selected image"} style={styles.imagePreviewThumb} />
                <span style={styles.imagePreviewName}>{image?.name}</span>
                <button
                  type="button"
                  className="gx-remove-img-btn"
                  style={styles.removeImgBtn}
                  aria-label="Remove image"
                  onClick={removeImage}
                >
                  <CloseIcon />
                </button>
              </div>
            )}

            <div style={styles.inputBar}>
              <label className="gx-icon-btn" style={styles.iconBtn} title="Attach image">
                <PaperclipIcon />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageSelect(file);
                  }}
                />
              </label>

              <textarea
                ref={textareaRef}
                className="gx-textarea"
                style={styles.textarea}
                value={message}
                placeholder="Message Gen-Xora..."
                rows={1}
                onChange={handleTextareaChange}
                onKeyDown={handleKeyDown}
              />

              <button
                type="button"
                className={`gx-icon-btn gx-mic-btn${listening ? " listening" : ""}`}
                style={styles.iconBtn}
                title="Voice input"
                onClick={startListening}
              >
                <MicIcon />
              </button>

              <button
                type="button"
                className="gx-send-btn"
                style={styles.sendBtn}
                title="Send message"
                disabled={!message.trim() || loading}
                onClick={sendMessage}
              >
                <SendIcon />
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}