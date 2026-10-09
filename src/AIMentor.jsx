import { useEffect, useRef, useState, useMemo } from "react";
import { apiRequest, apiStreamRequest } from "./services/api.js";
import MarkdownMessage, { MarkdownActions } from "./components/MarkdownMessage.jsx";
import ErrorBanner from "./components/ErrorBanner.jsx";
import {
  Bot,
  Sparkles,
  Send,
  Plus,
  CheckSquare,
  Target,
  FileText,
  BookOpen,
  History,
  Pencil,
  Paperclip,
  Image as ImageIcon,
  Camera,
  Mic,
  X,
  ChevronDown,
  Database,
  GraduationCap,
  MessageCircle,
  Brain,
  CircleCheck,
  Trash2,
  Volume2,
  Trophy,
  StopCircle,
} from "lucide-react";

import "./AIMentor.css";
import "./components/MarkdownMessage.css";

const STORAGE_KEY = "studyos-ai-history";

const AI_MODES = [
  {
    id: "ask",
    label: "Ask",
    description: "General questions and StudyOS help",
    icon: MessageCircle,
    color: "blue",
  },
  {
    id: "think",
    label: "Think",
    description: "Deep problem-solving and step-by-step breakdown",
    icon: Brain,
    color: "purple",
  },
  {
    id: "exam",
    label: "Exam Ready",
    description: "Targeted revision, key formulas, and exam prep",
    icon: GraduationCap,
    color: "cyan",
  },
];

const ACTIONS = [
  {
    id: "CREATE_TASK",
    label: "Task",
    description: "Create or manage tasks",
    icon: CheckSquare,
    color: "blue",
    target: "Tasks",
  },
  {
    id: "CREATE_GOAL",
    label: "Goal",
    description: "Set or track study goals",
    icon: Target,
    color: "purple",
    target: "Goals",
  },
  {
    id: "CREATE_NOTE",
    label: "Note",
    description: "Summarize and save notes",
    icon: FileText,
    color: "cyan",
    target: "Notes",
  },
  {
    id: "CREATE_SUBJECT",
    label: "Subject",
    description: "Add or manage course subjects",
    icon: BookOpen,
    color: "green",
    target: "Subjects",
  },
];

const QUICK_PROMPTS = [
  {
    icon: Brain,
    title: "Java OOP Concepts",
    text: "Explain Java OOP concepts (Encapsulation, Inheritance, Polymorphism, Abstraction) with simple real-world code examples.",
    badge: "Concepts",
    theme: "purple",
  },
  {
    icon: Database,
    title: "Primary vs Unique Key",
    text: "What is the difference between a primary key and a unique key in SQL? Provide syntax examples.",
    badge: "Database",
    theme: "blue",
  },
  {
    icon: GraduationCap,
    title: "3-Day DBMS Revision",
    text: "Create a 3-day DBMS revision plan covering normalization, transactions, ACID properties, and indexing.",
    badge: "Revision Plan",
    theme: "cyan",
  },
  {
    icon: Trophy,
    title: "Placement Readiness",
    text: "Analyze placement readiness for a software engineer role and suggest high-yield DSA and CS fundamentals topics.",
    badge: "Placement",
    theme: "amber",
  },
];

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function createNewConversation() {
  return {
    id: createId(),
    title: "New Chat",
    messages: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function loadHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function getChatTitle(messages) {
  const firstUser = messages.find((m) => m.role === "user");
  if (!firstUser) return "New Chat";
  const trimmed = firstUser.content.trim();
  return trimmed.length <= 36 ? trimmed : `${trimmed.slice(0, 36)}...`;
}

export default function AIMentor() {
  const [conversations, setConversations] = useState(loadHistory);
  const [activeConversationId, setActiveConversationId] = useState(() => {
    const saved = loadHistory();
    return saved.length > 0 ? saved[0].id : null;
  });

  const [mode, setMode] = useState("ask");
  const [modeOpen, setModeOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [actionsOpen, setActionsOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [searchHistory, setSearchHistory] = useState("");

  const [isThinking, setIsThinking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [chatError, setChatError] = useState(null);
  const [autoScroll, setAutoScroll] = useState(true);

  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);

  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const cameraVideoRef = useRef(null);
  const recognitionRef = useRef(null);
  const chatBottomRef = useRef(null);
  const requestControllerRef = useRef(null);
  const historyDropdownRef = useRef(null);

  const activeConversation = useMemo(() => {
    return conversations.find((c) => c.id === activeConversationId) || null;
  }, [conversations, activeConversationId]);

  const messages = activeConversation?.messages || [];
  const currentMode = AI_MODES.find((item) => item.id === mode) || AI_MODES[0];
  const hasInput = message.trim().length > 0 || attachments.length > 0;

  // Persist conversations
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
    } catch {
      // Ignore quota error
    }
  }, [conversations]);

  // Auto-scroll on new message
  const latestMessageContent = messages[messages.length - 1]?.content;
  useEffect(() => {
    if (autoScroll && chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length, latestMessageContent, isThinking, autoScroll]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (requestControllerRef.current) {
        requestControllerRef.current.abort();
      }
    };
  }, [cameraStream]);

  // Close history popover on outside click
  useEffect(() => {
    if (!historyOpen) return;
    const handleOutside = (e) => {
      if (historyDropdownRef.current && !historyDropdownRef.current.contains(e.target)) {
        setHistoryOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [historyOpen]);

  const createConversation = () => {
    const newConv = createNewConversation();
    setConversations((prev) => [newConv, ...prev]);
    setActiveConversationId(newConv.id);
    setMessage("");
    setAttachments([]);
    setChatError(null);
    setHistoryOpen(false);
    setActionsOpen(false);
    setTimeout(() => textareaRef.current?.focus(), 80);
  };

  const ensureConversation = () => {
    if (activeConversationId) {
      const existing = conversations.find((c) => c.id === activeConversationId);
      if (existing) return activeConversationId;
    }
    const newConv = createNewConversation();
    setConversations((prev) => [newConv, ...prev]);
    setActiveConversationId(newConv.id);
    return newConv.id;
  };

  const handleFiles = (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    const newAttachments = files.map((file) => ({
      id: createId(),
      name: file.name,
      type: file.type,
      size: file.size,
      kind: file.type.startsWith("image/") ? "image" : "file",
      file,
    }));
    setAttachments((prev) => [...prev, ...newAttachments]);
    event.target.value = "";
  };

  const removeAttachment = (id) => {
    setAttachments((prev) => prev.filter((item) => item.id !== id));
  };

  const startCamera = async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        console.warn("Camera not supported in this browser.");
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      setCameraStream(stream);
      setCameraOpen(true);
      setTimeout(() => {
        if (cameraVideoRef.current) cameraVideoRef.current.srcObject = stream;
      }, 100);
    } catch {
      console.warn("Camera access denied or unavailable.");
    }
  };

  const closeCamera = () => {
    if (cameraStream) cameraStream.getTracks().forEach((track) => track.stop());
    setCameraStream(null);
    setCameraOpen(false);
  };

  const captureCameraImage = () => {
    const video = cameraVideoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], `studyos-capture-${Date.now()}.jpg`, { type: "image/jpeg" });
      setAttachments((prev) => [
        ...prev,
        { id: createId(), name: file.name, type: file.type, size: file.size, kind: "image", file },
      ]);
      closeCamera();
    }, "image/jpeg");
  };

  const startVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn("Speech recognition not supported in this browser.");
      return;
    }
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "en-IN";
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (e) => {
      let transcript = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        transcript += e.results[i][0].transcript;
      }
      setMessage((prev) => (prev.trim() ? `${prev.trim()} ${transcript}` : transcript));
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
    recognition.start();
  };

  const streamAssistant = async (text, convId, assistantId, historyList, continueAnswer, signal) => {
    const response = await apiStreamRequest("/ai/chat/stream", {
      signal,
      body: { message: text, history: historyList.slice(-20), continue: continueAnswer },
    });
    if (!response.ok || !response.body) {
      throw new Error(`AI request failed (${response.status})`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let complete = null;
    let accumulated = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const events = buffer.split("\n\n");
      buffer = events.pop() || "";
      for (const event of events) {
        const line = event.split("\n").find((p) => p.startsWith("data: "));
        if (!line) continue;
        let payload;
        try {
          payload = JSON.parse(line.slice(6));
        } catch {
          continue;
        }
        if (payload.type === "error") {
          throw Object.assign(new Error(payload.message), { status: payload.status, code: payload.code });
        }
        if (payload.type === "token") {
          accumulated += payload.text;
          setConversations((prev) =>
            prev.map((c) => {
              if (c.id === convId) {
                return {
                  ...c,
                  messages: c.messages.map((m) =>
                    m.id === assistantId ? { ...m, content: accumulated } : m
                  ),
                };
              }
              return c;
            })
          );
        }
        if (payload.type === "done") {
          complete = payload.response;
        }
      }
    }

    if (complete) {
      const cleanMessage = (complete.message || accumulated)
        .replace(/(?:^|\n)```studyos-action[\s\S]*?(?:```|$)/gi, "")
        .trim();

      setConversations((prev) =>
        prev.map((c) => {
          if (c.id === convId) {
            return {
              ...c,
              messages: c.messages.map((m) =>
                m.id === assistantId
                  ? {
                      ...m,
                      content: cleanMessage || accumulated,
                      truncated: complete.truncated,
                      confirmationId: complete.confirmationId,
                      action: complete.confirmationRequired
                        ? complete.action
                        : complete.action
                        ? { target: complete.action }
                        : undefined,
                    }
                  : m
              ),
            };
          }
          return c;
        })
      );
      if (complete.action && !complete.confirmationRequired) {
        window.dispatchEvent(new Event("studyos-data-changed"));
      }
    }
  };

  const sendMessage = async () => {
    const text = message.trim();
    if (!text && !attachments.length) return;
    if (isThinking) return;

    const convId = ensureConversation();
    const userMsg = {
      id: createId(),
      role: "user",
      content: text || "Please analyze the attached files.",
      attachments: attachments.map((a) => ({ name: a.name, type: a.type, kind: a.kind, size: a.size })),
      mode,
      createdAt: new Date().toISOString(),
    };

    const currentConv = conversations.find((c) => c.id === convId);
    const priorMessages = currentConv ? currentConv.messages : [];
    const updatedHistory = [...priorMessages, userMsg];

    setMessage("");
    setAttachments([]);
    setChatError(null);
    setIsThinking(true);

    const assistantId = createId();
    const initialAssistantMsg = {
      id: assistantId,
      role: "assistant",
      content: "",
      createdAt: new Date().toISOString(),
    };

    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === convId) {
          const newMessages = [...c.messages, userMsg, initialAssistantMsg];
          return {
            ...c,
            title: c.title === "New Chat" ? getChatTitle(newMessages) : c.title,
            messages: newMessages,
            updatedAt: new Date().toISOString(),
          };
        }
        return c;
      })
    );

    const controller = new AbortController();
    requestControllerRef.current = controller;

    try {
      await streamAssistant(userMsg.content, convId, assistantId, updatedHistory, false, controller.signal);
    } catch (err) {
      if (!controller.signal.aborted) {
        setChatError(err);
        setConversations((prev) =>
          prev.map((c) => {
            if (c.id === convId) {
              return {
                ...c,
                messages: c.messages.map((m) =>
                  m.id === assistantId
                    ? {
                        ...m,
                        content: m.content || err.message || "The AI request could not be completed.",
                        isError: true,
                      }
                    : m
                ),
              };
            }
            return c;
          })
        );
      }
    } finally {
      requestControllerRef.current = null;
      setIsThinking(false);
    }
  };

  const retryMessage = async (assistantMessage, continueAnswer = false) => {
    if (isThinking) return;
    const currentConv = conversations.find((c) => c.id === activeConversationId);
    if (!currentConv) return;
    const msgIndex = currentConv.messages.findIndex((m) => m.id === assistantMessage.id);
    if (msgIndex < 0) return;

    const priorMessages = currentConv.messages.slice(0, msgIndex);
    const latestUser = [...priorMessages].reverse().find((m) => m.role === "user");
    if (!latestUser) return;

    setChatError(null);
    setIsThinking(true);
    const controller = new AbortController();
    requestControllerRef.current = controller;

    try {
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id === activeConversationId) {
            return {
              ...c,
              messages: c.messages.map((m) =>
                m.id === assistantMessage.id ? { ...m, content: continueAnswer ? m.content : "", isError: false } : m
              ),
            };
          }
          return c;
        })
      );
      await streamAssistant(latestUser.content, activeConversationId, assistantMessage.id, priorMessages, continueAnswer, controller.signal);
    } catch (err) {
      if (!controller.signal.aborted) setChatError(err);
    } finally {
      requestControllerRef.current = null;
      setIsThinking(false);
    }
  };

  const confirmAIAction = async (confirmationId, conversationId, messageId) => {
    setIsThinking(true);
    try {
      const response = await apiRequest("/ai/chat", {
        method: "POST",
        body: { message: "Confirm the requested action.", confirmationId, confirm: true },
      });
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id !== conversationId) return c;
          return {
            ...c,
            messages: c.messages
              .map((m) => (m.id === messageId ? { ...m, confirmationId: undefined, confirmationComplete: true } : m))
              .concat({
                id: createId(),
                role: "assistant",
                content: response.message,
                createdAt: new Date().toISOString(),
              }),
          };
        })
      );
      window.dispatchEvent(new Event("studyos-data-changed"));
    } catch (err) {
      setChatError(err);
    } finally {
      setIsThinking(false);
    }
  };

  const handleComposerKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleComposerChange = (e) => {
    setMessage(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 180)}px`;
  };

  const handlePromptClick = (text) => {
    setMessage(text);
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.style.height = "auto";
        textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
      }
    }, 50);
  };

  const executeActionShortcut = (action) => {
    setActionsOpen(false);
    handlePromptClick(`Please help me create a ${action.label} in StudyOS.`);
  };

  const deleteConversation = (id, e) => {
    e.stopPropagation();
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeConversationId === id) {
      const remaining = conversations.filter((c) => c.id !== id);
      setActiveConversationId(remaining.length > 0 ? remaining[0].id : null);
    }
  };

  const filteredHistory = useMemo(() => {
    return conversations
      .filter((c) => c.title.toLowerCase().includes(searchHistory.toLowerCase()))
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  }, [conversations, searchHistory]);

  const ModeIcon = currentMode.icon;

  return (
    <div className="ai-page">
      {/* =========================================================
          PAGE HEADER (Tasks / Pomodoro style alignment)
          ========================================================= */}
      <header className="ai-page-header">
        <div className="ai-page-heading">
          <div className="ai-page-heading-icon">
            <Bot size={28} />
          </div>
          <div className="ai-page-heading-text">
            <div className="ai-title-row">
              <h1>AI Mentor</h1>
              <span className="ai-pro-badge">
                <Sparkles size={11} />
                Intelligent Tutor
              </span>
            </div>
            <p>Your intelligent study companion for concepts, revision, problem solving, and placements.</p>
          </div>
        </div>

        <div className="ai-page-header-actions">
          <div className="ai-history-wrapper" ref={historyDropdownRef}>
            <button
              type="button"
              className={`ai-btn-secondary ${historyOpen ? "active" : ""}`}
              onClick={() => setHistoryOpen(!historyOpen)}
              title="View conversation history"
            >
              <History size={15} />
              <span>History</span>
              {conversations.length > 0 && <span className="ai-count-chip">{conversations.length}</span>}
            </button>

            {historyOpen && (
              <div className="ai-history-popover">
                <div className="ai-history-popover-header">
                  <div>
                    <strong>Chat History</strong>
                    <p>Recent StudyOS conversations</p>
                  </div>
                  <button type="button" className="ai-close-btn" onClick={() => setHistoryOpen(false)}>
                    <X size={14} />
                  </button>
                </div>

                <div className="ai-history-search">
                  <MessageCircle size={13} />
                  <input
                    value={searchHistory}
                    onChange={(e) => setSearchHistory(e.target.value)}
                    placeholder="Search conversations..."
                  />
                </div>

                <button type="button" className="ai-history-new-btn" onClick={createConversation}>
                  <Plus size={14} />
                  <span>Start New Chat</span>
                </button>

                <div className="ai-history-list">
                  {filteredHistory.length === 0 ? (
                    <div className="ai-history-empty">
                      <History size={20} />
                      <strong>No conversations found</strong>
                      <span>Start a chat or ask a question to see history.</span>
                    </div>
                  ) : (
                    filteredHistory.map((c) => (
                      <div
                        key={c.id}
                        className={`ai-history-item ${c.id === activeConversationId ? "selected" : ""}`}
                        onClick={() => {
                          setActiveConversationId(c.id);
                          setHistoryOpen(false);
                        }}
                      >
                        <MessageCircle size={14} className="ai-history-item-icon" />
                        <div className="ai-history-item-content">
                          <strong>{c.title}</strong>
                          <small>{new Date(c.updatedAt).toLocaleDateString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</small>
                        </div>
                        <button
                          type="button"
                          className="ai-history-delete-btn"
                          title="Delete conversation"
                          onClick={(e) => deleteConversation(c.id, e)}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <button type="button" className="ai-btn-primary" onClick={createConversation} title="New conversation">
            <Pencil size={14} />
            <span>New Chat</span>
          </button>
        </div>
      </header>

      {/* =========================================================
          MAIN CHAT CONTAINER
          ========================================================= */}
      <main className="ai-chat-card">
        {/* Top toolbar */}
        <div className="ai-chat-topbar">
          <div className="ai-topbar-info">
            <div className="ai-status-indicator">
              <span className="ai-status-dot" />
              <strong>{activeConversation ? activeConversation.title : "New Chat"}</strong>
            </div>
          </div>

          {/* Mode Selector */}
          <div className="ai-mode-pill-wrapper">
            <button
              type="button"
              className="ai-mode-selector-btn"
              onClick={() => setModeOpen(!modeOpen)}
              title="Select AI Mentor Mode"
            >
              <span className={`ai-mode-icon-accent mode-${currentMode.color || "blue"}`}>
                <ModeIcon size={14} />
              </span>
              <span>{currentMode.label}</span>
              <ChevronDown size={12} className={modeOpen ? "rotate" : ""} />
            </button>

            {modeOpen && (
              <div className="ai-mode-dropdown">
                {AI_MODES.map((item) => {
                  const IconComponent = item.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      className={`ai-mode-option mode-opt-${item.color || "blue"} ${mode === item.id ? "active" : ""}`}
                      onClick={() => {
                        setMode(item.id);
                        setModeOpen(false);
                      }}
                    >
                      <div className={`ai-mode-option-icon icon-${item.color || "blue"}`}>
                        <IconComponent size={14} />
                      </div>
                      <div className="ai-mode-option-text">
                        <strong>{item.label}</strong>
                        <small>{item.description}</small>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Scrollable Conversation Area */}
        <div
          className="ai-chat-scroll-area"
          onScroll={(e) => {
            const el = e.currentTarget;
            setAutoScroll(el.scrollHeight - el.scrollTop - el.clientHeight < 80);
          }}
        >
          {chatError && (
            <div className="ai-error-banner-wrap">
              <ErrorBanner error={chatError} onRetry={() => retryMessage(messages[messages.length - 1], false)} />
            </div>
          )}

          {/* EMPTY STATE */}
          {messages.length === 0 ? (
            <div className="ai-welcome-container">
              <div className="ai-welcome-hero">
                <div className="ai-welcome-avatar">
                  <Bot size={34} />
                </div>
                <h2>How can StudyOS AI assist you today?</h2>
                <p>
                  Ask questions, break down complex concepts, prepare for exams, or request actions to manage your
                  workspace.
                </p>
              </div>

              {/* Quick Prompts Grid */}
              <div className="ai-quick-grid">
                {QUICK_PROMPTS.map((prompt, idx) => {
                  const PromptIcon = prompt.icon;
                  return (
                    <button
                      key={idx}
                      type="button"
                      className={`ai-quick-card theme-${prompt.theme}`}
                      onClick={() => handlePromptClick(prompt.text)}
                    >
                      <div className="ai-quick-card-header">
                        <div className={`ai-quick-card-icon icon-${prompt.theme}`}>
                          <PromptIcon size={16} />
                        </div>
                        <span className={`ai-quick-card-badge badge-${prompt.theme}`}>{prompt.badge}</span>
                      </div>
                      <strong>{prompt.title}</strong>
                      <p>{prompt.text}</p>
                    </button>
                  );
                })}
              </div>

              {/* StudyOS Quick Action Pills */}
              <div className="ai-action-pills-section">
                <span className="ai-action-pills-label">Quick Workspace Actions:</span>
                <div className="ai-action-pills">
                  {ACTIONS.map((action) => {
                    const ActionIcon = action.icon;
                    return (
                      <button
                        key={action.id}
                        type="button"
                        className={`ai-action-pill pill-${action.color}`}
                        onClick={() => executeActionShortcut(action)}
                      >
                        <span className={`ai-action-pill-icon icon-${action.color}`}>
                          <ActionIcon size={13} />
                        </span>
                        <span>Create {action.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            /* CONVERSATION MESSAGES */
            <div className="ai-messages-list">
              {messages.map((item) => (
                <div
                  key={item.id}
                  className={`ai-message-row ${item.role === "user" ? "user-row" : "assistant-row"}`}
                >
                  {item.role === "assistant" && (
                    <div className="ai-avatar-circle">
                      <Bot size={16} />
                    </div>
                  )}

                  <div className={`ai-message-bubble ${item.role === "user" ? "user-bubble" : "assistant-bubble"}`}>
                    {item.role === "assistant" && (
                      <div className="ai-bubble-header">
                        <span className="ai-assistant-name">StudyOS AI</span>
                        <span className="ai-timestamp">
                          {new Date(item.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    )}

                    {/* Content */}
                    <div className="ai-bubble-content">
                      {item.role === "user" ? (
                        <p className="ai-user-text">{item.content}</p>
                      ) : (
                        <MarkdownMessage text={item.content} />
                      )}
                    </div>

                    {/* Attachments if any */}
                    {item.attachments?.length > 0 && (
                      <div className="ai-msg-attachments">
                        {item.attachments.map((file, fIdx) => (
                          <span key={fIdx} className="ai-msg-file-tag">
                            {file.kind === "image" ? <ImageIcon size={11} /> : <FileText size={11} />}
                            {file.name}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Action Execution Feedback */}
                    {item.action && (
                      <div className="ai-action-badge">
                        <CircleCheck size={12} />
                        <span>Workspace action applied: {item.action.target || item.action}</span>
                      </div>
                    )}

                    {/* Action Confirmation Button */}
                    {item.confirmationId && (
                      <button
                        type="button"
                        className="ai-action-confirm-btn"
                        disabled={isThinking}
                        onClick={() => confirmAIAction(item.confirmationId, activeConversationId, item.id)}
                      >
                        Confirm {String(item.action || "action").replace(/^delete/, "delete ")}
                      </button>
                    )}

                    {/* EXACTLY ONE ACTION TOOLBAR PER ASSISTANT MESSAGE */}
                    {item.role === "assistant" && !item.isError && (
                      <div className="ai-message-actions-bar">
                        <MarkdownActions
                          text={item.content}
                          onRegenerate={() => retryMessage(item, false)}
                          onContinue={item.truncated ? () => retryMessage(item, true) : undefined}
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Thinking Indicator */}
              {isThinking && (
                <div className="ai-message-row assistant-row">
                  <div className="ai-avatar-circle thinking-avatar">
                    <Bot size={16} />
                  </div>
                  <div className="ai-message-bubble assistant-bubble typing-bubble">
                    <div className="ai-bubble-header">
                      <span className="ai-assistant-name">StudyOS AI</span>
                    </div>
                    <div className="ai-typing-indicator">
                      <span className="dot" />
                      <span className="dot" />
                      <span className="dot" />
                      <span className="ai-typing-label">Formulating response...</span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={chatBottomRef} />
            </div>
          )}
        </div>

        {/* Scroll To Bottom Button */}
        {!autoScroll && messages.length > 0 && (
          <button
            type="button"
            className="ai-scroll-bottom"
            onClick={() => {
              setAutoScroll(true);
              chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            Scroll to bottom
          </button>
        )}

        {/* =========================================================
            COMPOSER SECTION
            ========================================================= */}
        <div className="ai-composer-wrapper">
          {/* Actions Popover Menu */}
          {actionsOpen && (
            <div className="ai-actions-popover">
              <div className="ai-actions-popover-header">
                <strong>StudyOS Workspace Actions</strong>
                <button type="button" onClick={() => setActionsOpen(false)}>
                  <X size={14} />
                </button>
              </div>
              <div className="ai-actions-popover-grid">
                {ACTIONS.map((action) => {
                  const ActionIcon = action.icon;
                  return (
                    <button
                      key={action.id}
                      type="button"
                      className="ai-action-popover-item"
                      onClick={() => executeActionShortcut(action)}
                    >
                      <div className={`ai-action-icon-box ${action.color}`}>
                        <ActionIcon size={15} />
                      </div>
                      <div className="ai-action-item-info">
                        <strong>{action.label}</strong>
                        <small>{action.description}</small>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Attachment Chips */}
          {attachments.length > 0 && (
            <div className="ai-composer-attachments">
              {attachments.map((att) => (
                <div key={att.id} className="ai-attachment-chip">
                  {att.kind === "image" ? <ImageIcon size={12} /> : <FileText size={12} />}
                  <span>{att.name}</span>
                  <button type="button" onClick={() => removeAttachment(att.id)}>
                    <X size={11} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Main Input Box */}
          <div className={`ai-composer-box ${hasInput ? "has-input" : ""}`}>
            <button
              type="button"
              className={`ai-composer-action-btn ${actionsOpen ? "active" : ""}`}
              onClick={() => setActionsOpen(!actionsOpen)}
              title="Add StudyOS Action"
            >
              <Plus size={18} />
            </button>

            <textarea
              ref={textareaRef}
              value={message}
              onChange={handleComposerChange}
              onKeyDown={handleComposerKeyDown}
              placeholder="Message StudyOS AI... (Shift + Enter for new line)"
              rows={1}
            />

            <div className="ai-composer-tools">
              {/* File Inputs */}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                style={{ display: "none" }}
                onChange={handleFiles}
              />
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                multiple
                style={{ display: "none" }}
                onChange={handleFiles}
              />

              <button
                type="button"
                className="ai-tool-btn"
                onClick={() => fileInputRef.current?.click()}
                title="Attach file"
              >
                <Paperclip size={16} />
              </button>

              <button
                type="button"
                className="ai-tool-btn"
                onClick={() => imageInputRef.current?.click()}
                title="Attach image"
              >
                <ImageIcon size={16} />
              </button>

              <button
                type="button"
                className="ai-tool-btn"
                onClick={startCamera}
                title="Camera capture"
              >
                <Camera size={16} />
              </button>

              <button
                type="button"
                className={`ai-tool-btn ${isListening ? "active-mic" : ""}`}
                onClick={startVoiceInput}
                title="Voice input"
              >
                {isListening ? <Volume2 size={16} /> : <Mic size={16} />}
              </button>

              {/* Send or Stop Button */}
              {isThinking ? (
                <button
                  type="button"
                  className="ai-stop-btn"
                  onClick={() => requestControllerRef.current?.abort()}
                  title="Stop generating"
                >
                  <StopCircle size={17} />
                  <span>Stop</span>
                </button>
              ) : (
                <button
                  type="button"
                  className={`ai-send-btn ${hasInput ? "active" : ""}`}
                  disabled={!hasInput}
                  onClick={sendMessage}
                  title="Send message"
                >
                  <Send size={15} />
                </button>
              )}
            </div>
          </div>

          <div className="ai-composer-footer-note">
            <span>StudyOS AI can answer general questions and manage your workspace. Verify important formulas and dates.</span>
          </div>
        </div>
      </main>

      {/* =========================================================
          CAMERA MODAL OVERLAY
          ========================================================= */}
      {cameraOpen && (
        <div className="ai-camera-modal-backdrop">
          <div className="ai-camera-modal">
            <div className="ai-camera-modal-header">
              <strong>Camera Capture</strong>
              <button type="button" onClick={closeCamera}>
                <X size={16} />
              </button>
            </div>
            <div className="ai-camera-preview">
              <video ref={cameraVideoRef} autoPlay playsInline muted />
            </div>
            <div className="ai-camera-modal-footer">
              <button type="button" className="ai-btn-secondary" onClick={closeCamera}>
                Cancel
              </button>
              <button type="button" className="ai-btn-primary" onClick={captureCameraImage}>
                <Camera size={15} />
                Capture Photo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
