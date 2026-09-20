import { useState } from "react";
import {
  Target,
  Plus,
  Search,
  CheckCircle2,
  CircleDot,
  AlertCircle,
  X,
  CalendarDays,
  ListChecks,
  Trash2,
  Flag,
} from "lucide-react";
import "./Goals.css";

const Goals = ({ setNotifications }) => {
  const [search, setSearch] = useState("");
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [goals, setGoals] = useState([]);

  const [goalForm, setGoalForm] = useState({
    title: "",
    description: "",
    category: "Academic",
    priority: "Medium",
    startDate: "",
    deadline: "",
    targetValue: "",
    subject: "",
    notes: "",
    milestones: "",
  });

  const addNotification = (title, message) => {
    if (!setNotifications) return;

    setNotifications((previous) => [
      {
        id: `goal-${Date.now()}`,
        type: "goal",
        title,
        message,
        read: false,
        createdAt: new Date().toISOString(),
        time: new Date().toISOString(),
      },
      ...(Array.isArray(previous) ? previous : []),
    ]);
  };

  const handleAddGoal = () => {
    setShowGoalModal(true);
  };

  const handleCloseModal = () => {
    setShowGoalModal(false);
  };

  const handleGoalChange = (event) => {
    const { name, value } = event.target;

    setGoalForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSaveGoal = (event) => {
    event.preventDefault();

    if (!goalForm.title.trim()) {
      return;
    }

    const newGoal = {
      id: Date.now(),
      ...goalForm,
      progress: 0,
      completed: false,
      createdAt: new Date().toISOString(),
    };

    setGoals((previous) => [newGoal, ...previous]);

    addNotification(
      "Goal Created",
      `"${goalForm.title}" has been added successfully.`
    );

    setGoalForm({
      title: "",
      description: "",
      category: "Academic",
      priority: "Medium",
      startDate: "",
      deadline: "",
      targetValue: "",
      subject: "",
      notes: "",
      milestones: "",
    });

    setShowGoalModal(false);
  };

  const handleCompleteGoal = (id) => {
    setGoals((previous) =>
      previous.map((goal) =>
        goal.id === id
          ? {
              ...goal,
              progress: 100,
              completed: true,
            }
          : goal
      )
    );

    const selectedGoal = goals.find((goal) => goal.id === id);

    if (selectedGoal) {
      addNotification(
        "Goal Completed",
        `"${selectedGoal.title}" has been completed.`
      );
    }
  };

  const handleDeleteGoal = (id) => {
    const selectedGoal = goals.find((goal) => goal.id === id);

    setGoals((previous) =>
      previous.filter((goal) => goal.id !== id)
    );

    if (selectedGoal) {
      addNotification(
        "Goal Deleted",
        `"${selectedGoal.title}" has been deleted.`
      );
    }
  };

  const today = new Date().toISOString().split("T")[0];

  const totalGoals = goals.length;

  const activeGoals = goals.filter(
    (goal) => !goal.completed
  ).length;

  const completedGoals = goals.filter(
    (goal) => goal.completed
  ).length;

  const overdueGoals = goals.filter(
    (goal) =>
      !goal.completed &&
      goal.deadline &&
      goal.deadline < today
  ).length;

  const filteredGoals = goals.filter((goal) =>
    `${goal.title} ${goal.description} ${goal.category} ${goal.subject}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <section className="goals-page">
      {/* =========================
          HEADER
      ========================= */}
      <header className="goals-header">
        <div className="goals-heading">
          <div className="goals-heading-icon">
            <Target size={30} />
          </div>

          <div>
            <h1>Goals</h1>
            <p>Set goals. Track progress. Achieve more.</p>
          </div>
        </div>

        <button
          className="goals-primary"
          onClick={handleAddGoal}
        >
          <Plus size={18} />
          Add Goal
        </button>
      </header>

      {/* =========================
          SUMMARY
      ========================= */}
      <section className="goals-summary">
        <div className="goal-summary-card blue">
          <div className="goal-summary-icon">
            <Target size={21} />
          </div>

          <div>
            <strong>{totalGoals}</strong>
            <span>Total Goals</span>
            <small>All your goals</small>
          </div>
        </div>

        <div className="goal-summary-card green">
          <div className="goal-summary-icon">
            <CircleDot size={21} />
          </div>

          <div>
            <strong>{activeGoals}</strong>
            <span>Active Goals</span>
            <small>Keep going!</small>
          </div>
        </div>

        <div className="goal-summary-card purple">
          <div className="goal-summary-icon">
            <CheckCircle2 size={21} />
          </div>

          <div>
            <strong>{completedGoals}</strong>
            <span>Completed</span>
            <small>Great progress!</small>
          </div>
        </div>

        <div className="goal-summary-card red">
          <div className="goal-summary-icon">
            <AlertCircle size={21} />
          </div>

          <div>
            <strong>{overdueGoals}</strong>
            <span>Overdue</span>
            <small>Needs attention</small>
          </div>
        </div>
      </section>

      {/* =========================
          SEARCH + FILTERS
      ========================= */}
      <section className="goals-toolbar">
        <label className="goals-search">
          <Search size={17} />

          <input
            type="text"
            placeholder="Search goals..."
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />
        </label>

        <select className="goals-filter">
          <option>All Categories</option>
          <option>Academic</option>
          <option>Coding</option>
          <option>Career</option>
          <option>Personal</option>
        </select>

        <select className="goals-filter">
          <option>All Status</option>
          <option>Active</option>
          <option>Completed</option>
          <option>Overdue</option>
        </select>

        <select className="goals-filter">
          <option>Newest</option>
          <option>Deadline</option>
          <option>Progress</option>
          <option>A-Z</option>
        </select>
      </section>

      {/* =========================
          GOALS
      ========================= */}
      <section className="goals-content">
        <div className="goals-section-title">
          <div>
            <h2>My Goals</h2>
            <p>Track your progress and stay consistent.</p>
          </div>
        </div>

        {filteredGoals.length === 0 ? (
          <div className="goals-empty">
            <div className="goals-empty-icon">
              <Target size={34} />
            </div>

            <h3>No goals yet</h3>

            <p>
              Create your first goal and start tracking
              your progress.
            </p>

            <button
              className="goals-primary"
              onClick={handleAddGoal}
            >
              <Plus size={18} />
              Add Goal
            </button>
          </div>
        ) : (
          <div className="goals-list">
            {filteredGoals.map((goal) => (
              <article
                className="goal-card"
                key={goal.id}
              >
                <div className="goal-card-top">
                  <div className="goal-card-title">
                    <div className="goal-card-icon">
                      <Target size={20} />
                    </div>

                    <div>
                      <h3>{goal.title}</h3>

                      {goal.description && (
                        <p>{goal.description}</p>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    className="goal-delete-button"
                    onClick={() =>
                      handleDeleteGoal(goal.id)
                    }
                    aria-label="Delete goal"
                  >
                    <Trash2 size={17} />
                  </button>
                </div>

                <div className="goal-card-meta">
                  <span className="goal-badge">
                    {goal.category}
                  </span>

                  <span className="goal-priority">
                    <Flag size={13} />
                    {goal.priority}
                  </span>

                  {goal.deadline && (
                    <span className="goal-deadline">
                      <CalendarDays size={13} />
                      {goal.deadline}
                    </span>
                  )}
                </div>

                <div className="goal-progress-header">
                  <span>Progress</span>
                  <strong>{goal.progress}%</strong>
                </div>

                <div className="goal-progress-track">
                  <div
                    className="goal-progress-fill"
                    style={{
                      width: `${goal.progress}%`,
                    }}
                  />
                </div>

                {goal.targetValue && (
                  <div className="goal-target">
                    Target: {goal.targetValue}
                  </div>
                )}

                <div className="goal-card-footer">
                  {goal.completed ? (
                    <span className="goal-completed-label">
                      <CheckCircle2 size={16} />
                      Completed
                    </span>
                  ) : (
                    <button
                      type="button"
                      className="goal-complete-button"
                      onClick={() =>
                        handleCompleteGoal(goal.id)
                      }
                    >
                      <CheckCircle2 size={16} />
                      Mark Complete
                    </button>
                  )}

                  {goal.milestones && (
                    <span className="goal-milestone-label">
                      <ListChecks size={15} />
                      Milestone added
                    </span>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* =========================
          ADD GOAL MODAL
      ========================= */}
      {showGoalModal && (
        <div
          className="goal-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              handleCloseModal();
            }
          }}
        >
          <div
            className="goal-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="goal-modal-title"
          >
            <div className="goal-modal-header">
              <div>
                <h2 id="goal-modal-title">Add Goal</h2>
                <p>
                  Create a goal and start tracking your
                  progress.
                </p>
              </div>

              <button
                type="button"
                className="goal-modal-close"
                onClick={handleCloseModal}
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveGoal}>
              <div className="goal-modal-body">
                <div className="goal-form-group full">
                  <label>
                    Goal Title <span>*</span>
                  </label>

                  <input
                    type="text"
                    name="title"
                    value={goalForm.title}
                    onChange={handleGoalChange}
                    placeholder="e.g. Complete Java DSA course"
                    required
                  />
                </div>

                <div className="goal-form-group full">
                  <label>Description</label>

                  <textarea
                    name="description"
                    value={goalForm.description}
                    onChange={handleGoalChange}
                    placeholder="Describe what you want to achieve..."
                    rows="3"
                  />
                </div>

                <div className="goal-form-group">
                  <label>Category</label>

                  <select
                    name="category"
                    value={goalForm.category}
                    onChange={handleGoalChange}
                  >
                    <option>Academic</option>
                    <option>Coding</option>
                    <option>Career</option>
                    <option>Personal</option>
                  </select>
                </div>

                <div className="goal-form-group">
                  <label>Priority</label>

                  <select
                    name="priority"
                    value={goalForm.priority}
                    onChange={handleGoalChange}
                  >
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                  </select>
                </div>

                <div className="goal-form-group">
                  <label>Start Date</label>

                  <div className="goal-input-icon">
                    <CalendarDays size={16} />

                    <input
                      type="date"
                      name="startDate"
                      value={goalForm.startDate}
                      onChange={handleGoalChange}
                    />
                  </div>
                </div>

                <div className="goal-form-group">
                  <label>Deadline</label>

                  <div className="goal-input-icon">
                    <CalendarDays size={16} />

                    <input
                      type="date"
                      name="deadline"
                      value={goalForm.deadline}
                      onChange={handleGoalChange}
                    />
                  </div>
                </div>

                <div className="goal-form-group">
                  <label>Target Value</label>

                  <input
                    type="text"
                    name="targetValue"
                    value={goalForm.targetValue}
                    onChange={handleGoalChange}
                    placeholder="e.g. 100 problems"
                  />
                </div>

                <div className="goal-form-group">
                  <label>Subject</label>

                  <select
                    name="subject"
                    value={goalForm.subject}
                    onChange={handleGoalChange}
                  >
                    <option value="">No subject</option>
                    <option>Java</option>
                    <option>DBMS</option>
                    <option>Mathematics</option>
                    <option>Data Structures</option>
                    <option>Computer Networks</option>
                  </select>
                </div>

                <div className="goal-form-group full">
                  <label>Milestones</label>

                  <div className="goal-input-icon goal-milestone-input">
                    <ListChecks size={16} />

                    <input
                      type="text"
                      name="milestones"
                      value={goalForm.milestones}
                      onChange={handleGoalChange}
                      placeholder="e.g. Finish Unit 1, Complete 50 problems"
                    />
                  </div>
                </div>

                <div className="goal-form-group full">
                  <label>Notes</label>

                  <textarea
                    name="notes"
                    value={goalForm.notes}
                    onChange={handleGoalChange}
                    placeholder="Add any additional notes..."
                    rows="3"
                  />
                </div>
              </div>

              <div className="goal-modal-footer">
                <button
                  type="button"
                  className="goal-cancel-button"
                  onClick={handleCloseModal}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="goals-primary"
                >
                  <Plus size={18} />
                  Save Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};

export default Goals;
