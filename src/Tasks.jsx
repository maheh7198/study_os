import { useEffect, useMemo, useState } from "react";
import "./Tasks.css";
import {
  AlertCircle,
  Atom,
  BookOpen,
  Brain,
  CalendarCheck,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleDot,
  Clock3,
  Code2,
  Cpu,
  Database,
  Eye,
  FileText,
  FlaskConical,
  Globe,
  GraduationCap,
  Languages,
  List,
  Monitor,
  Network,
  Palette,
  Pencil,
  Plus,
  Search,
  Sigma,
  Target,
  Terminal,
  Timer,
  Trash2,
  X,
} from "lucide-react";

const TASKS_STORAGE_KEY = "studyos-tasks";

const STATUS_OPTIONS = ["To Do", "In Progress", "Completed"];
const PRIORITY_OPTIONS = ["Low", "Medium", "High"];

const DAILY_STUDY_OPTIONS = [
  { label: "15 min", minutes: 15 },
  { label: "20 min", minutes: 20 },
  { label: "30 min", minutes: 30 },
  { label: "45 min", minutes: 45 },
  { label: "1 hour (60 min)", minutes: 60 },
  { label: "1.5 hours", minutes: 90 },
  { label: "2 hours", minutes: 120 },
  { label: "3 hours", minutes: 180 },
];

const DURATION_OPTIONS = [
  { label: "1 day", days: 1 },
  { label: "3 days", days: 3 },
  { label: "7 days", days: 7 },
  { label: "15 days", days: 15 },
  { label: "30 days", days: 30 },
  { label: "60 days", days: 60 },
  { label: "90 days", days: 90 },
];

/* =========================================================
   SUBJECT ICONS
   ========================================================= */

const SUBJECT_ICON_MAP = {
  monitor: Monitor,
  monitorcheck: Monitor,
  laptop: Monitor,
  computer: Monitor,
  cpu: Cpu,
  code: Code2,
  code2: Code2,
  codesquare: Code2,
  terminal: Terminal,

  network: Network,
  networkicon: Network,

  database: Database,
  db: Database,

  globe: Globe,
  language: Languages,
  languages: Languages,
  english: Languages,

  math: Sigma,
  mathematics: Sigma,
  sigma: Sigma,
  calculator: Sigma,

  brain: Brain,
  flask: FlaskConical,
  flaskconical: FlaskConical,
  chemistry: FlaskConical,

  palette: Palette,
  art: Palette,

  graduation: GraduationCap,
  graduationcap: GraduationCap,
  school: GraduationCap,

  atom: Atom,
  physics: Atom,

  file: FileText,
  filetext: FileText,
  book: BookOpen,
  bookopen: BookOpen,
};

const SUBJECT_ICON_CLASS = {
  monitor: "task-subject-blue",
  monitorcheck: "task-subject-blue",
  laptop: "task-subject-blue",
  computer: "task-subject-blue",

  code: "task-subject-purple",
  code2: "task-subject-purple",
  codesquare: "task-subject-purple",
  terminal: "task-subject-cyan",

  network: "task-subject-green",
  networkicon: "task-subject-green",

  database: "task-subject-orange",
  db: "task-subject-orange",

  globe: "task-subject-pink",
  language: "task-subject-blue",
  languages: "task-subject-blue",
  english: "task-subject-blue",

  math: "task-subject-purple",
  mathematics: "task-subject-purple",
  sigma: "task-subject-purple",
  calculator: "task-subject-purple",

  brain: "task-subject-purple",

  flask: "task-subject-green",
  flaskconical: "task-subject-green",
  chemistry: "task-subject-green",

  palette: "task-subject-pink",
  art: "task-subject-pink",

  graduation: "task-subject-purple",
  graduationcap: "task-subject-purple",
  school: "task-subject-purple",

  atom: "task-subject-green",
  physics: "task-subject-green",

  file: "task-subject-orange",
  filetext: "task-subject-orange",

  book: "task-subject-blue",
  bookopen: "task-subject-blue",
};

/* =========================================================
   DATE HELPERS
   ========================================================= */

function getISTDate() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
  }).format(new Date());
}

function formatDate(dateString) {
  if (!dateString) return "—";

  const date = new Date(`${dateString}T00:00:00`);

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(date);
}

function addDays(dateString, days) {
  if (!dateString) return "";

  const date = new Date(`${dateString}T00:00:00`);

  date.setDate(date.getDate() + Number(days) - 1);

  return date.toISOString().split("T")[0];
}

function getDaysBetween(startDate, endDate) {
  if (!startDate || !endDate) return 0;

  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);

  return Math.max(
    1,
    Math.round((end - start) / 86400000) + 1
  );
}

/* =========================================================
   EMPTY TASK
   ========================================================= */

function createEmptyTask() {
  const today = getISTDate();

  return {
    id: "",
    user_id: "",
    subject_id: "",
    title: "",
    description: "",
    subject: "",
    status: "To Do",
    priority: "Medium",
    start_date: today,
    due_date: today,
    due_time: "",
    duration_days: 1,
    estimated_minutes_per_day: 60,
    reminder_minutes: 30,
    completed_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

/* =========================================================
   SUBJECT HELPERS
   ========================================================= */

function normalizeIconKey(value) {
  if (!value) return "";

  if (typeof value === "string") {
    return value
      .toLowerCase()
      .replace(/[\s_-]/g, "");
  }

  return "";
}

function getSubjectData(subject, subjectId, subjects = []) {
  return subjects.find(
    (item) =>
      (subjectId &&
        String(item?.id) === String(subjectId)) ||
      item?.name === subject
  );
}

/*
   IMPORTANT:
   This function accepts the icon name coming from
   Subjects.jsx and converts it into the same icon
   used on the Tasks page.
*/

function getSubjectIconKey(subjectData, subject = "") {
  const raw =
    subjectData?.icon ||
    subjectData?.iconName ||
    subjectData?.icon_name ||
    subjectData?.iconKey ||
    subjectData?.icon_key ||
    subjectData?.selectedIcon ||
    subjectData?.selected_icon ||
    "";

  const key = normalizeIconKey(raw);

  if (key && SUBJECT_ICON_MAP[key]) {
    return key;
  }

  const name = String(
    subjectData?.name || subject || ""
  )
    .toLowerCase()
    .trim();

  /* Subject-name fallback */

  if (name.includes("java")) return "monitor";

  if (
    name.includes("database") ||
    name.includes("dbms")
  ) {
    return "database";
  }

  if (
    name.includes("operating system") ||
    name.includes("computer network") ||
    name.includes("network")
  ) {
    return "network";
  }

  if (
    name.includes("data structure") ||
    name.includes("algorithm") ||
    name.includes("coding") ||
    name.includes("programming")
  ) {
    return "code";
  }

  if (
    name.includes("mathematics") ||
    name.includes("math")
  ) {
    return "math";
  }

  if (
    name.includes("english") ||
    name.includes("communication") ||
    name.includes("language")
  ) {
    return "languages";
  }

  if (
    name.includes("physics")
  ) {
    return "atom";
  }

  if (
    name.includes("chemistry")
  ) {
    return "flask";
  }

  if (
    name.includes("art") ||
    name.includes("design")
  ) {
    return "palette";
  }

  if (
    name.includes("ai") ||
    name.includes("artificial intelligence")
  ) {
    return "brain";
  }

  return "monitor";
}

/* =========================================================
   SUBJECT ICON
   ========================================================= */

function TaskSubjectIcon({
  subject,
  subjectId,
  subjects = [],
  small = false,
}) {
  const subjectData = getSubjectData(
    subject,
    subjectId,
    subjects
  );

  const iconKey = getSubjectIconKey(
    subjectData,
    subject
  );

  const Icon =
    SUBJECT_ICON_MAP[iconKey] || BookOpen;

  const iconClass =
    SUBJECT_ICON_CLASS[iconKey] ||
    "task-subject-blue";

  return (
    <div
      className={`task-subject-icon ${iconClass}${
        small ? " task-subject-icon-small" : ""
      }`}
      title={subject || "Subject"}
    >
      <Icon
        size={small ? 12 : 19}
        strokeWidth={2.2}
      />
    </div>
  );
}

/* =========================================================
   BADGES
   ========================================================= */

function StatusBadge({ status }) {
  const className = String(
    status || "To Do"
  )
    .toLowerCase()
    .replaceAll(" ", "-");

  return (
    <span
      className={`task-status-badge ${className}`}
    >
      <CircleDot size={12} />
      {status}
    </span>
  );
}

function PriorityBadge({ priority }) {
  return (
    <span
      className={`task-priority-badge ${String(
        priority || "Medium"
      ).toLowerCase()}`}
    >
      <span className="priority-dot" />
      {priority}
    </span>
  );
}

/* =========================================================
   MAIN
   ========================================================= */

export default function Tasks({
  subjects = [],
  setNotifications,
}) {
  const [tasks, setTasks] = useState(() => {
    try {
      const stored =
        localStorage.getItem(TASKS_STORAGE_KEY);

      const parsed = stored
        ? JSON.parse(stored)
        : [];

      return Array.isArray(parsed)
        ? parsed
        : [];
    } catch {
      return [];
    }
  });

  const [search, setSearch] = useState("");
  const [subjectFilter, setSubjectFilter] =
    useState("All Subjects");
  const [statusFilter, setStatusFilter] =
    useState("All Status");
  const [priorityFilter, setPriorityFilter] =
    useState("All Priority");
  const [dateFilter, setDateFilter] =
    useState("All Dates");
  const [sortBy, setSortBy] =
    useState("Due Date");

  const [viewMode, setViewMode] =
    useState("list");

  const [drawerOpen, setDrawerOpen] =
    useState(false);

  const [editingTask, setEditingTask] =
    useState(null);

  const [viewingTask, setViewingTask] =
    useState(null);

  const [deleteTaskId, setDeleteTaskId] =
    useState(null);

  const [taskForm, setTaskForm] =
    useState(createEmptyTask);

  const [toast, setToast] =
    useState(null);

  const [calendarDate, setCalendarDate] =
    useState(new Date());

  /* =====================================================
     SAVE
     ===================================================== */

  useEffect(() => {
    localStorage.setItem(
      TASKS_STORAGE_KEY,
      JSON.stringify(tasks)
    );
  }, [tasks]);

  /* =====================================================
     TOAST
     ===================================================== */

  useEffect(() => {
    if (!toast) return;

    const timer = setTimeout(() => {
      setToast(null);
    }, 3000);

    return () => clearTimeout(timer);
  }, [toast]);

  const showToast = (
    message,
    type = "success"
  ) => {
    setToast({
      message,
      type,
    });
  };
/* =====================================================
     TASK REMINDER → NOTIFICATION + SOUND
     ===================================================== */

  useEffect(() => {
    if (!setNotifications) return;

    let audioContext = null;

    const playReminderSound = async () => {
      try {
        if (!audioContext) {
          const AudioContext =
            window.AudioContext ||
            window.webkitAudioContext;

          if (!AudioContext) return;

          audioContext = new AudioContext();
        }

        if (audioContext.state === "suspended") {
          await audioContext.resume();
        }

        const playBeep = (frequency, startTime) => {
          const oscillator =
            audioContext.createOscillator();

          const gainNode =
            audioContext.createGain();

          oscillator.type = "sine";

          oscillator.frequency.setValueAtTime(
            frequency,
            startTime
          );

          gainNode.gain.setValueAtTime(
            0.001,
            startTime
          );

          gainNode.gain.exponentialRampToValueAtTime(
            0.18,
            startTime + 0.03
          );

          gainNode.gain.exponentialRampToValueAtTime(
            0.001,
            startTime + 0.35
          );

          oscillator.connect(gainNode);
          gainNode.connect(
            audioContext.destination
          );

          oscillator.start(startTime);
          oscillator.stop(startTime + 0.35);
        };

        const startTime =
          audioContext.currentTime;

        playBeep(880, startTime);

        playBeep(
          1046,
          startTime + 0.42
        );
      } catch (error) {
        console.log(
          "Reminder sound could not play:",
          error
        );
      }
    };

    const checkTaskReminders = () => {
      const now = new Date();

      let sentReminders = {};

      try {
        sentReminders = JSON.parse(
          localStorage.getItem(
            "studyos-task-reminders-sent"
          ) || "{}"
        );
      } catch {
        sentReminders = {};
      }

      const newNotifications = [];

      tasks.forEach((task) => {
        if (
          !task.reminder_minutes ||
          Number(task.reminder_minutes) <= 0
        ) {
          return;
        }

        if (task.status === "Completed") {
          return;
        }

        if (
          !task.due_date ||
          !task.due_time
        ) {
          return;
        }

        const dueDateTime = new Date(
          `${task.due_date}T${task.due_time}:00`
        );

        if (
          Number.isNaN(
            dueDateTime.getTime()
          )
        ) {
          return;
        }

        const reminderTime =
          new Date(
            dueDateTime.getTime() -
              Number(task.reminder_minutes) *
                60 *
                1000
          );

        const reminderKey =
          `${task.id}-${task.due_date}-${task.due_time}-${task.reminder_minutes}`;

        if (sentReminders[reminderKey]) {
          return;
        }

        if (
          now >= reminderTime &&
          now < dueDateTime
        ) {
          const minutes = Number(
            task.reminder_minutes
          );

          let reminderText;

          if (minutes < 60) {
            reminderText =
              `${minutes} minutes`;
          } else if (minutes === 60) {
            reminderText = "1 hour";
          } else if (
            minutes % 60 === 0
          ) {
            reminderText =
              `${minutes / 60} hours`;
          } else {
            reminderText =
              `${minutes} minutes`;
          }

          newNotifications.push({
            id:
              `task-reminder-${Date.now()}-${task.id}`,

            type: "task-reminder",

            title: "Task Reminder",

            message:
              `${task.title} is due in ${reminderText}.`,

            text:
              `${task.title} is due in ${reminderText}.`,

            read: false,

            createdAt:
              new Date().toISOString(),

            time:
              new Date().toISOString(),

            taskId: task.id,
          });

          sentReminders[reminderKey] =
            true;
        }
      });

      if (newNotifications.length > 0) {
        localStorage.setItem(
          "studyos-task-reminders-sent",
          JSON.stringify(
            sentReminders
          )
        );

        setNotifications(
          (previous) => [
            ...newNotifications,
            ...(Array.isArray(previous)
              ? previous
              : []),
          ]
        );

        playReminderSound();
      }
    };

    checkTaskReminders();

    const reminderTimer =
      setInterval(
        checkTaskReminders,
        15000
      );

    return () => {
      clearInterval(
        reminderTimer
      );

      if (audioContext) {
        audioContext
          .close()
          .catch(() => {});
      }
    };
  }, [tasks, setNotifications]);
  
  /* =====================================================
     SUBJECTS
     ===================================================== */

  const availableSubjects = useMemo(() => {
    const fromSubjects =
      Array.isArray(subjects)
        ? subjects
            .map((item) => item?.name)
            .filter(Boolean)
        : [];

    const fromTasks = tasks
      .map((task) => task.subject)
      .filter(Boolean);

    return [
      ...new Set([
        ...fromSubjects,
        ...fromTasks,
      ]),
    ];
  }, [subjects, tasks]);

  /* =====================================================
     FILTER
     ===================================================== */

  const filteredTasks = useMemo(() => {
    let result = [...tasks];

    const query = search
      .trim()
      .toLowerCase();

    if (query) {
      result = result.filter((task) =>
        [
          task.title,
          task.description,
          task.subject,
          task.status,
          task.priority,
        ]
          .filter(Boolean)
          .some((value) =>
            String(value)
              .toLowerCase()
              .includes(query)
          )
      );
    }

    if (
      subjectFilter !==
      "All Subjects"
    ) {
      result = result.filter(
        (task) =>
          task.subject === subjectFilter
      );
    }

    if (
      statusFilter !==
      "All Status"
    ) {
      result = result.filter(
        (task) =>
          task.status === statusFilter
      );
    }

    if (
      priorityFilter !==
      "All Priority"
    ) {
      result = result.filter(
        (task) =>
          task.priority === priorityFilter
      );
    }

    const today = getISTDate();

    if (dateFilter === "Today") {
      result = result.filter(
        (task) =>
          task.start_date <= today &&
          task.due_date >= today
      );
    }

    if (dateFilter === "Upcoming") {
      result = result.filter(
        (task) =>
          task.due_date >= today
      );
    }

    if (dateFilter === "Overdue") {
      result = result.filter(
        (task) =>
          task.due_date < today &&
          task.status !== "Completed"
      );
    }

    result.sort((a, b) => {
      if (sortBy === "Due Date") {
        return (
          new Date(
            `${a.due_date}T00:00:00`
          ) -
          new Date(
            `${b.due_date}T00:00:00`
          )
        );
      }

      if (sortBy === "Created") {
        return (
          new Date(b.created_at) -
          new Date(a.created_at)
        );
      }

      if (sortBy === "Priority") {
        const order = {
          High: 1,
          Medium: 2,
          Low: 3,
        };

        return (
          (order[a.priority] || 4) -
          (order[b.priority] || 4)
        );
      }

      if (sortBy === "Title") {
        return String(
          a.title
        ).localeCompare(
          String(b.title)
        );
      }

      return 0;
    });

    return result;
  }, [
    tasks,
    search,
    subjectFilter,
    statusFilter,
    priorityFilter,
    dateFilter,
    sortBy,
  ]);

  /* =====================================================
     STATS
     ===================================================== */

  const today = getISTDate();

  const totalTasks =
    tasks.length;

  const completedTasks =
    tasks.filter(
      (task) =>
        task.status === "Completed"
    ).length;

  const inProgressTasks =
    tasks.filter(
      (task) =>
        task.status === "In Progress"
    ).length;

  const overdueTasks =
    tasks.filter(
      (task) =>
        task.due_date < today &&
        task.status !== "Completed"
    ).length;

  const remainingTasks =
    totalTasks -
    completedTasks;

  const todayTasks =
    tasks.filter(
      (task) =>
        task.start_date <= today &&
        task.due_date >= today
    );

  const todayCompleted =
    todayTasks.filter(
      (task) =>
        task.status === "Completed"
    ).length;

  const todayProgress =
    todayTasks.length > 0
      ? Math.round(
          (todayCompleted /
            todayTasks.length) *
            100
        )
      : 0;

  /* =====================================================
     FORM
     ===================================================== */

  const updateForm = (
    field,
    value
  ) => {
    setTaskForm(
      (previous) => ({
        ...previous,
        [field]: value,
      })
    );
  };

  const openAddTask = () => {
    setEditingTask(null);
    setTaskForm(
      createEmptyTask()
    );
    setDrawerOpen(true);
  };

  const openEditTask = (
    task
  ) => {
    setEditingTask(task);

    setTaskForm({
      ...task,
    });

    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setEditingTask(null);
  };

  const handleSubjectChange = (
    value
  ) => {
    const selected = subjects.find(
      (item) =>
        item?.name === value
    );

    setTaskForm(
      (previous) => ({
        ...previous,
        subject: value,
        subject_id:
          selected?.id || "",
      })
    );
  };

  const handleDailyStudyChange =
    (value) => {
      const selected =
        DAILY_STUDY_OPTIONS.find(
          (item) =>
            item.minutes === Number(value)
        );

      updateForm(
        "estimated_minutes_per_day",
        selected
          ? selected.minutes
          : Number(value)
      );
    };

  const handleDurationChange =
    (value) => {
      const days = Number(value);

      setTaskForm(
        (previous) => ({
          ...previous,
          duration_days: days,
          due_date: addDays(
            previous.start_date,
            days
          ),
        })
      );
    };

  const handleStartDateChange =
    (value) => {
      setTaskForm(
        (previous) => ({
          ...previous,
          start_date: value,
          due_date: addDays(
            value,
            previous.duration_days || 1
          ),
        })
      );
    };

  /* =====================================================
     SUBMIT
     ===================================================== */

  const handleSubmit = (
    event
  ) => {
    event.preventDefault();

    if (!taskForm.title.trim()) {
      showToast(
        "Please enter a task title.",
        "error"
      );
      return;
    }

    if (!taskForm.subject) {
      showToast(
        "Please select a subject.",
        "error"
      );
      return;
    }

    const now =
      new Date().toISOString();

    const taskData = {
      ...taskForm,
      title: taskForm.title.trim(),
      description:
        taskForm.description.trim(),
      updated_at: now,
    };

    if (editingTask) {
      setTasks(
        (previous) =>
          previous.map(
            (task) =>
              task.id === editingTask.id
                ? {
                    ...taskData,
                    id: editingTask.id,
                    created_at:
                      editingTask.created_at,
                  }
                : task
          )
      );

      showToast(
        "Task updated successfully."
      );
    } else {
      const newTask = {
        ...taskData,
        id: `task-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 8)}`,
        created_at: now,
        completed_at: null,
      };

      setTasks(
        (previous) => [
          ...previous,
          newTask,
        ]
      );

      showToast(
        "Task added successfully."
      );
    }

    closeDrawer();
  };

  /* =====================================================
     COMPLETE
     ===================================================== */

  const toggleTaskComplete = (
    task
  ) => {
    const completed =
      task.status !== "Completed";

    setTasks(
      (previous) =>
        previous.map(
          (item) =>
            item.id === task.id
              ? {
                  ...item,
                  status:
                    completed
                      ? "Completed"
                      : "To Do",
                  completed_at:
                    completed
                      ? new Date().toISOString()
                      : null,
                  updated_at:
                    new Date().toISOString(),
                }
              : item
        )
    );

    showToast(
      completed
        ? "Task completed."
        : "Task moved back to To Do."
    );
  };

  /* =====================================================
     DELETE
     ===================================================== */

  const confirmDelete = () => {
    if (!deleteTaskId) return;

    setTasks(
      (previous) =>
        previous.filter(
          (task) =>
            task.id !== deleteTaskId
        )
    );

    setDeleteTaskId(null);

    showToast("Task deleted.");
  };

  /* =====================================================
     TOTAL TIME
     ===================================================== */

  const totalPlannedMinutes =
    Number(
      taskForm.duration_days || 0
    ) *
    Number(
      taskForm.estimated_minutes_per_day ||
        0
    );

  const totalPlannedHours =
    totalPlannedMinutes / 60;

  const totalPlannedText =
    totalPlannedHours < 1
      ? `${totalPlannedMinutes} min`
      : `${Number(
          totalPlannedHours.toFixed(2)
        )} hrs`;

  /* =====================================================
     CALENDAR
     ===================================================== */

  const calendarDays =
    useMemo(() => {
      const year =
        calendarDate.getFullYear();

      const month =
        calendarDate.getMonth();

      const firstDay =
        new Date(
          year,
          month,
          1
        );

      const startDay =
        firstDay.getDay();

      const daysInMonth =
        new Date(
          year,
          month + 1,
          0
        ).getDate();

      const days = [];

      for (
        let index = 0;
        index < startDay;
        index++
      ) {
        days.push(null);
      }

      for (
        let day = 1;
        day <= daysInMonth;
        day++
      ) {
        days.push(
          new Date(
            year,
            month,
            day
          )
        );
      }

      return days;
    }, [calendarDate]);

  const getCalendarDateString =
    (date) => {
      if (!date) return "";

      const year =
        date.getFullYear();

      const month =
        String(
          date.getMonth() + 1
        ).padStart(2, "0");

      const day =
        String(
          date.getDate()
        ).padStart(2, "0");

      return `${year}-${month}-${day}`;
    };

  /* =====================================================
     RENDER
     ===================================================== */

  return (
    <div className="tasks-page">

      <section className="tasks-header">
        <div className="tasks-heading">
          <div className="tasks-heading-icon">
            <CalendarCheck size={30} />
          </div>

          <div>
            <h1>Tasks</h1>

            <p>
              Plan, organize and
              complete your academic
              work.
            </p>
          </div>
        </div>

        <button
          className="tasks-add-button"
          onClick={openAddTask}
        >
          <Plus size={19} />
          Add Task
        </button>
      </section>

      <section className="task-summary">

        <SummaryCard
          className="blue"
          icon={<Target size={21} />}
          value={totalTasks}
          label="Total Tasks"
          note="All your tasks"
        />

        <SummaryCard
          className="green"
          icon={
            <CheckCircle2 size={21} />
          }
          value={completedTasks}
          label="Completed"
          note={`${
            totalTasks
              ? Math.round(
                  (completedTasks /
                    totalTasks) *
                    100
                )
              : 0
          }% done`}
        />

        <SummaryCard
          className="purple"
          icon={<CircleDot size={21} />}
          value={inProgressTasks}
          label="In Progress"
          note="Working on it"
        />

        <SummaryCard
          className="orange"
          icon={<Timer size={21} />}
          value={remainingTasks}
          label="Remaining"
          note="To do"
        />

        <SummaryCard
          className="red"
          icon={
            <AlertCircle size={21} />
          }
          value={overdueTasks}
          label="Overdue"
          note="Needs attention"
        />

        <div className="task-progress-card">
          <div className="task-progress-top">
            <strong>
              Today's Progress
            </strong>

            <b>
              {todayCompleted} /{" "}
              {todayTasks.length}
            </b>
          </div>

          <div className="task-progress-bar">
            <span
              style={{
                width: `${todayProgress}%`,
              }}
            />
          </div>

          <div className="task-progress-bottom">
            <span>
              <Target size={15} />
              Keep going! You're doing
              great!
            </span>

            <strong>
              {todayProgress}%
            </strong>
          </div>
        </div>
      </section>

      <section className="tasks-toolbar">

        <div className="task-search">
          <Search size={18} />

          <input
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
            placeholder="Search tasks..."
          />
        </div>

        <select
          value={subjectFilter}
          onChange={(event) =>
            setSubjectFilter(
              event.target.value
            )
          }
        >
          <option>
            All Subjects
          </option>

          {availableSubjects.map(
            (subject) => (
              <option
                key={subject}
                value={subject}
              >
                {subject}
              </option>
            )
          )}
        </select>

        <select
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(
              event.target.value
            )
          }
        >
          <option>
            All Status
          </option>

          {STATUS_OPTIONS.map(
            (status) => (
              <option
                key={status}
                value={status}
              >
                {status}
              </option>
            )
          )}
        </select>

        <select
          value={priorityFilter}
          onChange={(event) =>
            setPriorityFilter(
              event.target.value
            )
          }
        >
          <option>
            All Priority
          </option>

          {PRIORITY_OPTIONS.map(
            (priority) => (
              <option
                key={priority}
                value={priority}
              >
                {priority}
              </option>
            )
          )}
        </select>

        <select
          value={dateFilter}
          onChange={(event) =>
            setDateFilter(
              event.target.value
            )
          }
        >
          <option>
            All Dates
          </option>

          <option value="Today">
            Today
          </option>

          <option value="Upcoming">
            Upcoming
          </option>

          <option value="Overdue">
            Overdue
          </option>
        </select>

        <select
          value={sortBy}
          onChange={(event) =>
            setSortBy(
              event.target.value
            )
          }
        >
          <option>
            Due Date
          </option>

          <option>
            Created
          </option>

          <option>
            Priority
          </option>

          <option>
            Title
          </option>
        </select>

        <div className="task-view-switch">

          <button
            className={
              viewMode === "list"
                ? "active"
                : ""
            }
            onClick={() =>
              setViewMode("list")
            }
          >
            <List size={16} />
            List
          </button>

          <button
            className={
              viewMode === "calendar"
                ? "active"
                : ""
            }
            onClick={() =>
              setViewMode("calendar")
            }
          >
            <CalendarDays size={16} />
            Calendar
          </button>

        </div>
      </section>

      <section className="tasks-content">

        {viewMode === "list" && (
          <div className="tasks-list">

            {filteredTasks.length === 0 ? (
              <div className="tasks-empty">

                <div className="tasks-empty-icon">
                  <CheckSquareIcon />
                </div>

                <h3>
                  No tasks found
                </h3>

                <p>
                  Add your first task
                  to start organizing
                  your academic work.
                </p>

                <button
                  onClick={openAddTask}
                >
                  <Plus size={17} />
                  Add Task
                </button>

              </div>
            ) : (
              filteredTasks.map(
                (task) => {

                  const taskDays =
                    getDaysBetween(
                      task.start_date,
                      task.due_date
                    );

                  const totalMinutes =
                    taskDays *
                    Number(
                      task.estimated_minutes_per_day ||
                        0
                    );

                  const totalHours =
                    totalMinutes / 60;

                  const isOverdue =
                    task.due_date <
                      today &&
                    task.status !==
                      "Completed";

                  return (
                    <article
                      className={`task-card ${
                        task.status ===
                        "Completed"
                          ? "completed"
                          : ""
                      }`}
                      key={task.id}
                    >

                      <button
                        className={`task-checkbox ${
                          task.status ===
                          "Completed"
                            ? "checked"
                            : ""
                        }`}
                        onClick={() =>
                          toggleTaskComplete(
                            task
                          )
                        }
                        aria-label={
                          task.status ===
                          "Completed"
                            ? "Mark incomplete"
                            : "Mark complete"
                        }
                      >
                        {task.status ===
                          "Completed" && (
                          <Check size={15} />
                        )}
                      </button>

                      <TaskSubjectIcon
                        subject={task.subject}
                        subjectId={task.subject_id}
                        subjects={subjects}
                      />

                      <div className="task-main">

                        <div className="task-title-row">

                          <h3>
                            {task.title}
                          </h3>

                          <StatusBadge
                            status={
                              task.status
                            }
                          />

                          <PriorityBadge
                            priority={
                              task.priority
                            }
                          />

                        </div>

                        {task.description && (
                          <p className="task-description">
                            {task.description}
                          </p>
                        )}

                        <div className="task-meta-row">

                          <span className="task-subject-badge">

                            <TaskSubjectIcon
                              subject={task.subject}
                              subjectId={
                                task.subject_id
                              }
                              subjects={subjects}
                              small
                            />

                            {task.subject}

                          </span>

                        </div>

                        <div className="task-details">

                          <span>

                            <CalendarDays
                              size={14}
                            />

                            {formatDate(
                              task.start_date
                            )}

                            <b>
                              →
                            </b>

                            <span
                              className={
                                isOverdue
                                  ? "overdue-text"
                                  : ""
                              }
                            >
                              {formatDate(
                                task.due_date
                              )}

                              {isOverdue &&
                                " (Overdue)"}
                            </span>

                          </span>

                          <span>

                            <Clock3
                              size={14}
                            />

                            {task.estimated_minutes_per_day >=
                            60
                              ? `${Number(
                                  (
                                    task.estimated_minutes_per_day /
                                    60
                                  ).toFixed(1)
                                )} hr/day`
                              : `${task.estimated_minutes_per_day} min/day`}

                          </span>

                          <span>

                            <CalendarCheck
                              size={14}
                            />

                            {taskDays}{" "}
                            {taskDays === 1
                              ? "day"
                              : "days"}

                          </span>

                          <span>

                            <Timer
                              size={14}
                            />

                            Total:{" "}
                            {totalHours < 1
                              ? `${totalMinutes} min`
                              : `${Number(
                                  totalHours.toFixed(2)
                                )} hrs`}

                          </span>

                        </div>

                      </div>

                      <div className="task-actions">

                        <button
                          title="View"
                          onClick={() =>
                            setViewingTask(
                              task
                            )
                          }
                        >
                          <Eye size={17} />
                        </button>

                        <button
                          title="Edit"
                          onClick={() =>
                            openEditTask(
                              task
                            )
                          }
                        >
                          <Pencil size={17} />
                        </button>

                        <button
                          className="danger"
                          title="Delete"
                          onClick={() =>
                            setDeleteTaskId(
                              task.id
                            )
                          }
                        >
                          <Trash2 size={17} />
                        </button>

                      </div>

                    </article>
                  );
                }
              )
            )}

          </div>
        )}

        {viewMode === "calendar" && (
          <div className="task-calendar">

            <div className="calendar-header">

              <button
                onClick={() =>
                  setCalendarDate(
                    new Date(
                      calendarDate.getFullYear(),
                      calendarDate.getMonth() - 1,
                      1
                    )
                  )
                }
              >
                <ChevronLeft size={19} />
              </button>

              <h3>
                {calendarDate.toLocaleDateString(
                  "en-IN",
                  {
                    month: "long",
                    year: "numeric",
                  }
                )}
              </h3>

              <button
                onClick={() =>
                  setCalendarDate(
                    new Date(
                      calendarDate.getFullYear(),
                      calendarDate.getMonth() + 1,
                      1
                    )
                  )
                }
              >
                <ChevronRight size={19} />
              </button>

            </div>

            <div className="calendar-weekdays">
              <span>Sun</span>
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
            </div>

            <div className="calendar-grid">

              {calendarDays.map(
                (date, index) => {

                  if (!date) {
                    return (
                      <div
                        key={`empty-${index}`}
                        className="calendar-day empty"
                      />
                    );
                  }

                  const dateString =
                    getCalendarDateString(
                      date
                    );

                  const dayTasks =
                    tasks.filter(
                      (task) =>
                        task.start_date <=
                          dateString &&
                        task.due_date >=
                          dateString
                    );

                  const isToday =
                    dateString === today;

                  return (
                    <div
                      key={dateString}
                      className={`calendar-day ${
                        isToday
                          ? "today"
                          : ""
                      }`}
                    >

                      <div className="calendar-date">
                        {date.getDate()}
                      </div>

                      <div className="calendar-day-tasks">

                        {dayTasks
                          .slice(0, 3)
                          .map(
                            (task) => (
                              <button
                                key={task.id}
                                className={`calendar-task ${
                                  task.status ===
                                  "Completed"
                                    ? "completed"
                                    : ""
                                }`}
                                onClick={() =>
                                  setViewingTask(
                                    task
                                  )
                                }
                              >
                                {task.title}
                              </button>
                            )
                          )}

                        {dayTasks.length > 3 && (
                          <span>
                            +{dayTasks.length - 3} more
                          </span>
                        )}

                      </div>

                    </div>
                  );
                }
              )}

            </div>

          </div>
        )}

      </section>

      <div className="tasks-footer">
        Showing{" "}
        <strong>
          {filteredTasks.length}
        </strong>{" "}
        of{" "}
        <strong>
          {tasks.length}
        </strong>{" "}
        tasks
      </div>

      {/* =================================================
          ADD / EDIT CENTER MODAL
          ================================================= */}

      {drawerOpen && (
        <div className="task-drawer-overlay">

          <aside className="task-drawer">

            <div className="task-drawer-header">

              <div className="task-drawer-title">

                <div className="task-drawer-icon">
                  <CalendarCheck size={23} />
                </div>

                <div>

                  <h2>
                    {editingTask
                      ? "Edit Task"
                      : "Add New Task"}
                  </h2>

                  <p>
                    Create a new task
                    to stay organized.
                  </p>

                </div>

              </div>

              <button
                onClick={closeDrawer}
                aria-label="Close"
              >
                <X size={21} />
              </button>

            </div>

            <form
              className="task-form"
              onSubmit={handleSubmit}
            >

              <div className="task-form-grid">

                <label>

                  <span>
                    Task Title <b>*</b>
                  </span>

                  <input
                    value={taskForm.title}
                    onChange={(event) =>
                      updateForm(
                        "title",
                        event.target.value
                      )
                    }
                    placeholder="Enter task title..."
                    required
                  />

                </label>

                <label>

                  <span>
                    Subject <b>*</b>
                  </span>

                  <select
                    value={taskForm.subject}
                    onChange={(event) =>
                      handleSubjectChange(
                        event.target.value
                      )
                    }
                    required
                  >
                    <option value="">
                      Select subject
                    </option>

                    {availableSubjects.map(
                      (subject) => (
                        <option
                          key={subject}
                          value={subject}
                        >
                          {subject}
                        </option>
                      )
                    )}

                  </select>

                </label>

              </div>

              <label>

                <span>
                  Description{" "}
                  <small>
                    (Optional)
                  </small>
                </span>

                <textarea
                  value={
                    taskForm.description
                  }
                  onChange={(event) =>
                    updateForm(
                      "description",
                      event.target.value
                    )
                  }
                  placeholder="Enter task description..."
                  rows={3}
                />

              </label>

              <div className="task-form-grid">

                <label>

                  <span>
                    Start Date
                  </span>

                  <input
                    type="date"
                    value={
                      taskForm.start_date
                    }
                    onChange={(event) =>
                      handleStartDateChange(
                        event.target.value
                      )
                    }
                  />

                </label>

                <label>

                  <span>
                    Due Date
                  </span>

                  <input
                    type="date"
                    value={
                      taskForm.due_date
                    }
                    onChange={(event) =>
                      updateForm(
                        "due_date",
                        event.target.value
                      )
                    }
                  />

                </label>

              </div>

              <div className="task-form-grid">

                <label>

                  <span>
                    Due Time{" "}
                    <small>
                      (Optional)
                    </small>
                  </span>

                  <input
                    type="time"
                    value={
                      taskForm.due_time
                    }
                    onChange={(event) =>
                      updateForm(
                        "due_time",
                        event.target.value
                      )
                    }
                  />

                </label>

                <label>

                  <span>
                    Status
                  </span>

                  <select
                    value={
                      taskForm.status
                    }
                    onChange={(event) =>
                      updateForm(
                        "status",
                        event.target.value
                      )
                    }
                  >

                    {STATUS_OPTIONS.map(
                      (status) => (
                        <option
                          key={status}
                          value={status}
                        >
                          {status}
                        </option>
                      )
                    )}

                  </select>

                </label>

              </div>

              <div className="task-form-grid">

                <label>

                  <span>
                    Priority
                  </span>

                  <select
                    value={
                      taskForm.priority
                    }
                    onChange={(event) =>
                      updateForm(
                        "priority",
                        event.target.value
                      )
                    }
                  >

                    {PRIORITY_OPTIONS.map(
                      (priority) => (
                        <option
                          key={priority}
                          value={priority}
                        >
                          {priority}
                        </option>
                      )
                    )}

                  </select>

                </label>

                <label>

                  <span>
                    Daily Study Time
                  </span>

                  <select
                    value={
                      taskForm.estimated_minutes_per_day
                    }
                    onChange={(event) =>
                      handleDailyStudyChange(
                        event.target.value
                      )
                    }
                  >

                    {DAILY_STUDY_OPTIONS.map(
                      (option) => (
                        <option
                          key={option.minutes}
                          value={option.minutes}
                        >
                          {option.label}
                        </option>
                      )
                    )}

                  </select>

                </label>

              </div>

              <label>

                <span>
                  Task Duration
                </span>

                <select
                  value={
                    taskForm.duration_days
                  }
                  onChange={(event) =>
                    handleDurationChange(
                      event.target.value
                    )
                  }
                >

                  {DURATION_OPTIONS.map(
                    (option) => (
                      <option
                        key={option.days}
                        value={option.days}
                      >
                        {option.label}
                      </option>
                    )
                  )}

                </select>

              </label>

              <label>

                <span>
                  Reminder{" "}
                  <small>
                    (Optional)
                  </small>
                </span>

                <select
                  value={
                    taskForm.reminder_minutes
                  }
                  onChange={(event) =>
                    updateForm(
                      "reminder_minutes",
                      Number(
                        event.target.value
                      )
                    )
                  }
                >

                  <option value={0}>
                    No reminder
                  </option>

                  <option value={15}>
                    15 minutes before
                  </option>

                  <option value={30}>
                    30 minutes before
                  </option>

                  <option value={60}>
                    1 hour before
                  </option>

                  <option value={1440}>
                    1 day before
                  </option>

                </select>

              </label>

              <div className="planned-time-card">

                <div className="planned-time-icon">
                  <Clock3 size={23} />
                </div>

                <div>

                  <strong>
                    Total Planned Study Time
                  </strong>

                  <span>

                    {taskForm.duration_days}{" "}
                    {Number(
                      taskForm.duration_days
                    ) === 1
                      ? "day"
                      : "days"}{" "}

                    ×{" "}

                    {taskForm.estimated_minutes_per_day >=
                    60
                      ? `${Number(
                          (
                            taskForm.estimated_minutes_per_day /
                            60
                          ).toFixed(1)
                        )} hr/day`
                      : `${taskForm.estimated_minutes_per_day} min/day`}{" "}

                    ={" "}

                    <b>
                      {totalPlannedText}
                    </b>

                  </span>

                </div>

              </div>

              <div className="task-form-actions">

                <button
                  type="button"
                  className="task-cancel-button"
                  onClick={closeDrawer}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="task-submit-button"
                >
                  <Plus size={18} />

                  {editingTask
                    ? "Save Changes"
                    : "Add Task"}
                </button>

              </div>

            </form>

          </aside>

        </div>
      )}

      {/* VIEW */}

      {viewingTask && (
        <div className="task-modal-overlay">

          <div className="task-view-modal">

            <button
              className="task-modal-close"
              onClick={() =>
                setViewingTask(null)
              }
            >
              <X size={20} />
            </button>

            <div className="task-view-top">

              <TaskSubjectIcon
                subject={viewingTask.subject}
                subjectId={
                  viewingTask.subject_id
                }
                subjects={subjects}
              />

              <div>

                <h2>
                  {viewingTask.title}
                </h2>

                <div>

                  <StatusBadge
                    status={
                      viewingTask.status
                    }
                  />

                  <PriorityBadge
                    priority={
                      viewingTask.priority
                    }
                  />

                </div>

              </div>

            </div>

            {viewingTask.description && (
              <div className="task-view-section">

                <h4>
                  Description
                </h4>

                <p>
                  {viewingTask.description}
                </p>

              </div>
            )}

            <div className="task-view-info">

              <div>
                <span>Subject</span>

                <strong>
                  {viewingTask.subject}
                </strong>
              </div>

              <div>
                <span>Start Date</span>

                <strong>
                  {formatDate(
                    viewingTask.start_date
                  )}
                </strong>
              </div>

              <div>
                <span>Due Date</span>

                <strong>
                  {formatDate(
                    viewingTask.due_date
                  )}
                </strong>
              </div>

              <div>
                <span>Daily Study</span>

                <strong>
                  {
                    viewingTask.estimated_minutes_per_day
                  }{" "}
                  min/day
                </strong>
              </div>

              <div>
                <span>Duration</span>

                <strong>
                  {
                    viewingTask.duration_days
                  }{" "}
                  days
                </strong>
              </div>

            </div>

            <div className="task-view-actions">

              <button
                onClick={() => {
                  setViewingTask(null);
                  openEditTask(
                    viewingTask
                  );
                }}
              >
                <Pencil size={16} />
                Edit Task
              </button>

              <button
                className="danger"
                onClick={() => {
                  setViewingTask(null);
                  setDeleteTaskId(
                    viewingTask.id
                  );
                }}
              >
                <Trash2 size={16} />
                Delete
              </button>

            </div>

          </div>

        </div>
      )}

      {/* DELETE */}

      {deleteTaskId && (
        <div className="task-modal-overlay">

          <div className="delete-task-modal">

            <div className="delete-icon">
              <Trash2 size={22} />
            </div>

            <h3>
              Delete Task?
            </h3>

            <p>
              This task will be
              permanently removed
              from your task list.
            </p>

            <div className="delete-actions">

              <button
                onClick={() =>
                  setDeleteTaskId(null)
                }
              >
                Cancel
              </button>

              <button
                className="delete-confirm"
                onClick={confirmDelete}
              >
                Delete Task
              </button>

            </div>

          </div>

        </div>
      )}

      {/* TOAST */}

      {toast && (
        <div
          className={`task-toast ${toast.type}`}
        >
          {toast.type === "error" ? (
            <AlertCircle size={18} />
          ) : (
            <CheckCircle2 size={18} />
          )}

          <span>
            {toast.message}
          </span>

        </div>
      )}

    </div>
  );
}

/* =========================================================
   SUMMARY CARD
   ========================================================= */

function SummaryCard({
  className,
  icon,
  value,
  label,
  note,
}) {
  return (
    <div
      className={`task-summary-card ${className}`}
    >
      <div className="summary-icon">
        {icon}
      </div>

      <div>
        <strong>{value}</strong>
        <span>{label}</span>
        <small>{note}</small>
      </div>
    </div>
  );
}

/* =========================================================
   EMPTY CHECK ICON
   ========================================================= */

function CheckSquareIcon() {
  return (
    <div className="empty-check-icon">
      <Check size={30} />
    </div>
  );
}