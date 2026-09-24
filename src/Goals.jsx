import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  Target,
  Plus,
  Search,
  CheckCircle2,
  CircleDot,
  AlertCircle,
  CalendarDays,
  Clock3,
  Bell,
  X,
  ChevronLeft,
  ChevronRight,
  Save,
  Eye,
  Pencil,
  Trash2,
  Flame,
  RotateCcw,
} from "lucide-react";
import "./Goals.css";

/* =========================================================
   HELPERS
   ========================================================= */

const pad = (value) => String(value).padStart(2, "0");

const formatDate = (date) => {
  if (!date) return "";

  const d = new Date(date);

  if (Number.isNaN(d.getTime())) return "";

  return `${pad(d.getDate())}-${pad(
    d.getMonth() + 1
  )}-${d.getFullYear()}`;
};

const dateToInput = (date) => {
  if (!date) return "";

  const d = new Date(date);

  if (Number.isNaN(d.getTime())) return "";

  return `${d.getFullYear()}-${pad(
    d.getMonth() + 1
  )}-${pad(d.getDate())}`;
};

const makeLocalDate = (year, month, day) => {
  return new Date(year, month, day);
};

const todayStart = () => {
  const now = new Date();

  return new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );
};

const addDays = (date, amount) => {
  const d = new Date(date);

  d.setDate(d.getDate() + amount);

  return d;
};

const sameDate = (a, b) => {
  if (!a || !b) return false;

  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
};

const getInitialForm = () => {
  const today = todayStart();
  const defaultDeadline = addDays(today, 30);

  return {
    title: "",
    description: "",
    category: "Academic",
    priority: "Medium",
    startDate: dateToInput(today),
    deadline: dateToInput(defaultDeadline),
    targetValue: "",
    subject: "",
    reminderDate: "",
    reminderTime: "",
    dailyTarget: "1",
  };
};

const categoryOptions = [
  "Academic",
  "Coding",
  "Career",
  "Personal",
];

const priorityOptions = [
  "Low",
  "Medium",
  "High",
];

const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const weekDays = [
  "Sun",
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
];

/* =========================================================
   DATE PICKER
   ========================================================= */

const CalendarPicker = ({
  value,
  onChange,
  minDate,
  closePicker,
}) => {
  const selectedDate = value
    ? new Date(`${value}T00:00:00`)
    : null;

  const baseDate = selectedDate || todayStart();

  const [viewDate, setViewDate] = useState(
    new Date(
      baseDate.getFullYear(),
      baseDate.getMonth(),
      1
    )
  );

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const firstDay = new Date(
    year,
    month,
    1
  ).getDay();

  const daysInMonth = new Date(
    year,
    month + 1,
    0
  ).getDate();

  const cells = [];

  for (let i = 0; i < firstDay; i += 1) {
    cells.push(null);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(day);
  }

  const minimum = minDate
    ? new Date(`${minDate}T00:00:00`)
    : null;

  const handleSelect = (day) => {
    const date = makeLocalDate(
      year,
      month,
      day
    );

    if (
      minimum &&
      date <
        new Date(
          minimum.getFullYear(),
          minimum.getMonth(),
          minimum.getDate()
        )
    ) {
      return;
    }

    onChange(dateToInput(date));
    closePicker();
  };

  const goPrevious = () => {
    setViewDate(
      new Date(
        year,
        month - 1,
        1
      )
    );
  };

  const goNext = () => {
    setViewDate(
      new Date(
        year,
        month + 1,
        1
      )
    );
  };

  const goToday = () => {
    const today = todayStart();

    if (
      !minimum ||
      today >=
        new Date(
          minimum.getFullYear(),
          minimum.getMonth(),
          minimum.getDate()
        )
    ) {
      onChange(dateToInput(today));

      setViewDate(
        new Date(
          today.getFullYear(),
          today.getMonth(),
          1
        )
      );

      closePicker();
    }
  };

  return (
    <div
      className="goal-picker-popup goal-calendar-popup"
      onMouseDown={(event) =>
        event.stopPropagation()
      }
    >
      <div className="goal-calendar-header">
        <button
          type="button"
          onClick={goPrevious}
          aria-label="Previous month"
        >
          <ChevronLeft size={14} />
        </button>

        <strong>
          {monthNames[month]} {year}
        </strong>

        <button
          type="button"
          onClick={goNext}
          aria-label="Next month"
        >
          <ChevronRight size={14} />
        </button>
      </div>

      <div className="goal-weekdays">
        {weekDays.map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>

      <div className="goal-calendar-grid">
        {cells.map((day, index) => {
          if (!day) {
            return (
              <span
                className="goal-calendar-empty"
                key={`empty-${index}`}
              />
            );
          }

          const currentDate = makeLocalDate(
            year,
            month,
            day
          );

          const currentInput =
            dateToInput(currentDate);

          const isSelected =
            value === currentInput;

          const isToday = sameDate(
            currentDate,
            todayStart()
          );

          const isDisabled =
            minimum &&
            currentDate <
              new Date(
                minimum.getFullYear(),
                minimum.getMonth(),
                minimum.getDate()
              );

          return (
            <button
              type="button"
              key={day}
              className={[
                "goal-calendar-day",
                isSelected ? "selected" : "",
                isToday ? "today" : "",
                isDisabled ? "disabled" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              disabled={isDisabled}
              onClick={() =>
                handleSelect(day)
              }
            >
              {day}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        className="goal-calendar-today"
        onClick={goToday}
      >
        Today
      </button>
    </div>
  );
};

/* =========================================================
   TIME PICKER
   ========================================================= */

const TimePicker = ({
  value,
  onChange,
  closePicker,
}) => {
  const parseTime = () => {
    if (!value) {
      return {
        hour: 9,
        minute: 0,
        period: "AM",
      };
    }

    const parts = value.split(":");

    let hour = Number(parts[0]);
    const minute = Number(parts[1] || 0);

    const period =
      hour >= 12 ? "PM" : "AM";

    if (hour === 0) {
      hour = 12;
    } else if (hour > 12) {
      hour -= 12;
    }

    return {
      hour,
      minute,
      period,
    };
  };

  const parsed = parseTime();

  const [hour, setHour] = useState(
    parsed.hour
  );

  const [minute, setMinute] = useState(
    parsed.minute
  );

  const [period, setPeriod] = useState(
    parsed.period
  );

  const hours = Array.from(
    { length: 12 },
    (_, index) => index + 1
  );

  const minutes = Array.from(
    { length: 12 },
    (_, index) => index * 5
  );

  const saveTime = () => {
    let finalHour = hour;

    if (
      period === "AM" &&
      hour === 12
    ) {
      finalHour = 0;
    }

    if (
      period === "PM" &&
      hour !== 12
    ) {
      finalHour = hour + 12;
    }

    onChange(
      `${pad(finalHour)}:${pad(minute)}`
    );

    closePicker();
  };

  return (
    <div
      className="goal-picker-popup goal-time-popup"
      onMouseDown={(event) =>
        event.stopPropagation()
      }
    >
      <div className="goal-time-title">
        <Clock3 size={13} />
        <strong>Select time</strong>
      </div>

      <div className="goal-time-columns">
        <div className="goal-time-column">
          <span>Hour</span>

          <div className="goal-time-scroll">
            {hours.map((item) => (
              <button
                type="button"
                key={item}
                className={
                  hour === item
                    ? "selected"
                    : ""
                }
                onClick={() =>
                  setHour(item)
                }
              >
                {pad(item)}
              </button>
            ))}
          </div>
        </div>

        <div className="goal-time-colon">
          :
        </div>

        <div className="goal-time-column">
          <span>Min</span>

          <div className="goal-time-scroll">
            {minutes.map((item) => (
              <button
                type="button"
                key={item}
                className={
                  minute === item
                    ? "selected"
                    : ""
                }
                onClick={() =>
                  setMinute(item)
                }
              >
                {pad(item)}
              </button>
            ))}
          </div>
        </div>

        <div className="goal-time-period">
          <span>Period</span>

          <button
            type="button"
            className={
              period === "AM"
                ? "selected"
                : ""
            }
            onClick={() =>
              setPeriod("AM")
            }
          >
            AM
          </button>

          <button
            type="button"
            className={
              period === "PM"
                ? "selected"
                : ""
            }
            onClick={() =>
              setPeriod("PM")
            }
          >
            PM
          </button>
        </div>
      </div>

      <button
        type="button"
        className="goal-time-done"
        onClick={saveTime}
      >
        Done
      </button>
    </div>
  );
};

/* =========================================================
   FIELD PICKER
   ========================================================= */

const DateField = ({
  label,
  value,
  onChange,
  minDate,
  openPicker,
  setOpenPicker,
  pickerId,
}) => {
  const isOpen = openPicker === pickerId;

  return (
    <div className="goal-form-group">
      <label>{label}</label>

      <div className="goal-picker-field">
        <button
          type="button"
          className={[
            "goal-picker-trigger",
            value ? "has-value" : "",
          ]
            .filter(Boolean)
            .join(" ")}
          onClick={() =>
            setOpenPicker(
              isOpen ? null : pickerId
            )
          }
        >
          <CalendarDays size={14} />

          <span>
            {value
              ? formatDate(value)
              : "Select date"}
          </span>
        </button>

        {isOpen && (
          <CalendarPicker
            value={value}
            minDate={minDate}
            onChange={onChange}
            closePicker={() =>
              setOpenPicker(null)
            }
          />
        )}
      </div>
    </div>
  );
};

const TimeField = ({
  label,
  value,
  onChange,
  openPicker,
  setOpenPicker,
  pickerId,
}) => {
  const isOpen = openPicker === pickerId;

  const displayValue = value
    ? (() => {
        const [h, m] =
          value.split(":").map(Number);

        const period =
          h >= 12 ? "PM" : "AM";

        let hour = h % 12;

        if (hour === 0) {
          hour = 12;
        }

        return `${pad(hour)}:${pad(
          m
        )} ${period}`;
      })()
    : "Select time";

  return (
    <div className="goal-form-group">
      <label>{label}</label>

      <div className="goal-picker-field">
        <button
          type="button"
          className={[
            "goal-picker-trigger",
            value ? "has-value" : "",
          ]
            .filter(Boolean)
            .join(" ")}
          onClick={() =>
            setOpenPicker(
              isOpen ? null : pickerId
            )
          }
        >
          <Clock3 size={14} />

          <span>{displayValue}</span>
        </button>

        {isOpen && (
          <TimePicker
            value={value}
            onChange={onChange}
            closePicker={() =>
              setOpenPicker(null)
            }
          />
        )}
      </div>
    </div>
  );
};

/* =========================================================
   MAIN COMPONENT
   ========================================================= */

const Goals = ({
  setNotifications,
  subjects = [],
}) => {
  const [search, setSearch] = useState("");
  const [goals, setGoals] = useState([]);

  const [showGoalModal, setShowGoalModal] =
    useState(false);

  const [showViewModal, setShowViewModal] =
    useState(false);

  const [editingGoal, setEditingGoal] =
    useState(null);

  const [selectedGoal, setSelectedGoal] =
    useState(null);

  const [goalForm, setGoalForm] =
    useState(getInitialForm());

  const [openPicker, setOpenPicker] =
    useState(null);

  const [notice, setNotice] =
    useState(null);

  const [categoryFilter, setCategoryFilter] =
    useState("All Categories");

  const [statusFilter, setStatusFilter] =
    useState("All Status");

  const [sortBy, setSortBy] =
    useState("Newest");

  /* =======================================================
     BODY SCROLL LOCK
     ======================================================= */

  useEffect(() => {
    const modalOpen =
      showGoalModal || showViewModal;

    if (modalOpen) {
      document.body.classList.add(
        "goal-modal-open"
      );
    } else {
      document.body.classList.remove(
        "goal-modal-open"
      );
    }

    return () => {
      document.body.classList.remove(
        "goal-modal-open"
      );
    };
  }, [
    showGoalModal,
    showViewModal,
  ]);

  /* =======================================================
     NOTICE
     ======================================================= */

  useEffect(() => {
    if (!notice) return undefined;

    const timer = setTimeout(() => {
      setNotice(null);
    }, 3200);

    return () => clearTimeout(timer);
  }, [notice]);

  const showNotice = (
    type,
    message
  ) => {
    setNotice({
      type,
      message,
    });
  };

  /* =======================================================
     NOTIFICATION
     ======================================================= */

  const addNotification = (
    title,
    message
  ) => {
    if (!setNotifications) return;

    setNotifications(
      (previous) => [
        {
          id: `goal-${Date.now()}`,
          type: "goal",
          title,
          message,
          read: false,
          createdAt:
            new Date().toISOString(),
          time:
            new Date().toISOString(),
        },
        ...(Array.isArray(previous)
          ? previous
          : []),
      ]
    );
  };

  /* =======================================================
     OPEN ADD
     ======================================================= */

  const openAddGoal = () => {
    setEditingGoal(null);
    setGoalForm(getInitialForm());
    setOpenPicker(null);
    setShowGoalModal(true);
  };

  /* =======================================================
     OPEN EDIT
     ======================================================= */

  const openEditGoal = (goal) => {
    setEditingGoal(goal);

    setGoalForm({
      title: goal.title || "",
      description:
        goal.description || "",
      category:
        goal.category || "Academic",
      priority:
        goal.priority || "Medium",
      startDate:
        goal.startDate || "",
      deadline:
        goal.deadline || "",
      targetValue:
        goal.targetValue || "",
      subject:
        goal.subject || "",
      reminderDate:
        goal.reminderDate || "",
      reminderTime:
        goal.reminderTime || "",
      dailyTarget:
        String(goal.dailyTarget || 1),
    });

    setOpenPicker(null);
    setShowGoalModal(true);
  };

  /* =======================================================
     CLOSE MODALS
     ======================================================= */

  const closeGoalModal = () => {
    setShowGoalModal(false);
    setEditingGoal(null);
    setOpenPicker(null);
  };

  const closeViewModal = () => {
    setShowViewModal(false);
    setSelectedGoal(null);
  };

  /* =======================================================
     FORM CHANGE
     ======================================================= */

  const updateForm = (
    key,
    value
  ) => {
    setGoalForm(
      (previous) => ({
        ...previous,
        [key]: value,
      })
    );
  };

  /* =======================================================
     SAVE GOAL
     ======================================================= */

  const handleSaveGoal = (
    event
  ) => {
    event.preventDefault();

    if (!goalForm.title.trim()) {
      showNotice(
        "error",
        "Please enter a goal title."
      );

      return;
    }

    if (
      goalForm.startDate &&
      goalForm.deadline &&
      new Date(
        `${goalForm.deadline}T00:00:00`
      ) <
        new Date(
          `${goalForm.startDate}T00:00:00`
        )
    ) {
      showNotice(
        "error",
        "Deadline cannot be before the start date."
      );

      return;
    }

    const target =
      Number(goalForm.targetValue) || 0;

    const dailyTarget =
      Math.max(
        1,
        Number(
          goalForm.dailyTarget
        ) || 1
      );

    const existingProgress =
      editingGoal?.progress || 0;

    const newGoal = {
      id:
        editingGoal?.id ||
        `goal-${Date.now()}`,

      title:
        goalForm.title.trim(),

      description:
        goalForm.description.trim(),

      category:
        goalForm.category,

      priority:
        goalForm.priority,

      startDate:
        goalForm.startDate,

      deadline:
        goalForm.deadline,

      targetValue:
        target,

      subject:
        goalForm.subject,

      reminderDate:
        goalForm.reminderDate,

      reminderTime:
        goalForm.reminderTime,

      dailyTarget,

      progress:
        existingProgress,

      todayCompleted:
        editingGoal?.todayCompleted || 0,

      createdAt:
        editingGoal?.createdAt ||
        new Date().toISOString(),

      updatedAt:
        new Date().toISOString(),
    };

    if (editingGoal) {
      setGoals(
        (previous) =>
          previous.map((goal) =>
            goal.id === editingGoal.id
              ? newGoal
              : goal
          )
      );

      showNotice(
        "success",
        "Goal updated successfully."
      );

      addNotification(
        "Goal updated",
        `"${newGoal.title}" was updated.`
      );
    } else {
      setGoals(
        (previous) => [
          newGoal,
          ...previous,
        ]
      );

      showNotice(
        "success",
        "Goal created successfully."
      );

      addNotification(
        "New goal created",
        `"${newGoal.title}" has been added.`
      );
    }

    closeGoalModal();
  };

  /* =======================================================
     DELETE
     ======================================================= */

  const deleteGoal = (goal) => {
    const confirmed =
      window.confirm(
        `Delete "${goal.title}"?`
      );

    if (!confirmed) return;

    setGoals(
      (previous) =>
        previous.filter(
          (item) =>
            item.id !== goal.id
        )
    );

    showNotice(
      "success",
      "Goal deleted."
    );

    addNotification(
      "Goal deleted",
      `"${goal.title}" was deleted.`
    );
  };

  /* =======================================================
     COMPLETE TODAY
     ======================================================= */

  const completeToday = (goal) => {
    const dailyTarget =
      Math.max(
        1,
        Number(
          goal.dailyTarget
        ) || 1
      );

    const newTodayCompleted =
      Math.min(
        dailyTarget,
        (goal.todayCompleted || 0) +
          1
      );

    let newProgress =
      Number(goal.progress) || 0;

    if (goal.targetValue > 0) {
      newProgress = Math.min(
        100,
        Math.round(
          (newTodayCompleted /
            dailyTarget) *
            100
        )
      );
    } else {
      newProgress = Math.min(
        100,
        newProgress + 10
      );
    }

    setGoals(
      (previous) =>
        previous.map((item) =>
          item.id === goal.id
            ? {
                ...item,
                todayCompleted:
                  newTodayCompleted,
                progress:
                  newProgress,
                updatedAt:
                  new Date().toISOString(),
              }
            : item
        )
    );

    showNotice(
      "success",
      "Today's goal progress updated."
    );

    addNotification(
      "Goal progress",
      `Today: ${newTodayCompleted}/${dailyTarget} completed for "${goal.title}".`
    );
  };

  /* =======================================================
     RESET TODAY
     ======================================================= */

  const resetToday = (goal) => {
    setGoals(
      (previous) =>
        previous.map((item) =>
          item.id === goal.id
            ? {
                ...item,
                todayCompleted: 0,
              }
            : item
        )
    );

    showNotice(
      "success",
      "Today's count reset."
    );
  };

  /* =======================================================
     STATUS
     ======================================================= */

  const getStatus = (goal) => {
    if (
      Number(goal.progress) >= 100
    ) {
      return "Completed";
    }

    if (
      goal.deadline &&
      new Date(
        `${goal.deadline}T23:59:59`
      ) < new Date()
    ) {
      return "Overdue";
    }

    return "Active";
  };

  /* =======================================================
     FILTER + SORT
     ======================================================= */

  const filteredGoals = useMemo(() => {
    let result = [...goals];

    const query =
      search.trim().toLowerCase();

    if (query) {
      result = result.filter(
        (goal) =>
          goal.title
            .toLowerCase()
            .includes(query) ||
          goal.description
            .toLowerCase()
            .includes(query) ||
          goal.category
            .toLowerCase()
            .includes(query) ||
          goal.subject
            .toLowerCase()
            .includes(query)
      );
    }

    if (
      categoryFilter !==
      "All Categories"
    ) {
      result = result.filter(
        (goal) =>
          goal.category ===
          categoryFilter
      );
    }

    if (
      statusFilter !==
      "All Status"
    ) {
      result = result.filter(
        (goal) =>
          getStatus(goal) ===
          statusFilter
      );
    }

    if (sortBy === "Newest") {
      result.sort(
        (a, b) =>
          new Date(b.createdAt) -
          new Date(a.createdAt)
      );
    }

    if (sortBy === "Deadline") {
      result.sort(
        (a, b) =>
          new Date(
            a.deadline || "2999-12-31"
          ) -
          new Date(
            b.deadline ||
              "2999-12-31"
          )
      );
    }

    if (sortBy === "Progress") {
      result.sort(
        (a, b) =>
          Number(b.progress) -
          Number(a.progress)
      );
    }

    if (sortBy === "A-Z") {
      result.sort(
        (a, b) =>
          a.title.localeCompare(
            b.title
          )
      );
    }

    return result;
  }, [
    goals,
    search,
    categoryFilter,
    statusFilter,
    sortBy,
  ]);

  /* =======================================================
     SUMMARY
     ======================================================= */

  const totalGoals =
    goals.length;

  const activeGoals =
    goals.filter(
      (goal) =>
        getStatus(goal) ===
        "Active"
    ).length;

  const completedGoals =
    goals.filter(
      (goal) =>
        getStatus(goal) ===
        "Completed"
    ).length;

  const overdueGoals =
    goals.filter(
      (goal) =>
        getStatus(goal) ===
        "Overdue"
    ).length;

  /* =======================================================
     SUBJECT OPTIONS
     ======================================================= */

  const subjectOptions =
    Array.isArray(subjects)
      ? subjects
      : [];

  /* =======================================================
     ADD / EDIT GOAL MODAL
     ======================================================= */

  const goalModal = showGoalModal
    ? createPortal(
        <div
          className="goal-modal-overlay"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeGoalModal();
            }
          }}
        >
          <div
            className="goal-modal"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <form
              onSubmit={
                handleSaveGoal
              }
            >
              {/* HEADER */}
              <div className="goal-modal-header">
                <div className="goal-modal-title">
                  <div className="goal-modal-icon">
                    <Target size={18} />
                  </div>

                  <div>
                    <h2>
                      {editingGoal
                        ? "Edit Goal"
                        : "Add Goal"}
                    </h2>

                    <p>
                      Set a goal and build
                      your daily plan.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  className="goal-modal-close"
                  onClick={
                    closeGoalModal
                  }
                  aria-label="Close"
                >
                  <X size={17} />
                </button>
              </div>

              {/* BODY */}
              <div className="goal-modal-body">
                {/* TITLE */}
                <div className="goal-form-group full">
                  <label>
                    Goal Title{" "}
                    <span>*</span>
                  </label>

                  <input
                    type="text"
                    value={
                      goalForm.title
                    }
                    onChange={(event) =>
                      updateForm(
                        "title",
                        event.target.value
                      )
                    }
                    placeholder="e.g. Complete Java DSA in 1 month"
                    autoFocus
                  />
                </div>

                {/* DESCRIPTION */}
                <div className="goal-form-group full">
                  <label>
                    Description
                  </label>

                  <textarea
                    value={
                      goalForm.description
                    }
                    onChange={(event) =>
                      updateForm(
                        "description",
                        event.target.value
                      )
                    }
                    placeholder="What do you want to achieve?"
                  />
                </div>

                {/* CATEGORY */}
                <div className="goal-form-group">
                  <label>
                    Category
                  </label>

                  <select
                    value={
                      goalForm.category
                    }
                    onChange={(event) =>
                      updateForm(
                        "category",
                        event.target.value
                      )
                    }
                  >
                    {categoryOptions.map(
                      (item) => (
                        <option
                          key={item}
                          value={item}
                        >
                          {item}
                        </option>
                      )
                    )}
                  </select>
                </div>

                {/* PRIORITY */}
                <div className="goal-form-group">
                  <label>
                    Priority
                  </label>

                  <select
                    value={
                      goalForm.priority
                    }
                    onChange={(event) =>
                      updateForm(
                        "priority",
                        event.target.value
                      )
                    }
                  >
                    {priorityOptions.map(
                      (item) => (
                        <option
                          key={item}
                          value={item}
                        >
                          {item}
                        </option>
                      )
                    )}
                  </select>
                </div>

                {/* START DATE */}
                <DateField
                  label="Start Date"
                  value={
                    goalForm.startDate
                  }
                  onChange={(value) =>
                    updateForm(
                      "startDate",
                      value
                    )
                  }
                  openPicker={
                    openPicker
                  }
                  setOpenPicker={
                    setOpenPicker
                  }
                  pickerId="start-date"
                />

                {/* DEADLINE */}
                <DateField
                  label="Deadline"
                  value={
                    goalForm.deadline
                  }
                  minDate={
                    goalForm.startDate
                  }
                  onChange={(value) =>
                    updateForm(
                      "deadline",
                      value
                    )
                  }
                  openPicker={
                    openPicker
                  }
                  setOpenPicker={
                    setOpenPicker
                  }
                  pickerId="deadline"
                />

                {/* TARGET VALUE */}
                <div className="goal-form-group">
                  <label>
                    Target Value
                  </label>

                  <input
                    type="number"
                    min="0"
                    value={
                      goalForm.targetValue
                    }
                    onChange={(event) =>
                      updateForm(
                        "targetValue",
                        event.target.value
                      )
                    }
                    placeholder="e.g. 100 problems"
                  />
                </div>

                {/* DAILY TARGET */}
                <div className="goal-form-group">
                  <label>
                    Daily Target
                  </label>

                  <input
                    type="number"
                    min="1"
                    value={
                      goalForm.dailyTarget
                    }
                    onChange={(event) =>
                      updateForm(
                        "dailyTarget",
                        event.target.value
                      )
                    }
                    placeholder="e.g. 5"
                  />
                </div>

                {/* =================================================
                    SUBJECT
                    Connected to Subjects page through subjects prop.
                    User can type or select a subject.
                   ================================================= */}
                <div className="goal-form-group">
                  <label>
                    Subject
                  </label>

                  <input
                    type="text"
                    list="goal-subject-options"
                    value={
                      goalForm.subject
                    }
                    onChange={(event) =>
                      updateForm(
                        "subject",
                        event.target.value
                      )
                    }
                    placeholder="Type or select subject"
                    autoComplete="off"
                  />

                  <datalist id="goal-subject-options">
                    {subjectOptions.map(
                      (
                        subject,
                        index
                      ) => {
                        const name =
                          typeof subject ===
                          "string"
                            ? subject
                            : subject?.name ||
                              subject?.title ||
                              "";

                        if (!name) {
                          return null;
                        }

                        return (
                          <option
                            key={
                              subject?.id ||
                              `${name}-${index}`
                            }
                            value={name}
                          />
                        );
                      }
                    )}
                  </datalist>
                </div>

                {/* REMINDER DATE */}
                <DateField
                  label="Reminder Date"
                  value={
                    goalForm.reminderDate
                  }
                  minDate={
                    goalForm.startDate ||
                    dateToInput(
                      todayStart()
                    )
                  }
                  onChange={(value) =>
                    updateForm(
                      "reminderDate",
                      value
                    )
                  }
                  openPicker={
                    openPicker
                  }
                  setOpenPicker={
                    setOpenPicker
                  }
                  pickerId="reminder-date"
                />

                {/* REMINDER TIME */}
                <TimeField
                  label="Reminder Time"
                  value={
                    goalForm.reminderTime
                  }
                  onChange={(value) =>
                    updateForm(
                      "reminderTime",
                      value
                    )
                  }
                  openPicker={
                    openPicker
                  }
                  setOpenPicker={
                    setOpenPicker
                  }
                  pickerId="reminder-time"
                />

                {/* REMINDER INFO */}
                <div className="goal-reminder-info full">
                  <Bell size={14} />

                  <span>
                    {goalForm.reminderDate &&
                    goalForm.reminderTime
                      ? `Reminder set for ${formatDate(
                          goalForm.reminderDate
                        )} at ${(() => {
                          const [
                            h,
                            m,
                          ] =
                            goalForm.reminderTime
                              .split(":")
                              .map(Number);

                          const period =
                            h >= 12
                              ? "PM"
                              : "AM";

                          let hour =
                            h % 12;

                          if (hour === 0) {
                            hour = 12;
                          }

                          return `${pad(
                            hour
                          )}:${pad(
                            m
                          )} ${period}`;
                        })()}`
                      : "Optional: select a date and time for your goal reminder."}
                  </span>
                </div>
              </div>

              {/* FOOTER */}
              <div className="goal-modal-footer">
                <button
                  type="button"
                  className="goal-cancel-button"
                  onClick={
                    closeGoalModal
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="goals-primary goal-save-button"
                >
                  <Save size={15} />

                  {editingGoal
                    ? "Update Goal"
                    : "Save Goal"}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )
    : null;

  /* =======================================================
     VIEW MODAL
     ======================================================= */

  const viewModal =
    showViewModal &&
    selectedGoal
      ? createPortal(
          <div
            className="goal-modal-overlay"
            onMouseDown={(event) => {
              if (
                event.target ===
                event.currentTarget
              ) {
                closeViewModal();
              }
            }}
          >
            <div
              className="goal-modal goal-view-modal"
              onMouseDown={(event) =>
                event.stopPropagation()
              }
            >
              <div className="goal-modal-header">
                <div className="goal-modal-title">
                  <div className="goal-modal-icon">
                    <Target size={18} />
                  </div>

                  <div>
                    <h2>
                      {selectedGoal.title}
                    </h2>

                    <p>
                      Goal progress and
                      daily activity
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  className="goal-modal-close"
                  onClick={
                    closeViewModal
                  }
                >
                  <X size={17} />
                </button>
              </div>

              <div className="goal-view-body">
                <div className="goal-view-progress">
                  <div className="goal-view-progress-top">
                    <span>
                      Overall Progress
                    </span>

                    <strong>
                      {
                        selectedGoal.progress
                      }
                      %
                    </strong>
                  </div>

                  <div className="goal-progress-track large">
                    <div
                      className="goal-progress-fill"
                      style={{
                        width: `${Math.min(
                          100,
                          Number(
                            selectedGoal.progress
                          ) || 0
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="goal-view-grid">
                  <div>
                    <span>
                      Category
                    </span>

                    <strong>
                      {
                        selectedGoal.category
                      }
                    </strong>
                  </div>

                  <div>
                    <span>
                      Priority
                    </span>

                    <strong>
                      {
                        selectedGoal.priority
                      }
                    </strong>
                  </div>

                  <div>
                    <span>
                      Start Date
                    </span>

                    <strong>
                      {formatDate(
                        selectedGoal.startDate
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Deadline
                    </span>

                    <strong>
                      {formatDate(
                        selectedGoal.deadline
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Daily Target
                    </span>

                    <strong>
                      {
                        selectedGoal.dailyTarget
                      }
                    </strong>
                  </div>

                  <div>
                    <span>
                      Today
                    </span>

                    <strong>
                      {
                        selectedGoal.todayCompleted
                      }
                      /
                      {
                        selectedGoal.dailyTarget
                      }
                    </strong>
                  </div>
                </div>

                {selectedGoal.description && (
                  <div className="goal-view-description">
                    <span>
                      Description
                    </span>

                    <p>
                      {
                        selectedGoal.description
                      }
                    </p>
                  </div>
                )}

                {selectedGoal.reminderDate &&
                  selectedGoal.reminderTime && (
                    <div className="goal-view-reminder">
                      <Bell size={15} />

                      <div>
                        <strong>
                          Reminder
                        </strong>

                        <span>
                          {formatDate(
                            selectedGoal.reminderDate
                          )}{" "}
                          at{" "}
                          {(() => {
                            const [
                              h,
                              m,
                            ] =
                              selectedGoal.reminderTime
                                .split(":")
                                .map(Number);

                            const period =
                              h >= 12
                                ? "PM"
                                : "AM";

                            let hour =
                              h % 12;

                            if (hour === 0) {
                              hour = 12;
                            }

                            return `${pad(
                              hour
                            )}:${pad(
                              m
                            )} ${period}`;
                          })()}
                        </span>
                      </div>
                    </div>
                  )}
              </div>

              <div className="goal-modal-footer">
                <button
                  type="button"
                  className="goal-cancel-button"
                  onClick={
                    closeViewModal
                  }
                >
                  Close
                </button>

                <button
                  type="button"
                  className="goals-primary"
                  onClick={() => {
                    closeViewModal();

                    openEditGoal(
                      selectedGoal
                    );
                  }}
                >
                  <Pencil size={14} />
                  Edit Goal
                </button>
              </div>
            </div>
          </div>,
          document.body
        )
      : null;

  /* =======================================================
     RENDER
     ======================================================= */

  return (
    <>
      <section className="goals-page">
        {/* NOTICE */}
        {notice && (
          <div
            className={`goals-toast ${notice.type}`}
            role="status"
          >
            <span className="goals-toast-icon">
              {notice.type ===
              "success" ? (
                <CheckCircle2 size={16} />
              ) : (
                <AlertCircle size={16} />
              )}
            </span>

            <span>
              {notice.message}
            </span>

            <button
              type="button"
              onClick={() =>
                setNotice(null)
              }
              aria-label="Close notification"
            >
              <X size={13} />
            </button>
          </div>
        )}

        {/* HEADER */}
        <header className="goals-header">
          <div className="goals-heading">
            <div className="goals-heading-icon">
              <Target size={30} />
            </div>

            <div>
              <h1>Goals</h1>

              <p>
                Set goals. Track progress.
                Achieve more.
              </p>
            </div>
          </div>

          <button
            type="button"
            className="goals-primary"
            onClick={openAddGoal}
          >
            <Plus size={17} />
            Add Goal
          </button>
        </header>

        {/* SUMMARY */}
        <section className="goals-summary">
          <div className="goal-summary-card blue">
            <div className="goal-summary-icon">
              <Target size={20} />
            </div>

            <div>
              <strong>
                {totalGoals}
              </strong>

              <span>
                Total Goals
              </span>

              <small>
                All your goals
              </small>
            </div>
          </div>

          <div className="goal-summary-card green">
            <div className="goal-summary-icon">
              <CircleDot size={20} />
            </div>

            <div>
              <strong>
                {activeGoals}
              </strong>

              <span>
                Active Goals
              </span>

              <small>
                Keep going!
              </small>
            </div>
          </div>

          <div className="goal-summary-card purple">
            <div className="goal-summary-icon">
              <CheckCircle2 size={20} />
            </div>

            <div>
              <strong>
                {completedGoals}
              </strong>

              <span>
                Completed
              </span>

              <small>
                Great progress!
              </small>
            </div>
          </div>

          <div className="goal-summary-card red">
            <div className="goal-summary-icon">
              <AlertCircle size={20} />
            </div>

            <div>
              <strong>
                {overdueGoals}
              </strong>

              <span>
                Overdue
              </span>

              <small>
                Needs attention
              </small>
            </div>
          </div>
        </section>

        {/* TOOLBAR */}
        <section className="goals-toolbar">
          <label className="goals-search">
            <Search size={16} />

            <input
              type="text"
              placeholder="Search goals..."
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
            />
          </label>

          <select
            className="goals-filter"
            value={categoryFilter}
            onChange={(event) =>
              setCategoryFilter(
                event.target.value
              )
            }
          >
            <option>
              All Categories
            </option>

            {categoryOptions.map(
              (item) => (
                <option
                  key={item}
                  value={item}
                >
                  {item}
                </option>
              )
            )}
          </select>

          <select
            className="goals-filter"
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

            <option>Active</option>
            <option>Completed</option>
            <option>Overdue</option>
          </select>

          <select
            className="goals-filter"
            value={sortBy}
            onChange={(event) =>
              setSortBy(
                event.target.value
              )
            }
          >
            <option value="Newest">
              Newest
            </option>

            <option value="Deadline">
              Deadline
            </option>

            <option value="Progress">
              Progress
            </option>

            <option value="A-Z">
              A-Z
            </option>
          </select>
        </section>

        {/* CONTENT */}
        <section className="goals-content">
          <div className="goals-section-title">
            <div>
              <h2>My Goals</h2>

              <p>
                Track your progress and
                stay consistent.
              </p>
            </div>

            {goals.length > 0 && (
              <span className="goal-count">
                {filteredGoals.length}{" "}
                goal
                {filteredGoals.length !==
                1
                  ? "s"
                  : ""}
              </span>
            )}
          </div>

          {filteredGoals.length ===
          0 ? (
            <div className="goals-empty">
              <div className="goals-empty-icon">
                <Target size={32} />
              </div>

              <h3>
                {goals.length === 0
                  ? "No goals yet"
                  : "No matching goals"}
              </h3>

              <p>
                {goals.length === 0
                  ? "Create your first goal and start tracking your progress."
                  : "Try changing your search or filters."}
              </p>

              {goals.length === 0 && (
                <button
                  type="button"
                  className="goals-primary"
                  onClick={
                    openAddGoal
                  }
                >
                  <Plus size={16} />
                  Add Goal
                </button>
              )}
            </div>
          ) : (
            <div className="goals-list">
              {filteredGoals.map(
                (goal) => {
                  const status =
                    getStatus(goal);

                  const progress =
                    Math.min(
                      100,
                      Number(
                        goal.progress
                      ) || 0
                    );

                  const dailyTarget =
                    Math.max(
                      1,
                      Number(
                        goal.dailyTarget
                      ) || 1
                    );

                  const todayCompleted =
                    Math.min(
                      dailyTarget,
                      Number(
                        goal.todayCompleted
                      ) || 0
                    );

                  return (
                    <article
                      className="goal-card"
                      key={goal.id}
                    >
                      <div className="goal-card-top">
                        <div className="goal-card-title">
                          <div className="goal-card-icon">
                            <Target size={18} />
                          </div>

                          <div>
                            <h3>
                              {goal.title}
                            </h3>

                            <p>
                              {goal.description ||
                                "Keep working consistently toward your goal."}
                            </p>
                          </div>
                        </div>

                        <div className="goal-card-actions">
                          <button
                            type="button"
                            title="View"
                            onClick={() => {
                              setSelectedGoal(
                                goal
                              );

                              setShowViewModal(
                                true
                              );
                            }}
                          >
                            <Eye size={14} />
                          </button>

                          <button
                            type="button"
                            title="Edit"
                            onClick={() =>
                              openEditGoal(
                                goal
                              )
                            }
                          >
                            <Pencil size={14} />
                          </button>

                          <button
                            type="button"
                            title="Delete"
                            onClick={() =>
                              deleteGoal(
                                goal
                              )
                            }
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      <div className="goal-card-meta">
                        <span className="goal-badge">
                          {goal.category}
                        </span>

                        <span
                          className={`goal-status ${status.toLowerCase()}`}
                        >
                          {status}
                        </span>

                        <span className="goal-priority">
                          {goal.priority}
                        </span>

                        {goal.deadline && (
                          <span className="goal-deadline">
                            <CalendarDays
                              size={11}
                            />
                            {formatDate(
                              goal.deadline
                            )}
                          </span>
                        )}
                      </div>

                      <div className="goal-progress-header">
                        <span>
                          Overall progress
                        </span>

                        <strong>
                          {progress}%
                        </strong>
                      </div>

                      <div className="goal-progress-track">
                        <div
                          className="goal-progress-fill"
                          style={{
                            width: `${progress}%`,
                          }}
                        />
                      </div>

                      {/* TODAY */}
                      <div className="goal-today-box">
                        <div className="goal-today-left">
                          <div className="goal-today-icon">
                            <Flame size={15} />
                          </div>

                          <div>
                            <strong>
                              Today
                            </strong>

                            <span>
                              {
                                todayCompleted
                              }
                              /
                              {
                                dailyTarget
                              }{" "}
                              completed
                            </span>
                          </div>
                        </div>

                        <div className="goal-today-actions">
                          <button
                            type="button"
                            className="goal-reset-today"
                            title="Reset today's count"
                            onClick={() =>
                              resetToday(
                                goal
                              )
                            }
                          >
                            <RotateCcw
                              size={12}
                            />
                          </button>

                          <button
                            type="button"
                            className="goal-complete-today"
                            onClick={() =>
                              completeToday(
                                goal
                              )
                            }
                            disabled={
                              todayCompleted >=
                              dailyTarget
                            }
                          >
                            <CheckCircle2
                              size={13}
                            />

                            {todayCompleted >=
                            dailyTarget
                              ? "Done"
                              : "+1 Today"}
                          </button>
                        </div>
                      </div>

                      {/* FOOTER */}
                      <div className="goal-card-footer">
                        <span>
                          {goal.subject
                            ? goal.subject
                            : "Personal goal"}
                        </span>

                        {goal.reminderDate &&
                          goal.reminderTime && (
                            <span>
                              <Bell size={11} />
                              Reminder
                            </span>
                          )}
                      </div>
                    </article>
                  );
                }
              )}
            </div>
          )}
        </section>
      </section>

      {goalModal}
      {viewModal}
    </>
  );
};

export default Goals;