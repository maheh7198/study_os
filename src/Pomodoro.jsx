import { useEffect, useMemo, useRef, useState } from "react";
import {
  Timer,
  Play,
  Pause,
  RotateCcw,
  Coffee,
  Brain,
  BookOpen,
  CheckCircle2,
  Flame,
  Clock3,
  BarChart3,
  Volume2,
  VolumeX,
  Zap,
} from "lucide-react";
import "./Pomodoro.css";

const POMODORO_STORAGE_KEY = "studyos-pomodoro-sessions";
const POMODORO_TIMER_STORAGE_KEY = "studyos-pomodoro-active-timer";

const DEFAULT_DURATIONS = {
  focus: 25,
  shortBreak: 5,
  longBreak: 15,
};

const createId = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const todayString = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const formatTime = (seconds) => {
  const safeSeconds = Math.max(0, Number(seconds) || 0);
  const minutes = Math.floor(safeSeconds / 60);
  const remaining = safeSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(
    remaining
  ).padStart(2, "0")}`;
};

const Pomodoro = ({ subjects = [], setNotifications }) => {
  const [mode, setMode] = useState("focus");

  const [durations, setDurations] = useState(DEFAULT_DURATIONS);

  const [remainingSeconds, setRemainingSeconds] = useState(
    DEFAULT_DURATIONS.focus * 60
  );

  const [isRunning, setIsRunning] = useState(false);

  const [completedSessions, setCompletedSessions] = useState(() => {
    try {
      const saved = localStorage.getItem(POMODORO_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("");
  const [sessionNote, setSessionNote] = useState("");

  const [soundEnabled, setSoundEnabled] = useState(true);
  const [autoStartBreak, setAutoStartBreak] = useState(false);
  const [autoStartFocus, setAutoStartFocus] = useState(false);

  const [notice, setNotice] = useState("");

  const intervalRef = useRef(null);
  const endTimeRef = useRef(null);
  const startedAtRef = useRef(null);

  const hydratedRef = useRef(false);
  const completionLockRef = useRef(false);

  /* -------------------------------------------------------
     TOPICS FROM SUBJECTS
  ------------------------------------------------------- */

  const subjectTopics = useMemo(() => {
    if (!selectedSubject) return [];

    const subject = subjects.find(
      (item) => item.name === selectedSubject
    );

    if (!subject) return [];

    const topics = [];

    const addTopic = (topic) => {
      if (!topic) return;

      if (typeof topic === "string") {
        const value = topic.trim();

        if (value) {
          topics.push(value);
        }

        return;
      }

      if (typeof topic === "object") {
        const value =
          topic.name ||
          topic.title ||
          topic.topic ||
          topic.label;

        if (typeof value === "string" && value.trim()) {
          topics.push(value.trim());
        }
      }
    };

    if (Array.isArray(subject.topics)) {
      subject.topics.forEach(addTopic);
    }

    if (Array.isArray(subject.units)) {
      subject.units.forEach((unit) => {
        if (Array.isArray(unit?.topics)) {
          unit.topics.forEach(addTopic);
        }
      });
    }

    if (Array.isArray(subject.topicList)) {
      subject.topicList.forEach(addTopic);
    }

    if (Array.isArray(subject.syllabusTopics)) {
      subject.syllabusTopics.forEach(addTopic);
    }

    return [...new Set(topics)];
  }, [subjects, selectedSubject]);

  /* -------------------------------------------------------
     CURRENT TIMER
  ------------------------------------------------------- */

  const currentDuration = durations[mode] * 60;

  const progress =
    currentDuration > 0
      ? ((currentDuration - remainingSeconds) / currentDuration) * 100
      : 0;

  const safeProgress = Math.min(100, Math.max(0, progress));

  /* -------------------------------------------------------
     STATS
  ------------------------------------------------------- */

  const todaySessions = useMemo(() => {
    return completedSessions.filter(
      (session) => session.date === todayString()
    );
  }, [completedSessions]);

  const todayFocusMinutes = useMemo(() => {
    return todaySessions.reduce(
      (total, session) => total + Number(session.duration || 0),
      0
    );
  }, [todaySessions]);

  const todayFocusHours = (todayFocusMinutes / 60).toFixed(1);

  const currentStreak = useMemo(() => {
    const uniqueDates = [
      ...new Set(completedSessions.map((session) => session.date)),
    ].sort((a, b) => new Date(b) - new Date(a));

    if (!uniqueDates.length) return 0;

    let streak = 0;
    const current = new Date();

    for (const dateString of uniqueDates) {
      const expected = new Date(current);
      expected.setDate(current.getDate() - streak);

      const expectedString = [
        expected.getFullYear(),
        String(expected.getMonth() + 1).padStart(2, "0"),
        String(expected.getDate()).padStart(2, "0"),
      ].join("-");

      if (dateString === expectedString) {
        streak += 1;
      } else {
        break;
      }
    }

    return streak;
  }, [completedSessions]);

  /* -------------------------------------------------------
     SAVE COMPLETED SESSIONS
  ------------------------------------------------------- */

  useEffect(() => {
    try {
      localStorage.setItem(
        POMODORO_STORAGE_KEY,
        JSON.stringify(completedSessions)
      );
    } catch {
      // Ignore storage errors.
    }
  }, [completedSessions]);

  /* -------------------------------------------------------
     NOTICE
  ------------------------------------------------------- */

  useEffect(() => {
    if (!notice) return;

    const timeout = setTimeout(() => {
      setNotice("");
    }, 2800);

    return () => clearTimeout(timeout);
  }, [notice]);

  /* -------------------------------------------------------
     NOTIFICATION
  ------------------------------------------------------- */

  const sendNotification = (title, message) => {
    if (typeof setNotifications === "function") {
      setNotifications((previous) => [
        {
          id: createId(),
          title,
          message,
          time: new Date().toISOString(),
          read: false,
          type: "pomodoro",
        },
        ...previous,
      ]);
    }

    if (
      typeof window !== "undefined" &&
      "Notification" in window &&
      Notification.permission === "granted"
    ) {
      try {
        new Notification(title, {
          body: message,
        });
      } catch {
        // Browser notification unavailable.
      }
    }
  };

  /* -------------------------------------------------------
     SOUND
  ------------------------------------------------------- */

  const playSound = () => {
    if (!soundEnabled) return;

    try {
      const AudioContext =
        window.AudioContext || window.webkitAudioContext;

      if (!AudioContext) return;

      const audioContext = new AudioContext();

      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(
        880,
        audioContext.currentTime
      );

      gain.gain.setValueAtTime(
        0.0001,
        audioContext.currentTime
      );

      gain.gain.exponentialRampToValueAtTime(
        0.2,
        audioContext.currentTime + 0.02
      );

      gain.gain.exponentialRampToValueAtTime(
        0.0001,
        audioContext.currentTime + 0.8
      );

      oscillator.connect(gain);
      gain.connect(audioContext.destination);

      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.8);
    } catch {
      // Ignore audio errors.
    }
  };

  /* -------------------------------------------------------
     SAVE ACTIVE TIMER
  ------------------------------------------------------- */

  const saveActiveTimer = ({
    running = isRunning,
    currentMode = mode,
    currentRemaining = remainingSeconds,
    endTime = endTimeRef.current,
    startedAt = startedAtRef.current,
  } = {}) => {
    try {
      const activeTimer = {
        mode: currentMode,
        durations,
        remainingSeconds: currentRemaining,
        isRunning: running,
        endTime: running ? endTime : null,
        selectedSubject,
        selectedTopic,
        sessionNote,
        startedAt: running || startedAt ? startedAt : null,
        updatedAt: Date.now(),
      };

      localStorage.setItem(
        POMODORO_TIMER_STORAGE_KEY,
        JSON.stringify(activeTimer)
      );
    } catch {
      // Ignore storage errors.
    }
  };

  const clearActiveTimer = () => {
    try {
      localStorage.removeItem(POMODORO_TIMER_STORAGE_KEY);
    } catch {
      // Ignore storage errors.
    }

    endTimeRef.current = null;
    startedAtRef.current = null;
  };

  /* -------------------------------------------------------
     COMPLETE TIMER
  ------------------------------------------------------- */

  const completeTimer = ({
    completedMode = mode,
    completedDurationSeconds = currentDuration,
    completedSubject = selectedSubject,
    completedTopic = selectedTopic,
    completedNote = sessionNote,
    completedStartedAt = startedAtRef.current,
  } = {}) => {
    if (completionLockRef.current) return;

    completionLockRef.current = true;

    setIsRunning(false);

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    endTimeRef.current = null;

    playSound();

    if (completedMode === "focus") {
      const durationMinutes = Math.round(
        completedDurationSeconds / 60
      );

      const session = {
        id: createId(),
        date: todayString(),
        startTime:
          completedStartedAt ||
          new Date(
            Date.now() - completedDurationSeconds * 1000
          ).toISOString(),
        endTime: new Date().toISOString(),
        duration: durationMinutes,
        subject: completedSubject,
        topic: completedTopic,
        task: "",
        sessionType: "focus",
        completed: true,
        interrupted: false,
        note: completedNote,
        createdAt: new Date().toISOString(),
      };

      setCompletedSessions((previous) => [
        session,
        ...previous,
      ]);

      const newSessionNumber = completedSessions.length + 1;

      const nextMode =
        newSessionNumber % 4 === 0
          ? "longBreak"
          : "shortBreak";

      sendNotification(
        "Focus session completed",
        nextMode === "longBreak"
          ? "Great work! Time for a long break."
          : "Great work! Time for a short break."
      );

      setNotice(
        nextMode === "longBreak"
          ? "Focus completed — long break started."
          : "Focus completed — short break started."
      );

      setMode(nextMode);

      const nextDuration = durations[nextMode] * 60;

      setRemainingSeconds(nextDuration);

      startedAtRef.current = null;

      if (autoStartBreak) {
        const newEndTime = Date.now() + nextDuration * 1000;

        endTimeRef.current = newEndTime;
        startedAtRef.current = new Date().toISOString();

        setIsRunning(true);

        try {
          localStorage.setItem(
            POMODORO_TIMER_STORAGE_KEY,
            JSON.stringify({
              mode: nextMode,
              durations,
              remainingSeconds: nextDuration,
              isRunning: true,
              endTime: newEndTime,
              selectedSubject: "",
              selectedTopic: "",
              sessionNote: "",
              startedAt: startedAtRef.current,
              updatedAt: Date.now(),
            })
          );
        } catch {
          // Ignore storage errors.
        }
      } else {
        try {
          localStorage.setItem(
            POMODORO_TIMER_STORAGE_KEY,
            JSON.stringify({
              mode: nextMode,
              durations,
              remainingSeconds: nextDuration,
              isRunning: false,
              endTime: null,
              selectedSubject: "",
              selectedTopic: "",
              sessionNote: "",
              startedAt: null,
              updatedAt: Date.now(),
            })
          );
        } catch {
          // Ignore storage errors.
        }
      }

      setSelectedSubject("");
      setSelectedTopic("");
      setSessionNote("");
    } else {
      sendNotification(
        "Break completed",
        "Break finished. Ready for another focus session?"
      );

      setNotice("Break completed — ready for focus.");

      const nextDuration = durations.focus * 60;

      setMode("focus");
      setRemainingSeconds(nextDuration);

      startedAtRef.current = null;

      if (autoStartFocus) {
        const newEndTime = Date.now() + nextDuration * 1000;

        endTimeRef.current = newEndTime;
        startedAtRef.current = new Date().toISOString();

        setIsRunning(true);

        try {
          localStorage.setItem(
            POMODORO_TIMER_STORAGE_KEY,
            JSON.stringify({
              mode: "focus",
              durations,
              remainingSeconds: nextDuration,
              isRunning: true,
              endTime: newEndTime,
              selectedSubject,
              selectedTopic,
              sessionNote,
              startedAt: startedAtRef.current,
              updatedAt: Date.now(),
            })
          );
        } catch {
          // Ignore storage errors.
        }
      } else {
        try {
          localStorage.setItem(
            POMODORO_TIMER_STORAGE_KEY,
            JSON.stringify({
              mode: "focus",
              durations,
              remainingSeconds: nextDuration,
              isRunning: false,
              endTime: null,
              selectedSubject,
              selectedTopic,
              sessionNote,
              startedAt: null,
              updatedAt: Date.now(),
            })
          );
        } catch {
          // Ignore storage errors.
        }
      }
    }

    setTimeout(() => {
      completionLockRef.current = false;
    }, 500);
  };

  /* -------------------------------------------------------
     RESTORE TIMER AFTER NAVIGATION / REFRESH
  ------------------------------------------------------- */

  useEffect(() => {
    let savedTimer = null;

    try {
      const saved = localStorage.getItem(
        POMODORO_TIMER_STORAGE_KEY
      );

      savedTimer = saved ? JSON.parse(saved) : null;
    } catch {
      savedTimer = null;
    }

    if (savedTimer) {
      const restoredDurations = {
        ...DEFAULT_DURATIONS,
        ...(savedTimer.durations || {}),
      };

      const restoredMode =
        savedTimer.mode === "shortBreak" ||
        savedTimer.mode === "longBreak"
          ? savedTimer.mode
          : "focus";

      setDurations(restoredDurations);
      setMode(restoredMode);

      setSelectedSubject(savedTimer.selectedSubject || "");
      setSelectedTopic(savedTimer.selectedTopic || "");
      setSessionNote(savedTimer.sessionNote || "");

      const savedIsRunning = Boolean(savedTimer.isRunning);

      if (savedIsRunning && savedTimer.endTime) {
        const secondsLeft = Math.max(
          0,
          Math.ceil(
            (Number(savedTimer.endTime) - Date.now()) / 1000
          )
        );

        setRemainingSeconds(secondsLeft);

        endTimeRef.current = Number(savedTimer.endTime);
        startedAtRef.current =
          savedTimer.startedAt || new Date().toISOString();

        if (secondsLeft <= 0) {
          setIsRunning(false);

          setTimeout(() => {
            completeTimer({
              completedMode: restoredMode,
              completedDurationSeconds:
                restoredDurations[restoredMode] * 60,
              completedSubject:
                savedTimer.selectedSubject || "",
              completedTopic:
                savedTimer.selectedTopic || "",
              completedNote:
                savedTimer.sessionNote || "",
              completedStartedAt:
                savedTimer.startedAt ||
                new Date(
                  Date.now() -
                    restoredDurations[restoredMode] * 60 * 1000
                ).toISOString(),
            });
          }, 0);
        } else {
          setIsRunning(true);
        }
      } else {
        const restoredRemaining =
          Number(savedTimer.remainingSeconds) ||
          restoredDurations[restoredMode] * 60;

        setRemainingSeconds(restoredRemaining);
        setIsRunning(false);

        endTimeRef.current = null;
        startedAtRef.current =
          savedTimer.startedAt || null;
      }
    }

    hydratedRef.current = true;
  }, []);

  /* -------------------------------------------------------
     TIMER TICK
  ------------------------------------------------------- */

  useEffect(() => {
    if (!isRunning) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      return;
    }

    const updateRemaining = () => {
      const endTime = endTimeRef.current;

      if (!endTime) return;

      const secondsLeft = Math.max(
        0,
        Math.ceil((endTime - Date.now()) / 1000)
      );

      setRemainingSeconds(secondsLeft);

      if (secondsLeft <= 0) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }

        completeTimer();
      }
    };

    updateRemaining();

    intervalRef.current = setInterval(
      updateRemaining,
      1000
    );

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning]);

  /* -------------------------------------------------------
     SAVE CONTEXT CHANGES WHILE RUNNING
  ------------------------------------------------------- */

  useEffect(() => {
    if (!hydratedRef.current) return;

    try {
      const saved = localStorage.getItem(
        POMODORO_TIMER_STORAGE_KEY
      );

      if (!saved) return;

      const activeTimer = JSON.parse(saved);

      if (!activeTimer?.isRunning) return;

      localStorage.setItem(
        POMODORO_TIMER_STORAGE_KEY,
        JSON.stringify({
          ...activeTimer,
          mode,
          durations,
          selectedSubject,
          selectedTopic,
          sessionNote,
          endTime: endTimeRef.current,
          startedAt: startedAtRef.current,
          updatedAt: Date.now(),
        })
      );
    } catch {
      // Ignore storage errors.
    }
  }, [
    selectedSubject,
    selectedTopic,
    sessionNote,
  ]);

  /* -------------------------------------------------------
     START / RESUME
  ------------------------------------------------------- */

  const startTimer = () => {
    if (remainingSeconds <= 0) return;

    const newEndTime =
      Date.now() + remainingSeconds * 1000;

    endTimeRef.current = newEndTime;

    if (!startedAtRef.current) {
      startedAtRef.current = new Date().toISOString();
    }

    setIsRunning(true);

    saveActiveTimer({
      running: true,
      currentMode: mode,
      currentRemaining: remainingSeconds,
      endTime: newEndTime,
      startedAt: startedAtRef.current,
    });

    if (
      "Notification" in window &&
      Notification.permission === "default"
    ) {
      Notification.requestPermission().catch(() => {});
    }
  };

  /* -------------------------------------------------------
     PAUSE
  ------------------------------------------------------- */

  const pauseTimer = () => {
    const currentEndTime = endTimeRef.current;

    const currentRemaining = currentEndTime
      ? Math.max(
          0,
          Math.ceil(
            (currentEndTime - Date.now()) / 1000
          )
        )
      : remainingSeconds;

    setRemainingSeconds(currentRemaining);
    setIsRunning(false);

    endTimeRef.current = null;

    saveActiveTimer({
      running: false,
      currentMode: mode,
      currentRemaining,
      endTime: null,
      startedAt: startedAtRef.current,
    });
  };

  /* -------------------------------------------------------
     RESET
  ------------------------------------------------------- */

  const resetTimer = () => {
    setIsRunning(false);

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    const resetSeconds = durations[mode] * 60;

    setRemainingSeconds(resetSeconds);

    endTimeRef.current = null;
    startedAtRef.current = null;

    clearActiveTimer();

    try {
      localStorage.setItem(
        POMODORO_TIMER_STORAGE_KEY,
        JSON.stringify({
          mode,
          durations,
          remainingSeconds: resetSeconds,
          isRunning: false,
          endTime: null,
          selectedSubject,
          selectedTopic,
          sessionNote,
          startedAt: null,
          updatedAt: Date.now(),
        })
      );
    } catch {
      // Ignore storage errors.
    }

    setNotice("Timer reset.");
  };

  /* -------------------------------------------------------
     CHANGE MODE
  ------------------------------------------------------- */

  const changeMode = (newMode) => {
    setIsRunning(false);

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    const newDuration = durations[newMode] * 60;

    setMode(newMode);
    setRemainingSeconds(newDuration);

    endTimeRef.current = null;
    startedAtRef.current = null;

    try {
      localStorage.setItem(
        POMODORO_TIMER_STORAGE_KEY,
        JSON.stringify({
          mode: newMode,
          durations,
          remainingSeconds: newDuration,
          isRunning: false,
          endTime: null,
          selectedSubject,
          selectedTopic,
          sessionNote,
          startedAt: null,
          updatedAt: Date.now(),
        })
      );
    } catch {
      // Ignore storage errors.
    }
  };

  /* -------------------------------------------------------
     CHANGE DURATION
  ------------------------------------------------------- */

  const changeDuration = (newMinutes) => {
    const safeMinutes = Math.max(
      1,
      Math.min(120, Number(newMinutes) || 1)
    );

    const updatedDurations = {
      ...durations,
      [mode]: safeMinutes,
    };

    setDurations(updatedDurations);

    const newSeconds = safeMinutes * 60;

    setRemainingSeconds(newSeconds);

    if (isRunning) {
      const newEndTime =
        Date.now() + newSeconds * 1000;

      endTimeRef.current = newEndTime;

      saveActiveTimer({
        running: true,
        currentMode: mode,
        currentRemaining: newSeconds,
        endTime: newEndTime,
        startedAt: startedAtRef.current,
      });
    } else {
      endTimeRef.current = null;

      try {
        localStorage.setItem(
          POMODORO_TIMER_STORAGE_KEY,
          JSON.stringify({
            mode,
            durations: updatedDurations,
            remainingSeconds: newSeconds,
            isRunning: false,
            endTime: null,
            selectedSubject,
            selectedTopic,
            sessionNote,
            startedAt: null,
            updatedAt: Date.now(),
          })
        );
      } catch {
        // Ignore storage errors.
      }
    }
  };

  /* -------------------------------------------------------
     RING
  ------------------------------------------------------- */

  const radius = 118;
  const circumference = 2 * Math.PI * radius;

  const dashOffset =
    circumference -
    (safeProgress / 100) * circumference;

  /* -------------------------------------------------------
     UI
  ------------------------------------------------------- */

  return (
    <section className="pomodoro-page">
      {notice && (
        <div className="pomodoro-toast">
          <CheckCircle2 size={17} />
          <span>{notice}</span>
        </div>
      )}

      {/* HEADER */}
      <header className="pomodoro-header">
        <div className="pomodoro-heading">
          <div className="pomodoro-heading-icon">
            <Timer size={28} />
          </div>

          <div>
            <h1>Pomodoro</h1>
            <p>
              Focus deeply, take meaningful breaks, and
              build consistent study habits.
            </p>
          </div>
        </div>
      </header>

      {/* MAIN */}
      <div className="pomodoro-layout">
        {/* TIMER */}
        <div className="pomodoro-timer-card">
          <div className="pomodoro-mode-tabs">
            <button
              className={mode === "focus" ? "active" : ""}
              onClick={() => changeMode("focus")}
            >
              <Brain size={17} />
              Focus
            </button>

            <button
              className={mode === "shortBreak" ? "active" : ""}
              onClick={() => changeMode("shortBreak")}
            >
              <Coffee size={17} />
              Short Break
            </button>

            <button
              className={mode === "longBreak" ? "active" : ""}
              onClick={() => changeMode("longBreak")}
            >
              <Coffee size={17} />
              Long Break
            </button>
          </div>

          {/* TIMER RING */}
          <div className="pomodoro-ring-wrap">
            <svg
              className="pomodoro-ring"
              width="340"
              height="340"
              viewBox="0 0 280 280"
            >
              <defs>
                <linearGradient
                  id="pomodoroGradient"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor="#4f46e5" />
                  <stop offset="100%" stopColor="#a855f7" />
                </linearGradient>
              </defs>

              <circle
                cx="140"
                cy="140"
                r={radius}
                className="pomodoro-ring-bg"
              />

              <circle
                cx="140"
                cy="140"
                r={radius}
                className="pomodoro-ring-progress"
                stroke="url(#pomodoroGradient)"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
              />
            </svg>

            <div className="pomodoro-ring-content">
              <span className="pomodoro-mode-label">
                {mode === "focus"
                  ? "FOCUS"
                  : mode === "shortBreak"
                  ? "SHORT BREAK"
                  : "LONG BREAK"}
              </span>

              <strong>
                {formatTime(remainingSeconds)}
              </strong>

              <span className="pomodoro-status">
                {isRunning
                  ? "Timer running"
                  : "Ready when you are"}
              </span>
            </div>
          </div>

          {/* CURRENT STUDY */}
          <div className="pomodoro-current-study">
            <div className="pomodoro-current-icon">
              {mode === "focus" ? (
                <Brain size={20} />
              ) : (
                <Coffee size={20} />
              )}
            </div>

            <div>
              <span>Current Session</span>
              <strong>
                {mode === "focus"
                  ? selectedTopic ||
                    selectedSubject ||
                    "Focused Study"
                  : "Recharge & Reset"}
              </strong>
            </div>
          </div>

          {/* CONTROLS */}
          <div className="pomodoro-controls">
            {!isRunning ? (
              <button
                className="pomodoro-primary-btn"
                onClick={startTimer}
              >
                <Play size={18} fill="currentColor" />
                {remainingSeconds <
                durations[mode] * 60
                  ? "Resume"
                  : "Start"}
              </button>
            ) : (
              <button
                className="pomodoro-primary-btn"
                onClick={pauseTimer}
              >
                <Pause size={18} fill="currentColor" />
                Pause
              </button>
            )}

            <button
              className="pomodoro-secondary-btn"
              onClick={resetTimer}
            >
              <RotateCcw size={17} />
              Reset
            </button>
          </div>

          <div className="pomodoro-focus-hint">
            <Zap size={15} />
            {isRunning
              ? "Your focus timer continues even when you navigate to another page."
              : "Start a session and make every minute count."}
          </div>
        </div>

        {/* RIGHT SIDE */}
        <aside className="pomodoro-side">
          {/* STUDY CONTEXT */}
          <div className="pomodoro-panel">
            <div className="pomodoro-panel-heading">
              <div>
                <h3>Study Context</h3>
                <p>Connect this session to your study.</p>
              </div>

              <BookOpen size={19} />
            </div>

            <div className="pomodoro-form-group">
              <label>Subject</label>

              <select
                value={selectedSubject}
                onChange={(event) => {
                  setSelectedSubject(event.target.value);
                  setSelectedTopic("");
                }}
              >
                <option value="">Select subject</option>

                {subjects.map((subject) => (
                  <option
                    key={subject.id || subject.name}
                    value={subject.name}
                  >
                    {subject.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="pomodoro-form-group">
              <label>Topic</label>

              <input
                list="pomodoro-topic-options"
                type="text"
                value={selectedTopic}
                onChange={(event) =>
                  setSelectedTopic(event.target.value)
                }
                disabled={!selectedSubject}
                placeholder={
                  selectedSubject
                    ? "Select or type a topic"
                    : "Select subject first"
                }
              />

              <datalist id="pomodoro-topic-options">
                {subjectTopics.map((topic, index) => (
                  <option
                    value={topic}
                    key={`${topic}-${index}`}
                  />
                ))}
              </datalist>
            </div>

            <div className="pomodoro-form-group">
              <label>Session Note</label>

              <textarea
                value={sessionNote}
                onChange={(event) =>
                  setSessionNote(event.target.value)
                }
                placeholder="What are you focusing on?"
                rows="3"
              />
            </div>
          </div>

          {/* FOCUS DURATION */}
          <div className="pomodoro-panel">
            <div className="pomodoro-panel-heading">
              <div>
                <h3>Focus Duration</h3>
                <p>Customize the current timer.</p>
              </div>

              <Clock3 size={19} />
            </div>

            <div className="pomodoro-duration-control">
              <button
                onClick={() =>
                  changeDuration(
                    durations[mode] - 5
                  )
                }
                disabled={durations[mode] <= 5}
              >
                −
              </button>

              <div>
                <strong>{durations[mode]}</strong>
                <span>minutes</span>
              </div>

              <button
                onClick={() =>
                  changeDuration(
                    durations[mode] + 5
                  )
                }
                disabled={durations[mode] >= 120}
              >
                +
              </button>
            </div>

            <div className="pomodoro-duration-presets">
              {[15, 25, 30, 45, 60].map(
                (minutes) => (
                  <button
                    key={minutes}
                    className={
                      durations[mode] === minutes
                        ? "active"
                        : ""
                    }
                    onClick={() =>
                      changeDuration(minutes)
                    }
                  >
                    {minutes}m
                  </button>
                )
              )}
            </div>
          </div>

          {/* TODAY'S PROGRESS */}
          <div className="pomodoro-panel">
            <div className="pomodoro-panel-heading">
              <div>
                <h3>Today's Progress</h3>
                <p>Your focus performance today.</p>
              </div>

              <BarChart3 size={19} />
            </div>

            <div className="pomodoro-progress-grid">
              <div>
                <span>Sessions</span>
                <strong>{todaySessions.length}</strong>
              </div>

              <div>
                <span>Focus Time</span>
                <strong>{todayFocusHours}h</strong>
              </div>

              <div>
                <span>Streak</span>
                <strong>
                  <Flame size={15} />
                  {currentStreak}
                </strong>
              </div>
            </div>
          </div>

          {/* SETTINGS */}
          <div className="pomodoro-panel">
            <div className="pomodoro-panel-heading">
              <div>
                <h3>Settings</h3>
                <p>Control your focus routine.</p>
              </div>

              {soundEnabled ? (
                <Volume2 size={19} />
              ) : (
                <VolumeX size={19} />
              )}
            </div>

            <label className="pomodoro-toggle-row">
              <span>
                <span className="toggle-title">
                  Sound
                </span>
                <span className="toggle-description">
                  Play sound when a timer finishes.
                </span>
              </span>

              <input
                type="checkbox"
                checked={soundEnabled}
                onChange={(event) =>
                  setSoundEnabled(
                    event.target.checked
                  )
                }
              />

              <span className="pomodoro-switch" />
            </label>

            <label className="pomodoro-toggle-row">
              <span>
                <span className="toggle-title">
                  Auto-start breaks
                </span>
                <span className="toggle-description">
                  Start the break automatically.
                </span>
              </span>

              <input
                type="checkbox"
                checked={autoStartBreak}
                onChange={(event) =>
                  setAutoStartBreak(
                    event.target.checked
                  )
                }
              />

              <span className="pomodoro-switch" />
            </label>

            <label className="pomodoro-toggle-row">
              <span>
                <span className="toggle-title">
                  Auto-start focus
                </span>
                <span className="toggle-description">
                  Start focus after a break.
                </span>
              </span>

              <input
                type="checkbox"
                checked={autoStartFocus}
                onChange={(event) =>
                  setAutoStartFocus(
                    event.target.checked
                  )
                }
              />

              <span className="pomodoro-switch" />
            </label>
          </div>

          {/* RECENT SESSIONS */}
          <div className="pomodoro-panel">
            <div className="pomodoro-panel-heading">
              <div>
                <h3>Recent Sessions</h3>
                <p>Your latest completed focus sessions.</p>
              </div>

              <CheckCircle2 size={19} />
            </div>

            {completedSessions.length === 0 ? (
              <div className="pomodoro-empty-sessions">
                <Timer size={20} />
                <span>
                  No completed sessions yet.
                </span>
              </div>
            ) : (
              <div className="pomodoro-session-list">
                {completedSessions
                  .slice(0, 5)
                  .map((session) => (
                    <div
                      className="pomodoro-session-item"
                      key={session.id}
                    >
                      <div>
                        <strong>
                          {session.topic ||
                            session.subject ||
                            "Focused Study"}
                        </strong>

                        <span>
                          {session.date}
                          {session.subject
                            ? ` • ${session.subject}`
                            : ""}
                        </span>
                      </div>

                      <b>
                        {session.duration}m
                      </b>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </aside>
      </div>
    </section>
  );
};

export default Pomodoro;