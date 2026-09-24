import { useEffect, useMemo, useState } from "react";
import {
  Check,
  Flame,
  Plus,
  Pencil,
  Trash2,
  Archive,
  RotateCcw,
  CalendarDays,
  Clock3,
  Target,
  Trophy,
  X,
  Save,
  Heart,
  CircleCheck,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import "./HabitTracker.css";

const HABITS_STORAGE_KEY = "studyos-habits";

const HABIT_CATEGORIES = [
  "Study",
  "Health",
  "Fitness",
  "Personal",
  "Productivity",
  "Other",
];

const HABIT_ICONS = [
  "📚",
  "💻",
  "🧠",
  "🏃",
  "💪",
  "💧",
  "📖",
  "✍️",
  "🎯",
  "🧘",
  "😴",
  "☀️",
];

const HABIT_COLORS = [
  "#4f46e5",
  "#7c3aed",
  "#06b6d4",
  "#10b981",
  "#f59e0b",
  "#ef4444",
];

const createId = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const dateToString = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const todayString = () => dateToString(new Date());

const parseDate = (value) => {
  const [year, month, day] = value.split("-").map(Number);

  return new Date(year, month - 1, day);
};

const formatDate = (value) => {
  if (!value) return "";

  return parseDate(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const getDaysBetween = (startDate, endDate) => {
  const start = parseDate(startDate);
  const end = parseDate(endDate);

  const difference =
    Math.floor(
      (end.getTime() - start.getTime()) /
        (1000 * 60 * 60 * 24)
    ) + 1;

  return Math.max(0, difference);
};

const isSameOrAfter = (dateA, dateB) =>
  dateA >= dateB;

const getWeekdayIndex = (date) => date.getDay();

const defaultHabitForm = {
  name: "",
  description: "",
  category: "Study",
  icon: "📚",
  color: "#4f46e5",
  frequency: "Daily",
  startDate: todayString(),
  reminderTime: "",
};

const HabitTracker = ({ setNotifications }) => {
  const [habits, setHabits] = useState(() => {
    try {
      const saved = localStorage.getItem(
        HABITS_STORAGE_KEY
      );

      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [selectedDate, setSelectedDate] =
    useState(todayString());

  const [calendarDate, setCalendarDate] =
    useState(new Date());

  const [search, setSearch] = useState("");

  const [filter, setFilter] = useState("All");

  const [showArchived, setShowArchived] =
    useState(false);

  const [showModal, setShowModal] =
    useState(false);

  const [editingHabit, setEditingHabit] =
    useState(null);

  const [viewHabit, setViewHabit] =
    useState(null);

  const [deleteHabit, setDeleteHabit] =
    useState(null);

  const [notice, setNotice] = useState("");

  const [habitForm, setHabitForm] =
    useState(defaultHabitForm);

  /* =====================================================
     SAVE HABITS
  ===================================================== */

  useEffect(() => {
    try {
      localStorage.setItem(
        HABITS_STORAGE_KEY,
        JSON.stringify(habits)
      );
    } catch {
      // Ignore localStorage errors.
    }
  }, [habits]);

  /* =====================================================
     NOTICE
  ===================================================== */

  useEffect(() => {
    if (!notice) return;

    const timeout = setTimeout(() => {
      setNotice("");
    }, 2800);

    return () => clearTimeout(timeout);
  }, [notice]);

  /* =====================================================
     NOTIFICATION
  ===================================================== */

  const addNotification = (
    title,
    message,
    type = "habit"
  ) => {
    if (typeof setNotifications !== "function") {
      return;
    }

    setNotifications((previous) => [
      {
        id: createId(),
        title,
        message,
        type,
        read: false,
        time: new Date().toISOString(),
      },
      ...previous,
    ]);
  };

  /* =====================================================
     TODAY
  ===================================================== */

  const today = todayString();

  /* =====================================================
     ACTIVE HABITS
  ===================================================== */

  const activeHabits = useMemo(() => {
    return habits.filter(
      (habit) => !habit.archived
    );
  }, [habits]);

  const archivedHabits = useMemo(() => {
    return habits.filter(
      (habit) => habit.archived
    );
  }, [habits]);

  /* =====================================================
     FILTERED HABITS
  ===================================================== */

  const visibleHabits = useMemo(() => {
    const source = showArchived
      ? archivedHabits
      : activeHabits;

    return source.filter((habit) => {
      const matchesSearch =
        !search.trim() ||
        habit.name
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        habit.description
          ?.toLowerCase()
          .includes(search.toLowerCase());

      const matchesFilter =
        filter === "All" ||
        habit.category === filter;

      return matchesSearch && matchesFilter;
    });
  }, [
    activeHabits,
    archivedHabits,
    search,
    filter,
    showArchived,
  ]);

  /* =====================================================
     HABIT SCHEDULE
  ===================================================== */

  const isHabitScheduledForDate = (
    habit,
    dateString
  ) => {
    if (!habit?.startDate) return false;

    const selected = parseDate(dateString);
    const start = parseDate(habit.startDate);

    if (selected < start) return false;

    if (habit.archived) return false;

    if (habit.frequency === "Daily") {
      return true;
    }

    if (habit.frequency === "Weekly") {
      return (
        getWeekdayIndex(selected) ===
        getWeekdayIndex(start)
      );
    }

    return true;
  };

  /* =====================================================
     COMPLETION
  ===================================================== */

  const isCompletedOnDate = (
    habit,
    dateString
  ) => {
    return Array.isArray(habit.completedDates)
      ? habit.completedDates.includes(dateString)
      : false;
  };

  const toggleHabitCompletion = (
    habitId,
    dateString = todayString()
  ) => {
    setHabits((previous) =>
      previous.map((habit) => {
        if (habit.id !== habitId) {
          return habit;
        }

        const completedDates = Array.isArray(
          habit.completedDates
        )
          ? [...habit.completedDates]
          : [];

        const index =
          completedDates.indexOf(dateString);

        if (index >= 0) {
          completedDates.splice(index, 1);

          if (dateString === todayString()) {
            setNotice(
              `"${habit.name}" marked incomplete.`
            );

            addNotification(
              "Habit updated",
              `${habit.name} was marked incomplete.`
            );
          }
        } else {
          completedDates.push(dateString);

          if (dateString === todayString()) {
            setNotice(
              `"${habit.name}" completed today!`
            );

            addNotification(
              "Habit completed",
              `Great work! ${habit.name} is completed for today.`
            );
          }
        }

        return {
          ...habit,
          completedDates,
          updatedAt: new Date().toISOString(),
        };
      })
    );
  };

  /* =====================================================
     STREAK
  ===================================================== */

  const getCurrentStreak = (habit) => {
    const completedDates = new Set(
      Array.isArray(habit.completedDates)
        ? habit.completedDates
        : []
    );

    let streak = 0;

    const current = new Date();

    while (true) {
      const currentDate = dateToString(current);

      if (!completedDates.has(currentDate)) {
        break;
      }

      streak += 1;

      current.setDate(current.getDate() - 1);
    }

    return streak;
  };

  const getBestStreak = (habit) => {
    const completedDates = [
      ...new Set(
        Array.isArray(habit.completedDates)
          ? habit.completedDates
          : []
      ),
    ].sort();

    if (!completedDates.length) {
      return 0;
    }

    let best = 1;
    let current = 1;

    for (let index = 1; index < completedDates.length; index++) {
      const previous = parseDate(
        completedDates[index - 1]
      );

      const currentDate = parseDate(
        completedDates[index]
      );

      const difference =
        Math.round(
          (currentDate.getTime() -
            previous.getTime()) /
            (1000 * 60 * 60 * 24)
        );

      if (difference === 1) {
        current += 1;
      } else {
        current = 1;
      }

      best = Math.max(best, current);
    }

    return best;
  };

  /* =====================================================
     COMPLETION %
  ===================================================== */

  const getCompletionPercentage = (habit) => {
    const completedDates = Array.isArray(
      habit.completedDates
    )
      ? habit.completedDates
      : [];

    const endDate = todayString();

    if (
      !habit.startDate ||
      parseDate(habit.startDate) > parseDate(endDate)
    ) {
      return 0;
    }

    const totalDays = getDaysBetween(
      habit.startDate,
      endDate
    );

    if (totalDays <= 0) return 0;

    let scheduledDays = totalDays;

    if (habit.frequency === "Weekly") {
      scheduledDays = 0;

      const current = parseDate(
        habit.startDate
      );

      const end = parseDate(endDate);

      while (current <= end) {
        if (
          getWeekdayIndex(current) ===
          getWeekdayIndex(
            parseDate(habit.startDate)
          )
        ) {
          scheduledDays += 1;
        }

        current.setDate(
          current.getDate() + 1
        );
      }
    }

    const completedCount =
      completedDates.filter((date) => {
        return isHabitScheduledForDate(
          {
            ...habit,
            archived: false,
          },
          date
        );
      }).length;

    return Math.min(
      100,
      Math.round(
        (completedCount /
          Math.max(1, scheduledDays)) *
          100
      )
    );
  };

  /* =====================================================
     STATS
  ===================================================== */

  const totalHabits = activeHabits.length;

  const todayScheduledHabits =
    activeHabits.filter((habit) =>
      isHabitScheduledForDate(
        habit,
        selectedDate
      )
    );

  const todayCompleted = todayScheduledHabits.filter(
    (habit) =>
      isCompletedOnDate(
        habit,
        selectedDate
      )
  ).length;

  const overallCompletion = useMemo(() => {
    if (!activeHabits.length) return 0;

    const total = activeHabits.reduce(
      (sum, habit) =>
        sum + getCompletionPercentage(habit),
      0
    );

    return Math.round(
      total / activeHabits.length
    );
  }, [activeHabits]);

  const bestStreak = useMemo(() => {
    if (!activeHabits.length) return 0;

    return Math.max(
      ...activeHabits.map((habit) =>
        getBestStreak(habit)
      )
    );
  }, [activeHabits]);

  /* =====================================================
     MODAL
  ===================================================== */

  const openAddModal = () => {
    setEditingHabit(null);

    setHabitForm({
      ...defaultHabitForm,
      startDate: todayString(),
    });

    setShowModal(true);
  };

  const openEditModal = (habit) => {
    setEditingHabit(habit);

    setHabitForm({
      name: habit.name || "",
      description: habit.description || "",
      category: habit.category || "Study",
      icon: habit.icon || "📚",
      color: habit.color || "#4f46e5",
      frequency: habit.frequency || "Daily",
      startDate:
        habit.startDate || todayString(),
      reminderTime: habit.reminderTime || "",
    });

    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingHabit(null);
  };

  /* =====================================================
     SAVE HABIT
  ===================================================== */

  const saveHabit = () => {
    const name = habitForm.name.trim();

    if (!name) {
      setNotice("Please enter a habit name.");
      return;
    }

    if (editingHabit) {
      setHabits((previous) =>
        previous.map((habit) =>
          habit.id === editingHabit.id
            ? {
                ...habit,
                ...habitForm,
                name,
                updatedAt:
                  new Date().toISOString(),
              }
            : habit
        )
      );

      setNotice("Habit updated successfully.");

      addNotification(
        "Habit updated",
        `${name} was updated successfully.`
      );
    } else {
      const newHabit = {
        id: createId(),

        name,

        description:
          habitForm.description.trim(),

        category: habitForm.category,

        icon: habitForm.icon,

        color: habitForm.color,

        frequency: habitForm.frequency,

        startDate: habitForm.startDate,

        reminderTime:
          habitForm.reminderTime,

        completedDates: [],

        archived: false,

        favorite: false,

        createdAt:
          new Date().toISOString(),

        updatedAt:
          new Date().toISOString(),
      };

      setHabits((previous) => [
        newHabit,
        ...previous,
      ]);

      setNotice("Habit created successfully.");

      addNotification(
        "New habit created",
        `${name} has been added to your habits.`
      );
    }

    closeModal();
  };

  /* =====================================================
     DELETE
  ===================================================== */

  const confirmDelete = () => {
    if (!deleteHabit) return;

    setHabits((previous) =>
      previous.filter(
        (habit) =>
          habit.id !== deleteHabit.id
      )
    );

    addNotification(
      "Habit deleted",
      `${deleteHabit.name} was deleted.`
    );

    setNotice("Habit deleted.");

    setDeleteHabit(null);

    if (
      viewHabit?.id === deleteHabit.id
    ) {
      setViewHabit(null);
    }
  };

  /* =====================================================
     ARCHIVE
  ===================================================== */

  const archiveHabit = (habit) => {
    setHabits((previous) =>
      previous.map((item) =>
        item.id === habit.id
          ? {
              ...item,
              archived: !item.archived,
              updatedAt:
                new Date().toISOString(),
            }
          : item
      )
    );

    const archived = !habit.archived;

    setNotice(
      archived
        ? "Habit archived."
        : "Habit restored."
    );

    addNotification(
      archived
        ? "Habit archived"
        : "Habit restored",
      `${habit.name} was ${
        archived ? "archived" : "restored"
      }.`
    );
  };

  /* =====================================================
     FAVORITE
  ===================================================== */

  const toggleFavorite = (habitId) => {
    setHabits((previous) =>
      previous.map((habit) =>
        habit.id === habitId
          ? {
              ...habit,
              favorite: !habit.favorite,
              updatedAt:
                new Date().toISOString(),
            }
          : habit
      )
    );
  };

  /* =====================================================
     CALENDAR
  ===================================================== */

  const calendarDays = useMemo(() => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();

    const firstDay = new Date(
      year,
      month,
      1
    );

    const lastDay = new Date(
      year,
      month + 1,
      0
    );

    const startOffset =
      (firstDay.getDay() + 6) % 7;

    const totalDays =
      lastDay.getDate();

    const cells = [];

    for (
      let index = 0;
      index < startOffset;
      index++
    ) {
      cells.push(null);
    }

    for (
      let day = 1;
      day <= totalDays;
      day++
    ) {
      cells.push(
        new Date(year, month, day)
      );
    }

    while (cells.length % 7 !== 0) {
      cells.push(null);
    }

    return cells;
  }, [calendarDate]);

  const changeMonth = (amount) => {
    setCalendarDate(
      (previous) =>
        new Date(
          previous.getFullYear(),
          previous.getMonth() + amount,
          1
        )
    );
  };

  const calendarMonthName =
    calendarDate.toLocaleDateString(
      "en-IN",
      {
        month: "long",
        year: "numeric",
      }
    );

  /* =====================================================
     CALENDAR COMPLETION
  ===================================================== */

  const getCalendarCompletion = (
    dateString
  ) => {
    const scheduled = activeHabits.filter(
      (habit) =>
        isHabitScheduledForDate(
          habit,
          dateString
        )
    );

    if (!scheduled.length) {
      return null;
    }

    const completed = scheduled.filter(
      (habit) =>
        isCompletedOnDate(
          habit,
          dateString
        )
    ).length;

    return {
      completed,
      total: scheduled.length,
      percentage: Math.round(
        (completed / scheduled.length) *
          100
      ),
    };
  };

  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <section className="habit-page">
      {/* TOAST */}
      {notice && (
        <div className="habit-toast">
          <CircleCheck size={17} />
          <span>{notice}</span>
        </div>
      )}

      {/* HEADER */}
      <header className="habit-header">
        <div className="habit-heading">
          <div className="habit-heading-icon">
            <Flame size={28} />
          </div>

          <div>
            <h1>Habit Tracker</h1>
            <p>
              Build better habits, one day at a
              time.
            </p>
          </div>
        </div>

        <button
          className="habit-primary-btn"
          onClick={openAddModal}
        >
          <Plus size={18} />
          Add Habit
        </button>
      </header>

      {/* STATS */}
      <div className="habit-stats">
        <div className="habit-stat-card">
          <div className="habit-stat-icon indigo">
            <Target size={19} />
          </div>

          <div>
            <span>Total Habits</span>
            <strong>{totalHabits}</strong>
          </div>
        </div>

        <div className="habit-stat-card">
          <div className="habit-stat-icon green">
            <Check size={19} />
          </div>

          <div>
            <span>Today's Completed</span>
            <strong>
              {todayCompleted}
              <small>/{todayScheduledHabits.length}</small>
            </strong>
          </div>
        </div>

        <div className="habit-stat-card">
          <div className="habit-stat-icon orange">
            <Flame size={19} />
          </div>

          <div>
            <span>Best Streak</span>
            <strong>{bestStreak} days</strong>
          </div>
        </div>

        <div className="habit-stat-card">
          <div className="habit-stat-icon purple">
            <Trophy size={19} />
          </div>

          <div>
            <span>Overall Progress</span>
            <strong>{overallCompletion}%</strong>
          </div>
        </div>
      </div>

      {/* TOOLBAR */}
      <div className="habit-toolbar">
        <div className="habit-search">
          <input
            type="text"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search habits..."
          />
        </div>

        <select
          value={filter}
          onChange={(event) =>
            setFilter(event.target.value)
          }
        >
          <option value="All">All Categories</option>

          {HABIT_CATEGORIES.map(
            (category) => (
              <option
                key={category}
                value={category}
              >
                {category}
              </option>
            )
          )}
        </select>

        <button
          className={
            showArchived
              ? "habit-toolbar-btn active"
              : "habit-toolbar-btn"
          }
          onClick={() =>
            setShowArchived(
              (previous) => !previous
            )
          }
        >
          <Archive size={16} />

          {showArchived
            ? "Active Habits"
            : "Archived"}
        </button>
      </div>

      {/* CONTENT */}
      <div className="habit-content">
        {/* HABITS */}
        <div className="habit-main">
          <div className="habit-section-heading">
            <div>
              <h2>
                {showArchived
                  ? "Archived Habits"
                  : "My Habits"}
              </h2>

              <p>
                {showArchived
                  ? "Your archived habits."
                  : "Keep your daily routine consistent."}
              </p>
            </div>

            {!showArchived && (
              <span className="habit-date-label">
                {formatDate(selectedDate)}
              </span>
            )}
          </div>

          {visibleHabits.length === 0 ? (
            <div className="habit-empty">
              <div className="habit-empty-icon">
                <Flame size={28} />
              </div>

              <h3>
                {showArchived
                  ? "No archived habits"
                  : search || filter !== "All"
                  ? "No habits found"
                  : "Start building a habit"}
              </h3>

              <p>
                {showArchived
                  ? "Archived habits will appear here."
                  : search || filter !== "All"
                  ? "Try changing your search or category filter."
                  : "Create your first habit and start building a consistent routine."}
              </p>

              {!showArchived &&
                !search &&
                filter === "All" && (
                  <button
                    className="habit-primary-btn"
                    onClick={openAddModal}
                  >
                    <Plus size={17} />
                    Create Habit
                  </button>
                )}
            </div>
          ) : (
            <div className="habit-list">
              {visibleHabits.map(
                (habit) => {
                  const scheduled =
                    isHabitScheduledForDate(
                      habit,
                      selectedDate
                    );

                  const completed =
                    isCompletedOnDate(
                      habit,
                      selectedDate
                    );

                  const streak =
                    getCurrentStreak(
                      habit
                    );

                  const percentage =
                    getCompletionPercentage(
                      habit
                    );

                  return (
                    <article
                      className={`habit-card ${
                        completed
                          ? "completed"
                          : ""
                      }`}
                      key={habit.id}
                    >
                      <div
                        className="habit-card-accent"
                        style={{
                          background:
                            habit.color,
                        }}
                      />

                      <div className="habit-card-main">
                        <div className="habit-card-top">
                          <div
                            className="habit-icon"
                            style={{
                              background: `${habit.color}16`,
                            }}
                          >
                            {habit.icon}
                          </div>

                          <div className="habit-card-title">
                            <div>
                              <h3>
                                {habit.name}
                              </h3>

                              <button
                                className="habit-favorite"
                                onClick={() =>
                                  toggleFavorite(
                                    habit.id
                                  )
                                }
                                aria-label="Favorite habit"
                              >
                                <Heart
                                  size={16}
                                  fill={
                                    habit.favorite
                                      ? "currentColor"
                                      : "none"
                                  }
                                  className={
                                    habit.favorite
                                      ? "active"
                                      : ""
                                  }
                                />
                              </button>
                            </div>

                            {habit.description && (
                              <p>
                                {
                                  habit.description
                                }
                              </p>
                            )}

                            <div className="habit-meta">
                              <span>
                                {
                                  habit.category
                                }
                              </span>

                              <span>
                                {
                                  habit.frequency
                                }
                              </span>

                              {habit.reminderTime && (
                                <span>
                                  <Clock3
                                    size={12}
                                  />
                                  {
                                    habit.reminderTime
                                  }
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="habit-progress-area">
                          <div className="habit-progress-info">
                            <span>
                              Progress
                            </span>

                            <strong>
                              {percentage}%
                            </strong>
                          </div>

                          <div className="habit-progress">
                            <div
                              style={{
                                width: `${percentage}%`,
                                background:
                                  habit.color,
                              }}
                            />
                          </div>
                        </div>

                        <div className="habit-card-bottom">
                          <div className="habit-streak">
                            <Flame
                              size={15}
                            />

                            <span>
                              <b>
                                {streak}
                              </b>{" "}
                              day streak
                            </span>
                          </div>

                          <div className="habit-card-actions">
                            {!showArchived &&
                              scheduled && (
                                <button
                                  className={`habit-complete-btn ${
                                    completed
                                      ? "done"
                                      : ""
                                  }`}
                                  onClick={() =>
                                    toggleHabitCompletion(
                                      habit.id,
                                      selectedDate
                                    )
                                  }
                                >
                                  {completed ? (
                                    <>
                                      <Check
                                        size={16}
                                      />
                                      Completed
                                    </>
                                  ) : (
                                    <>
                                      <CircleCheck
                                        size={16}
                                      />
                                      Complete
                                    </>
                                  )}
                                </button>
                              )}

                            {!showArchived && (
                              <>
                                <button
                                  className="habit-icon-btn"
                                  onClick={() =>
                                    setViewHabit(
                                      habit
                                    )
                                  }
                                  title="View"
                                >
                                  <CalendarDays
                                    size={16}
                                  />
                                </button>

                                <button
                                  className="habit-icon-btn"
                                  onClick={() =>
                                    openEditModal(
                                      habit
                                    )
                                  }
                                  title="Edit"
                                >
                                  <Pencil
                                    size={16}
                                  />
                                </button>

                                <button
                                  className="habit-icon-btn"
                                  onClick={() =>
                                    archiveHabit(
                                      habit
                                    )
                                  }
                                  title="Archive"
                                >
                                  <Archive
                                    size={16}
                                  />
                                </button>
                              </>
                            )}

                            {showArchived && (
                              <button
                                className="habit-icon-btn"
                                onClick={() =>
                                  archiveHabit(
                                    habit
                                  )
                                }
                                title="Restore"
                              >
                                <RotateCcw
                                  size={16}
                                />
                              </button>
                            )}

                            <button
                              className="habit-icon-btn danger"
                              onClick={() =>
                                setDeleteHabit(
                                  habit
                                )
                              }
                              title="Delete"
                            >
                              <Trash2
                                size={16}
                              />
                            </button>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                }
              )}
            </div>
          )}
        </div>

        {/* CALENDAR */}
        <aside className="habit-calendar-panel">
          <div className="habit-calendar-heading">
            <div>
              <h2>Habit Calendar</h2>
              <p>Track your consistency.</p>
            </div>
          </div>

          <div className="habit-calendar-nav">
            <button
              onClick={() =>
                changeMonth(-1)
              }
            >
              <ChevronLeft size={17} />
            </button>

            <strong>
              {calendarMonthName}
            </strong>

            <button
              onClick={() =>
                changeMonth(1)
              }
            >
              <ChevronRight size={17} />
            </button>
          </div>

          <div className="habit-calendar-weekdays">
            {[
              "Mon",
              "Tue",
              "Wed",
              "Thu",
              "Fri",
              "Sat",
              "Sun",
            ].map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>

          <div className="habit-calendar-grid">
            {calendarDays.map(
              (date, index) => {
                if (!date) {
                  return (
                    <div
                      className="habit-calendar-empty"
                      key={`empty-${index}`}
                    />
                  );
                }

                const dateString =
                  dateToString(date);

                const calendarData =
                  getCalendarCompletion(
                    dateString
                  );

                const isToday =
                  dateString === today;

                const isSelected =
                  dateString ===
                  selectedDate;

                const isFuture =
                  date > new Date();

                return (
                  <button
                    key={dateString}
                    className={`habit-calendar-day ${
                      isToday ? "today" : ""
                    } ${
                      isSelected
                        ? "selected"
                        : ""
                    }`}
                    onClick={() => {
                      setSelectedDate(
                        dateString
                      );
                    }}
                  >
                    <span>
                      {date.getDate()}
                    </span>

                    {calendarData && (
                      <i
                        className={
                          calendarData.percentage ===
                          100
                            ? "complete"
                            : calendarData.completed >
                              0
                            ? "partial"
                            : ""
                        }
                      />
                    )}

                    {isFuture && (
                      <em />
                    )}
                  </button>
                );
              }
            )}
          </div>

          <div className="habit-calendar-legend">
            <span>
              <i className="complete" />
              Completed
            </span>

            <span>
              <i className="partial" />
              Partial
            </span>

            <span>
              <i />
              No activity
            </span>
          </div>

          {/* SELECTED DATE */}
          <div className="habit-selected-day">
            <div className="habit-selected-day-heading">
              <div>
                <span>Selected Day</span>
                <strong>
                  {formatDate(
                    selectedDate
                  )}
                </strong>
              </div>

              <CalendarDays
                size={18}
              />
            </div>

            <div className="habit-day-progress">
              <strong>
                {todayScheduledHabits.filter(
                  (habit) =>
                    isCompletedOnDate(
                      habit,
                      selectedDate
                    )
                ).length}
                /
                {todayScheduledHabits.length}
              </strong>

              <span>
                habits completed
              </span>
            </div>

            <div className="habit-day-list">
              {todayScheduledHabits
                .slice(0, 5)
                .map((habit) => {
                  const completed =
                    isCompletedOnDate(
                      habit,
                      selectedDate
                    );

                  return (
                    <button
                      key={habit.id}
                      className={
                        completed
                          ? "completed"
                          : ""
                      }
                      onClick={() =>
                        toggleHabitCompletion(
                          habit.id,
                          selectedDate
                        )
                      }
                    >
                      <span>
                        {habit.icon}
                      </span>

                      <strong>
                        {habit.name}
                      </strong>

                      <i>
                        {completed ? (
                          <Check
                            size={13}
                          />
                        ) : null}
                      </i>
                    </button>
                  );
                })}

              {todayScheduledHabits.length ===
                0 && (
                <div className="habit-no-day-data">
                  No habits scheduled for
                  this day.
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>

      {/* ===================================================
          ADD / EDIT MODAL
      =================================================== */}

      {showModal && (
        <div
          className="habit-modal-overlay"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeModal();
            }
          }}
        >
          <div className="habit-modal">
            <div className="habit-modal-header">
              <div>
                <h2>
                  {editingHabit
                    ? "Edit Habit"
                    : "Create Habit"}
                </h2>

                <p>
                  Set up a simple routine
                  you can maintain.
                </p>
              </div>

              <button
                className="habit-modal-close"
                onClick={closeModal}
              >
                <X size={19} />
              </button>
            </div>

            <div className="habit-form">
              <div className="habit-form-group full">
                <label>
                  Habit Name
                </label>

                <input
                  type="text"
                  value={habitForm.name}
                  onChange={(event) =>
                    setHabitForm({
                      ...habitForm,
                      name: event.target.value,
                    })
                  }
                  placeholder="e.g. Study DSA for 1 hour"
                  autoFocus
                />
              </div>

              <div className="habit-form-group full">
                <label>
                  Description
                </label>

                <textarea
                  value={
                    habitForm.description
                  }
                  onChange={(event) =>
                    setHabitForm({
                      ...habitForm,
                      description:
                        event.target.value,
                    })
                  }
                  placeholder="What do you want to build into your routine?"
                  rows="3"
                />
              </div>

              <div className="habit-form-group">
                <label>
                  Category
                </label>

                <select
                  value={
                    habitForm.category
                  }
                  onChange={(event) =>
                    setHabitForm({
                      ...habitForm,
                      category:
                        event.target.value,
                    })
                  }
                >
                  {HABIT_CATEGORIES.map(
                    (category) => (
                      <option
                        key={category}
                        value={category}
                      >
                        {category}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div className="habit-form-group">
                <label>
                  Frequency
                </label>

                <select
                  value={
                    habitForm.frequency
                  }
                  onChange={(event) =>
                    setHabitForm({
                      ...habitForm,
                      frequency:
                        event.target.value,
                    })
                  }
                >
                  <option value="Daily">
                    Daily
                  </option>

                  <option value="Weekly">
                    Weekly
                  </option>
                </select>
              </div>

              <div className="habit-form-group">
                <label>
                  Start Date
                </label>

                <input
                  type="date"
                  value={
                    habitForm.startDate
                  }
                  onChange={(event) =>
                    setHabitForm({
                      ...habitForm,
                      startDate:
                        event.target.value,
                    })
                  }
                />
              </div>

              <div className="habit-form-group">
                <label>
                  Reminder Time
                </label>

                <input
                  type="time"
                  value={
                    habitForm.reminderTime
                  }
                  onChange={(event) =>
                    setHabitForm({
                      ...habitForm,
                      reminderTime:
                        event.target.value,
                    })
                  }
                />
              </div>

              {/* ICON */}
              <div className="habit-form-group full">
                <label>
                  Habit Icon
                </label>

                <div className="habit-icon-options">
                  {HABIT_ICONS.map(
                    (icon) => (
                      <button
                        type="button"
                        key={icon}
                        className={
                          habitForm.icon ===
                          icon
                            ? "active"
                            : ""
                        }
                        onClick={() =>
                          setHabitForm({
                            ...habitForm,
                            icon,
                          })
                        }
                      >
                        {icon}
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* COLOR */}
              <div className="habit-form-group full">
                <label>
                  Accent Color
                </label>

                <div className="habit-color-options">
                  {HABIT_COLORS.map(
                    (color) => (
                      <button
                        type="button"
                        key={color}
                        className={
                          habitForm.color ===
                          color
                            ? "active"
                            : ""
                        }
                        style={{
                          background: color,
                        }}
                        onClick={() =>
                          setHabitForm({
                            ...habitForm,
                            color,
                          })
                        }
                      />
                    )
                  )}
                </div>
              </div>
            </div>

            <div className="habit-modal-footer">
              <button
                className="habit-cancel-btn"
                onClick={closeModal}
              >
                Cancel
              </button>

              <button
                className="habit-primary-btn"
                onClick={saveHabit}
              >
                <Save size={17} />

                {editingHabit
                  ? "Save Changes"
                  : "Create Habit"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================
          VIEW MODAL
      =================================================== */}

      {viewHabit && (
        <div
          className="habit-modal-overlay"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setViewHabit(null);
            }
          }}
        >
          <div className="habit-view-modal">
            <div className="habit-modal-header">
              <div className="habit-view-title">
                <div
                  className="habit-view-icon"
                  style={{
                    background: `${viewHabit.color}18`,
                  }}
                >
                  {viewHabit.icon}
                </div>

                <div>
                  <h2>
                    {viewHabit.name}
                  </h2>

                  <p>
                    {viewHabit.category} •{" "}
                    {viewHabit.frequency}
                  </p>
                </div>
              </div>

              <button
                className="habit-modal-close"
                onClick={() =>
                  setViewHabit(null)
                }
              >
                <X size={19} />
              </button>
            </div>

            {viewHabit.description && (
              <p className="habit-view-description">
                {viewHabit.description}
              </p>
            )}

            <div className="habit-view-stats">
              <div>
                <Flame size={18} />
                <span>Current Streak</span>
                <strong>
                  {getCurrentStreak(
                    viewHabit
                  )}{" "}
                  days
                </strong>
              </div>

              <div>
                <Trophy size={18} />
                <span>Best Streak</span>
                <strong>
                  {getBestStreak(
                    viewHabit
                  )}{" "}
                  days
                </strong>
              </div>

              <div>
                <Target size={18} />
                <span>Completion</span>
                <strong>
                  {getCompletionPercentage(
                    viewHabit
                  )}
                  %
                </strong>
              </div>
            </div>

            <div className="habit-view-details">
              <div>
                <span>
                  Start Date
                </span>

                <strong>
                  {formatDate(
                    viewHabit.startDate
                  )}
                </strong>
              </div>

              <div>
                <span>
                  Reminder
                </span>

                <strong>
                  {viewHabit.reminderTime ||
                    "Not set"}
                </strong>
              </div>

              <div>
                <span>
                  Completed Days
                </span>

                <strong>
                  {Array.isArray(
                    viewHabit.completedDates
                  )
                    ? viewHabit
                        .completedDates
                        .length
                    : 0}
                  days
                </strong>
              </div>
            </div>

            <div className="habit-view-actions">
              <button
                className="habit-cancel-btn"
                onClick={() =>
                  setViewHabit(null)
                }
              >
                Close
              </button>

              <button
                className="habit-primary-btn"
                onClick={() => {
                  setViewHabit(null);
                  openEditModal(
                    viewHabit
                  );
                }}
              >
                <Pencil size={16} />
                Edit Habit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================
          DELETE MODAL
      =================================================== */}

      {deleteHabit && (
        <div
          className="habit-modal-overlay"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setDeleteHabit(null);
            }
          }}
        >
          <div className="habit-delete-modal">
            <div className="habit-delete-icon">
              <Trash2 size={22} />
            </div>

            <h2>
              Delete this habit?
            </h2>

            <p>
              "{deleteHabit.name}" and its
              completion history will be
              permanently deleted.
            </p>

            <div className="habit-delete-actions">
              <button
                className="habit-cancel-btn"
                onClick={() =>
                  setDeleteHabit(null)
                }
              >
                Cancel
              </button>

              <button
                className="habit-delete-confirm"
                onClick={
                  confirmDelete
                }
              >
                <Trash2 size={16} />
                Delete Habit
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default HabitTracker;