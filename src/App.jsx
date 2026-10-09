import { lazy, Suspense, useEffect, useRef, useState } from "react";
import {
  Menu,
  Search,
  Sun,
  Moon,
  Bell,
  ChevronDown,
  Home,
  BookOpen,
  CheckSquare,
  FileText,
  Target,
  CalendarDays,
  Timer,
  Flame,
  BarChart3,
  BriefcaseBusiness,
  Trophy,
  Bot,
  Settings as SettingsIcon,
  HelpCircle,
  CalendarCheck,
  Rocket,
  Sparkles,
  ArrowUpRight,
  Plus,
  X,
  Send,
  Clock3,
  Award,
  TrendingUp,
  UserCircle,
  LogOut,
  Inbox,
} from "lucide-react";
import studyOSLogo from "./assets/logo.png";
import { apiRequest, apiStreamRequest } from "./services/api.js";
import MarkdownMessage, { MarkdownActions } from "./components/MarkdownMessage.jsx";
import ErrorBanner from "./components/ErrorBanner.jsx";
import "./components/MarkdownMessage.css";
import { useRemoteCollection } from "./services/useRemoteCollection.js";
const Subjects = lazy(() => import("./Subjects.jsx"));
const Tasks = lazy(() => import("./Tasks.jsx"));
const Notes = lazy(() => import("./Notes.jsx"));
const Goals = lazy(() => import("./Goals.jsx"));
const StudyPlan = lazy(() => import("./StudyPlan.jsx"));
const Pomodoro = lazy(() => import("./Pomodoro.jsx"));
const HabitTracker = lazy(() => import("./HabitTracker.jsx"));
const Analytics = lazy(() => import("./Analytics.jsx"));
const PlacementHub = lazy(() => import("./PlacementHub.jsx"));
const Leaderboard = lazy(() => import("./Leaderboard.jsx"));
const AIMentor = lazy(() => import("./AIMentor.jsx"));
const SettingsPage = lazy(() => import("./Settings.jsx"));
const HelpPage = lazy(() => import("./Help.jsx"));
import { AppErrorBoundary, ErrorPage } from "./components/AppErrorBoundary.jsx";

import "./App.css";
import "./ModalSystem.css";

const SUBJECTS_STORAGE_KEY = "studyos-subjects";
const NOTIFICATIONS_STORAGE_KEY = "studyos-notifications";
const THEME_STORAGE_KEY = "studyos-theme";
const SETTINGS_STORAGE_KEY = "studyos-settings";

function createNotificationId() {
  const randomPart = typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return `notification-${randomPart}`;
}

function normalizeNotificationIds(value) {
  const usedIds = new Set();
  return (Array.isArray(value) ? value : []).map((item) => {
    const id = typeof item?.id === "string" ? item.id : String(item?.id || "");
    if (/^[\w-]{1,64}$/.test(id) && !usedIds.has(id)) {
      usedIds.add(id);
      return item;
    }
    let nextId = createNotificationId();
    while (usedIds.has(nextId)) nextId = createNotificationId();
    usedIds.add(nextId);
    return { ...item, id: nextId };
  });
}

function readSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) {
      return { profileName: "Student", theme: "light" };
    }
    const parsed = JSON.parse(raw);
    return {
      profileName: parsed?.profileName || "Student",
      theme: parsed?.theme || "light",
    };
  } catch {
    return { profileName: "Student", theme: "light" };
  }
}

function getProfileName() {
  const settings = readSettings();
  return settings.profileName?.trim() || "Student";
}

function getInitials(name) {
  const trimmed = (name || "Student").trim();
  if (!trimmed) return "S";
  return trimmed.charAt(0).toUpperCase();
}

/* =========================================================
   SIDEBAR NAVIGATION
   ========================================================= */

const navSections = [
  {
    title: "MAIN",
    items: [
      ["Dashboard", Home],
      ["Subjects", BookOpen],
      ["Tasks", CheckSquare],
      ["Notes", FileText],
      ["Goals", Target],
    ],
  },
  {
    title: "STUDY",
    items: [
      ["Study Plan", CalendarDays],
      ["Pomodoro", Timer],
      ["Habit Tracker", Flame],
      ["Analytics", BarChart3],
    ],
  },
  {
    title: "CAREER",
    items: [
      ["Placement Hub", BriefcaseBusiness],
      ["Leaderboard", Trophy],
      ["AI Mentor", Bot],
    ],
  },
];

const moreItems = [
  ["Settings", SettingsIcon],
  ["Help & Feedback", HelpCircle],
];
const searchablePages = [
  ...navSections.flatMap((section) => section.items.map(([label]) => label)),
  ...moreItems.map(([label]) => label),
];



/* =========================================================
   DASHBOARD STATS
   ========================================================= */

const stats = [
  ["Subjects", "SUBJECT_COUNT", BookOpen, "blue"],
  ["Tasks Done", "0", CheckSquare, "green"],
  ["Active Goals", "0", Target, "purple"],
  ["Study Hours This Week", "0h", Clock3, "cyan"],
  ["Pomodoro Sessions", "0", Timer, "orange"],
  ["Level", "1", Award, "pink"],
  ["Streak", "0", Flame, "red"],
];

/* =========================================================
   APP
   ========================================================= */

function App({ user, onLogout }) {
  const [activePage, setActivePage] = useState("Dashboard");
  const [profileName, setProfileName] = useState(() => getProfileName() === "Student" ? user.name : getProfileName());
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    if (new URLSearchParams(window.location.search).get("theme") === "night") return true;
    if (new URLSearchParams(window.location.search).get("theme") === "light") return false;
    try {
      const settings = readSettings();
      const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
      if (settings.theme === "dark" || storedTheme === "night") return true;
      if (settings.theme === "light") return false;
      return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    } catch {
      return false;
    }
  });
  const [currentTime, setCurrentTime] = useState(new Date());
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [mobileNavHidden, setMobileNavHidden] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(SETTINGS_STORAGE_KEY))?.reducedMotion === true;
    } catch {
      return false;
    }
  });
  const [message, setMessage] = useState("");
  const [aiMessages, setAiMessages] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);
  const floatingControllerRef = useRef(null);
  const [greeting, setGreeting] = useState("Good Morning");
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notificationRef = useRef(null);
  const searchInputRef = useRef(null);
  const aiTapTimeoutRef = useRef(null);
  const [notifications, setNotifications] = useState(() => {
    try {
      const stored = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
      const parsed = stored ? JSON.parse(stored) : [];
      return normalizeNotificationIds(parsed);
    } catch { return []; }
  });
  const [subjects, setSubjects] = useState(() => {
    try {
      const storedSubjects = localStorage.getItem(SUBJECTS_STORAGE_KEY);
      const parsedSubjects = storedSubjects ? JSON.parse(storedSubjects) : [];
      return Array.isArray(parsedSubjects) ? parsedSubjects : [];
    } catch {
      return [];
    }
  });
  const [apiStatus, setApiStatus] = useState(null);

  useRemoteCollection("subjects", subjects, setSubjects);
  useRemoteCollection("notifications", notifications, setNotifications);

  useEffect(() => {
    const handleAccountChange = (event) => {
      if (event.key === "studyos-session-logout" || (event.key === "studyos-active-account" && event.newValue !== user.id)) {
        onLogout(false);
      }
    };
    window.addEventListener("storage", handleAccountChange);
    return () => window.removeEventListener("storage", handleAccountChange);
  }, [onLogout, user.id]);

  useEffect(() => {
    const updateStatus = (event) => {
      setApiStatus(event.detail?.status === "error" ? event.detail.message : null);
    };
    window.addEventListener("studyos-api-status", updateStatus);
    return () => window.removeEventListener("studyos-api-status", updateStatus);
  }, []);

  useEffect(() => {
    let active = true;
    apiRequest("/profile")
      .then(async (profile) => {
        if (!active) return;
        const localSettings = readSettings();
        const localName = localSettings.profileName?.trim() || "Student";
        if (localName !== "Student" && localName !== profile.name) {
          await apiRequest("/profile", { method: "PUT", body: { name: localName } });
          return;
        }
        if (profile.name && profile.name !== localName) {
          const nextSettings = { ...localSettings, profileName: profile.name };
          localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(nextSettings));
          setProfileName(profile.name);
          window.dispatchEvent(new Event("studyos-settings-changed"));
        }
      })
      .catch((error) => {
        if (active) setApiStatus(error.message || "Unable to load your profile.");
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    localStorage.setItem(SUBJECTS_STORAGE_KEY, JSON.stringify(subjects));
  }, [subjects]);

  useEffect(() => {
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, darkMode ? "night" : "light");
    } catch {
      // Ignore storage failures and continue safely.
    }
  }, [darkMode]);

  useEffect(() => {
    const closeOnOutsideOrEscape = (event) => {
      if (event.type === "keydown" && event.key === "Escape") setNotificationsOpen(false);
      if (event.type === "mousedown" && notificationRef.current && !notificationRef.current.contains(event.target)) setNotificationsOpen(false);
    };
    document.addEventListener("mousedown", closeOnOutsideOrEscape);
    document.addEventListener("keydown", closeOnOutsideOrEscape);
    return () => { document.removeEventListener("mousedown", closeOnOutsideOrEscape); document.removeEventListener("keydown", closeOnOutsideOrEscape); };
  }, []);

  useEffect(() => {
    const syncMotionPreference = () => {
      try {
        setReducedMotion(JSON.parse(localStorage.getItem(SETTINGS_STORAGE_KEY))?.reducedMotion === true);
      } catch {
        setReducedMotion(false);
      }
    };

    window.addEventListener("studyos-settings-changed", syncMotionPreference);
    return () => window.removeEventListener("studyos-settings-changed", syncMotionPreference);
  }, []);

  useEffect(() => {
    const mobileQuery = window.matchMedia("(max-width: 768px)");
    let lastScrollY = window.scrollY;
    let accumulatedDelta = 0;
    let accumulatedDirection = 0;

    const handleScroll = () => {
      if (!mobileQuery.matches) return;

      const currentScrollY = window.scrollY;
      const delta = currentScrollY - lastScrollY;
      lastScrollY = currentScrollY;

      if (currentScrollY <= 24) {
        accumulatedDelta = 0;
        accumulatedDirection = 0;
        setMobileNavHidden(false);
        return;
      }

      if (delta === 0) return;
      const direction = Math.sign(delta);
      if (direction !== accumulatedDirection) {
        accumulatedDelta = delta;
        accumulatedDirection = direction;
      } else {
        accumulatedDelta += delta;
      }

      if (Math.abs(accumulatedDelta) >= 12) {
        setMobileNavHidden(accumulatedDelta > 0);
        accumulatedDelta = 0;
      }
    };

    const handleViewportChange = () => {
      accumulatedDelta = 0;
      accumulatedDirection = 0;
      lastScrollY = window.scrollY;
      setMobileNavHidden(false);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    mobileQuery.addEventListener("change", handleViewportChange);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      mobileQuery.removeEventListener("change", handleViewportChange);
    };
  }, []);

  useEffect(() => () => {
    if (aiTapTimeoutRef.current) {
      clearTimeout(aiTapTimeoutRef.current);
    }
  }, []);

  const unreadNotifications = notifications.filter((item) => !item.read).length;
  const markAllNotificationsRead = () => setNotifications((items) => items.map((item) => ({ ...item, read: true })));
  const clearAllNotifications = () => setNotifications([]);
  const markNotificationRead = (id) => setNotifications((items) => items.map((item) => item.id === id ? { ...item, read: true } : item));

  useEffect(() => {
    const syncProfile = () => {
      const nextName = getProfileName();
      setProfileName(nextName);
      const settings = readSettings();
      if (settings.theme === "dark") {
        setDarkMode(true);
      } else if (settings.theme === "light") {
        setDarkMode(false);
      } else if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
        setDarkMode(true);
      } else {
        setDarkMode(false);
      }
    };

    syncProfile();
    window.addEventListener("studyos-settings-changed", syncProfile);
    return () => window.removeEventListener("studyos-settings-changed", syncProfile);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  /* =======================================================
     INDIA TIME GREETING
     ======================================================= */

  useEffect(() => {
    const updateGreeting = () => {
      const hour = Number(
        new Intl.DateTimeFormat("en-IN", {
          timeZone: "Asia/Kolkata",
          hour: "numeric",
          hour12: false,
        }).format(new Date())
      );

      if (hour >= 5 && hour < 12) {
        setGreeting("Good Morning");
      } else if (hour >= 12 && hour < 17) {
        setGreeting("Good Afternoon");
      } else if (hour >= 17 && hour < 21) {
        setGreeting("Good Evening");
      } else {
        setGreeting("Good Night");
      }
    };

    updateGreeting();

    const timer = setInterval(updateGreeting, 60000);

    return () => clearInterval(timer);
  }, []);

  const name = profileName || "Student";
  const headerDayLabel = new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    timeZone: "Asia/Kolkata",
  }).format(currentTime);
  const headerDateLabel = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(currentTime);
  const headerTimeLabel = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  }).format(currentTime);
  const matchingPages = searchQuery.trim()
    ? searchablePages.filter((page) => page.toLowerCase().includes(searchQuery.trim().toLowerCase()))
    : [];

  const navigate = (page) => {
    setActivePage(page);
    setSidebarOpen(false);
    setProfileOpen(false);
  };

  const selectSearchResult = (page) => {
    navigate(page);
    setSearchQuery("");
    setSearchFocused(false);
    setMobileSearchOpen(false);
    setNotificationsOpen(false);
    setProfileOpen(false);
  };

  useEffect(() => {
    const handleSearchShortcut = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchFocused(true);
        setNotificationsOpen(false);
        setProfileOpen(false);
        if (window.matchMedia("(max-width: 768px)").matches) {
          setMobileSearchOpen(true);
        }
        window.requestAnimationFrame(() => searchInputRef.current?.focus());
      }
    };

    document.addEventListener("keydown", handleSearchShortcut);
    return () => document.removeEventListener("keydown", handleSearchShortcut);
  }, []);

  const handleFloatingAiClick = () => {
    if (aiTapTimeoutRef.current) {
      clearTimeout(aiTapTimeoutRef.current);
      aiTapTimeoutRef.current = null;
      setAiOpen(false);
      navigate("AI Mentor");
      window.scrollTo(0, 0);
      window.requestAnimationFrame(() => window.scrollTo(0, 0));
      return;
    }

    aiTapTimeoutRef.current = setTimeout(() => {
      setAiOpen((open) => !open);
      aiTapTimeoutRef.current = null;
    }, 280);
  };

  const toggleTheme = () => {
    const nextDarkMode = !darkMode;
    setDarkMode(nextDarkMode);
    const currentSettings = readSettings();
    const updatedSettings = { ...currentSettings, theme: nextDarkMode ? "dark" : "light" };
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(updatedSettings));
      window.dispatchEvent(new Event("studyos-settings-changed"));
    } catch {
      // Ignore storage failures and continue safely.
    }
  };

  const submitAI = async (e) => {
    e.preventDefault();

    const question = message.trim();
    if (!question || aiLoading) return;
    setAiMessages((previous) => [...previous, { id: crypto.randomUUID(), role: "user", content: question }]);
    setMessage("");
    setAiLoading(true);
    setAiError(null);
    const controller = new AbortController(); floatingControllerRef.current = controller;
    try {
      const response = await apiStreamRequest("/ai/chat/stream", { signal: controller.signal, body: { message: question, history: aiMessages.slice(-19) } });
      if (!response.ok || !response.body) throw new Error(`AI request failed (${response.status}).`);
      const id = crypto.randomUUID(); setAiMessages((previous) => [...previous, { id, role: "assistant", content: "" }]);
      const reader = response.body.getReader(); const decoder = new TextDecoder(); let buffer = "";
      while (true) {
        const { value, done } = await reader.read(); if (done) break;
        buffer += decoder.decode(value, { stream: true }); const events = buffer.split("\n\n"); buffer = events.pop() || "";
        for (const event of events) {
          const line = event.split("\n").find((part) => part.startsWith("data: ")); if (!line) continue;
          const data = JSON.parse(line.slice(6));
          if (data.type === "notice") setAiError({ title: "Local AI fallback", message: data.message });
          if (data.type === "error") throw Object.assign(new Error(data.message), { status: data.status });
          if (data.type === "token") setAiMessages((previous) => previous.map((item) => item.id === id ? { ...item, content: item.content + data.text } : item));
          if (data.type === "done") setAiMessages((previous) => previous.map((item) => item.id === id ? { ...item, truncated: data.response.truncated, confirmationId: data.response.confirmationId, action: data.response.action } : item));
        }
      }
    } catch (error) {
      if (!controller.signal.aborted) {
        setAiError(error);
        setAiMessages((previous) => [...previous, {
          id: crypto.randomUUID(),
          role: "assistant",
          content: error.message || "The AI request could not be completed.",
        }]);
      }
    } finally {
      floatingControllerRef.current = null;
      setAiLoading(false);
    }
  };

  const confirmFloatingAIAction = async (messageItem) => {
    if (!messageItem.confirmationId || aiLoading) return;
    setAiLoading(true);
    try {
      const response = await apiRequest("/ai/chat", {
        method: "POST",
        body: { message: "Confirm the requested action.", confirmationId: messageItem.confirmationId, confirm: true },
      });
      setAiMessages((previous) => previous.map((item) => item.id === messageItem.id
        ? { ...item, confirmationId: null }
        : item).concat({ id: crypto.randomUUID(), role: "assistant", content: response.message }));
      window.dispatchEvent(new Event("studyos-data-changed"));
    } catch (error) {
      setAiMessages((previous) => [...previous, {
        id: crypto.randomUUID(),
        role: "assistant",
        content: error.message || "The requested action could not be completed.",
      }]);
    } finally {
      setAiLoading(false);
    }
  };

  const retryFloatingMessage = async (item, continueAnswer = false) => {
    const question = [...aiMessages.slice(0, aiMessages.findIndex((entry) => entry.id === item.id))].reverse().find((entry) => entry.role === "user")?.content;
    if (!question) return;
    setAiLoading(true); setAiError(null);
    const controller = new AbortController();
    floatingControllerRef.current = controller;
    try {
      const response = await apiStreamRequest("/ai/chat/stream", { signal: controller.signal, body: { message: question, history: aiMessages.slice(0, aiMessages.findIndex((entry) => entry.id === item.id)).slice(-20), continue: continueAnswer } });
      if (!response.ok || !response.body) throw new Error(`AI request failed (${response.status}).`);
      const id = item.id; setAiMessages((previous) => previous.map((entry) => entry.id === id ? { ...entry, content: "" } : entry));
      const reader = response.body.getReader(); const decoder = new TextDecoder(); let buffer = "";
      while (true) { const { value, done } = await reader.read(); if (done) break; buffer += decoder.decode(value, { stream: true }); const events = buffer.split("\n\n"); buffer = events.pop() || ""; for (const event of events) { const line = event.split("\n").find((part) => part.startsWith("data: ")); if (!line) continue; const data = JSON.parse(line.slice(6)); if (data.type === "token") setAiMessages((previous) => previous.map((entry) => entry.id === id ? { ...entry, content: entry.content + data.text } : entry)); if (data.type === "done") setAiMessages((previous) => previous.map((entry) => entry.id === id ? { ...entry, truncated: data.response.truncated } : entry)); if (data.type === "error") throw new Error(data.message); } }
    } catch (error) { if (!controller.signal.aborted) setAiError(error); }
    finally { floatingControllerRef.current = null; setAiLoading(false); }
  };

  const handleLogout = async () => {
    setProfileOpen(false);
    try {
      await apiRequest("/auth/logout", { method: "POST" });
      onLogout();
    } catch (error) {
      setApiStatus(error.message || "Unable to sign out.");
    }
  };

  return (
    <div className={`studyos ${darkMode ? "night" : ""}`}>
      {/* =====================================================
          SIDEBAR
          ===================================================== */}

      <aside
        className={`sidebar ${
          sidebarOpen ? "mobile-open" : ""
        }`}
      >
        {/* BRAND */}
        <div className="sidebar-top">
          <div className="sidebar-brand">
            <img className="sidebar-logo" src={studyOSLogo} alt="StudyOS logo" />
          </div>

          <div className="sidebar-description">
            Your Personal Study OS
          </div>
        </div>

        {/* MAIN / STUDY / CAREER SCROLL AREA */}
        <div className="sidebar-scroll">
          {navSections.map((section) => (
            <div
              className="nav-group"
              key={section.title}
            >
              <div className="nav-label">
                {section.title}
              </div>

              {section.items.map(([label, Icon]) => (
                <button
                  key={label}
                  className={`side-link ${
                    activePage === label
                      ? "selected"
                      : ""
                  }`}
                  onClick={() => navigate(label)}
                >
                  <span className="side-link-icon">
                    <Icon
                      size={19}
                      strokeWidth={1.9}
                    />
                  </span>

                  <span className="side-link-text">
                    {label}
                  </span>
                </button>
              ))}
            </div>
          ))}
        </div>

        {/* MORE FIXED / STABLE */}
        <div className="sidebar-more">
          <div className="nav-label">MORE</div>

          {moreItems.map(([label, Icon]) => (
            <button
              key={label}
              className={`side-link ${
                activePage === label
                  ? "selected"
                  : ""
              }`}
              onClick={() => navigate(label)}
            >
              <span className="side-link-icon">
                <Icon
                  size={19}
                  strokeWidth={1.9}
                />
              </span>

              <span className="side-link-text">
                {label}
              </span>
            </button>
          ))}

          <div className="sidebar-quote">
            <span>&#x201C;</span>

            <em>
              Small Consistent
              <br />
              Actions Today.
              <br />
              Bigger Opportunities
              <br />
              Tomorrow.
            </em>
          </div>
        </div>
      </aside>

      {/* MOBILE SIDEBAR OVERLAY */}
      {sidebarOpen && (
        <button
          className="sidebar-overlay"
          aria-label="Close sidebar"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* =====================================================
          PAGE
          ===================================================== */}

      <main className="page">
        {/* ===================================================
            HEADER
            =================================================== */}

        <header className="header">
          <div className="header-left">
            <button
              className="menu-button"
              onClick={() =>
                setSidebarOpen(!sidebarOpen)
              }
              aria-label="Open menu"
            >
              <Menu size={22} />
            </button>

            <div className={`header-search${mobileSearchOpen ? " mobile-search-open" : ""}`}>
              <Search className="desktop-search-icon" size={18} aria-hidden="true" />

              <button
                className="mobile-search-toggle"
                type="button"
                aria-label={mobileSearchOpen ? "Close search" : "Open search"}
                onClick={() => {
                  if (mobileSearchOpen) {
                    setMobileSearchOpen(false);
                    setSearchFocused(false);
                    setSearchQuery("");
                  } else {
                    setMobileSearchOpen(true);
                    setNotificationsOpen(false);
                    setProfileOpen(false);
                    window.requestAnimationFrame(() => searchInputRef.current?.focus());
                  }
                }}
              >
                {mobileSearchOpen ? <X size={18} /> : <Search size={18} />}
              </button>

              <input
                placeholder="Search StudyOS - notes, tasks, subjects, topics..."
                type="text"
                ref={searchInputRef}
                value={searchQuery}
                aria-label="Search StudyOS"
                aria-controls="global-search-results"
                aria-expanded={searchFocused && matchingPages.length > 0}
                onChange={(event) => setSearchQuery(event.target.value)}
                onFocus={() => {
                  setSearchFocused(true);
                  setNotificationsOpen(false);
                  setProfileOpen(false);
                }}
                onBlur={() => setSearchFocused(false)}
                onKeyDown={(event) => {
                  if (event.key === "Escape") {
                    setSearchFocused(false);
                    setSearchQuery("");
                    setMobileSearchOpen(false);
                    event.currentTarget.blur();
                  } else if (event.key === "Enter" && matchingPages[0]) {
                    selectSearchResult(matchingPages[0]);
                  }
                }}
              />

              <kbd className="search-shortcut">
                Ctrl + K
              </kbd>

              {searchFocused && searchQuery.trim() && (
                <div className="search-results" id="global-search-results" role="listbox" aria-label="Pages">
                  {matchingPages.length ? matchingPages.map((page) => (
                    <button
                      key={page}
                      type="button"
                      role="option"
                      aria-selected="false"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => selectSearchResult(page)}
                    >
                      {page}
                    </button>
                  )) : <span className="search-empty">No matching StudyOS pages</span>}
                </div>
              )}
            </div>
          </div>

          <div className="header-meta">
            <span>{headerDayLabel}</span>
            <span className="header-meta-separator" aria-hidden="true">&middot;</span>
            <span>{headerDateLabel}</span>
            <span className="header-meta-separator" aria-hidden="true">&middot;</span>
            <time dateTime={currentTime.toISOString()}>{headerTimeLabel}</time>
          </div>

          {/* HEADER ACTIONS */}
          <div className="header-actions">
            {/* THEME */}
            <button
              className={`theme-switch ${
                darkMode ? "active" : ""
              }`}
              onClick={toggleTheme}
              aria-label={`Switch to ${darkMode ? "light" : "night"} mode`}
              aria-pressed={darkMode}
              title={`Switch to ${darkMode ? "light" : "night"} mode`}
            >
              <span className="theme-icon sun-icon">
                <Sun size={15} />
              </span>

              <span className="theme-icon moon-icon">
                <Moon size={13} />
              </span>

              <span className="switch-knob" />
            </button>

            {/* NOTIFICATION */}
            <div className="notification-wrap" ref={notificationRef}>
              <button
                className="header-icon notification"
                aria-label="Notifications"
                aria-expanded={notificationsOpen}
                aria-haspopup="dialog"
                onClick={() => setNotificationsOpen((open) => !open)}
              >
                <Bell size={19} />
                {unreadNotifications > 0 && <span className="notification-dot">{unreadNotifications > 99 ? "99+" : unreadNotifications}</span>}
              </button>
              {notificationsOpen && <section className="notification-menu" role="dialog" aria-label="Notifications">
                <div className="notification-menu-header">
                  <strong>Notifications</strong>
                  <div className="notification-menu-actions">
                    <button onClick={markAllNotificationsRead} disabled={unreadNotifications === 0}>Mark all as read</button>
                    <button className="notification-clear-all" onClick={clearAllNotifications} disabled={notifications.length === 0}>Clear all</button>
                  </div>
                </div>
                {notifications.length === 0 ? <div className="notification-empty"><Inbox size={23} /><span>No new notifications</span></div> : <div className="notification-list">{notifications.map((item) => <button key={item.id} className={`notification-item ${item.read ? "" : "unread"}`} onClick={() => markNotificationRead(item.id)}><strong>{item.title}</strong><span>{item.message}</span></button>)}</div>}
              </section>}
            </div>

            {/* PROFILE */}
            <div className="profile-wrap">
              <button
                className={`profile-button ${
                  profileOpen ? "profile-active" : ""
                }`}
                onClick={() =>
                  setProfileOpen((open) => !open)
                }
                aria-label="Open profile"
                aria-expanded={profileOpen}
              >
                <div className="profile-avatar">
                  {getInitials(name)}
                </div>

                <div className="profile-info">
                  <strong>{name}</strong>

                  <span>
                    {user.role}
                  </span>
                </div>

                <ChevronDown
                  size={17}
                  className={
                    profileOpen
                      ? "profile-chevron-open"
                      : ""
                  }
                />
              </button>

              {/* PROFILE DROPDOWN */}
              {profileOpen && (
                <div className="profile-menu">
                  {/* PROFILE HEADER */}
                  <div className="profile-menu-header">
                    <div className="profile-menu-avatar">
                      {getInitials(name)}
                    </div>

                    <div className="profile-menu-user">
                      <strong>{name}</strong>

                      <span>
                        {user.role}
                      </span>
                      <span className="profile-menu-email">
                        {user.email}
                      </span>
                    </div>
                  </div>

                  <div className="profile-menu-divider" />

                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      navigate("Settings");
                    }}
                  >
                    <UserCircle size={16} />
                    <span>My Profile</span>
                  </button>

                  <button
                    onClick={() =>
                      navigate("Settings")
                    }
                  >
                    <SettingsIcon size={16} />
                    <span>Settings</span>
                  </button>

                  <button
                    onClick={() =>
                      navigate("Help & Feedback")
                    }
                  >
                    <HelpCircle size={16} />
                    <span>
                      Help & Feedback
                    </span>
                  </button>

                  <div className="profile-menu-divider" />

                  <button
                    className="profile-logout"
                    onClick={handleLogout}
                  >
                    <LogOut size={16} />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {apiStatus && (
          <div className="api-status-alert" role="status">
            {apiStatus}
          </div>
        )}

        {/* ===================================================
            CONTENT
            =================================================== */}

        <AppErrorBoundary key={activePage}>
        <Suspense fallback={<div className="auth-loading" role="status">Loading page?</div>}>
        {activePage === "Dashboard" ? (
  <Dashboard
  navigate={navigate}
  greeting={greeting}
  subjectCount={subjects.length}
  profileName={name}
  />
  ) : activePage === "Subjects" ? (
  <Subjects
    subjects={subjects}
    setSubjects={setSubjects}
  />
) : activePage === "Tasks" ? (
  <Tasks
    subjects={subjects}
    setNotifications={setNotifications}
  />
) : activePage === "Notes" ? (
  <Notes
    subjects={subjects}
    setNotifications={setNotifications}
  />
) : activePage === "Goals" ? (
  <Goals
    setNotifications={setNotifications}
  />
) : activePage === "Study Plan" ? (
  <StudyPlan
    subjects={subjects}
    setNotifications={setNotifications}
  />
) : activePage === "Pomodoro" ? (
  <Pomodoro
    subjects={subjects}
    setNotifications={setNotifications}
  />
  ) : activePage === "Habit Tracker" ? (
  <HabitTracker
    setNotifications={setNotifications}
  />
  ) : activePage === "Analytics" ? (
  <Analytics />
) : activePage === "Placement Hub" ? (
  <PlacementHub />
  ) : activePage === "Leaderboard" ? (
  <Leaderboard />
  ) : activePage === "AI Mentor" ? (
  <AIMentor />
) : activePage === "Settings" ? (
  <SettingsPage />
) : activePage === "Help & Feedback" ? (
  <HelpPage />
) : (
  <ErrorPage status={404} />
)}
        </Suspense>
        </AppErrorBoundary>

        {/* ===================================================
            FOOTER
            =================================================== */}

        <footer className="footer">
          <div className="footer-brand">
            <strong>StudyOS</strong>

            <span>
              A Little Progress Today, A Brighter Future Tomorrow.
            </span>
          </div>

          <div className="footer-points">
            <span>100% Focus</span>
            <span>Better Habits</span>
            <span>Real Skills</span>
            <span>More Opportunities</span>
          </div>

          <span className="footer-right">
            Made for Students &middot; Built for Growth
          </span>
        </footer>
      </main>

      {/* =====================================================
          AI FLOATING BUTTON
          ===================================================== */}

      <button
        className={`ai-floating-button ${
          aiOpen ? "open" : ""
        }`}
        onClick={handleFloatingAiClick}
        aria-label="Open StudyOS AI; double click to open AI Mentor"
      >
        {aiOpen ? (
          <X size={23} />
        ) : (
          <Bot size={25} />
        )}

        <span className="ai-pulse" />
      </button>

      {/* =====================================================
          AI POPUP
          ===================================================== */}

      {aiOpen && (
        <div className="ai-popup">
          <div className="ai-popup-header">
            <div className="ai-avatar">
              <Bot size={20} />
            </div>

            <div>
              <strong>StudyOS AI</strong>

              <span>
                Ready to help you study
              </span>
            </div>

            <button
              onClick={() => setAiOpen(false)}
              aria-label="Close AI"
            >
              <X size={17} />
            </button>
          </div>

          <div className="ai-popup-body">
                {aiMessages.length === 0 && <div className="ai-message assistant">
              <Sparkles size={15} />

              <p>
                Hi! I'm your StudyOS AI. Ask me about
                studies, coding, exams or productivity.
              </p>
            </div>}

            {aiMessages.map((item) => (
              <div className={`ai-message ${item.role === "user" ? "user" : "assistant"}`} key={item.id}>
                <MarkdownMessage text={item.content} />
                {item.role === "assistant" && <MarkdownActions text={item.content} onRegenerate={() => retryFloatingMessage(item)} onContinue={item.truncated ? () => retryFloatingMessage(item, true) : undefined} />}
                {item.confirmationId && (
                  <button type="button" disabled={aiLoading} onClick={() => confirmFloatingAIAction(item)}>
                    Confirm {item.action?.replace(/^delete/, "delete ")}
                  </button>
                )}
              </div>
            ))}
            {aiLoading && <div className="ai-message assistant" role="status"><p>StudyOS AI is thinking...</p></div>}
            {aiError && <ErrorBanner error={aiError} onRetry={aiError.retryable ? () => { const failed = [...aiMessages].reverse().find((item) => item.role === "user"); if (failed) { setMessage(failed.content); setAiMessages((previous) => previous.filter((item) => item.id !== failed.id)); } setAiError(null); } : undefined} />}

            {aiMessages.length === 0 && <div className="ai-quick-prompts">
              <button
                onClick={() =>
                  setMessage(
                    "Create a study plan"
                  )
                }
              >
                Create study plan
              </button>

              <button
                onClick={() =>
                  setMessage(
                    "Explain a topic"
                  )
                }
              >
                Explain a topic
              </button>

              <button
                onClick={() =>
                  setMessage(
                    "Exam preparation"
                  )
                }
              >
                Exam preparation
              </button>
            </div>}
          </div>

          <form
            className="ai-input"
            onSubmit={submitAI}
          >
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); if (aiLoading) return; e.currentTarget.form?.requestSubmit(); } }}
              placeholder="Message StudyOS AI..."
              rows={1}
            />

            <button type="button" onClick={() => aiLoading ? floatingControllerRef.current?.abort() : document.querySelector(".ai-input")?.requestSubmit()} disabled={!message.trim() && !aiLoading}>
              {aiLoading ? <X size={17} /> : <Send size={17} />}
            </button>
          </form>
        </div>
      )}

      {/* =====================================================
          MOBILE BOTTOM NAV
          ===================================================== */}

      <nav className={`mobile-nav ${mobileNavHidden ? "hidden" : ""} ${reducedMotion ? "reduced-motion" : ""}`}>
        <button
          className={
            activePage === "Dashboard"
              ? "active"
              : ""
          }
          onClick={() => navigate("Dashboard")}
        >
          <Home size={19} />
          <span>Home</span>
        </button>

        <button
          className={
            activePage === "Tasks"
              ? "active"
              : ""
          }
          onClick={() => navigate("Tasks")}
        >
          <CheckSquare size={19} />
          <span>Tasks</span>
        </button>

        <button
          className={
            activePage === "Notes"
              ? "active"
              : ""
          }
          onClick={() => navigate("Notes")}
        >
          <FileText size={19} />
          <span>Notes</span>
        </button>

        <button
          className={aiOpen ? "active" : ""}
          onClick={() => setAiOpen(!aiOpen)}
        >
          <Bot size={19} />
          <span>AI</span>
        </button>

        <button
          onClick={() =>
            setSidebarOpen(!sidebarOpen)
          }
        >
          <Menu size={19} />
          <span>More</span>
        </button>
      </nav>
    </div>
  );
}

/* =========================================================
   DASHBOARD
   ========================================================= */

function Dashboard({ navigate, greeting, subjectCount, profileName }) {
  const [dashboardData, setDashboardData] = useState(null);

  useEffect(() => {
    let active = true;
    apiRequest("/dashboard")
      .then((data) => {
        if (active) setDashboardData(data);
      })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  const values = {
    "Subjects": subjectCount,
    "Tasks Done": dashboardData?.stats?.tasksDone ?? 0,
    "Active Goals": dashboardData?.stats?.activeGoals ?? 0,
    "Study Hours This Week": `${dashboardData?.stats?.studyHoursThisWeek ?? 0}h`,
    "Pomodoro Sessions": dashboardData?.stats?.pomodoroSessions ?? 0,
    "Level": dashboardData?.stats?.level ?? 1,
    "Streak": dashboardData?.stats?.streak ?? 0,
  };
  const dashboardStats = stats.map(([label, , Icon, type]) => [
    label,
    values[label],
    Icon,
    type,
  ]);
  const todayTasks = dashboardData?.todayTasks || [];
  const activeGoals = (dashboardData?.activeGoals || []).filter((goal) => goal.status !== "Completed");
  const upcomingDeadlines = dashboardData?.upcomingDeadlines || [];
  const recentActivity = dashboardData?.recentActivity || [];
  return (
    <div className="dashboard">
      {/* HERO */}
      <section className="hero">
        <div className="hero-content">
          <div className="hero-kicker">
            <Sparkles size={15} />
            YOUR DAILY STUDY COMMAND CENTER
          </div>

          <h1>
            {greeting}
            {profileName && profileName !== "Student"
              ? `, ${profileName}`
              : ""}
            ! <span aria-hidden="true">&#x1F44B;</span>
          </h1>

          <h2>
            Let's make today productive.
          </h2>

          <p>
            Build better habits. Learn consistently.
            Grow every day.
          </p>

          <button className="hero-button">
            <CalendarCheck size={17} />
            Plan My Day
            <ArrowUpRight size={16} />
          </button>
        </div>

        {/* HERO ART */}
        <div className="hero-art">
          <div className="hero-glow glow-one" />
          <div className="hero-glow glow-two" />

          <div className="hero-sun" />

          <div className="mountain mountain-one" />
          <div className="mountain mountain-two" />
          <div className="mountain mountain-three" />

          <div className="rocket">
            <Rocket
              size={59}
              strokeWidth={1.45}
            />
          </div>

          <div className="rocket-trail" />

          <div className="hero-card">
            <Sparkles size={16} />

            <div>
              <strong>Focus</strong>
              <span>Create &middot; Grow</span>
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="stats">
        {dashboardStats.map(
          ([label, value, Icon, type]) => (
            <article
              className={`stat-card stat-${type}`}
              key={label}
            >
              <div className="stat-icon">
                <Icon size={20} />
              </div>

              <div className="stat-text">
                <span>{label}</span>

                <strong>{value}</strong>
              </div>
            </article>
          )
        )}
      </section>

      {/* OVERVIEW */}
      <section className="content-grid">
        <div className="left-column">
          <OverviewPanel
            label="FOCUS"
            title="Today's Tasks"
            icon={CheckSquare}
            type="blue"
            items={todayTasks.map((task) => task.title)}
            emptyTitle="No tasks for today"
            emptyText="Add your first task and start making progress."
            button="Add Task"
            onClick={() => navigate("Tasks")}
          />

          <OverviewPanel
            label="PROGRESS"
            title="Active Goals"
            icon={Target}
            type="purple"
            items={activeGoals.map((goal) => goal.title)}
            emptyTitle="No active goals"
            emptyText="Create a goal to track your progress."
            button="Add Goal"
            onClick={() => navigate("Goals")}
          />
        </div>

        <div className="right-column">
          <OverviewPanel
            label="SCHEDULE"
            title="Upcoming Deadlines"
            icon={CalendarDays}
            type="cyan"
            items={upcomingDeadlines.map((task) => task.title)}
            emptyTitle="No upcoming deadlines"
            emptyText="Your important deadlines will appear here."
            button="View Schedule"
            onClick={() =>
              navigate("Study Plan")
            }
          />

          <OverviewPanel
            label="ACTIVITY"
            title="Recent Activity"
            icon={TrendingUp}
            type="orange"
            items={recentActivity.map((activity) => activity.metadata?.title || activity.event_type.replaceAll("_", " ").toLowerCase())}
            emptyTitle="No recent activity"
            emptyText="Your study activity will appear here."
            button="View Analytics"
            onClick={() =>
              navigate("Analytics")
            }
          />
        </div>
      </section>

      {/* PLACEMENT */}
      <section
        className="placement-mini"
        onClick={() =>
          navigate("Placement Hub")
        }
      >
        <div className="placement-mini-icon">
          <BriefcaseBusiness size={21} />
        </div>

        <div className="placement-content">
          <span>CAREER</span>

          <strong>Placement Hub</strong>

          <p>
            Prepare for internships and placements.
          </p>
        </div>

        <ArrowUpRight size={20} />
      </section>

      {/* MOTIVATION */}
      <section className="motivation">
        <div className="motivation-icon">
          <Sparkles size={20} />
        </div>

        <div className="motivation-copy">
          <strong>
            Small progress is still progress.
          </strong>

          <span>
            Stay consistent today and let your future
            self thank you.
          </span>
        </div>

        <button>
          Keep Going
          <ArrowUpRight size={16} />
        </button>
      </section>
    </div>
  );
}

/* =========================================================
   OVERVIEW PANEL
   ========================================================= */

function OverviewPanel({
  label,
  title,
  icon: Icon,
  type,
  emptyTitle,
  emptyText,
  items = [],
  button,
  onClick,
}) {
  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <span className="panel-kicker">
            {label}
          </span>

          <h3>{title}</h3>
        </div>

        <button onClick={onClick}>
          View All
          <ArrowUpRight size={14} />
        </button>
      </div>

      <div className="empty-state">
        <div
          className={`empty-icon ${type}`}
        >
          <Icon size={21} />
        </div>

        <div className="empty-copy">
          <strong>{items.length ? `${items.length} ${items.length === 1 ? "item" : "items"}` : emptyTitle}</strong>

          {items.length
            ? items.slice(0, 3).map((item, index) => <span key={`${item}-${index}`}>{item}</span>)
            : <span>{emptyText}</span>}
        </div>

        {button && (
          <button
            className="small-add-button"
            onClick={onClick}
          >
            <Plus size={15} />
            {button}
          </button>
        )}
      </div>
    </section>
  );
}


export default App;
