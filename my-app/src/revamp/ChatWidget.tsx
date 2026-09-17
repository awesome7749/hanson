import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { LIVE } from "./deployment";
import { Icon } from "./Shared";
import { fbqTrack } from "./pixel";

interface Message {
  role: "visitor" | "assistant";
  text: string;
}

const GREETING: Message = {
  role: "assistant",
  text: "Hi! I can help with heat-pump quotes, Mass Save rebates and scheduling. What can we help with today?",
};

function chatSessionId() {
  try {
    const existing = sessionStorage.getItem("hanson-chat-id");
    if (existing) return existing;
    const id = globalThis.crypto?.randomUUID?.() || `chat-${Date.now()}`;
    sessionStorage.setItem("hanson-chat-id", id);
    return id;
  } catch {
    return `chat-${Date.now()}`;
  }
}

// Floating customer chat. The widget only renders the conversation; replies
// come from POST /api/chat, where the provider can be swapped for a live
// agent or an AI without changing this component.
export default function ChatWidget() {
  const { pathname } = useLocation();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([GREETING]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const log = useRef<HTMLDivElement>(null);
  useEffect(() => {
    log.current?.scrollTo({ top: log.current.scrollHeight });
  }, [messages, open]);
  if (pathname.startsWith("/admin") || pathname.startsWith("/staff")) {
    return null;
  }
  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    const history: Message[] = [...messages, { role: "visitor", text: trimmed }];
    setMessages(history);
    setInput("");
    if (!LIVE) {
      setMessages([
        ...history,
        {
          role: "assistant",
          text: "This design preview doesn’t send messages. On the live site a team member follows up from here.",
        },
      ]);
      return;
    }
    setBusy(true);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: chatSessionId(), messages: history }),
      });
      const body = await response.json().catch(() => null);
      const reply =
        body?.reply?.text ||
        body?.error ||
        "We couldn’t send that. Call or text us at (401) 612-3443.";
      setMessages([...history, { role: "assistant", text: reply }]);
      if (body?.reply?.handoff) fbqTrack("track", "Contact");
    } catch {
      setMessages([
        ...history,
        {
          role: "assistant",
          text: "We couldn’t send that. Call or text us at (401) 612-3443.",
        },
      ]);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="chat-widget">
      {open && (
        <div className="chat-panel" role="dialog" aria-label="Chat with Hanson Home">
          <div className="chat-head">
            <div>
              <b>Hanson Home</b>
              <span>We reply within 1 business day</span>
            </div>
            <button
              className="icon-button"
              onClick={() => setOpen(false)}
              aria-label="Close chat"
            >
              <Icon name="close" size={18} />
            </button>
          </div>
          <div className="chat-log" ref={log}>
            {messages.map((m, i) => (
              <p key={i} className={`chat-msg ${m.role}`}>
                {m.text}
              </p>
            ))}
            {busy && <p className="chat-msg assistant chat-typing">…</p>}
          </div>
          <div className="chat-quick">
            <button type="button" onClick={() => { setOpen(false); nav("/start?intent=heat-pump"); }}>
              Get my quote
            </button>
            <a href="tel:+14016123443" onClick={() => fbqTrack("track", "Contact")}>
              Call or text us
            </a>
          </div>
          <form
            className="chat-input"
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message…"
              aria-label="Your message"
              maxLength={1000}
            />
            <button type="submit" className="button small" disabled={busy || !input.trim()}>
              Send
            </button>
          </form>
        </div>
      )}
      <button
        type="button"
        className="chat-launcher"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        {open ? <Icon name="close" size={21} /> : <Icon name="chat" size={21} />}
        <span>{open ? "Close" : "Chat with us"}</span>
      </button>
    </div>
  );
}
