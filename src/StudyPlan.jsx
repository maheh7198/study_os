import { useEffect, useMemo, useRef, useState } from "react";

import {
  CalendarDays,
  CalendarRange,
  CheckCircle2,
  Clock3,
  Plus,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Target,
  Pencil,
  Trash2,
  Archive,  
  X,
  Save,
  GraduationCap,
  LayoutGrid,
  Bell,
  Timer,
  BarChart3,
} from "lucide-react";

import "./StudyPlan.css";

/* =========================================================
   CONSTANTS
   ========================================================= */

const SESSION_STORAGE_KEY = "studyos-studyplan-sessions";
const PLAN_STORAGE_KEY = "studyos-study-plans";
const TIMETABLE_STORAGE_KEY = "studyos-study-timetable";


const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];


const TIMETABLE_HOURS = [
  "06:00",
  "07:00",
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
  "20:00",
  "21:00",
  "22:00",
];


/* =========================================================
   HELPERS
   ========================================================= */

const todayString = () => {
  const date = new Date();

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};


const dateString = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};


const parseDate = (value) => {
  if (!value) {
    return new Date();
  }

  const [year, month, day] = value.split("-").map(Number);

  return new Date(year, month - 1, day);
};


const formatLongDate = (value) => {
  if (!value) {
    return "";
  }

  return parseDate(value).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};


const formatShortDate = (value) => {
  if (!value) {
    return "";
  }

  return parseDate(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
};


const getTimeMinutes = (time) => {
  if (!time) {
    return 0;
  }

  const [hours, minutes] = time.split(":").map(Number);

  return hours * 60 + minutes;
};


const calculateDuration = (startTime, endTime) => {
  const start = getTimeMinutes(startTime);
  const end = getTimeMinutes(endTime);

  if (!start || !end || end <= start) {
    return 0;
  }

  return end - start;
};


const createId = (prefix) => {
  return `${prefix}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
};


/* =========================================================
   DEFAULT FORMS
   ========================================================= */

const defaultSessionForm = {
  title: "",
  date: todayString(),
  subject: "",
  topic: "",
  type: "Study",
  startTime: "09:00",
  endTime: "10:00",
  priority: "Medium",
  reminder: "none",
  description: "",
};


const defaultPlanForm = {
  title: "",
  description: "",
  startDate: todayString(),
  endDate: todayString(),
  targetHours: "10",
  progress: "0",
};


const defaultTimetableForm = {
  title: "",
  day: "Monday",
  subject: "",
  startTime: "09:00",
  endTime: "10:00",
  color: "indigo",
};


/* =========================================================
   COMPONENT
   ========================================================= */

function StudyPlan({
  subjects = [],
  setNotifications,
  navigate,
}) {

  /* -------------------------------------------------------
     STATE
     ------------------------------------------------------- */

  const [sessions, setSessions] = useState(() => {
    try {
      const saved = localStorage.getItem(
        SESSION_STORAGE_KEY
      );

      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });


  const [plans, setPlans] = useState(() => {
    try {
      const saved = localStorage.getItem(
        PLAN_STORAGE_KEY
      );

      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });


  const [timetable, setTimetable] = useState(() => {
    try {
      const saved = localStorage.getItem(
        TIMETABLE_STORAGE_KEY
      );

      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });


  const [activeView, setActiveView] =
    useState("planner");


  const [activeSection, setActiveSection] =
    useState("day");


  const [selectedDate, setSelectedDate] =
    useState(todayString());


  const [calendarDate, setCalendarDate] =
    useState(parseDate(todayString()));


  const [sessionModal, setSessionModal] =
    useState({
      open: false,
      editing: false,
      id: null,
    });


  const [planModal, setPlanModal] =
    useState({
      open: false,
      editing: false,
      id: null,
    });


  const [timetableModal, setTimetableModal] =
    useState({
      open: false,
      editing: false,
      id: null,
    });


  const [sessionForm, setSessionForm] =
    useState(defaultSessionForm);


  const [planForm, setPlanForm] =
    useState(defaultPlanForm);


  const [timetableForm, setTimetableForm] =
    useState(defaultTimetableForm);


  const [selectedPlanId, setSelectedPlanId] =
    useState(null);


  const [formError, setFormError] =
    useState("");


  const [notice, setNotice] =
    useState(null);
const studyPlanReminderKeys = useRef(new Set());
/* =====================================================
     STUDY SESSION REMINDER ENGINE
     ===================================================== */

  const playStudyReminderSound = () => {
    try {
      const AudioContext =
        window.AudioContext ||
        window.webkitAudioContext;

      if (!AudioContext) {
        return;
      }

      const audioContext = new AudioContext();

      const oscillator =
        audioContext.createOscillator();

      const gain =
        audioContext.createGain();

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(
        880,
        audioContext.currentTime
      );

      oscillator.frequency.setValueAtTime(
        660,
        audioContext.currentTime + 0.18
      );

      gain.gain.setValueAtTime(
        0.0001,
        audioContext.currentTime
      );

      gain.gain.exponentialRampToValueAtTime(
        0.18,
        audioContext.currentTime + 0.02
      );

      gain.gain.exponentialRampToValueAtTime(
        0.0001,
        audioContext.currentTime + 0.55
      );

      oscillator.connect(gain);
      gain.connect(audioContext.destination);

      oscillator.start();

      oscillator.stop(
        audioContext.currentTime + 0.55
      );

      oscillator.onended = () => {
        audioContext.close();
      };
    } catch {
      // Audio may be blocked by browser autoplay policy.
    }
  };


  const showBrowserStudyNotification = (
    session,
    reminderMinutes
  ) => {
    if (
      typeof window === "undefined" ||
      !("Notification" in window)
    ) {
      return;
    }

    if (Notification.permission !== "granted") {
      return;
    }

    const message =
      reminderMinutes === 60
        ? `${session.title} starts in 1 hour.`
        : `${session.title} starts in ${reminderMinutes} minutes.`;

    new Notification(
      "StudyOS — Study Session Reminder",
      {
        body: message,
        tag: `studyos-session-${session.id}`,
      }
    );
  };


  useEffect(() => {
    if (!sessions.length) {
      return undefined;
    }


    const checkStudyReminders = () => {
      const now = new Date();


      sessions.forEach((session) => {

        if (
          session.completed ||
          !session.reminder ||
          session.reminder === "none" ||
          !session.date ||
          !session.startTime
        ) {
          return;
        }


        const reminderMinutes =
          Number(session.reminder);


        if (
          !Number.isFinite(
            reminderMinutes
          ) ||
          reminderMinutes <= 0
        ) {
          return;
        }


        const [hours, minutes] =
          session.startTime
            .split(":")
            .map(Number);


        if (
          Number.isNaN(hours) ||
          Number.isNaN(minutes)
        ) {
          return;
        }


        const sessionStart =
          new Date(
            session.date
          );

        sessionStart.setHours(
          hours,
          minutes,
          0,
          0
        );


        const reminderTime =
          new Date(sessionStart);

        reminderTime.setMinutes(
          reminderTime.getMinutes() -
            reminderMinutes
        );


        const difference =
          now.getTime() -
          reminderTime.getTime();


        /*
          Trigger only during a small window.
          This prevents the same reminder from
          firing much later.
        */

        if (
          difference >= 0 &&
          difference < 60000
        ) {

          const reminderKey =
            `${session.id}-${session.date}-${session.startTime}-${reminderMinutes}`;


          if (
            studyPlanReminderKeys.current.has(
              reminderKey
            )
          ) {
            return;
          }


          studyPlanReminderKeys.current.add(
            reminderKey
          );


          const message =
            reminderMinutes === 60
              ? `${session.title} starts in 1 hour.`
              : `${session.title} starts in ${reminderMinutes} minutes.`;


          /* Top-right StudyOS notification */

          addNotification(
            "Study Session Reminder",
            message,
            "study"
          );


          /* Sound */

          playStudyReminderSound();


          /* Browser notification */

          showBrowserStudyNotification(
            session,
            reminderMinutes
          );

        }
      });
    };


    /*
      Ask for browser notification permission
      only when the user has actually created
      a reminder.
    */

    const hasReminder =
      sessions.some(
        (session) =>
          !session.completed &&
          session.reminder &&
          session.reminder !== "none"
      );


    if (
      hasReminder &&
      "Notification" in window &&
      Notification.permission ===
        "default"
    ) {
      Notification.requestPermission().catch(
        () => {}
      );
    }


    checkStudyReminders();


    /*
      Check every 15 seconds.
    */

    const reminderInterval =
      setInterval(
        checkStudyReminders,
        15000
      );


    return () =>
      clearInterval(
        reminderInterval
      );

  }, [sessions]);

  /* -------------------------------------------------------
     SAVE TO LOCAL STORAGE
     ------------------------------------------------------- */

  useEffect(() => {
    localStorage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify(sessions)
    );
  }, [sessions]);


  useEffect(() => {
    localStorage.setItem(
      PLAN_STORAGE_KEY,
      JSON.stringify(plans)
    );
  }, [plans]);


  useEffect(() => {
    localStorage.setItem(
      TIMETABLE_STORAGE_KEY,
      JSON.stringify(timetable)
    );
  }, [timetable]);


  /* -------------------------------------------------------
     NOTICE
     ------------------------------------------------------- */

  useEffect(() => {
    if (!notice) {
      return undefined;
    }

    const timer = setTimeout(() => {
      setNotice(null);
    }, 3000);

    return () => clearTimeout(timer);
  }, [notice]);


  const showNotice = (message, type = "success") => {
    setNotice({
      message,
      type,
    });
  };


  /* -------------------------------------------------------
     NOTIFICATION
     ------------------------------------------------------- */

  const addNotification = (
    title,
    message,
    type = "study"
  ) => {
    if (typeof setNotifications !== "function") {
      return;
    }

    const notification = {
      id: createId("notification"),
      title,
      message,
      type,
      read: false,
      createdAt: new Date().toISOString(),
    };

    setNotifications((current) => [
      notification,
      ...(current || []),
    ]);
  };


  /* -------------------------------------------------------
     SUBJECT TOPICS
     ------------------------------------------------------- */

  const sessionTopics = useMemo(() => {
  if (!sessionForm.subject) {
    return [];
  }

  const subject = subjects.find(
    (item) => item.name === sessionForm.subject
  );

  if (!subject) {
    return [];
  }

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

  /* Direct topics */
  if (Array.isArray(subject.topics)) {
    subject.topics.forEach(addTopic);
  }

  /* Units → topics */
  if (Array.isArray(subject.units)) {
    subject.units.forEach((unit) => {
      if (Array.isArray(unit?.topics)) {
        unit.topics.forEach(addTopic);
      }
    });
  }

  /* Other possible topic structures */
  if (Array.isArray(subject.topicList)) {
    subject.topicList.forEach(addTopic);
  }

  if (Array.isArray(subject.syllabusTopics)) {
    subject.syllabusTopics.forEach(addTopic);
  }

  return [...new Set(topics)];
}, [subjects, sessionForm.subject]);

  /* -------------------------------------------------------
     SORT SESSIONS
     ------------------------------------------------------- */

  const sortSessions = (a, b) => {
    return (
      getTimeMinutes(a.startTime) -
      getTimeMinutes(b.startTime)
    );
  };


  /* -------------------------------------------------------
     CURRENT DAY SESSIONS
     ------------------------------------------------------- */

  const selectedDaySessions = useMemo(() => {
    return sessions
      .filter(
        (session) =>
          session.date === selectedDate
      )
      .sort(sortSessions);
  }, [sessions, selectedDate]);


  /* -------------------------------------------------------
     ALL / COMPLETED SESSIONS
     ------------------------------------------------------- */

  const completedSessions = useMemo(() => {
    return sessions.filter(
      (session) => session.completed
    );
  }, [sessions]);


  const totalStudyMinutes = useMemo(() => {
    return sessions.reduce(
      (total, session) =>
        total +
        calculateDuration(
          session.startTime,
          session.endTime
        ),
      0
    );
  }, [sessions]);


  const completedMinutes = useMemo(() => {
    return completedSessions.reduce(
      (total, session) =>
        total +
        calculateDuration(
          session.startTime,
          session.endTime
        ),
      0
    );
  }, [completedSessions]);


  const progress = useMemo(() => {
    if (!sessions.length) {
      return 0;
    }

    return Math.round(
      (completedSessions.length /
        sessions.length) *
        100
    );
  }, [sessions, completedSessions]);


  /* -------------------------------------------------------
     WEEK DATES
     IMPORTANT: ONLY ONE DECLARATION
     ------------------------------------------------------- */

  const weekDates = useMemo(() => {
    const current = parseDate(selectedDate);

    const start = new Date(current);

    start.setDate(
      current.getDate() -
        current.getDay() +
        1
    );

    return Array.from(
      { length: 7 },
      (_, index) => {
        const item = new Date(start);

        item.setDate(
          start.getDate() + index
        );

        return dateString(item);
      }
    );
  }, [selectedDate]);


  /* -------------------------------------------------------
     CALENDAR DAYS
     ------------------------------------------------------- */

  const calendarDays = useMemo(() => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();

    const firstDay = new Date(
      year,
      month,
      1
    );


    const firstCalendarDay = new Date(
      year,
      month,
      1 - firstDay.getDay()
    );


    return Array.from(
      { length: 42 },
      (_, index) => {
        const date = new Date(
          firstCalendarDay
        );

        date.setDate(
          firstCalendarDay.getDate() +
            index
        );

        const dateValue =
          dateString(date);

        return {
          date: dateValue,
          day: date.getDate(),
          isCurrentMonth:
            date.getMonth() === month,
          isToday:
            dateValue === todayString(),
          hasSession: sessions.some(
            (session) =>
              session.date === dateValue
          ),
        };
      }
    );
  }, [calendarDate, sessions]);


  /* -------------------------------------------------------
     CALENDAR LABEL
     ------------------------------------------------------- */

  const calendarMonthLabel =
    calendarDate.toLocaleDateString(
      "en-US",
      {
        month: "long",
        year: "numeric",
      }
    );


  const monthLabel = calendarMonthLabel;


  /* -------------------------------------------------------
     ACTIVE PLANS
     ------------------------------------------------------- */

  const activePlans = useMemo(() => {
    return plans.filter(
      (plan) => !plan.archived
    );
  }, [plans]);


  /* -------------------------------------------------------
     STATS
     ------------------------------------------------------- */

  const statCards = [
    {
      label: "Total Sessions",
      value: sessions.length,
      icon: CalendarDays,
      color: "indigo",
    },
    {
      label: "Completed",
      value: completedSessions.length,
      icon: CheckCircle2,
      color: "green",
    },
    {
      label: "Study Hours",
      value: `${Math.floor(
        totalStudyMinutes / 60
      )}h ${totalStudyMinutes % 60}m`,
      icon: Clock3,
      color: "cyan",
    },
    {
      label: "Progress",
      value: `${progress}%`,
      icon: BarChart3,
      color: "purple",
    },
  ];


  /* -------------------------------------------------------
     DATE NAVIGATION
     ------------------------------------------------------- */

  const changeDate = (amount) => {
    const date = parseDate(selectedDate);

    date.setDate(
      date.getDate() + amount
    );

    const nextDate = dateString(date);

    setSelectedDate(nextDate);
    setCalendarDate(date);
  };


  const selectCalendarDate = (value) => {
    setSelectedDate(value);
    setCalendarDate(parseDate(value));
  };


  const changeCalendarMonth = (amount) => {
    const next = new Date(calendarDate);

    next.setMonth(
      next.getMonth() + amount
    );

    setCalendarDate(next);
  };


  /* -------------------------------------------------------
     WEEK LABEL
     ------------------------------------------------------- */

  const getWeekLabel = (dates) => {
    if (!dates.length) {
      return "";
    }

    const first = parseDate(dates[0]);
    const last = parseDate(
      dates[dates.length - 1]
    );

    return `${first.toLocaleDateString(
      "en-US",
      {
        month: "short",
        day: "numeric",
      }
    )} – ${last.toLocaleDateString(
      "en-US",
      {
        month: "short",
        day: "numeric",
        year: "numeric",
      }
    )}`;
  };


  /* -------------------------------------------------------
     SESSION MODAL
     ------------------------------------------------------- */

  const openSessionModal = (
    date = selectedDate,
    session = null
  ) => {
    setFormError("");

    if (session) {
      setSessionForm({
        title: session.title || "",
        date: session.date || date,
        subject: session.subject || "",
        topic: session.topic || "",
        type: session.type || "Study",
        startTime:
          session.startTime || "09:00",
        endTime:
          session.endTime || "10:00",
        priority:
          session.priority || "Medium",
        reminder:
          session.reminder || "none",
        description:
          session.description || "",
      });

      setSessionModal({
        open: true,
        editing: true,
        id: session.id,
      });

      return;
    }


    setSessionForm({
      ...defaultSessionForm,
      date,
    });

    setSessionModal({
      open: true,
      editing: false,
      id: null,
    });
  };


  const closeSessionModal = () => {
    setSessionModal({
      open: false,
      editing: false,
      id: null,
    });

    setFormError("");
  };


  /* -------------------------------------------------------
     SAVE SESSION
     ------------------------------------------------------- */

  const saveSession = () => {
    setFormError("");

    if (!sessionForm.title.trim()) {
      setFormError(
        "Please enter a session title."
      );
      return;
    }

    if (!sessionForm.date) {
      setFormError(
        "Please select a date."
      );
      return;
    }

    if (
      sessionForm.endTime &&
      sessionForm.startTime &&
      getTimeMinutes(
        sessionForm.endTime
      ) <=
        getTimeMinutes(
          sessionForm.startTime
        )
    ) {
      setFormError(
        "End time must be after start time."
      );
      return;
    }


    if (sessionModal.editing) {
      setSessions((current) =>
        current.map((session) =>
          session.id === sessionModal.id
            ? {
                ...session,
                ...sessionForm,
                title:
                  sessionForm.title.trim(),
              }
            : session
        )
      );

      showNotice(
        "Study session updated."
      );

      addNotification(
        "Study Session Updated",
        `${sessionForm.title} was updated.`
      );
    } else {
      const newSession = {
        id: createId("session"),
        ...sessionForm,
        title:
          sessionForm.title.trim(),
        completed: false,
        createdAt:
          new Date().toISOString(),
      };

      setSessions((current) => [
        ...current,
        newSession,
      ]);

      showNotice(
        "Study session added."
      );

      addNotification(
        "New Study Session",
        `${newSession.title} was added to your study plan.`
      );
    }

    setSelectedDate(sessionForm.date);
    setCalendarDate(
      parseDate(sessionForm.date)
    );

    closeSessionModal();
  };


  /* -------------------------------------------------------
     COMPLETE SESSION
     ------------------------------------------------------- */

  const toggleSessionComplete = (id) => {
    const target = sessions.find(
      (session) => session.id === id
    );

    if (!target) {
      return;
    }

    const nextCompleted =
      !target.completed;

    setSessions((current) =>
      current.map((session) =>
        session.id === id
          ? {
              ...session,
              completed: nextCompleted,
            }
          : session
      )
    );


    showNotice(
      nextCompleted
        ? "Session marked completed."
        : "Session marked incomplete."
    );


    if (nextCompleted) {
      addNotification(
        "Study Session Completed",
        `${target.title} has been completed.`
      );
    }
  };


  /* -------------------------------------------------------
     DELETE SESSION
     ------------------------------------------------------- */

  const deleteSession = (id) => {
    const target = sessions.find(
      (session) => session.id === id
    );

    if (!target) {
      return;
    }

    setSessions((current) =>
      current.filter(
        (session) => session.id !== id
      )
    );

    showNotice(
      "Study session deleted."
    );

    addNotification(
      "Study Session Deleted",
      `${target.title} was removed from your plan.`
    );
  };


  /* -------------------------------------------------------
     PLAN MODAL
     ------------------------------------------------------- */

  const openPlanModal = (plan = null) => {
    setFormError("");

    if (plan) {
      setPlanForm({
        title: plan.title || "",
        description:
          plan.description || "",
        startDate:
          plan.startDate ||
          todayString(),
        endDate:
          plan.endDate ||
          todayString(),
        targetHours:
          String(plan.targetHours || 10),
        progress:
          String(plan.progress || 0),
      });

      setPlanModal({
        open: true,
        editing: true,
        id: plan.id,
      });

      return;
    }


    setPlanForm({
      ...defaultPlanForm,
    });

    setPlanModal({
      open: true,
      editing: false,
      id: null,
    });
  };


  const closePlanModal = () => {
    setPlanModal({
      open: false,
      editing: false,
      id: null,
    });

    setFormError("");
  };


  /* -------------------------------------------------------
     SAVE PLAN
     ------------------------------------------------------- */

  const savePlan = () => {
    setFormError("");

    if (!planForm.title.trim()) {
      setFormError(
        "Please enter a study plan name."
      );
      return;
    }

    if (
      planForm.endDate <
      planForm.startDate
    ) {
      setFormError(
        "End date cannot be before start date."
      );
      return;
    }


    const planData = {
      title:
        planForm.title.trim(),
      description:
        planForm.description.trim(),
      startDate:
        planForm.startDate,
      endDate:
        planForm.endDate,
      targetHours:
        Number(planForm.targetHours) || 0,
      progress: Math.min(
        100,
        Math.max(
          0,
          Number(planForm.progress) || 0
        )
      ),
    };


    if (planModal.editing) {
      setPlans((current) =>
        current.map((plan) =>
          plan.id === planModal.id
            ? {
                ...plan,
                ...planData,
              }
            : plan
        )
      );

      showNotice(
        "Study plan updated."
      );

      addNotification(
        "Study Plan Updated",
        `${planData.title} was updated.`
      );
    } else {
      const newPlan = {
        id: createId("plan"),
        ...planData,
        archived: false,
        createdAt:
          new Date().toISOString(),
      };

      setPlans((current) => [
        ...current,
        newPlan,
      ]);

      setSelectedPlanId(newPlan.id);

      showNotice(
        "Study plan created."
      );

      addNotification(
        "New Study Plan",
        `${newPlan.title} was created.`
      );
    }

    closePlanModal();
  };


  /* -------------------------------------------------------
     ARCHIVE PLAN
     ------------------------------------------------------- */

  const archivePlan = (id) => {
    const target = plans.find(
      (plan) => plan.id === id
    );

    if (!target) {
      return;
    }

    setPlans((current) =>
      current.map((plan) =>
        plan.id === id
          ? {
              ...plan,
              archived: true,
            }
          : plan
      )
    );

    showNotice(
      "Study plan archived."
    );

    addNotification(
      "Study Plan Archived",
      `${target.title} was archived.`
    );
  };


  /* -------------------------------------------------------
     DELETE PLAN
     ------------------------------------------------------- */

  const deletePlan = (id) => {
    const target = plans.find(
      (plan) => plan.id === id
    );

    if (!target) {
      return;
    }

    setPlans((current) =>
      current.filter(
        (plan) => plan.id !== id
      )
    );

    if (selectedPlanId === id) {
      setSelectedPlanId(null);
    }

    showNotice(
      "Study plan deleted."
    );

    addNotification(
      "Study Plan Deleted",
      `${target.title} was deleted.`
    );
  };


  /* -------------------------------------------------------
     TIMETABLE MODAL
     ------------------------------------------------------- */

  const openTimetableModal = (
    slot = null
  ) => {
    setFormError("");

    if (slot) {
      setTimetableForm({
        title: slot.title || "",
        day: slot.day || "Monday",
        subject: slot.subject || "",
        startTime:
          slot.startTime || "09:00",
        endTime:
          slot.endTime || "10:00",
        color:
          slot.color || "indigo",
      });

      setTimetableModal({
        open: true,
        editing: Boolean(slot.id),
        id: slot.id || null,
      });

      return;
    }


    setTimetableForm({
      ...defaultTimetableForm,
    });

    setTimetableModal({
      open: true,
      editing: false,
      id: null,
    });
  };


  const closeTimetableModal = () => {
    setTimetableModal({
      open: false,
      editing: false,
      id: null,
    });

    setFormError("");
  };


  /* -------------------------------------------------------
     SAVE TIMETABLE
     ------------------------------------------------------- */

  const saveTimetableSlot = () => {
    setFormError("");

    if (!timetableForm.title.trim()) {
      setFormError(
        "Please enter a timetable title."
      );
      return;
    }

    if (
      getTimeMinutes(
        timetableForm.endTime
      ) <=
      getTimeMinutes(
        timetableForm.startTime
      )
    ) {
      setFormError(
        "End time must be after start time."
      );
      return;
    }


    const slotData = {
      title:
        timetableForm.title.trim(),
      day:
        timetableForm.day,
      subject:
        timetableForm.subject,
      startTime:
        timetableForm.startTime,
      endTime:
        timetableForm.endTime,
      color:
        timetableForm.color,
    };


    if (timetableModal.editing) {
      setTimetable((current) =>
        current.map((slot) =>
          slot.id ===
          timetableModal.id
            ? {
                ...slot,
                ...slotData,
              }
            : slot
        )
      );

      showNotice(
        "Timetable slot updated."
      );
    } else {
      const newSlot = {
        id: createId("slot"),
        ...slotData,
      };

      setTimetable((current) => [
        ...current,
        newSlot,
      ]);

      showNotice(
        "Timetable slot added."
      );
    }

    closeTimetableModal();
  };


  /* -------------------------------------------------------
     DELETE TIMETABLE SLOT
     ------------------------------------------------------- */

  const deleteTimetableSlot = (id) => {
    setTimetable((current) =>
      current.filter(
        (slot) => slot.id !== id
      )
    );

    showNotice(
      "Timetable slot deleted."
    );
  };


  /* -------------------------------------------------------
     RETURN STARTS IN PART 2
     ------------------------------------------------------- */
    return (
    <div className="studyplan-page">

      {/* =====================================================
          TOAST
         ===================================================== */}

      {notice && (
        <div
          className={`studyplan-toast ${notice.type}`}
          role="status"
        >
          {notice.type === "success" ? (
            <CheckCircle2 size={18} />
          ) : (
            <Bell size={18} />
          )}

          <span>{notice.message}</span>

          <button
            type="button"
            onClick={() => setNotice(null)}
            aria-label="Close notification"
          >
            <X size={16} />
          </button>
        </div>
      )}


      {/* =====================================================
          HEADER
         ===================================================== */}

      <header className="studyplan-header">

        <div className="studyplan-title-area">

          <div className="studyplan-title-icon">
            <CalendarRange size={29} />
          </div>

          <div>
            <h1>Study Plan</h1>

            <p>
              Organize your study sessions, timetable and
              daily learning plan.
            </p>
          </div>

        </div>


        <div className="studyplan-header-actions">

          <button
            type="button"
            className="studyplan-secondary-btn"
            onClick={() => {
              setActiveView("timetable");
            }}
          >
            <CalendarDays size={18} />
            Timetable
          </button>


          <button
            type="button"
            className="studyplan-primary-btn"
            onClick={() =>
              openSessionModal(selectedDate)
            }
          >
            <Plus size={18} />
            Add Session
          </button>

        </div>

      </header>


      {/* =====================================================
          STATISTICS
         ===================================================== */}

      <section className="studyplan-stats">

        {statCards.map((card) => {

          const Icon = card.icon;

          return (
            <div
              className="studyplan-stat-card"
              key={card.label}
            >

              <div
                className={`studyplan-stat-icon ${card.color}`}
              >
                <Icon size={21} />
              </div>


              <div className="studyplan-stat-content">

                <span>{card.label}</span>

                <strong>{card.value}</strong>

              </div>

            </div>
          );
        })}

      </section>


      {/* =====================================================
          MAIN VIEW TABS
         ===================================================== */}

      <div className="studyplan-main-tabs">

        <button
          type="button"
          className={
            activeView === "planner"
              ? "active"
              : ""
          }
          onClick={() =>
            setActiveView("planner")
          }
        >
          <LayoutGrid size={18} />
          Study Planner
        </button>


        <button
          type="button"
          className={
            activeView === "timetable"
              ? "active"
              : ""
          }
          onClick={() =>
            setActiveView("timetable")
          }
        >
          <CalendarRange size={18} />
          Weekly Timetable
        </button>

      </div>


      {/* =====================================================
          STUDY PLANNER
         ===================================================== */}

      {activeView === "planner" && (
        <div className="studyplan-content">

          {/* -------------------------------------------------
              PLANNER TOOLBAR
             ------------------------------------------------- */}

          <section className="studyplan-planner-toolbar">

            <div className="studyplan-view-tabs">

              <button
                type="button"
                className={
                  activeSection === "day"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setActiveSection("day")
                }
              >
                Day
              </button>


              <button
                type="button"
                className={
                  activeSection === "week"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setActiveSection("week")
                }
              >
                Week
              </button>


              <button
                type="button"
                className={
                  activeSection === "month"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setActiveSection("month")
                }
              >
                Month
              </button>

            </div>


            <div className="studyplan-date-navigation">

              <button
                type="button"
                onClick={() =>
                  changeDate(-1)
                }
                aria-label="Previous day"
              >
                <ChevronLeft size={19} />
              </button>


              <button
                type="button"
                className="studyplan-today-btn"
                onClick={() => {

                  const today =
                    todayString();

                  setSelectedDate(today);

                  setCalendarDate(
                    parseDate(today)
                  );

                }}
              >
                Today
              </button>


              <button
                type="button"
                onClick={() =>
                  changeDate(1)
                }
                aria-label="Next day"
              >
                <ChevronRight size={19} />
              </button>


              <div className="studyplan-current-date">

                <CalendarDays size={17} />

                <span>
                  {formatLongDate(
                    selectedDate
                  )}
                </span>

              </div>

            </div>


            <button
              type="button"
              className="studyplan-add-plan-btn"
              onClick={() =>
                openPlanModal()
              }
            >
              <Plus size={17} />
              New Study Plan
            </button>

          </section>


          {/* =================================================
              DAY VIEW
             ================================================= */}

          {activeSection === "day" && (
            <div className="studyplan-day-layout">

              {/* ---------------------------------------------
                  DAY SESSIONS
                 --------------------------------------------- */}

              <section className="studyplan-day-card">

                <div className="studyplan-section-header">

                  <div>

                    <span className="studyplan-eyebrow">
                      SELECTED DAY
                    </span>

                    <h2>
                      {formatLongDate(
                        selectedDate
                      )}
                    </h2>

                  </div>


                  <div className="studyplan-day-count">

                    {selectedDaySessions.length}

                    <span>
                      sessions
                    </span>

                  </div>

                </div>


                {selectedDaySessions.length === 0 ? (

                  <div className="studyplan-empty-state">

                    <div className="studyplan-empty-icon">
                      <CalendarDays size={31} />
                    </div>


                    <h3>
                      No study sessions planned
                    </h3>


                    <p>
                      Add your first study session
                      for this day.
                    </p>


                    <button
                      type="button"
                      className="studyplan-primary-btn"
                      onClick={() =>
                        openSessionModal(
                          selectedDate
                        )
                      }
                    >
                      <Plus size={17} />
                      Add Study Session
                    </button>

                  </div>

                ) : (

                  <div className="studyplan-session-list">

                    {selectedDaySessions.map(
                      (session) => (

                        <article
                          className={`studyplan-session-card ${
                            session.completed
                              ? "completed"
                              : ""
                          }`}
                          key={session.id}
                        >

                          <div className="studyplan-session-time">

                            <strong>
                              {session.startTime}
                            </strong>

                            <span>
                              {session.endTime}
                            </span>

                          </div>


                          <div className="studyplan-session-line" />


                          <div className="studyplan-session-main">

                            <div className="studyplan-session-heading">

                              <div className="studyplan-session-icon">
                                <BookOpen size={19} />
                              </div>


                              <div>

                                <h3>
                                  {session.title}
                                </h3>


                                <div className="studyplan-session-meta">

                                  <span>
                                    {session.subject ||
                                      "General Study"}
                                  </span>


                                  {session.topic && (
                                    <>
                                      <span className="dot">
                                        •
                                      </span>

                                      <span>
                                        {session.topic}
                                      </span>
                                    </>
                                  )}

                                </div>

                              </div>

                            </div>


                            {session.description && (
                              <p className="studyplan-session-description">
                                {session.description}
                              </p>
                            )}


                            <div className="studyplan-session-tags">

                              <span className="studyplan-tag">
                                <GraduationCap
                                  size={14}
                                />
                                {session.type}
                              </span>


                              <span className="studyplan-tag">
                                <Clock3 size={14} />
                                {calculateDuration(
                                  session.startTime,
                                  session.endTime
                                )}{" "}
                                min
                              </span>


                              <span
                                className={`studyplan-priority ${String(
                                  session.priority
                                ).toLowerCase()}`}
                              >
                                {session.priority}
                              </span>

                            </div>

                          </div>


                          <div className="studyplan-session-actions">

                            <button
                              type="button"
                              className={
                                session.completed
                                  ? "studyplan-complete-btn completed"
                                  : "studyplan-complete-btn"
                              }
                              onClick={() =>
                                toggleSessionComplete(
                                  session.id
                                )
                              }
                              title={
                                session.completed
                                  ? "Mark incomplete"
                                  : "Mark complete"
                              }
                            >
                              <CheckCircle2
                                size={20}
                              />
                            </button>


                            <button
                              type="button"
                              onClick={() =>
                                openSessionModal(
                                  selectedDate,
                                  session
                                )
                              }
                              title="Edit"
                            >
                              <Pencil size={17} />
                            </button>


                            <button
                              type="button"
                              className="danger"
                              onClick={() =>
                                deleteSession(
                                  session.id
                                )
                              }
                              title="Delete"
                            >
                              <Trash2 size={17} />
                            </button>

                          </div>

                        </article>

                      )
                    )}

                  </div>

                )}

              </section>


              {/* ---------------------------------------------
                  SIDE PANEL
                 --------------------------------------------- */}

              <aside className="studyplan-side-panel">

                {/* CALENDAR */}

                <div className="studyplan-mini-calendar">

                  <div className="studyplan-calendar-header">

                    <button
                      type="button"
                      onClick={() =>
                        changeCalendarMonth(-1)
                      }
                    >
                      <ChevronLeft size={17} />
                    </button>


                    <strong>
                      {calendarMonthLabel}
                    </strong>


                    <button
                      type="button"
                      onClick={() =>
                        changeCalendarMonth(1)
                      }
                    >
                      <ChevronRight size={17} />
                    </button>

                  </div>


                  <div className="studyplan-weekdays">

                    {[
                      "S",
                      "M",
                      "T",
                      "W",
                      "T",
                      "F",
                      "S",
                    ].map((day, index) => (
                      <span
                        key={`${day}-${index}`}
                      >
                        {day}
                      </span>
                    ))}

                  </div>


                  <div className="studyplan-calendar-grid">

                    {calendarDays.map(
                      (day) => (

                        <button
                          type="button"
                          key={day.date}
                          className={[
                            day.isCurrentMonth
                              ? ""
                              : "muted",

                            day.date ===
                            selectedDate
                              ? "selected"
                              : "",

                            day.isToday
                              ? "today"
                              : "",

                            day.hasSession
                              ? "has-session"
                              : "",
                          ]
                            .filter(Boolean)
                            .join(" ")}
                          onClick={() =>
                            selectCalendarDate(
                              day.date
                            )
                          }
                        >

                          {day.day}

                          {day.hasSession && (
                            <span className="calendar-dot" />
                          )}

                        </button>

                      )
                    )}

                  </div>

                </div>


                {/* ACTIVE PLANS */}

                <div className="studyplan-active-plans">

                  <div className="studyplan-side-title">

                    <div>

                      <span className="studyplan-eyebrow">
                        YOUR PLANS
                      </span>

                      <h3>
                        Active Study Plans
                      </h3>

                    </div>


                    <button
                      type="button"
                      onClick={() =>
                        openPlanModal()
                      }
                    >
                      <Plus size={17} />
                    </button>

                  </div>


                  {activePlans.length === 0 ? (

                    <div className="studyplan-small-empty">
                      <Target size={23} />
                      <span>
                        No study plans yet
                      </span>
                    </div>

                  ) : (

                    <div className="studyplan-plan-list">

                      {activePlans.map(
                        (plan) => (

                          <article
                            key={plan.id}
                            className={`studyplan-plan-card ${
                              selectedPlanId ===
                              plan.id
                                ? "selected"
                                : ""
                            }`}
                            onClick={() =>
                              setSelectedPlanId(
                                plan.id
                              )
                            }
                          >

                            <div className="studyplan-plan-top">

                              <div className="studyplan-plan-icon">
                                <Target size={17} />
                              </div>


                              <div className="studyplan-plan-actions">

                                <button
                                  type="button"
                                  onClick={(
                                    event
                                  ) => {
                                    event.stopPropagation();

                                    openPlanModal(
                                      plan
                                    );
                                  }}
                                >
                                  <Pencil size={14} />
                                </button>


                                <button
                                  type="button"
                                  onClick={(
                                    event
                                  ) => {
                                    event.stopPropagation();

                                    archivePlan(
                                      plan.id
                                    );
                                  }}
                                >
                                  <Archive size={14} />
                                </button>


                                <button
                                  type="button"
                                  className="danger"
                                  onClick={(
                                    event
                                  ) => {
                                    event.stopPropagation();

                                    deletePlan(
                                      plan.id
                                    );
                                  }}
                                >
                                  <Trash2 size={14} />
                                </button>

                              </div>

                            </div>


                            <h4>
                              {plan.title}
                            </h4>


                            {plan.description && (
                              <p>
                                {plan.description}
                              </p>
                            )}


                            <div className="studyplan-plan-dates">

                              <span>
                                {formatShortDate(
                                  plan.startDate
                                )}
                              </span>

                              <span>→</span>

                              <span>
                                {formatShortDate(
                                  plan.endDate
                                )}
                              </span>

                            </div>


                            <div className="studyplan-progress">

                              <div className="studyplan-progress-label">

                                <span>
                                  Progress
                                </span>

                                <strong>
                                  {plan.progress ||
                                    0}
                                  %
                                </strong>

                              </div>


                              <div className="studyplan-progress-track">

                                <span
                                  style={{
                                    width: `${Math.min(
                                      100,
                                      Math.max(
                                        0,
                                        Number(
                                          plan.progress
                                        ) || 0
                                      )
                                    )}%`,
                                  }}
                                />

                              </div>

                            </div>

                          </article>

                        )
                      )}

                    </div>

                  )}

                </div>

              </aside>

            </div>
          )}


          {/* =================================================
              WEEK VIEW
             ================================================= */}

          {activeSection === "week" && (
            <section className="studyplan-week-view">

              <div className="studyplan-week-header">

                <div>

                  <span className="studyplan-eyebrow">
                    WEEKLY OVERVIEW
                  </span>

                  <h2>
                    {getWeekLabel(
                      weekDates
                    )}
                  </h2>

                </div>


                <button
                  type="button"
                  className="studyplan-primary-btn"
                  onClick={() =>
                    openSessionModal(
                      selectedDate
                    )
                  }
                >
                  <Plus size={17} />
                  Add Session
                </button>

              </div>


              <div className="studyplan-week-grid">

                {weekDates.map(
                  (date) => {

                    const daySessions =
                      sessions
                        .filter(
                          (session) =>
                            session.date ===
                            date
                        )
                        .sort(sortSessions);

                    const dateObject =
                      parseDate(date);


                    return (
                      <div
                        className={`studyplan-week-day ${
                          date ===
                          selectedDate
                            ? "selected"
                            : ""
                        }`}
                        key={date}
                      >

                        <button
                          type="button"
                          className="studyplan-week-day-header"
                          onClick={() =>
                            selectCalendarDate(
                              date
                            )
                          }
                        >

                          <span>
                            {dateObject.toLocaleDateString(
                              "en-US",
                              {
                                weekday:
                                  "short",
                              }
                            )}
                          </span>


                          <strong>
                            {dateObject.getDate()}
                          </strong>

                        </button>


                        <div className="studyplan-week-day-sessions">

                          {daySessions.length ===
                          0 ? (

                            <div className="studyplan-no-session">
                              No sessions
                            </div>

                          ) : (

                            daySessions.map(
                              (session) => (

                                <button
                                  type="button"
                                  className={`studyplan-week-session ${
                                    session.completed
                                      ? "completed"
                                      : ""
                                  }`}
                                  key={session.id}
                                  onClick={() => {
                                    setSelectedDate(
                                      date
                                    );

                                    openSessionModal(
                                      date,
                                      session
                                    );
                                  }}
                                >

                                  <span className="session-time">
                                    {session.startTime}
                                  </span>


                                  <strong>
                                    {session.title}
                                  </strong>


                                  <small>
                                    {session.subject ||
                                      "General"}
                                  </small>


                                  {session.completed && (
                                    <CheckCircle2
                                      size={14}
                                    />
                                  )}

                                </button>

                              )
                            )

                          )}

                        </div>


                        <button
                          type="button"
                          className="studyplan-day-add"
                          onClick={() =>
                            openSessionModal(
                              date
                            )
                          }
                        >
                          <Plus size={15} />
                          Add
                        </button>

                      </div>
                    );
                  }
                )}

              </div>

            </section>
          )}


          {/* =================================================
              MONTH VIEW
             ================================================= */}

          {activeSection === "month" && (
            <section className="studyplan-month-view">

              <div className="studyplan-month-header">

                <div>

                  <span className="studyplan-eyebrow">
                    MONTHLY PLAN
                  </span>

                  <h2>
                    {monthLabel}
                  </h2>

                </div>


                <div className="studyplan-month-actions">

                  <button
                    type="button"
                    onClick={() =>
                      changeCalendarMonth(-1)
                    }
                  >
                    <ChevronLeft size={18} />
                  </button>


                  <button
                    type="button"
                    onClick={() =>
                      changeCalendarMonth(1)
                    }
                  >
                    <ChevronRight size={18} />
                  </button>

                </div>

              </div>


              <div className="studyplan-month-weekdays">

                {[
                  "Sunday",
                  "Monday",
                  "Tuesday",
                  "Wednesday",
                  "Thursday",
                  "Friday",
                  "Saturday",
                ].map((day) => (
                  <span key={day}>
                    {day}
                  </span>
                ))}

              </div>


              <div className="studyplan-month-grid">

                {calendarDays.map(
                  (day) => {

                    const daySessions =
                      sessions
                        .filter(
                          (session) =>
                            session.date ===
                            day.date
                        )
                        .sort(sortSessions);


                    return (
                      <button
                        type="button"
                        className={[
                          "studyplan-month-day",

                          !day.isCurrentMonth
                            ? "muted"
                            : "",

                          day.date ===
                          selectedDate
                            ? "selected"
                            : "",

                          day.isToday
                            ? "today"
                            : "",
                        ]
                          .filter(Boolean)
                          .join(" ")}
                        key={day.date}
                        onClick={() => {

                          selectCalendarDate(
                            day.date
                          );

                          setActiveSection(
                            "day"
                          );

                        }}
                      >

                        <span className="month-day-number">
                          {day.day}
                        </span>


                        <div className="month-day-sessions">

                          {daySessions
                            .slice(0, 3)
                            .map(
                              (session) => (

                                <span
                                  className={`month-session ${
                                    session.completed
                                      ? "completed"
                                      : ""
                                  }`}
                                  key={
                                    session.id
                                  }
                                >
                                  {session.startTime}{" "}
                                  {session.title}
                                </span>

                              )
                            )}


                          {daySessions.length >
                            3 && (
                            <span className="month-more">
                              +
                              {daySessions.length -
                                3}{" "}
                              more
                            </span>
                          )}

                        </div>

                      </button>
                    );
                  }
                )}

              </div>

            </section>
          )}

        </div>
      )}


      {/* =====================================================
          TIMETABLE
         ===================================================== */}

      {activeView === "timetable" && (
        <section className="studyplan-timetable">

          <div className="studyplan-timetable-header">

            <div>

              <span className="studyplan-eyebrow">
                WEEKLY TIMETABLE
              </span>

              <h2>
                Your Weekly Study Schedule
              </h2>

              <p>
                Create a reusable timetable
                for your regular study routine.
              </p>

            </div>


            <button
              type="button"
              className="studyplan-primary-btn"
              onClick={() =>
                openTimetableModal()
              }
            >
              <Plus size={18} />
              Add Timetable Slot
            </button>

          </div>


          <div className="studyplan-timetable-grid">

            <div className="studyplan-timetable-corner">
              <Clock3 size={17} />
              Time
            </div>


            {DAYS.map((day) => (
              <div
                className="studyplan-timetable-day"
                key={day}
              >
                {day}
              </div>
            ))}


            {TIMETABLE_HOURS.map(
              (hour) => (
                <div
                  className="studyplan-timetable-row"
                  key={hour}
                >

                  <div className="studyplan-timetable-time">
                    {hour}
                  </div>


                  {DAYS.map((day) => {

                    const slot =
                      timetable.find(
                        (item) =>
                          item.day ===
                            day &&
                          item.startTime ===
                            hour
                      );


                    return (
                      <div
                        className="studyplan-timetable-cell"
                        key={`${day}-${hour}`}
                      >

                        {slot ? (

                          <div
                            className={`studyplan-timetable-slot ${
                              slot.color ||
                              "indigo"
                            }`}
                          >

                            <div className="timetable-slot-top">

                              <span>
                                {slot.subject ||
                                  "Study"}
                              </span>


                              <div>

                                <button
                                  type="button"
                                  onClick={() =>
                                    openTimetableModal(
                                      slot
                                    )
                                  }
                                  title="Edit"
                                >
                                  <Pencil size={12} />
                                </button>


                                <button
                                  type="button"
                                  onClick={() =>
                                    deleteTimetableSlot(
                                      slot.id
                                    )
                                  }
                                  title="Delete"
                                >
                                  <Trash2 size={12} />
                                </button>

                              </div>

                            </div>


                            <strong>
                              {slot.title}
                            </strong>


                            <small>
                              {slot.startTime} –{" "}
                              {slot.endTime}
                            </small>

                          </div>

                        ) : (

                          <button
                            type="button"
                            className="studyplan-empty-slot"
                            onClick={() =>
                              openTimetableModal({
                                day,
                                startTime:
                                  hour,
                                endTime:
                                  `${String(
                                    Number(
                                      hour.slice(
                                        0,
                                        2
                                      )
                                    ) + 1
                                  ).padStart(
                                    2,
                                    "0"
                                  )}:00`,
                              })
                            }
                            title={`Add session on ${day} at ${hour}`}
                          >
                            <Plus size={14} />
                          </button>

                        )}

                      </div>
                    );
                  })}

                </div>
              )
            )}

          </div>

        </section>
      )}


      {/* =====================================================
          SESSION MODAL
         ===================================================== */}

      {sessionModal.open && (
        <div
          className="studyplan-modal-overlay"
          onMouseDown={(event) => {

            if (
              event.target ===
              event.currentTarget
            ) {
              closeSessionModal();
            }

          }}
        >

          <div className="studyplan-modal">

            <div className="studyplan-modal-header">

              <div>

                <span className="studyplan-eyebrow">
                  STUDY SESSION
                </span>

                <h2>
                  {sessionModal.editing
                    ? "Edit Study Session"
                    : "Add Study Session"}
                </h2>

              </div>


              <button
                type="button"
                onClick={
                  closeSessionModal
                }
              >
                <X size={20} />
              </button>

            </div>


            {formError && (
              <div className="studyplan-form-error">
                {formError}
              </div>
            )}


           <div className="studyplan-form">

  {/* SESSION TITLE */}
  <div className="studyplan-form-group full">
    <label>Session Title</label>

    <input
      type="text"
      value={sessionForm.title}
      onChange={(event) =>
        setSessionForm({
          ...sessionForm,
          title: event.target.value,
        })
      }
      placeholder="e.g. DBMS Revision"
    />
  </div>


  {/* DATE + SUBJECT */}
  <div className="studyplan-form-row">

    <div className="studyplan-form-group">
      <label>Date</label>

      <input
        type="date"
        value={sessionForm.date}
        onChange={(event) =>
          setSessionForm({
            ...sessionForm,
            date: event.target.value,
          })
        }
        onClick={(event) => {
          if (event.currentTarget.showPicker) {
            event.currentTarget.showPicker();
          }
        }}
      />
    </div>


    <div className="studyplan-form-group">
      <label>Subject</label>

      <select
        value={sessionForm.subject}
        onChange={(event) =>
          setSessionForm({
            ...sessionForm,
            subject: event.target.value,
            topic: "",
          })
        }
      >
        <option value="">
          Select subject
        </option>

        {subjects.map((subject) => (
          <option
            value={subject.name}
            key={subject.id || subject.name}
          >
            {subject.name}
          </option>
        ))}
      </select>
    </div>

  </div>


  {/* TOPIC + SESSION TYPE */}
  <div className="studyplan-form-row">

    <div className="studyplan-form-group">
      <label>Topic</label>

      <input
        list="studyplan-topic-options"
        type="text"
        value={sessionForm.topic}
        onChange={(event) =>
          setSessionForm({
            ...sessionForm,
            topic: event.target.value,
          })
        }
        disabled={!sessionForm.subject}
        placeholder={
          sessionForm.subject
            ? "Select or type a topic"
            : "Select subject first"
        }
      />

      <datalist id="studyplan-topic-options">
        {sessionTopics.map((topic, index) => (
          <option
            value={topic}
            key={`${topic}-${index}`}
          />
        ))}
      </datalist>
    </div>


    <div className="studyplan-form-group">
      <label>Session Type</label>

      <select
        value={sessionForm.type}
        onChange={(event) =>
          setSessionForm({
            ...sessionForm,
            type: event.target.value,
          })
        }
      >
        <option value="Study">
          Study
        </option>

        <option value="Revision">
          Revision
        </option>

        <option value="Practice">
          Practice
        </option>

        <option value="Assignment">
          Assignment
        </option>

        <option value="Exam Prep">
          Exam Prep
        </option>
      </select>
    </div>

  </div>


  {/* START + END TIME */}
  <div className="studyplan-form-row">

    <div className="studyplan-form-group">
      <label>Start Time</label>

      <input
        type="time"
        value={sessionForm.startTime}
        onChange={(event) =>
          setSessionForm({
            ...sessionForm,
            startTime: event.target.value,
          })
        }
        onClick={(event) => {
          if (event.currentTarget.showPicker) {
            event.currentTarget.showPicker();
          }
        }}
      />
    </div>


    <div className="studyplan-form-group">
      <label>End Time</label>

      <input
        type="time"
        value={sessionForm.endTime}
        onChange={(event) =>
          setSessionForm({
            ...sessionForm,
            endTime: event.target.value,
          })
        }
        onClick={(event) => {
          if (event.currentTarget.showPicker) {
            event.currentTarget.showPicker();
          }
        }}
      />
    </div>

  </div>


  {/* PRIORITY + REMINDER */}
  <div className="studyplan-form-row">

    <div className="studyplan-form-group">
      <label>Priority</label>

      <select
        value={sessionForm.priority}
        onChange={(event) =>
          setSessionForm({
            ...sessionForm,
            priority: event.target.value,
          })
        }
      >
        <option value="Low">
          Low
        </option>

        <option value="Medium">
          Medium
        </option>

        <option value="High">
          High
        </option>
      </select>
    </div>


    <div className="studyplan-form-group">
      <label>Reminder</label>

      <select
        value={sessionForm.reminder}
        onChange={(event) =>
          setSessionForm({
            ...sessionForm,
            reminder: event.target.value,
          })
        }
      >
        <option value="none">
          No reminder
        </option>

        <option value="10">
          10 minutes before
        </option>

        <option value="30">
          30 minutes before
        </option>

        <option value="60">
          1 hour before
        </option>
      </select>
    </div>

  </div>


  {/* DESCRIPTION */}
  <div className="studyplan-form-group full">
    <label>Description</label>

    <textarea
      rows="4"
      value={sessionForm.description}
      onChange={(event) =>
        setSessionForm({
          ...sessionForm,
          description: event.target.value,
        })
      }
      placeholder="Add notes or what you want to complete..."
    />
  </div>

</div>


            <div className="studyplan-modal-footer">

              <button
                type="button"
                className="studyplan-cancel-btn"
                onClick={
                  closeSessionModal
                }
              >
                Cancel
              </button>


              <button
                type="button"
                className="studyplan-primary-btn"
                onClick={saveSession}
              >
                <Save size={17} />

                {sessionModal.editing
                  ? "Save Changes"
                  : "Add Session"}
              </button>

            </div>

          </div>

        </div>
      )}


      {/* =====================================================
          STUDY PLAN MODAL
         ===================================================== */}

      {planModal.open && (
        <div
          className="studyplan-modal-overlay"
          onMouseDown={(event) => {

            if (
              event.target ===
              event.currentTarget
            ) {
              closePlanModal();
            }

          }}
        >

          <div className="studyplan-modal studyplan-plan-modal">

            <div className="studyplan-modal-header">

              <div>

                <span className="studyplan-eyebrow">
                  STUDY PLAN
                </span>

                <h2>
                  {planModal.editing
                    ? "Edit Study Plan"
                    : "Create Study Plan"}
                </h2>

              </div>


              <button
                type="button"
                onClick={
                  closePlanModal
                }
              >
                <X size={20} />
              </button>

            </div>


            {formError && (
              <div className="studyplan-form-error">
                {formError}
              </div>
            )}


            <div className="studyplan-form">

              <div className="studyplan-form-group full">

                <label>
                  Plan Name
                </label>

                <input
                  type="text"
                  value={planForm.title}
                  onChange={(event) =>
                    setPlanForm({
                      ...planForm,
                      title:
                        event.target.value,
                    })
                  }
                  placeholder="e.g. DBMS Final Preparation"
                />

              </div>


              <div className="studyplan-form-group full">

                <label>
                  Description
                </label>

                <textarea
                  rows="3"
                  value={
                    planForm.description
                  }
                  onChange={(event) =>
                    setPlanForm({
                      ...planForm,
                      description:
                        event.target.value,
                    })
                  }
                  placeholder="What do you want to achieve?"
                />

              </div>


              <div className="studyplan-form-row">

                <div className="studyplan-form-group">

                  <label>
                    Start Date
                  </label>

                 <input
  type="date"
  value={sessionForm.date}
  onChange={(event) =>
    setSessionForm({
      ...sessionForm,
      date: event.target.value,
    })
  }
  onClick={(event) => {
    if (event.currentTarget.showPicker) {
      event.currentTarget.showPicker();
    }
  }}
/>

                </div>


                <div className="studyplan-form-group">

                  <label>
                    End Date
                  </label>

                  <input
                    type="date"
                    value={
                      planForm.endDate
                    }
                    onChange={(event) =>
                      setPlanForm({
                        ...planForm,
                        endDate:
                          event.target.value,
                      })
                    }
                  />

                </div>

              </div>


              <div className="studyplan-form-row">

                <div className="studyplan-form-group">

                  <label>
                    Target Hours
                  </label>

                  <input
                    type="number"
                    min="1"
                    value={
                      planForm.targetHours
                    }
                    onChange={(event) =>
                      setPlanForm({
                        ...planForm,
                        targetHours:
                          event.target.value,
                      })
                    }
                    placeholder="40"
                  />

                </div>


                <div className="studyplan-form-group">

                  <label>
                    Progress (%)
                  </label>

                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={
                      planForm.progress
                    }
                    onChange={(event) =>
                      setPlanForm({
                        ...planForm,
                        progress:
                          event.target.value,
                      })
                    }
                    placeholder="0"
                  />

                </div>

              </div>

            </div>


            <div className="studyplan-modal-footer">

              <button
                type="button"
                className="studyplan-cancel-btn"
                onClick={
                  closePlanModal
                }
              >
                Cancel
              </button>


              <button
                type="button"
                className="studyplan-primary-btn"
                onClick={savePlan}
              >
                <Save size={17} />

                {planModal.editing
                  ? "Save Changes"
                  : "Create Plan"}
              </button>

            </div>

          </div>

        </div>
      )}


      {/* =====================================================
          TIMETABLE MODAL
         ===================================================== */}

      {timetableModal.open && (
        <div
          className="studyplan-modal-overlay"
          onMouseDown={(event) => {

            if (
              event.target ===
              event.currentTarget
            ) {
              closeTimetableModal();
            }

          }}
        >

          <div className="studyplan-modal">

            <div className="studyplan-modal-header">

              <div>

                <span className="studyplan-eyebrow">
                  TIMETABLE
                </span>

                <h2>
                  {timetableModal.editing
                    ? "Edit Timetable Slot"
                    : "Add Timetable Slot"}
                </h2>

              </div>


              <button
                type="button"
                onClick={
                  closeTimetableModal
                }
              >
                <X size={20} />
              </button>

            </div>


            {formError && (
              <div className="studyplan-form-error">
                {formError}
              </div>
            )}


            <div className="studyplan-form">

              <div className="studyplan-form-group full">

                <label>
                  Title
                </label>

                <input
                  type="text"
                  value={
                    timetableForm.title
                  }
                  onChange={(event) =>
                    setTimetableForm({
                      ...timetableForm,
                      title:
                        event.target.value,
                    })
                  }
                  placeholder="e.g. Java Practice"
                />

              </div>


              <div className="studyplan-form-row">

                <div className="studyplan-form-group">

                  <label>
                    Day
                  </label>

                  <select
                    value={
                      timetableForm.day
                    }
                    onChange={(event) =>
                      setTimetableForm({
                        ...timetableForm,
                        day:
                          event.target.value,
                      })
                    }
                  >

                    {DAYS.map((day) => (
                      <option
                        value={day}
                        key={day}
                      >
                        {day}
                      </option>
                    ))}

                  </select>

                </div>


                <div className="studyplan-form-group">

                  <label>
                    Subject
                  </label>

                  <select
                    value={
                      timetableForm.subject
                    }
                    onChange={(event) =>
                      setTimetableForm({
                        ...timetableForm,
                        subject:
                          event.target.value,
                      })
                    }
                  >

                    <option value="">
                      General Study
                    </option>


                    {subjects.map(
                      (subject) => (
                        <option
                          value={
                            subject.name
                          }
                          key={
                            subject.id ||
                            subject.name
                          }
                        >
                          {subject.name}
                        </option>
                      )
                    )}

                  </select>

                </div>

              </div>


              <div className="studyplan-form-row">

                <div className="studyplan-form-group">

                  <label>
                    Start Time
                  </label>

                  <input
                    type="time"
                    value={
                      timetableForm.startTime
                    }
                    onChange={(event) =>
                      setTimetableForm({
                        ...timetableForm,
                        startTime:
                          event.target.value,
                      })
                    }
                  />

                </div>


                <div className="studyplan-form-group">

                  <label>
                    End Time
                  </label>

                  <input
                    type="time"
                    value={
                      timetableForm.endTime
                    }
                    onChange={(event) =>
                      setTimetableForm({
                        ...timetableForm,
                        endTime:
                          event.target.value,
                      })
                    }
                  />

                </div>

              </div>


              <div className="studyplan-form-group full">

                <label>
                  Color
                </label>


                <div className="studyplan-color-options">

                  {[
                    "indigo",
                    "purple",
                    "cyan",
                    "green",
                    "orange",
                  ].map((color) => (

                    <button
                      type="button"
                      key={color}
                      className={`studyplan-color-option ${color} ${
                        timetableForm.color ===
                        color
                          ? "selected"
                          : ""
                      }`}
                      onClick={() =>
                        setTimetableForm({
                          ...timetableForm,
                          color,
                        })
                      }
                      aria-label={`Select ${color}`}
                    />

                  ))}

                </div>

              </div>

            </div>


            <div className="studyplan-modal-footer">

              <button
                type="button"
                className="studyplan-cancel-btn"
                onClick={
                  closeTimetableModal
                }
              >
                Cancel
              </button>


              <button
                type="button"
                className="studyplan-primary-btn"
                onClick={
                  saveTimetableSlot
                }
              >
                <Save size={17} />

                {timetableModal.editing
                  ? "Save Changes"
                  : "Add Slot"}
              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}


export default StudyPlan;