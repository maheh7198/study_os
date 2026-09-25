import { useEffect, useRef, useState } from "react";
import {
  Bot,
  Sparkles,
  Send,
  Plus,
  CheckSquare,
  Target,
  CalendarDays,
  Timer,
  BarChart3,
  BookOpen,
  BriefcaseBusiness,
  History,
  Pencil,
  Paperclip,
  Image as ImageIcon,
  Camera,
  Mic,
  X,
  ChevronDown,
  GraduationCap,
  MessageCircle,
  Brain,
  ShieldCheck,
  FileText,
  Flame,
  Lightbulb,
  WandSparkles,
  Code2,
  Mic2,
  Route,
  CircleCheck,
  Trash2,
  Volume2,
  Trophy,
  Clock3,
} from "lucide-react";

import "./AIMentor.css";

const STORAGE_KEY = "studyos-ai-history";

const AI_MODES = [
  {
    id: "ask",
    label: "Ask",
    description: "General questions and StudyOS help",
    icon: MessageCircle,
  },
  {
    id: "think",
    label: "Think",
    description: "Break down difficult problems",
    icon: Brain,
  },
  {
    id: "exam",
    label: "Exam Ready",
    description: "Prepare for exams and revision",
    icon: GraduationCap,
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
    description: "Create or manage goals",
    icon: Target,
    color: "purple",
    target: "Goals",
  },
  {
    id: "CREATE_NOTE",
    label: "Note",
    description: "Create or manage notes",
    icon: FileText,
    color: "cyan",
    target: "Notes",
  },
  {
    id: "CREATE_SUBJECT",
    label: "Subject",
    description: "Add or manage subjects",
    icon: BookOpen,
    color: "green",
    target: "Subjects",
  },
  {
    id: "CREATE_STUDY_PLAN",
    label: "Study Plan",
    description: "Create a study schedule",
    icon: CalendarDays,
    color: "orange",
    target: "Study Plan",
  },
  {
    id: "CREATE_HABIT",
    label: "Habit",
    description: "Create or manage habits",
    icon: Flame,
    color: "pink",
    target: "Habit Tracker",
  },
  {
    id: "START_FOCUS",
    label: "Focus",
    description: "Start a focus session",
    icon: Timer,
    color: "red",
    target: "Pomodoro",
  },
  {
    id: "PLACEMENT_ROADMAP",
    label: "Placement",
    description: "Build placement preparation",
    icon: BriefcaseBusiness,
    color: "indigo",
    target: "Placement Hub",
  },
];

const QUICK_PROMPTS = [
  {
    label: "Explain something to me",
    icon: Lightbulb,
    text: "Explain this topic to me in a simple way.",
  },
  {
    label: "Plan my study day",
    icon: CalendarDays,
    text: "Plan my study day based on my current StudyOS progress.",
  },
  {
    label: "Prepare me for my exam",
    icon: GraduationCap,
    text: "Help me prepare for my upcoming exam.",
  },
  {
    label: "Analyze my progress",
    icon: BarChart3,
    text: "Analyze my StudyOS progress and tell me what I should improve.",
  },
  {
    label: "Help me with placement",
    icon: BriefcaseBusiness,
    text: "Help me create a placement preparation plan.",
  },
  {
    label: "Give me a study strategy",
    icon: WandSparkles,
    text: "Give me a practical study strategy for me.",
  },
];

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function loadHistory() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) {
      return [];
    }

    const parsed = JSON.parse(saved);

    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function createNewConversation() {
  return {
    id: createId(),
    title: "New StudyOS Chat",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    messages: [],
  };
}

function getChatTitle(messages) {
  const firstUserMessage = messages.find(
    (message) => message.role === "user",
  );

  if (!firstUserMessage) {
    return "New StudyOS Chat";
  }

  const text = firstUserMessage.content.trim();

  return text.length <= 42
    ? text
    : `${text.slice(0, 42)}...`;
}

export default function AIMentor({ navigate, onAIAction }) {
  const [conversations, setConversations] = useState(loadHistory);
  const [activeConversationId, setActiveConversationId] =
    useState(null);

  const [mode, setMode] = useState("ask");
  const [modeOpen, setModeOpen] = useState(false);

  const [message, setMessage] = useState("");
  const [attachments, setAttachments] = useState([]);

  const [actionsOpen, setActionsOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  const [selectedAction, setSelectedAction] = useState(null);
  const [actionRequest, setActionRequest] = useState("");

  const [isThinking, setIsThinking] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);

  const [searchHistory, setSearchHistory] = useState("");

  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const cameraVideoRef = useRef(null);
  const recognitionRef = useRef(null);
  const chatBottomRef = useRef(null);

  const activeConversation =
    conversations.find(
      (conversation) =>
        conversation.id === activeConversationId,
    ) || null;

  const messages = activeConversation?.messages || [];

  const currentMode =
    AI_MODES.find((item) => item.id === mode) ||
    AI_MODES[0];

  const hasMessage =
    message.trim().length > 0 ||
    attachments.length > 0;

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(conversations),
    );
  }, [conversations]);

  useEffect(() => {
    if (
      !activeConversationId &&
      conversations.length > 0
    ) {
      setActiveConversationId(
        conversations[0].id,
      );
    }
  }, [activeConversationId, conversations]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages.length, isThinking]);

  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream
          .getTracks()
          .forEach((track) => track.stop());
      }

      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [cameraStream]);

  const createConversation = () => {
    const conversation =
      createNewConversation();

    setConversations((previous) => [
      conversation,
      ...previous,
    ]);

    setActiveConversationId(
      conversation.id,
    );

    setMessage("");
    setAttachments([]);
    setActionsOpen(false);
    setModeOpen(false);
    setSelectedAction(null);
    setHistoryOpen(false);

    setTimeout(() => {
      textareaRef.current?.focus();
    }, 100);
  };

  const ensureConversation = () => {
    if (activeConversationId) {
      return activeConversationId;
    }

    const conversation =
      createNewConversation();

    setConversations((previous) => [
      conversation,
      ...previous,
    ]);

    setActiveConversationId(
      conversation.id,
    );

    return conversation.id;
  };

  const addMessages = (
    conversationId,
    newMessages,
  ) => {
    setConversations((previous) =>
      previous.map((conversation) => {
        if (
          conversation.id !==
          conversationId
        ) {
          return conversation;
        }

        const updatedMessages = [
          ...conversation.messages,
          ...newMessages,
        ];

        return {
          ...conversation,
          title:
            getChatTitle(updatedMessages),
          messages: updatedMessages,
          updatedAt:
            new Date().toISOString(),
        };
      }),
    );
  };

  const handleModeChange = (nextMode) => {
    setMode(nextMode);
    setModeOpen(false);
  };

  const handleFiles = (event) => {
    const files = Array.from(
      event.target.files || [],
    );

    if (!files.length) {
      return;
    }

    const newAttachments = files.map(
      (file) => ({
        id: createId(),
        name: file.name,
        type: file.type,
        size: file.size,
        kind: file.type.startsWith(
          "image/",
        )
          ? "image"
          : "file",
        file,
      }),
    );

    setAttachments((previous) => [
      ...previous,
      ...newAttachments,
    ]);

    event.target.value = "";
  };

  const removeAttachment = (id) => {
    setAttachments((previous) =>
      previous.filter(
        (item) => item.id !== id,
      ),
    );
  };

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  const openImagePicker = () => {
    imageInputRef.current?.click();
  };

  const startCamera = async () => {
    try {
      if (
        !navigator.mediaDevices?.getUserMedia
      ) {
        alert(
          "Camera is not supported in this browser.",
        );
        return;
      }

      const stream =
        await navigator.mediaDevices.getUserMedia(
          {
            video: true,
            audio: false,
          },
        );

      setCameraStream(stream);
      setCameraOpen(true);

      setTimeout(() => {
        if (cameraVideoRef.current) {
          cameraVideoRef.current.srcObject =
            stream;
        }
      }, 100);
    } catch {
      alert(
        "Camera permission was not allowed. Please allow camera access and try again.",
      );
    }
  };

  const closeCamera = () => {
    if (cameraStream) {
      cameraStream
        .getTracks()
        .forEach((track) => track.stop());
    }

    setCameraStream(null);
    setCameraOpen(false);
  };

  const captureCameraImage = () => {
    const video =
      cameraVideoRef.current;

    if (!video) {
      return;
    }

    const canvas =
      document.createElement("canvas");

    canvas.width =
      video.videoWidth || 1280;

    canvas.height =
      video.videoHeight || 720;

    const context =
      canvas.getContext("2d");

    if (!context) {
      return;
    }

    context.drawImage(
      video,
      0,
      0,
      canvas.width,
      canvas.height,
    );

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          return;
        }

        const file = new File(
          [blob],
          `studyos-camera-${Date.now()}.jpg`,
          {
            type: "image/jpeg",
          },
        );

        setAttachments((previous) => [
          ...previous,
          {
            id: createId(),
            name: file.name,
            type: file.type,
            size: file.size,
            kind: "image",
            file,
          },
        ]);

        closeCamera();
      },
      "image/jpeg",
    );
  };

  const startVoiceInput = () => {
    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert(
        "Voice input is not supported in this browser. Try Chrome.",
      );
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const recognition =
      new SpeechRecognition();

    recognition.lang = "en-IN";
    recognition.interimResults = true;
    recognition.continuous = false;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      let transcript = "";

      for (
        let index = event.resultIndex;
        index < event.results.length;
        index += 1
      ) {
        transcript +=
          event.results[index][0]
            .transcript;
      }

      setMessage((previous) => {
        const prefix =
          previous.trim();

        return prefix
          ? `${prefix} ${transcript}`
          : transcript;
      });
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current =
      recognition;

    recognition.start();
  };

  const buildAIAction = (
    action,
    request,
  ) => ({
    action: action.id,
    target: action.target,
    request,
    data: {},
    source: "ai-mentor",
    userScoped: true,
    requiresConfirmation: true,
    createdAt:
      new Date().toISOString(),
  });

  const executeAction = (
    action,
    request,
  ) => {
    const structuredAction =
      buildAIAction(
        action,
        request,
      );

    if (onAIAction) {
      onAIAction(structuredAction);
    }

    const conversationId =
      ensureConversation();

    addMessages(
      conversationId,
      [
        {
          id: createId(),
          role: "user",
          content: request,
          createdAt:
            new Date().toISOString(),
          action: structuredAction,
        },
        {
          id: createId(),
          role: "assistant",
          content:
            `I understood this as a ${action.label} action for ${action.target}. The StudyOS action is ready for the secure backend and module connection.`,
          action: structuredAction,
          createdAt:
            new Date().toISOString(),
        },
      ],
    );

    setSelectedAction(null);
    setActionRequest("");
    setActionsOpen(false);

    if (navigate) {
      const targets = {
        Tasks: "Tasks",
        Goals: "Goals",
        Notes: "Notes",
        Subjects: "Subjects",
        "Study Plan": "Study Plan",
        "Habit Tracker":
          "Habit Tracker",
        Pomodoro: "Pomodoro",
        "Placement Hub":
          "Placement Hub",
      };

      const targetPage =
        targets[action.target];

      if (targetPage) {
        setTimeout(() => {
          navigate(targetPage);
        }, 300);
      }
    }
  };

  const openAction = (action) => {
    setSelectedAction(action);
    setActionRequest("");
    setActionsOpen(false);
  };

  const submitAction = () => {
    if (!selectedAction) {
      return;
    }

    const request =
      actionRequest.trim() ||
      `Create/manage ${selectedAction.label} for me.`;

    executeAction(
      selectedAction,
      request,
    );
  };

  const sendMessage = () => {
    const text = message.trim();

    if (
      !text &&
      !attachments.length
    ) {
      return;
    }

    const conversationId =
      ensureConversation();

    const attachmentSummary =
      attachments.map((item) => ({
        name: item.name,
        type: item.type,
        kind: item.kind,
        size: item.size,
      }));

    const userMessage = {
      id: createId(),
      role: "user",
      content:
        text ||
        "Please analyze the attached files.",
      attachments:
        attachmentSummary,
      mode,
      createdAt:
        new Date().toISOString(),
    };

    addMessages(
      conversationId,
      [userMessage],
    );

    setMessage("");
    setAttachments([]);
    setIsThinking(true);

    /*
      BACKEND CONNECTION POINT

      POST /api/ai/chat

      {
        message,
        mode,
        attachments,
        userId
      }

      React
        ↓
      Express
        ↓
      authenticated user_id
        ↓
      MySQL StudyOS data
        ↓
      AI service
        ↓
      structured response
        ↓
      StudyOS action dispatcher
    */

    setTimeout(() => {
      addMessages(
        conversationId,
        [
          {
            id: createId(),
            role: "assistant",
            content:
              "Your StudyOS AI service will answer here after the backend and AI provider are connected. The workspace is already prepared for questions, exam preparation, placement preparation, file/image analysis, voice input and StudyOS actions.",
            createdAt:
              new Date().toISOString(),
          },
        ],
      );

      setIsThinking(false);
    }, 700);
  };

  const handleTextareaKeyDown = (
    event,
  ) => {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();
      sendMessage();
    }
  };

  const handleQuickPrompt = (
    prompt,
  ) => {
    setMessage(prompt.text);

    setTimeout(() => {
      textareaRef.current?.focus();
    }, 50);
  };

  const handleExamPrompt = (
    text,
  ) => {
    setMode("exam");
    setMessage(text);

    setTimeout(() => {
      textareaRef.current?.focus();
    }, 50);
  };

  const handlePlacementPrompt = (
    text,
  ) => {
    setMode("ask");
    setMessage(text);

    setTimeout(() => {
      textareaRef.current?.focus();
    }, 50);
  };

  const deleteConversation = (id) => {
    setConversations((previous) =>
      previous.filter(
        (conversation) =>
          conversation.id !== id,
      ),
    );

    if (
      activeConversationId === id
    ) {
      setActiveConversationId(null);
    }
  };

  const filteredHistory =
    conversations
      .filter((conversation) =>
        conversation.title
          .toLowerCase()
          .includes(
            searchHistory.toLowerCase(),
          ),
      )
      .sort(
        (a, b) =>
          new Date(b.updatedAt) -
          new Date(a.updatedAt),
      );

  const openConversation = (id) => {
    setActiveConversationId(id);
    setHistoryOpen(false);
  };

  const ModeIcon = currentMode.icon;

  return (
    <div className="ai-mentor-page">
      {/* =====================================================
          HEADER
          ===================================================== */}

      <header className="ai-mentor-header">
        <div className="ai-mentor-heading">
          <div className="ai-mentor-heading-icon">
            <Bot
              size={28}
              strokeWidth={2}
            />

            <span />
          </div>

          <div className="ai-mentor-heading-content">
            <div className="ai-mentor-title-row">
              <h1>AI Mentor</h1>

              <span className="ai-workspace-badge">
                <i />
                AI Workspace
              </span>
            </div>

            <p>
              Your intelligent StudyOS
              assistant for learning,
              planning, exams,
              productivity and
              placement.
            </p>
          </div>
        </div>

        <div className="ai-header-actions">
          <button
            type="button"
            className="ai-history-button"
            onClick={() =>
              setHistoryOpen(
                (previous) =>
                  !previous,
              )
            }
          >
            <History size={14} />
            History
          </button>

          <button
            type="button"
            className="ai-new-chat-button"
            onClick={
              createConversation
            }
          >
            <Pencil size={13} />
            New chat
          </button>
        </div>

        {/* Compact history popup */}

        {historyOpen && (
          <div className="ai-history-popover">
            <div className="ai-history-popover-header">
              <div>
                <strong>
                  Chat history
                </strong>

                <span>
                  Your StudyOS AI
                  conversations
                </span>
              </div>

              <button
                type="button"
                onClick={() =>
                  setHistoryOpen(false)
                }
              >
                <X size={14} />
              </button>
            </div>

            <div className="ai-history-search">
              <MessageCircle
                size={13}
              />

              <input
                value={searchHistory}
                onChange={(event) =>
                  setSearchHistory(
                    event.target.value,
                  )
                }
                placeholder="Search conversations..."
              />
            </div>

            <button
              type="button"
              className="ai-history-new"
              onClick={
                createConversation
              }
            >
              <Plus size={13} />
              New chat
            </button>

            <div className="ai-history-list">
              {filteredHistory.length ===
              0 ? (
                <div className="ai-history-empty">
                  <History size={22} />

                  <strong>
                    No conversations yet
                  </strong>

                  <span>
                    Your StudyOS AI
                    conversations will
                    appear here.
                  </span>
                </div>
              ) : (
                filteredHistory.map(
                  (conversation) => (
                    <div
                      className={`ai-history-item ${
                        conversation.id ===
                        activeConversationId
                          ? "active"
                          : ""
                      }`}
                      key={
                        conversation.id
                      }
                    >
                      <button
                        type="button"
                        onClick={() =>
                          openConversation(
                            conversation.id,
                          )
                        }
                      >
                        <MessageCircle
                          size={13}
                        />

                        <span>
                          <strong>
                            {
                              conversation.title
                            }
                          </strong>

                          <small>
                            {new Date(
                              conversation.updatedAt,
                            ).toLocaleString()}
                          </small>
                        </span>
                      </button>

                      <button
                        type="button"
                        className="ai-history-delete"
                        onClick={() =>
                          deleteConversation(
                            conversation.id,
                          )
                        }
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  ),
                )
              )}
            </div>
          </div>
        )}
      </header>

      {/* =====================================================
          CHAT
          ===================================================== */}

      <main className="ai-chat-card">
        <div className="ai-chat-topbar">
          <div className="ai-chat-identity">
            <div className="ai-chat-avatar">
              <Bot size={18} />
              <span />
            </div>

            <div>
              <strong>
                StudyOS AI
              </strong>

              <small>
                <i />
                Ready to help
              </small>
            </div>
          </div>

          <div className="ai-current-mode">
            <ModeIcon size={12} />
            {currentMode.label}
          </div>
        </div>

        <div className="ai-chat-content">
          {messages.length === 0 ? (
            <div className="ai-welcome">
              <div className="ai-welcome-icon">
                <Bot size={31} />

                <Sparkles
                  size={13}
                  className="ai-welcome-sparkle"
                />
              </div>

              <h2>
                How can I help you today?
              </h2>

              <p>
                Ask general or personal
                questions, learn a
                concept, prepare for an
                exam, plan your day,
                analyze your progress
                or ask AI to manage
                your StudyOS workspace.
              </p>

              {/* Quick prompts */}

              <div className="ai-prompt-grid">
                {QUICK_PROMPTS.map(
                  (prompt) => {
                    const PromptIcon =
                      prompt.icon;

                    return (
                      <button
                        type="button"
                        key={
                          prompt.label
                        }
                        onClick={() =>
                          handleQuickPrompt(
                            prompt,
                          )
                        }
                      >
                        <PromptIcon
                          size={14}
                        />

                        <span>
                          {
                            prompt.label
                          }
                        </span>
                      </button>
                    );
                  },
                )}
              </div>

              {/* Exam preparation */}

              <section className="ai-special-card exam">
                <div className="ai-special-icon">
                  <GraduationCap
                    size={19}
                  />
                </div>

                <div className="ai-special-content">
                  <div className="ai-special-title">
                    <strong>
                      Exam Ready
                    </strong>

                    <span>
                      Study smarter
                    </span>
                  </div>

                  <p>
                    Tell me your subject,
                    exam date and available
                    study time. I can
                    prepare a structured
                    revision strategy.
                  </p>

                  <div className="ai-special-actions">
                    <button
                      type="button"
                      onClick={() =>
                        handleExamPrompt(
                          "I have an exam in 5 days. Make a preparation plan for me.",
                        )
                      }
                    >
                      Exam in 5 days
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleExamPrompt(
                          "Prepare important topics and revision strategy for my exam.",
                        )
                      }
                    >
                      Important topics
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleExamPrompt(
                          "Explain this topic in an exam-ready way.",
                        )
                      }
                    >
                      Exam explanation
                    </button>
                  </div>
                </div>
              </section>

              {/* Placement preparation */}

              <section className="ai-special-card placement">
                <div className="ai-special-icon">
                  <BriefcaseBusiness
                    size={19}
                  />
                </div>

                <div className="ai-special-content">
                  <div className="ai-special-title">
                    <strong>
                      Placement Preparation
                    </strong>

                    <span>
                      Build your career
                    </span>
                  </div>

                  <p>
                    Prepare DSA, Java,
                    Core CS, Aptitude,
                    interviews and resume
                    readiness with a
                    personalized placement
                    strategy.
                  </p>

                  <div className="ai-placement-mini-grid">
                    <button
                      type="button"
                      onClick={() =>
                        handlePlacementPrompt(
                          "Create my placement preparation roadmap based on my current progress.",
                        )
                      }
                    >
                      <Route size={12} />
                      Roadmap
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handlePlacementPrompt(
                          "Give me a DSA preparation plan for placements.",
                        )
                      }
                    >
                      <Code2 size={12} />
                      DSA
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handlePlacementPrompt(
                          "Prepare me for a technical placement interview.",
                        )
                      }
                    >
                      <Mic2 size={12} />
                      Interview
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handlePlacementPrompt(
                          "Analyze my placement readiness and find my weak areas.",
                        )
                      }
                    >
                      <Trophy size={12} />
                      Readiness
                    </button>
                  </div>
                </div>
              </section>
            </div>
          ) : (
            <div className="ai-conversation">
              {messages.map((item) => (
                <div
                  key={item.id}
                  className={`ai-message ${
                    item.role === "user"
                      ? "user"
                      : ""
                  }`}
                >
                  <div className="ai-message-avatar">
                    {item.role ===
                    "assistant" ? (
                      <Bot size={15} />
                    ) : (
                      <span>S</span>
                    )}
                  </div>

                  <div className="ai-message-body">
                    <div className="ai-message-name">
                      {item.role ===
                      "assistant"
                        ? "StudyOS AI"
                        : "You"}
                    </div>

                    <div className="ai-message-bubble">
                      {item.content}
                    </div>

                    {item.attachments
                      ?.length > 0 && (
                      <div className="ai-message-files">
                        {item.attachments.map(
                          (file) => (
                            <span
                              key={`${item.id}-${file.name}`}
                            >
                              {file.kind ===
                              "image" ? (
                                <ImageIcon
                                  size={10}
                                />
                              ) : (
                                <FileText
                                  size={10}
                                />
                              )}

                              {file.name}
                            </span>
                          ),
                        )}
                      </div>
                    )}

                    {item.action && (
                      <div className="ai-message-action">
                        <CircleCheck
                          size={10}
                        />
                        {item.action.target}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isThinking && (
                <div className="ai-message">
                  <div className="ai-message-avatar">
                    <Bot size={15} />
                  </div>

                  <div className="ai-message-body">
                    <div className="ai-message-name">
                      StudyOS AI
                    </div>

                    <div className="ai-message-bubble typing">
                      <span />
                      <span />
                      <span />
                    </div>
                  </div>
                </div>
              )}

              <div ref={chatBottomRef} />
            </div>
          )}
        </div>

        {/* =================================================
            COMPOSER
            ================================================= */}

        <div className="ai-composer-section">
          {/* Actions popup */}

          {actionsOpen && (
            <div className="ai-actions-menu">
              <div className="ai-actions-header">
                <div>
                  <strong>
                    StudyOS Actions
                  </strong>

                  <span>
                    Ask AI to create,
                    update or manage
                    your workspace
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setActionsOpen(false)
                  }
                >
                  <X size={14} />
                </button>
              </div>

              <div className="ai-actions-grid">
                {ACTIONS.map(
                  (action) => {
                    const ActionIcon =
                      action.icon;

                    return (
                      <button
                        type="button"
                        className="ai-action-item"
                        key={action.id}
                        onClick={() =>
                          openAction(
                            action,
                          )
                        }
                      >
                        <div
                          className={`ai-action-icon ${action.color}`}
                        >
                          <ActionIcon
                            size={14}
                          />
                        </div>

                        <span>
                          <strong>
                            {
                              action.label
                            }
                          </strong>

                          <small>
                            {
                              action.description
                            }
                          </small>
                        </span>
                      </button>
                    );
                  },
                )}
              </div>
            </div>
          )}

          {/* Attachment chips */}

          {attachments.length > 0 && (
            <div className="ai-attachments">
              {attachments.map(
                (attachment) => (
                  <div
                    className="ai-file-chip"
                    key={attachment.id}
                  >
                    {attachment.kind ===
                    "image" ? (
                      <ImageIcon
                        size={11}
                      />
                    ) : (
                      <FileText
                        size={11}
                      />
                    )}

                    <span>
                      {
                        attachment.name
                      }
                    </span>

                    <button
                      type="button"
                      onClick={() =>
                        removeAttachment(
                          attachment.id,
                        )
                      }
                    >
                      <X size={10} />
                    </button>
                  </div>
                ),
              )}
            </div>
          )}

          {/* Main input */}

          <div className="ai-composer">
            <button
              type="button"
              className="ai-plus-button"
              onClick={() =>
                setActionsOpen(
                  (previous) =>
                    !previous,
                )
              }
              title="StudyOS Actions"
            >
              <Plus size={19} />
            </button>

            <textarea
              ref={textareaRef}
              value={message}
              onChange={(event) =>
                setMessage(
                  event.target.value,
                )
              }
              onKeyDown={
                handleTextareaKeyDown
              }
              placeholder={
                mode === "exam"
                  ? "Ask anything for your exam preparation..."
                  : "Ask anything about your studies..."
              }
              rows={1}
            />

            <div className="ai-input-tools">
              <button
                type="button"
                onClick={
                  openFilePicker
                }
                title="Attach file or PDF"
              >
                <Paperclip size={17} />
              </button>

              <button
                type="button"
                onClick={
                  openImagePicker
                }
                title="Upload image"
              >
                <ImageIcon size={17} />
              </button>

              <button
                type="button"
                onClick={
                  startCamera
                }
                title="Camera"
              >
                <Camera size={17} />
              </button>

              <button
                type="button"
                className={
                  isListening
                    ? "recording"
                    : ""
                }
                onClick={
                  startVoiceInput
                }
                title="Voice input"
              >
                {isListening ? (
                  <Volume2
                    size={17}
                  />
                ) : (
                  <Mic size={17} />
                )}
              </button>
            </div>

            <button
              type="button"
              className={`ai-send ${
                hasMessage
                  ? "enabled"
                  : ""
              }`}
              disabled={!hasMessage}
              onClick={sendMessage}
              title="Send"
            >
              <Send size={16} />
            </button>
          </div>

          {/* Controls */}

          <div className="ai-composer-controls">
            <div className="ai-left-controls">
              <div className="ai-mode-wrapper">
                <button
                  type="button"
                  className="ai-mode-button"
                  onClick={() =>
                    setModeOpen(
                      (previous) =>
                        !previous,
                    )
                  }
                >
                  <ModeIcon size={13} />

                  {currentMode.label}

                  <ChevronDown
                    size={11}
                  />
                </button>

                {modeOpen && (
                  <div className="ai-mode-menu">
                    {AI_MODES.map(
                      (item) => {
                        const ItemIcon =
                          item.icon;

                        return (
                          <button
                            type="button"
                            key={
                              item.id
                            }
                            className={
                              mode ===
                              item.id
                                ? "active"
                                : ""
                            }
                            onClick={() =>
                              handleModeChange(
                                item.id,
                              )
                            }
                          >
                            <ItemIcon
                              size={15}
                            />

                            <span>
                              <strong>
                                {
                                  item.label
                                }
                              </strong>

                              <small>
                                {
                                  item.description
                                }
                              </small>
                            </span>

                            {mode ===
                              item.id && (
                              <b>
                                ✓
                              </b>
                            )}
                          </button>
                        );
                      },
                    )}
                  </div>
                )}
              </div>

              <button
                type="button"
                className={`ai-control-button ${
                  mode === "think"
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  handleModeChange(
                    mode === "think"
                      ? "ask"
                      : "think",
                  )
                }
              >
                <Brain size={13} />
                Think
              </button>

              <button
                type="button"
                className={`ai-control-button exam ${
                  mode === "exam"
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  handleModeChange(
                    mode === "exam"
                      ? "ask"
                      : "exam",
                  )
                }
              >
                <GraduationCap
                  size={13}
                />
                Exam Ready
              </button>
            </div>

            <span className="ai-send-hint">
              Enter to send · Shift +
              Enter for new line
            </span>
          </div>
        </div>
      </main>

      {/* =====================================================
          ACTION MODAL
          ===================================================== */}

      {selectedAction && (
        <div className="ai-modal-backdrop">
          <div className="ai-action-modal">
            <div className="ai-modal-header">
              <div
                className={`ai-action-icon ${selectedAction.color}`}
              >
                {(() => {
                  const ActionIcon =
                    selectedAction.icon;

                  return (
                    <ActionIcon
                      size={16}
                    />
                  );
                })()}
              </div>

              <div>
                <h3>
                  AI{" "}
                  {
                    selectedAction.label
                  }
                </h3>

                <p>
                  Tell StudyOS what
                  you want AI to do.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedAction(
                    null,
                  )
                }
              >
                <X size={14} />
              </button>
            </div>

            <div className="ai-modal-body">
              <label htmlFor="ai-action-request">
                Your request
              </label>

              <textarea
                id="ai-action-request"
                value={actionRequest}
                onChange={(event) =>
                  setActionRequest(
                    event.target.value,
                  )
                }
                placeholder={
                  selectedAction.id ===
                  "CREATE_TASK"
                    ? "Create a DBMS task for tomorrow at 7 PM..."
                    : selectedAction.id ===
                        "CREATE_GOAL"
                      ? "Create a goal to finish Java DSA in 30 days..."
                      : `Tell me what you want to do with ${selectedAction.target}...`
                }
              />

              <div className="ai-modal-security">
                <ShieldCheck size={13} />

                <div>
                  <strong>
                    Secure StudyOS
                    action
                  </strong>

                  <span>
                    The backend will
                    validate your
                    account before
                    changing StudyOS
                    data.
                  </span>
                </div>
              </div>
            </div>

            <div className="ai-modal-footer">
              <button
                type="button"
                className="ai-modal-cancel"
                onClick={() =>
                  setSelectedAction(
                    null,
                  )
                }
              >
                Cancel
              </button>

              <button
                type="button"
                className="ai-modal-continue"
                onClick={
                  submitAction
                }
              >
                <WandSparkles
                  size={13}
                />
                Ask AI
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          CAMERA
          ===================================================== */}

      {cameraOpen && (
        <div className="ai-camera-backdrop">
          <div className="ai-camera-modal">
            <div className="ai-camera-header">
              <div>
                <strong>
                  StudyOS Camera
                </strong>

                <span>
                  Capture an image for
                  AI analysis
                </span>
              </div>

              <button
                type="button"
                onClick={
                  closeCamera
                }
              >
                <X size={16} />
              </button>
            </div>

            <div className="ai-camera-preview">
              <video
                ref={
                  cameraVideoRef
                }
                autoPlay
                playsInline
                muted
              />

              <div className="ai-camera-guide" />
            </div>

            <div className="ai-camera-footer">
              <button
                type="button"
                className="ai-camera-cancel"
                onClick={
                  closeCamera
                }
              >
                Cancel
              </button>

              <button
                type="button"
                className="ai-camera-capture"
                onClick={
                  captureCameraImage
                }
              >
                <Camera size={16} />
                Capture
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden inputs */}

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.txt,.csv,.xlsx,.ppt,.pptx"
        multiple
        hidden
        onChange={handleFiles}
      />

      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={handleFiles}
      />
    </div>
  );
}