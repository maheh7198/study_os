import { useMemo, useState } from "react";
import "./Analytics.css";

import {
  BarChart3,
  BookOpen,
  CheckSquare,
  Clock3,
  Flame,
  Target,
  Timer,
  TrendingUp,
  CalendarDays,
  Brain,
  Sparkles,
  ArrowUpRight,
  Activity,
  Award,
  AlertCircle,
  CircleCheck,
  CircleX,
  Zap,
  Trophy,
  ChevronRight,
  MessageSquare,
  Send,
  Lightbulb,
  RefreshCw,
  CalendarRange,
  Gauge,
  Hourglass,
} from "lucide-react";

const STORAGE_KEYS = {
  subjects: "studyos-subjects",
  tasks: "studyos-tasks",
  pomodoro: "studyos-pomodoro-sessions",
  habits: "studyos-habits",
  studyPlanSessions: "studyos-studyplan-sessions",
};

function readStorage(key, fallback = []) {
  try {
    const value = localStorage.getItem(key);

    if (!value) return fallback;

    const parsed = JSON.parse(value);

    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function getDateValue(value) {
  if (!value) return null;

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}

function isWithinDays(value, days) {
  const date = getDateValue(value);

  if (!date) return false;

  const now = new Date();
  const start = new Date();

  start.setHours(0, 0, 0, 0);
  start.setDate(now.getDate() - (days - 1));

  return date >= start && date <= now;
}

function formatMinutes(minutes) {
  const safeMinutes = Math.max(
    0,
    Math.round(Number(minutes) || 0)
  );

  const hours = Math.floor(safeMinutes / 60);
  const mins = safeMinutes % 60;

  if (hours === 0) return `${mins}m`;

  if (mins === 0) return `${hours}h`;

  return `${hours}h ${mins}m`;
}

function getTaskCompleted(task) {
  return (
    task?.completed === true ||
    task?.status === "completed" ||
    task?.status === "done"
  );
}

function getPomodoroMinutes(session) {
  if (typeof session?.duration === "number") {
    return session.duration;
  }

  if (typeof session?.durationMinutes === "number") {
    return session.durationMinutes;
  }

  return 0;
}

function getSessionDate(session) {
  return (
    session?.date ||
    session?.startedAt ||
    session?.startTime ||
    session?.createdAt
  );
}

function getTaskDate(task) {
  return (
    task?.completedAt ||
    task?.updatedAt ||
    task?.createdAt ||
    task?.dueDate
  );
}

function getSubjectName(subject) {
  return subject?.name || subject?.title || "Untitled Subject";
}

function EmptyAnalytics({
  icon: Icon = BarChart3,
  title,
  description,
}) {
  return (
    <div className="analytics-empty-block">
      <div className="analytics-empty-icon">
        <Icon size={25} />
      </div>

      <div>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </div>
  );
}

function ProgressBar({ value = 0 }) {
  const safeValue = Math.min(
    100,
    Math.max(0, Number(value) || 0)
  );

  return (
    <div className="analytics-progress-track">
      <div
        className="analytics-progress-fill"
        style={{ width: `${safeValue}%` }}
      />
    </div>
  );
}

function StatMini({
  label,
  value,
  icon: Icon,
  type = "default",
}) {
  return (
    <div
      className={`analytics-mini-stat analytics-mini-${type}`}
    >
      <div className="analytics-mini-icon">
        <Icon size={17} />
      </div>

      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

function getActivityIcon(type) {
  if (type === "task") return CheckSquare;

  if (type === "pomodoro") return Timer;

  return Activity;
}

export default function Analytics() {
  const [range, setRange] = useState("7");
  const [aiPrompt, setAiPrompt] = useState("");

  const analytics = useMemo(() => {
    const subjects = readStorage(STORAGE_KEYS.subjects);
    const tasks = readStorage(STORAGE_KEYS.tasks);
    const pomodoroSessions = readStorage(
      STORAGE_KEYS.pomodoro
    );
    const habits = readStorage(STORAGE_KEYS.habits);
    const studyPlanSessions = readStorage(
      STORAGE_KEYS.studyPlanSessions
    );

    const days = Number(range);

    /* =========================================
       POMODORO
    ========================================= */

    const recentPomodoro = pomodoroSessions.filter(
      (session) =>
        isWithinDays(
          getSessionDate(session),
          days
        )
    );

    const pomodoroFocusMinutes =
      recentPomodoro.reduce(
        (total, session) =>
          total + getPomodoroMinutes(session),
        0
      );

    const interruptedPomodoros =
      recentPomodoro.filter(
        (session) =>
          session?.interrupted === true ||
          session?.completed === false
      ).length;

    const longestPomodoro =
      recentPomodoro.reduce(
        (longest, session) =>
          Math.max(
            longest,
            getPomodoroMinutes(session)
          ),
        0
      );

    const averagePomodoro =
      recentPomodoro.length > 0
        ? Math.round(
            pomodoroFocusMinutes /
              recentPomodoro.length
          )
        : 0;

    /* =========================================
       STUDY PLAN
    ========================================= */

    const recentStudyPlanSessions =
      studyPlanSessions.filter((session) =>
        isWithinDays(
          session?.date ||
            session?.startTime ||
            session?.createdAt,
          days
        )
      );

    const studyPlanMinutes =
      recentStudyPlanSessions.reduce(
        (total, session) =>
          total +
          Number(
            session?.duration ||
              session?.durationMinutes ||
              0
          ),
        0
      );

    const totalStudyMinutes =
      pomodoroFocusMinutes +
      studyPlanMinutes;

    /* =========================================
       TASKS
    ========================================= */

    const completedTasks =
      tasks.filter(getTaskCompleted);

    const pendingTasks =
      tasks.filter(
        (task) => !getTaskCompleted(task)
      );

    const overdueTasks =
      tasks.filter((task) => {
        if (getTaskCompleted(task)) {
          return false;
        }

        const dueDate = getDateValue(
          task?.dueDate
        );

        if (!dueDate) return false;

        const today = new Date();

        today.setHours(
          23,
          59,
          59,
          999
        );

        return dueDate < today;
      });

    const recentCompletedTasks =
      completedTasks.filter((task) =>
        isWithinDays(
          getTaskDate(task),
          days
        )
      );

    const taskCompletionRate =
      tasks.length > 0
        ? Math.round(
            (completedTasks.length /
              tasks.length) *
              100
          )
        : 0;

    const highPriorityTasks =
      tasks.filter(
        (task) =>
          String(
            task?.priority || ""
          ).toLowerCase() === "high"
      );

    const mediumPriorityTasks =
      tasks.filter(
        (task) =>
          String(
            task?.priority || ""
          ).toLowerCase() === "medium"
      );

    const lowPriorityTasks =
      tasks.filter(
        (task) =>
          String(
            task?.priority || ""
          ).toLowerCase() === "low"
      );

    /* =========================================
       SUBJECTS
    ========================================= */

    const subjectProgress =
      subjects.map((subject) => {
        const topics = Array.isArray(
          subject?.topics
        )
          ? subject.topics
          : [];

        const completedTopics =
          topics.filter(
            (topic) =>
              topic?.completed === true ||
              topic?.status === "completed"
          ).length;

        const progress =
          topics.length > 0
            ? Math.round(
                (completedTopics /
                  topics.length) *
                  100
              )
            : Number(
                subject?.progress || 0
              );

        const subjectTasks =
          tasks.filter(
            (task) =>
              task?.subject ===
                subject?.name ||
              task?.subjectId ===
                subject?.id
          );

        const subjectPomodoros =
          recentPomodoro.filter(
            (session) =>
              session?.subject ===
                subject?.name ||
              session?.subjectId ===
                subject?.id
          );

        const subjectStudyMinutes =
          subjectPomodoros.reduce(
            (total, session) =>
              total +
              getPomodoroMinutes(
                session
              ),
            0
          );

        return {
          id: subject?.id,
          name: getSubjectName(subject),
          completedTopics,
          totalTopics: topics.length,
          progress: Math.min(
            100,
            Math.max(0, progress)
          ),
          tasks: subjectTasks.length,
          completedTasks:
            subjectTasks.filter(
              getTaskCompleted
            ).length,
          studyMinutes:
            subjectStudyMinutes,
        };
      });

    const totalTopics =
      subjectProgress.reduce(
        (total, subject) =>
          total + subject.totalTopics,
        0
      );

    const completedTopics =
      subjectProgress.reduce(
        (total, subject) =>
          total + subject.completedTopics,
        0
      );

    const subjectProgressRate =
      totalTopics > 0
        ? Math.round(
            (completedTopics /
              totalTopics) *
              100
          )
        : 0;

    /* =========================================
       HABITS
    ========================================= */

    const habitAnalysis =
      habits.map((habit) => {
        const completedDates =
          Array.isArray(
            habit?.completedDates
          )
            ? habit.completedDates
            : [];

        const recentCompletedDates =
          completedDates.filter((date) =>
            isWithinDays(date, days)
          );

        const consistency =
          days > 0
            ? Math.round(
                (recentCompletedDates.length /
                  days) *
                  100
              )
            : 0;

        return {
          id: habit?.id,
          name:
            habit?.name ||
            habit?.title ||
            "Untitled Habit",
          consistency: Math.min(
            100,
            consistency
          ),
          recentCompleted:
            recentCompletedDates.length,
          totalCompleted:
            completedDates.length,
        };
      });

    const habitConsistency =
      habitAnalysis.length > 0
        ? Math.round(
            habitAnalysis.reduce(
              (total, habit) =>
                total + habit.consistency,
              0
            ) /
              habitAnalysis.length
          )
        : 0;

    /* =========================================
       PRODUCTIVITY
    ========================================= */

    const productivityParts = [];

    if (tasks.length > 0) {
      productivityParts.push(
        taskCompletionRate
      );
    }

    if (subjectProgress.length > 0) {
      productivityParts.push(
        subjectProgressRate
      );
    }

    if (habitAnalysis.length > 0) {
      productivityParts.push(
        habitConsistency
      );
    }

    const productivityScore =
      productivityParts.length > 0
        ? Math.round(
            productivityParts.reduce(
              (sum, value) =>
                sum + value,
              0
            ) /
              productivityParts.length
          )
        : null;

    /* =========================================
       DAILY ACTIVITY
    ========================================= */

    const dailyActivity = [];

    for (
      let i = days - 1;
      i >= 0;
      i -= 1
    ) {
      const date = new Date();

      date.setHours(
        0,
        0,
        0,
        0
      );

      date.setDate(
        date.getDate() - i
      );

      const dayKey =
        date
          .toISOString()
          .slice(0, 10);

      const pomodoroMinutesForDay =
        recentPomodoro
          .filter((session) => {
            const sessionDate =
              getDateValue(
                getSessionDate(session)
              );

            if (!sessionDate) {
              return false;
            }

            return (
              sessionDate
                .toISOString()
                .slice(0, 10) ===
              dayKey
            );
          })
          .reduce(
            (total, session) =>
              total +
              getPomodoroMinutes(session),
            0
          );

      const studyPlanMinutesForDay =
        recentStudyPlanSessions
          .filter((session) => {
            const sessionDate =
              getDateValue(
                session?.date ||
                  session?.startTime ||
                  session?.createdAt
              );

            if (!sessionDate) {
              return false;
            }

            return (
              sessionDate
                .toISOString()
                .slice(0, 10) ===
              dayKey
            );
          })
          .reduce(
            (total, session) =>
              total +
              Number(
                session?.duration ||
                  session?.durationMinutes ||
                  0
              ),
            0
          );

      dailyActivity.push({
        date: dayKey,
        label:
          date.toLocaleDateString(
            "en-US",
            {
              weekday: "short",
            }
          ),
        minutes:
          pomodoroMinutesForDay +
          studyPlanMinutesForDay,
      });
    }

    /* =========================================
       HEATMAP
    ========================================= */

    const heatmapDays = [];

    for (
      let i = days - 1;
      i >= 0;
      i -= 1
    ) {
      const date = new Date();

      date.setHours(
        0,
        0,
        0,
        0
      );

      date.setDate(
        date.getDate() - i
      );

      const dayKey =
        date
          .toISOString()
          .slice(0, 10);

      const activity =
        dailyActivity.find(
          (item) =>
            item.date === dayKey
        );

      const minutes =
        activity?.minutes || 0;

      let level = "empty";

      if (minutes >= 90) {
        level = "high";
      } else if (minutes >= 45) {
        level = "medium";
      } else if (minutes > 0) {
        level = "low";
      }

      heatmapDays.push({
        date: dayKey,
        minutes,
        level,
      });
    }

    /* =========================================
       RECENT ACTIVITY
    ========================================= */

    const recentActivity = [];

    recentCompletedTasks
      .slice(-5)
      .forEach((task) => {
        recentActivity.push({
          type: "task",
          title:
            task?.title ||
            task?.name ||
            "Task completed",
          date: getTaskDate(task),
        });
      });

    recentPomodoro
      .slice(-5)
      .forEach((session) => {
        recentActivity.push({
          type: "pomodoro",
          title:
            "Pomodoro session completed",
          date: getSessionDate(session),
        });
      });

    recentActivity.sort(
      (a, b) => {
        const dateA =
          getDateValue(a.date)
            ?.getTime() || 0;

        const dateB =
          getDateValue(b.date)
            ?.getTime() || 0;

        return dateB - dateA;
      }
    );

    /* =========================================
       BEST STUDY DAY
    ========================================= */

    const bestStudyDay =
      dailyActivity.reduce(
        (best, current) =>
          current.minutes >
          best.minutes
            ? current
            : best,
        {
          label: "-",
          minutes: 0,
        }
      );

    /* =========================================
       DATA AVAILABILITY
    ========================================= */

    const hasData =
      subjects.length > 0 ||
      tasks.length > 0 ||
      habits.length > 0 ||
      pomodoroSessions.length > 0 ||
      studyPlanSessions.length > 0;

    return {
      subjects,
      tasks,
      habits,
      pomodoroSessions,
      studyPlanSessions,

      recentPomodoro,
      recentStudyPlanSessions,

      totalStudyMinutes,
      studyPlanMinutes,
      pomodoroFocusMinutes,

      completedTasks,
      pendingTasks,
      overdueTasks,
      recentCompletedTasks,

      taskCompletionRate,

      highPriorityTasks,
      mediumPriorityTasks,
      lowPriorityTasks,

      subjectProgress,
      totalTopics,
      completedTopics,
      subjectProgressRate,

      habitAnalysis,
      habitConsistency,

      productivityScore,

      interruptedPomodoros,
      longestPomodoro,
      averagePomodoro,

      dailyActivity,
      heatmapDays,
      bestStudyDay,

      recentActivity,

      hasData,
    };
  }, [range]);

  /* =========================================
     KPI DATA
  ========================================= */

  const kpis = [
    {
      label: "Study Time",
      value: formatMinutes(
        analytics.totalStudyMinutes
      ),
      icon: Clock3,
      type: "study",
    },
    {
      label: "Tasks Completed",
      value:
        analytics.completedTasks.length,
      icon: CheckSquare,
      type: "tasks",
    },
    {
      label: "Pomodoro Sessions",
      value:
        analytics.recentPomodoro.length,
      icon: Timer,
      type: "pomodoro",
    },
    {
      label: "Goal Progress",
      value: "—",
      icon: Target,
      type: "goals",
    },
    {
      label: "Habit Consistency",
      value:
        analytics.habitAnalysis.length > 0
          ? `${analytics.habitConsistency}%`
          : "—",
      icon: Flame,
      type: "habit",
    },
    {
      label: "Subject Progress",
      value: `${analytics.subjectProgressRate}%`,
      icon: BookOpen,
      type: "subject",
    },
    {
      label: "Productivity Score",
      value:
        analytics.productivityScore === null
          ? "—"
          : `${analytics.productivityScore}%`,
      icon: Gauge,
      type: "productivity",
    },
  ];

  /* =========================================
     AI QUICK PROMPTS
  ========================================= */

  const aiPrompts = [
    "Analyze my study week",
    "Which subject needs more attention?",
    "Why is my productivity changing?",
    "What should I prioritize tomorrow?",
    "Analyze my Pomodoro pattern",
    "Am I completing my goals on time?",
    "Find my weakest subject",
    "Create a recovery plan",
  ];

  const handleAiPrompt = (prompt) => {
    setAiPrompt(prompt);
  };

  const handleAiSubmit = () => {
    if (!aiPrompt.trim()) return;

    setAiPrompt(aiPrompt.trim());
  };

  return (
    <div className="analytics-page">
{/* =====================================================
    ANALYTICS HEADER
    Same structure as Pomodoro
===================================================== */}

<header className="analytics-header">
  <div className="analytics-heading">
    <div className="analytics-heading-icon">
      <BarChart3 size={28} />
    </div>

    <div>
      <h1>Analytics</h1>

      <p>
        Understand your study patterns, measure progress,
        and improve consistently.
      </p>
    </div>
  </div>

  <div className="analytics-range-control">
    <CalendarDays size={17} />

    <button
      className={range === "7d" ? "active" : ""}
      onClick={() => setRange("7d")}
    >
      7 Days
    </button>

    <button
      className={range === "30d" ? "active" : ""}
      onClick={() => setRange("30d")}
    >
      30 Days
    </button>

    <button
      className={range === "90d" ? "active" : ""}
      onClick={() => setRange("90d")}
    >
      90 Days
    </button>
  </div>
</header>

      {/* =========================================
          DATA NOTICE
      ========================================= */}

      {!analytics.hasData && (
        <div className="analytics-data-notice">
          <Activity size={18} />

          <div>
            <strong>
              Analytics is using real StudyOS
              records.
            </strong>

            <p>
              Start using Tasks, Subjects,
              Pomodoro, Habits, or Study Plan
              to build your analytics.
            </p>
          </div>
        </div>
      )}

      {/* =========================================
          KPI CARDS
      ========================================= */}

      <section className="analytics-kpi-grid">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;

          return (
            <div
              className={`analytics-kpi-card analytics-kpi-${kpi.type}`}
              key={kpi.label}
            >
              <div className="analytics-kpi-icon">
                <Icon size={20} />
              </div>

              <div className="analytics-kpi-content">
                <span>{kpi.label}</span>

                <strong>
                  {kpi.value}
                </strong>
              </div>
            </div>
          );
        })}
      </section>

      {/* =========================================
          STUDY ACTIVITY
      ========================================= */}

      <section className="analytics-card analytics-activity-card">
        <div className="analytics-card-header">
          <div>
            <h2>
              <Activity size={19} />
              Study Activity
            </h2>

            <p>
              Your actual recorded study
              activity during the selected
              period.
            </p>
          </div>

          <span className="analytics-period-badge">
            Last {range} days
          </span>
        </div>

        <div className="analytics-activity-summary">
          <StatMini
            label="Total Study Time"
            value={formatMinutes(
              analytics.totalStudyMinutes
            )}
            icon={Clock3}
            type="study"
          />

          <StatMini
            label="Focus Sessions"
            value={
              analytics.recentPomodoro.length
            }
            icon={Timer}
            type="pomodoro"
          />

          <StatMini
            label="Best Study Day"
            value={
              analytics.bestStudyDay.minutes > 0
                ? analytics.bestStudyDay.label
                : "—"
            }
            icon={Trophy}
            type="success"
          />

          <StatMini
            label="Longest Session"
            value={formatMinutes(
              analytics.longestPomodoro
            )}
            icon={Hourglass}
            type="warning"
          />
        </div>

        <div className="analytics-bar-chart">
          {analytics.dailyActivity.map(
            (day) => {
              const maxMinutes = Math.max(
                ...analytics.dailyActivity.map(
                  (item) =>
                    item.minutes
                ),
                1
              );

              const height =
                day.minutes > 0
                  ? Math.max(
                      4,
                      (day.minutes /
                        maxMinutes) *
                        100
                    )
                  : 3;

              return (
                <div
                  className="analytics-bar-column"
                  key={day.date}
                  title={`${day.date} • ${formatMinutes(
                    day.minutes
                  )}`}
                >
                  <div className="analytics-bar-value">
                    {day.minutes > 0
                      ? formatMinutes(
                          day.minutes
                        )
                      : ""}
                  </div>

                  <div className="analytics-bar-area">
                    <div
                      className="analytics-bar"
                      style={{
                        height: `${height}%`,
                      }}
                    />
                  </div>

                  <span>
                    {day.label}
                  </span>
                </div>
              );
            }
          )}
        </div>
      </section>

      {/* =========================================
          SUBJECT PERFORMANCE
      ========================================= */}

      <section className="analytics-card">
        <div className="analytics-card-header">
          <div>
            <h2>
              <BookOpen size={19} />
              Subject Performance
            </h2>

            <p>
              Progress based on your actual
              subjects, topics, tasks, and
              recorded focus time.
            </p>
          </div>

          <span className="analytics-card-count">
            {analytics.subjectProgress.length}{" "}
            subjects
          </span>
        </div>

        {analytics.subjectProgress.length ===
        0 ? (
          <EmptyAnalytics
            icon={BookOpen}
            title="No subjects available"
            description="Create subjects and add topics to start building real subject analytics."
          />
        ) : (
          <div className="analytics-subject-table">
            <div className="analytics-table-header">
              <span>Subject</span>
              <span>Progress</span>
              <span>Topics</span>
              <span>Tasks</span>
              <span>Study Time</span>
            </div>

            {analytics.subjectProgress.map(
              (subject) => (
                <div
                  className="analytics-table-row"
                  key={
                    subject.id ||
                    subject.name
                  }
                >
                  <div className="analytics-subject-name">
                    <div className="analytics-row-icon">
                      <BookOpen size={16} />
                    </div>

                    <strong>
                      {subject.name}
                    </strong>
                  </div>

                  <div className="analytics-subject-progress">
                    <div>
                      {subject.progress}%
                    </div>

                    <ProgressBar
                      value={
                        subject.progress
                      }
                    />
                  </div>

                  <span>
                    {subject.completedTopics}/
                    {subject.totalTopics}
                  </span>

                  <span>
                    {
                      subject.completedTasks
                    }
                    /
                    {subject.tasks}
                  </span>

                  <span>
                    {formatMinutes(
                      subject.studyMinutes
                    )}
                  </span>
                </div>
              )
            )}
          </div>
        )}
      </section>
      {/* =========================================
          TASK + TREND
      ========================================= */}

      <section className="analytics-section-grid">

        {/* TASK ANALYTICS */}

        <div className="analytics-card">
          <div className="analytics-card-header">
            <div>
              <h2>
                <CheckSquare size={19} />
                Task Analytics
              </h2>

              <p>
                Understand completion and
                pending workload.
              </p>
            </div>
          </div>

          <div className="analytics-task-overview">
            <div>
              <CircleCheck size={17} />

              <span>
                Completed
              </span>

              <strong>
                {
                  analytics.completedTasks
                    .length
                }
              </strong>
            </div>

            <div>
              <Clock3 size={17} />

              <span>
                Pending
              </span>

              <strong>
                {
                  analytics.pendingTasks
                    .length
                }
              </strong>
            </div>

            <div>
              <CircleX size={17} />

              <span>
                Overdue
              </span>

              <strong>
                {
                  analytics.overdueTasks
                    .length
                }
              </strong>
            </div>
          </div>

          <div className="analytics-completion-block">
            <div className="analytics-completion-heading">
              <span>
                Completion Rate
              </span>

              <strong>
                {
                  analytics.taskCompletionRate
                }
                %
              </strong>
            </div>

            <ProgressBar
              value={
                analytics.taskCompletionRate
              }
            />
          </div>

          <div className="analytics-priority-grid">
            <div>
              <span>
                High Priority
              </span>

              <strong>
                {
                  analytics
                    .highPriorityTasks
                    .length
                }
              </strong>
            </div>

            <div>
              <span>
                Medium Priority
              </span>

              <strong>
                {
                  analytics
                    .mediumPriorityTasks
                    .length
                }
              </strong>
            </div>

            <div>
              <span>
                Low Priority
              </span>

              <strong>
                {
                  analytics
                    .lowPriorityTasks
                    .length
                }
              </strong>
            </div>
          </div>
        </div>

        {/* TASK COMPLETION TREND */}

        <div className="analytics-card">
          <div className="analytics-card-header">
            <div>
              <h2>
                <TrendingUp size={19} />
                Task Completion Trend
              </h2>

              <p>
                Completed tasks recorded in
                the selected period.
              </p>
            </div>
          </div>

          <div className="analytics-trend-summary">
            <div className="analytics-trend-number">
              <strong>
                {
                  analytics
                    .recentCompletedTasks
                    .length
                }
              </strong>

              <span>
                completed in this period
              </span>
            </div>

            <div className="analytics-trend-icon">
              <TrendingUp size={25} />
            </div>
          </div>
        </div>
      </section>

      {/* =========================================
          GOAL + HABIT
      ========================================= */}

      <section className="analytics-section-grid">

        {/* GOALS */}

        <div className="analytics-card">
          <div className="analytics-card-header">
            <div>
              <h2>
                <Target size={19} />
                Goal Analytics
              </h2>

              <p>
                Progress, deadlines, and target
                completion.
              </p>
            </div>
          </div>

          <div className="analytics-goal-placeholder">
            <div className="analytics-feature-icon">
              <Target size={21} />
            </div>

            <div>
              <h3>
                Goal analytics ready
              </h3>

              <p>
                Goal progress will appear
                here once Goals are connected
                to persistent storage. No
                artificial goal numbers are
                shown.
              </p>
            </div>
          </div>
        </div>

        {/* HABITS */}

        <div className="analytics-card">
          <div className="analytics-card-header">
            <div>
              <h2>
                <Flame size={19} />
                Habit Analytics
              </h2>

              <p>
                Consistency and completed
                habit days.
              </p>
            </div>
          </div>

          {analytics.habitAnalysis.length ===
          0 ? (
            <EmptyAnalytics
              icon={Flame}
              title="No habits recorded"
              description="Create habits and complete them to build your consistency analysis."
            />
          ) : (
            <div className="analytics-habit-list">
              {analytics.habitAnalysis.map(
                (habit) => (
                  <div
                    className="analytics-habit-row"
                    key={
                      habit.id ||
                      habit.name
                    }
                  >
                    <div className="analytics-habit-title">
                      <div className="analytics-row-icon">
                        <Flame size={15} />
                      </div>

                      <strong>
                        {habit.name}
                      </strong>
                    </div>

                    <div className="analytics-habit-progress">
                      <ProgressBar
                        value={
                          habit.consistency
                        }
                      />

                      <span>
                        {
                          habit.consistency
                        }
                        %
                      </span>
                    </div>

                    <small>
                      {
                        habit.recentCompleted
                      }{" "}
                      days
                    </small>
                  </div>
                )
              )}
            </div>
          )}
        </div>
      </section>

      {/* =========================================
          POMODORO
      ========================================= */}

      <section className="analytics-card">
        <div className="analytics-card-header">
          <div>
            <h2>
              <Timer size={19} />
              Pomodoro Analytics
            </h2>

            <p>
              Analyze focus sessions and study
              patterns.
            </p>
          </div>
        </div>

        {analytics.recentPomodoro.length ===
        0 ? (
          <EmptyAnalytics
            icon={Timer}
            title="No Pomodoro sessions"
            description="Complete Pomodoro focus sessions to build your focus analytics."
          />
        ) : (
          <div className="analytics-pomodoro-grid">
            <StatMini
              label="Focus Time"
              value={formatMinutes(
                analytics.pomodoroFocusMinutes
              )}
              icon={Clock3}
              type="study"
            />

            <StatMini
              label="Sessions"
              value={
                analytics.recentPomodoro
                  .length
              }
              icon={Timer}
              type="pomodoro"
            />

            <StatMini
              label="Average Session"
              value={formatMinutes(
                analytics.averagePomodoro
              )}
              icon={Hourglass}
              type="default"
            />

            <StatMini
              label="Longest Session"
              value={formatMinutes(
                analytics.longestPomodoro
              )}
              icon={Trophy}
              type="success"
            />

            <StatMini
              label="Interrupted"
              value={
                analytics
                  .interruptedPomodoros
              }
              icon={AlertCircle}
              type="warning"
            />
          </div>
        )}
      </section>

      {/* =========================================
          CONSISTENCY HEATMAP
      ========================================= */}

      <section className="analytics-card">
        <div className="analytics-card-header">
          <div>
            <h2>
              <CalendarRange size={19} />
              Consistency Heatmap
            </h2>

            <p>
              A visual view of your actual
              study activity across days.
            </p>
          </div>
        </div>

        {!analytics.hasData ? (
          <div className="analytics-small-empty">
            No activity to display.
          </div>
        ) : (
          <>
            <div className="analytics-heatmap">
              {analytics.heatmapDays.map(
                (day) => (
                  <div
                    key={day.date}
                    className={`analytics-heat-cell ${day.level}`}
                    title={`${day.date} • ${formatMinutes(
                      day.minutes
                    )}`}
                  />
                )
              )}
            </div>

            <div className="analytics-small-empty">
              Actual study activity only
              — no artificial activity is
              generated.
            </div>
          </>
        )}
      </section>

      {/* =========================================
          STREAK + PRODUCTIVITY
      ========================================= */}

      <section className="analytics-section-grid">

        <div className="analytics-card">
          <div className="analytics-card-header">
            <div>
              <h2>
                <Flame size={19} />
                Study Streak
              </h2>

              <p>
                Based on recorded activity.
              </p>
            </div>
          </div>

          <div className="analytics-streak-content">
            <div className="analytics-streak-icon">
              <Flame size={31} />
            </div>

            <div>
              <strong>—</strong>

              <span>
                Streak calculation will use
                historical daily activity.
              </span>
            </div>
          </div>
        </div>

        <div className="analytics-card">
          <div className="analytics-card-header">
            <div>
              <h2>
                <Gauge size={19} />
                Productivity Score
              </h2>

              <p>
                Calculated from available
                StudyOS activity.
              </p>
            </div>
          </div>

          <div className="analytics-productivity">
            <div className="analytics-productivity-score">
              {analytics.productivityScore ===
              null
                ? "—"
                : `${analytics.productivityScore}%`}
            </div>

            <div>
              <strong>
                Current productivity
              </strong>

              <p>
                The score combines available
                task completion, subject
                progress, and habit
                consistency data.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================
          PERIOD COMPARISON
      ========================================= */}

      <section className="analytics-card">
        <div className="analytics-card-header">
          <div>
            <h2>
              <RefreshCw size={19} />
              Period Comparison
            </h2>

            <p>
              Compare your current period
              with a previous period once
              enough historical data is
              available.
            </p>
          </div>
        </div>

        <div className="analytics-comparison-grid">
          <div>
            <span>
              Study Time
            </span>

            <strong>
              {formatMinutes(
                analytics.totalStudyMinutes
              )}
            </strong>

            <small>
              Current period
            </small>
          </div>

          <div>
            <span>
              Tasks Completed
            </span>

            <strong>
              {
                analytics
                  .recentCompletedTasks
                  .length
              }
            </strong>

            <small>
              Current period
            </small>
          </div>

          <div>
            <span>
              Focus Sessions
            </span>

            <strong>
              {
                analytics
                  .recentPomodoro
                  .length
              }
            </strong>

            <small>
              Current period
            </small>
          </div>

          <div className="analytics-comparison-empty">
            <RefreshCw size={18} />

            <span>
              Previous-period comparison
              will use historical records.
            </span>
          </div>
        </div>
      </section>

      {/* =========================================
          RECENT ACTIVITY
      ========================================= */}

      <section className="analytics-card">
        <div className="analytics-card-header">
          <div>
            <h2>
              <Activity size={19} />
              Recent Activity
            </h2>

            <p>
              Recent study activity recorded
              by StudyOS.
            </p>
          </div>
        </div>

        {analytics.recentActivity.length ===
        0 ? (
          <EmptyAnalytics
            icon={Activity}
            title="No recent activity"
            description="Complete tasks or Pomodoro sessions and your real activity will appear here."
          />
        ) : (
          <div className="analytics-activity-list">
            {analytics.recentActivity
              .slice(0, 8)
              .map((item, index) => {
                const Icon =
                  getActivityIcon(
                    item.type
                  );

                const activityDate =
                  getDateValue(
                    item.date
                  );

                return (
                  <div
                    className="analytics-activity-item"
                    key={`${item.type}-${item.date}-${index}`}
                  >
                    <div className="analytics-row-icon">
                      <Icon size={15} />
                    </div>

                    <div>
                      <strong>
                        {item.title}
                      </strong>

                      <span>
                        {activityDate
                          ? activityDate.toLocaleString(
                              "en-IN",
                              {
                                dateStyle:
                                  "medium",
                                timeStyle:
                                  "short",
                              }
                            )
                          : "Recently"}
                      </span>
                    </div>

                    <ChevronRight size={15} />
                  </div>
                );
              })}
          </div>
        )}
      </section>

      {/* =========================================
          STUDYOS AI
      ========================================= */}

      <section className="analytics-ai-card">
        <div className="analytics-ai-header">
          <div className="analytics-ai-brand">
            <div className="analytics-ai-icon">
              <Sparkles size={25} />
            </div>

            <div>
              <span>
                STUDYOS AI
              </span>

              <h2>
                Study Intelligence
              </h2>

              <p>
                AI-powered analysis based on
                your actual StudyOS activity.
              </p>
            </div>
          </div>

          <Brain size={24} />
        </div>

        {/* AI CORE FEATURES */}

        <div className="analytics-ai-feature-grid">

          <div>
            <Lightbulb size={19} />

            <strong>
              Performance Insights
            </strong>

            <p>
              Understand what is working
              well in your study routine.
            </p>
          </div>

          <div>
            <AlertCircle size={19} />

            <strong>
              Attention Areas
            </strong>

            <p>
              Find subjects, tasks, or goals
              that need more attention.
            </p>
          </div>

          <div>
            <Zap size={19} />

            <strong>
              Smart Recommendations
            </strong>

            <p>
              Get practical suggestions
              based on your real activity.
            </p>
          </div>

          <div>
            <CalendarDays size={19} />

            <strong>
              Better Planning
            </strong>

            <p>
              AI can suggest how to organize
              upcoming study workload.
            </p>
          </div>
        </div>

        {/* AI PROMPTS */}

        <div className="analytics-ai-prompts">
          <div className="analytics-ai-prompts-header">
            <MessageSquare size={16} />

            <span>
              Ask StudyOS AI
            </span>
          </div>

          <div className="analytics-ai-prompt-grid">
            {aiPrompts.map(
              (prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() =>
                    handleAiPrompt(
                      prompt
                    )
                  }
                >
                  {prompt}

                  <ArrowUpRight size={12} />
                </button>
              )
            )}
          </div>
        </div>

        {/* AI INPUT */}

        <div className="analytics-ai-input">
          <MessageSquare size={17} />

          <input
            type="text"
            value={aiPrompt}
            onChange={(event) =>
              setAiPrompt(
                event.target.value
              )
            }
            onKeyDown={(event) => {
              if (
                event.key === "Enter"
              ) {
                handleAiSubmit();
              }
            }}
            placeholder="Ask StudyOS AI about your study performance..."
          />

          <button
            type="button"
            onClick={handleAiSubmit}
            disabled={!aiPrompt.trim()}
            aria-label="Send AI prompt"
          >
            <Send size={16} />
          </button>
        </div>

        <div className="analytics-ai-status">
          <Sparkles size={12} />

          <span>
            AI connection will analyze
            calculated StudyOS analytics
            data. No fake insights are
            generated.
          </span>
        </div>
      </section>

      {/* =========================================
          ADVANCED AI ANALYSIS
      ========================================= */}

      <section className="analytics-card">
        <div className="analytics-card-header">
          <div>
            <h2>
              <Brain size={19} />
              Advanced AI Analysis
            </h2>

            <p>
              Advanced capabilities prepared
              for the StudyOS AI service.
            </p>
          </div>

          <span className="analytics-period-badge">
            AI Ready
          </span>
        </div>

        <div className="analytics-advanced-ai-grid">

          <div>
            <Award size={20} />

            <strong>
              Weak Subject Detection
            </strong>

            <span>
              Identify subjects receiving
              less attention from actual
              study data.
            </span>
          </div>

          <div>
            <TrendingUp size={20} />

            <strong>
              Productivity Pattern Analysis
            </strong>

            <span>
              Explain changes in study
              activity using historical
              data.
            </span>
          </div>

          <div>
            <RefreshCw size={20} />

            <strong>
              Recovery Plan
            </strong>

            <span>
              Generate a practical plan for
              pending academic work.
            </span>
          </div>

          <div>
            <CalendarDays size={20} />

            <strong>
              Study Plan Optimization
            </strong>

            <span>
              Suggest adjustments using
              workload and study history.
            </span>
          </div>

          <div>
            <Timer size={20} />

            <strong>
              Focus Pattern Analysis
            </strong>

            <span>
              Analyze Pomodoro duration,
              interruptions, and focus habits.
            </span>
          </div>

          <div>
            <Target size={20} />

            <strong>
              Goal Completion Analysis
            </strong>

            <span>
              Analyze actual progress
              against deadlines and targets.
            </span>
          </div>
        </div>
      </section>

      {/* =========================================
          FOOTER
      ========================================= */}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
          padding: "18px 4px 0",
          color: "#94a3b8",
          fontSize: "11px",
        }}
      >
        <span>
          StudyOS · A smarter way to learn,
          plan, and grow.
        </span>

        <span>
          Analytics uses actual recorded
          activity.
        </span>
      </div>
    </div>
  );
}