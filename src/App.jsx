import { useEffect, useRef, useState } from "react";
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
  Settings,
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
  GraduationCap,
  UserCircle,
  LogOut,
  Inbox,
} from "lucide-react";
import Subjects from "./Subjects.jsx";
import Tasks from "./Tasks.jsx";
import Notes from "./Notes.jsx";
import Goals from "./Goals.jsx";

import "./App.css";

/* =========================================================
   USER
   Later this will come from Login / Backend
   ========================================================= */

const currentUser = {
  name: "",
  role: "Student",
};

const SUBJECTS_STORAGE_KEY = "studyos-subjects";
const NOTIFICATIONS_STORAGE_KEY = "studyos-notifications";

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
  ["Settings", Settings],
  ["Help & Feedback", HelpCircle],
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

function App() {
  const [activePage, setActivePage] = useState("Dashboard");
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [greeting, setGreeting] = useState("Good Morning");
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notificationRef = useRef(null);
  const [notifications, setNotifications] = useState(() => {
    try {
      const stored = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
      const parsed = stored ? JSON.parse(stored) : [];
      return Array.isArray(parsed) ? parsed : [];
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

  useEffect(() => {
    localStorage.setItem(SUBJECTS_STORAGE_KEY, JSON.stringify(subjects));
  }, [subjects]);

  useEffect(() => {
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    const closeOnOutsideOrEscape = (event) => {
      if (event.type === "keydown" && event.key === "Escape") setNotificationsOpen(false);
      if (event.type === "mousedown" && notificationRef.current && !notificationRef.current.contains(event.target)) setNotificationsOpen(false);
    };
    document.addEventListener("mousedown", closeOnOutsideOrEscape);
    document.addEventListener("keydown", closeOnOutsideOrEscape);
    return () => { document.removeEventListener("mousedown", closeOnOutsideOrEscape); document.removeEventListener("keydown", closeOnOutsideOrEscape); };
  }, []);

  const unreadNotifications = notifications.filter((item) => !item.read).length;
  const markAllNotificationsRead = () => setNotifications((items) => items.map((item) => ({ ...item, read: true })));
  const markNotificationRead = (id) => setNotifications((items) => items.map((item) => item.id === id ? { ...item, read: true } : item));

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

  const name = currentUser.name || "Student";

  const navigate = (page) => {
    setActivePage(page);
    setSidebarOpen(false);
    setProfileOpen(false);
  };

  const submitAI = (e) => {
    e.preventDefault();

    if (!message.trim()) return;

    setMessage("");
  };

  const handleLogout = () => {
    setProfileOpen(false);

    /*
      Later:
      localStorage/sessionStorage clear
      API logout
      Navigate to Login
    */
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
            <div className="logo-mark">
              <GraduationCap
                size={27}
                strokeWidth={1.8}
              />
            </div>

            <div className="logo-copy">
              <div className="logo-name">StudyOS</div>

              <div className="logo-tagline">
                Plan · Learn · Grow
              </div>
            </div>
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
            <span>“</span>

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

            <div className="header-title">
              <strong>StudyOS</strong>
              <span>{activePage}</span>
            </div>
          </div>

          {/* SEARCH */}
          <div className="header-search">
            <Search size={18} />

            <input
              placeholder="Search StudyOS (notes, tasks, subjects, topics...)"
              type="text"
            />

            <span className="search-shortcut">
              Ctrl + K
            </span>
          </div>

          {/* HEADER ACTIONS */}
          <div className="header-actions">
            {/* THEME */}
            <button
              className={`theme-switch ${
                darkMode ? "active" : ""
              }`}
              onClick={() =>
                setDarkMode(!darkMode)
              }
              aria-label="Toggle theme"
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
                <Bell size={20} />
                {unreadNotifications > 0 && <span className="notification-dot">{unreadNotifications > 99 ? "99+" : unreadNotifications}</span>}
              </button>
              {notificationsOpen && <section className="notification-menu" role="dialog" aria-label="Notifications">
                <div className="notification-menu-header"><strong>Notifications</strong><button onClick={markAllNotificationsRead} disabled={unreadNotifications === 0}>Mark all as read</button></div>
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
                  setProfileOpen(!profileOpen)
                }
                aria-label="Open profile"
                aria-expanded={profileOpen}
              >
                <div className="profile-avatar">
                  {currentUser.name
                    ? currentUser.name
                        .charAt(0)
                        .toUpperCase()
                    : "S"}
                </div>

                <div className="profile-info">
                  <strong>{name}</strong>

                  <span>
                    {currentUser.role}
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
                      {currentUser.name
                        ? currentUser.name
                            .charAt(0)
                            .toUpperCase()
                        : "S"}
                    </div>

                    <div className="profile-menu-user">
                      <strong>{name}</strong>

                      <span>
                        {currentUser.role}
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
                    <Settings size={16} />
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

        {/* ===================================================
            CONTENT
            =================================================== */}

        {activePage === "Dashboard" ? (
  <Dashboard
  navigate={navigate}
  greeting={greeting}
  subjectCount={subjects.length}
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
  />) : activePage === "Goals" ? (
  <Goals
    setNotifications={setNotifications}
  />
) : (
  <ModulePage
    page={activePage}
    setAiOpen={setAiOpen}
  />
)}
        {/* ===================================================
            FOOTER
            =================================================== */}

        <footer className="footer">
          <div className="footer-brand">
            <strong>StudyOS</strong>

            <span>
              A Little Progress Today, A Brighter Future
              Tomorrow.
            </span>
          </div>

          <div className="footer-points">
            <span>100% Focus</span>
            <span>Better Habits</span>
            <span>Real Skills</span>
            <span>More Opportunities</span>
          </div>

          <span className="footer-right">
            Made for Students · Built for Growth
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
        onClick={() => setAiOpen(!aiOpen)}
        aria-label="Open StudyOS AI"
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
            <div className="ai-message">
              <Sparkles size={15} />

              <p>
                Hi! I'm your StudyOS AI. Ask me about
                studies, coding, exams or productivity.
              </p>
            </div>

            <div className="ai-quick-prompts">
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
            </div>
          </div>

          <form
            className="ai-input"
            onSubmit={submitAI}
          >
            <input
              value={message}
              onChange={(e) =>
                setMessage(e.target.value)
              }
              placeholder="Ask StudyOS AI..."
            />

            <button type="submit">
              <Send size={17} />
            </button>
          </form>
        </div>
      )}

      {/* =====================================================
          MOBILE BOTTOM NAV
          ===================================================== */}

      <nav className="mobile-nav">
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

function Dashboard({ navigate, greeting, subjectCount }) {
  
  const dashboardStats = stats.map(([label, value, Icon, type]) =>
  label === "Subjects"
    ? [label, subjectCount, Icon, type]
    : [label, value, Icon, type]
);
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
            {currentUser.name
              ? `, ${currentUser.name}`
              : ""}
            ! <span>👋</span>
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
              <span>Create · Grow</span>
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
          <strong>{emptyTitle}</strong>

          <span>{emptyText}</span>
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

/* =========================================================
   MODULE PAGE
   ========================================================= */

function ModulePage({
  page,
  setAiOpen,
}) {
  const icons = {
    Subjects: BookOpen,
    Tasks: CheckSquare,
    Notes: FileText,
    Goals: Target,
    "Study Plan": CalendarDays,
    Pomodoro: Timer,
    "Habit Tracker": Flame,
    Analytics: BarChart3,
    "Placement Hub":
      BriefcaseBusiness,
    Leaderboard: Trophy,
    "AI Mentor": Bot,
    Settings,
    "Help & Feedback":
      HelpCircle,
  };

  const Icon =
    icons[page] || BookOpen;

  return (
    <div className="module-page">
      <div className="module-icon">
        <Icon size={31} />
      </div>

      <span>STUDYOS MODULE</span>

      <h1>{page}</h1>

      <p>
        {page} will be connected to your personalized
        StudyOS data and backend.
      </p>

      <div className="module-actions">
        <button
          className="primary-button"
          onClick={() => setAiOpen(true)}
        >
          <Bot size={17} />
          Ask StudyOS AI
        </button>

        <button className="secondary-button">
          <Plus size={17} />
          Get Started
        </button>
      </div>
    </div>
  );
}

export default App;