import { useEffect, useMemo, useState } from "react";
import {
  Target,
  Code2,
  Coffee,
  Brain,
  Mic2,
  BarChart3,
  Plus,
  Trash2,
  Check,
  FileUp,
  Bot,
  ArrowRight,
  BookOpen,
  X,
  Sparkles,
  Trophy,
  ChevronRight,
  Upload,
  WandSparkles,
} from "lucide-react";

import "./PlacementHub.css";

const STORAGE_KEY = "studyos-placement-hub";

const SECTIONS = {
  dsa: {
    label: "DSA",
    icon: Code2,
    color: "indigo",
    description: "Data structures, algorithms and problem solving.",
    topics: [
      "Arrays",
      "Strings",
      "Linked List",
      "Stack",
      "Queue",
      "Hashing",
      "Recursion",
      "Binary Search",
      "Trees",
      "Heap",
      "Graphs",
      "Greedy",
      "Dynamic Programming",
    ],
  },

  java: {
    label: "Java",
    icon: Coffee,
    color: "orange",
    description: "Java programming and object-oriented fundamentals.",
    topics: [
      "Java Basics",
      "Classes & Objects",
      "OOP",
      "Inheritance",
      "Polymorphism",
      "Encapsulation",
      "Abstraction",
      "Exception Handling",
      "Collections",
      "Generics",
      "Multithreading",
      "Java 8+",
    ],
  },

  corecs: {
    label: "Core CS",
    icon: BookOpen,
    color: "cyan",
    description: "Important computer science interview subjects.",
    topics: [
      "DBMS",
      "SQL",
      "Operating Systems",
      "Computer Networks",
      "Computer Architecture",
      "OOP Concepts",
    ],
  },

  aptitude: {
    label: "Aptitude",
    icon: Brain,
    color: "green",
    description: "Quantitative, logical, verbal and DI preparation.",
    topics: [
      "Percentages",
      "Profit & Loss",
      "Ratio & Proportion",
      "Time & Work",
      "Time Speed Distance",
      "Averages",
      "Logical Reasoning",
      "Verbal Ability",
      "Data Interpretation",
    ],
  },

  interview: {
    label: "Interview",
    icon: Mic2,
    color: "purple",
    description: "Technical, project and HR interview preparation.",
    topics: [
      "Technical Interview",
      "DSA Interview",
      "Java Interview",
      "Core CS Interview",
      "Project Questions",
      "Resume Questions",
      "HR / Behavioral",
    ],
  },
};

const TABS = [
  { id: "overview", label: "Overview", icon: Target },
  { id: "dsa", label: "DSA", icon: Code2 },
  { id: "java", label: "Java", icon: Coffee },
  { id: "corecs", label: "Core CS", icon: BookOpen },
  { id: "aptitude", label: "Aptitude", icon: Brain },
  { id: "interview", label: "Interview", icon: Mic2 },
  { id: "analytics", label: "Placement Analytics", icon: BarChart3 },
];

function createId(prefix = "item") {
  return `${prefix}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

function createDefaultData() {
  const data = {};

  Object.entries(SECTIONS).forEach(([key, section]) => {
    data[key] = {
      topics: section.topics.map((name, index) => ({
        id: `${key}-default-${index}`,
        name,
        completed: false,
        source: "default",
      })),
      questions: [],
    };
  });

  return data;
}

function loadData() {
  const defaults = createDefaultData();

  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) return defaults;

    const parsed = JSON.parse(saved);

    return {
      ...defaults,
      ...parsed,
    };
  } catch {
    return defaults;
  }
}

function readArray(key) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : [];
  } catch {
    return [];
  }
}

function PlacementHub() {
  const [activeTab, setActiveTab] = useState("overview");
  const [data, setData] = useState(loadData);

  const [topicModal, setTopicModal] = useState(false);
  const [aiModal, setAiModal] = useState(false);
  const [questionModal, setQuestionModal] = useState(false);

  const [topicName, setTopicName] = useState("");
  const [aiPrompt, setAiPrompt] = useState("");

  const [questionNumber, setQuestionNumber] = useState("");
  const [questionTitle, setQuestionTitle] = useState("");
  const [difficulty, setDifficulty] = useState("Easy");

  const [pdfName, setPdfName] = useState("");

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  /*
   * ONLY Placement Hub data.
   * Main Analytics.jsx is NOT used here.
   */

  const stats = useMemo(() => {
    const result = {};

    Object.keys(SECTIONS).forEach((key) => {
      const topics = data[key]?.topics || [];
      const questions =
        key === "dsa" ? data[key]?.questions || [] : [];

      const total = topics.length + questions.length;

      const completed =
        topics.filter((item) => item.completed).length +
        questions.filter((item) => item.completed).length;

      result[key] = {
        total,
        completed,
        progress: total
          ? Math.round((completed / total) * 100)
          : 0,
      };
    });

    return result;
  }, [data]);

  const placementAnalytics = useMemo(() => {
    const sections = Object.keys(SECTIONS);

    let totalItems = 0;
    let completedItems = 0;

    sections.forEach((section) => {
      totalItems += stats[section].total;
      completedItems += stats[section].completed;
    });

    const dsaQuestions = data.dsa.questions || [];

    const leetcodeTotal = dsaQuestions.length;

    const leetcodeCompleted = dsaQuestions.filter(
      (question) => question.completed
    ).length;

    const placementReadiness = totalItems
      ? Math.round((completedItems / totalItems) * 100)
      : 0;

    return {
      placementReadiness,
      totalItems,
      completedItems,
      leetcodeTotal,
      leetcodeCompleted,
    };
  }, [data, stats]);

  const toggleTopic = (section, id) => {
    setData((current) => ({
      ...current,
      [section]: {
        ...current[section],
        topics: current[section].topics.map((topic) =>
          topic.id === id
            ? { ...topic, completed: !topic.completed }
            : topic
        ),
      },
    }));
  };

  const removeTopic = (section, id) => {
    setData((current) => ({
      ...current,
      [section]: {
        ...current[section],
        topics: current[section].topics.filter(
          (topic) => topic.id !== id
        ),
      },
    }));
  };

  const addTopic = () => {
    const value = topicName.trim();

    if (!value || !SECTIONS[activeTab]) return;

    setData((current) => ({
      ...current,
      [activeTab]: {
        ...current[activeTab],
        topics: [
          ...current[activeTab].topics,
          {
            id: createId(activeTab),
            name: value,
            completed: false,
            source: "manual",
          },
        ],
      },
    }));

    setTopicName("");
    setTopicModal(false);
  };

  const addQuestion = () => {
    if (!questionNumber.trim() || !questionTitle.trim()) {
      return;
    }

    setData((current) => ({
      ...current,
      dsa: {
        ...current.dsa,
        questions: [
          ...current.dsa.questions,
          {
            id: createId("leetcode"),
            number: questionNumber.trim(),
            title: questionTitle.trim(),
            difficulty,
            completed: false,
            source: "manual",
          },
        ],
      },
    }));

    setQuestionNumber("");
    setQuestionTitle("");
    setDifficulty("Easy");
    setQuestionModal(false);
  };

  const toggleQuestion = (id) => {
    setData((current) => ({
      ...current,
      dsa: {
        ...current.dsa,
        questions: current.dsa.questions.map((question) =>
          question.id === id
            ? {
                ...question,
                completed: !question.completed,
              }
            : question
        ),
      },
    }));
  };

  const removeQuestion = (id) => {
    setData((current) => ({
      ...current,
      dsa: {
        ...current.dsa,
        questions: current.dsa.questions.filter(
          (question) => question.id !== id
        ),
      },
    }));
  };

  const handlePdf = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setPdfName(file.name);

    /*
     * Later:
     * PDF → backend → AI → topics → preview → add
     *
     * No fake AI result is generated here.
     */
  };

  const generateAI = () => {
    /*
     * Later:
     *
     * POST /api/placement/ai/topics
     *
     * The backend will receive:
     * - section
     * - prompt
     * - PDF
     * - existing topics
     *
     * and return structured topics.
     */

    setAiModal(false);
  };

  const activeSection = SECTIONS[activeTab];

  return (
    <div className="placement-page">

      {/* HEADER */}

      <header className="placement-header">
        <div className="placement-title-area">
          <div className="placement-title-icon">
            <Target size={27} />
          </div>

          <div>
            <h1>Placement Hub</h1>
            <p>
              Prepare smarter and track your placement
              readiness.
            </p>
          </div>
        </div>

        {activeSection && (
          <div className="placement-header-actions">
            <button
              className="placement-outline-button"
              onClick={() => setTopicModal(true)}
            >
              <Plus size={15} />
              Add Topic
            </button>

            <button
              className="placement-ai-button"
              onClick={() => setAiModal(true)}
            >
              <WandSparkles size={15} />
              Add with AI
            </button>

            {activeTab === "dsa" && (
              <button
                className="placement-primary-button"
                onClick={() => setQuestionModal(true)}
              >
                <Code2 size={15} />
                Add LeetCode
              </button>
            )}
          </div>
        )}
      </header>

      {/* HORIZONTAL NAVIGATION */}

      <nav className="placement-tabs">
        {TABS.map((tab) => {
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              className={
                activeTab === tab.id
                  ? "placement-tab active"
                  : "placement-tab"
              }
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon size={15} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      <main className="placement-content">

        {/* =================================================
            OVERVIEW
        ================================================= */}

        {activeTab === "overview" && (
          <>
            <section className="placement-overview-hero">
              <div>
                <span className="placement-eyebrow">
                  PLACEMENT PREPARATION
                </span>

                <h2>
                  Build your preparation step by step.
                </h2>

                <p>
                  Complete topics, practice coding questions
                  and prepare for technical interviews.
                </p>
              </div>

              <div className="placement-readiness">
                <strong>
                  {placementAnalytics.placementReadiness}%
                </strong>

                <span>Placement Readiness</span>

                <div className="placement-progress">
                  <span
                    style={{
                      width: `${placementAnalytics.placementReadiness}%`,
                    }}
                  />
                </div>
              </div>
            </section>

            <section className="placement-stat-grid">
              {Object.entries(SECTIONS).map(
                ([id, section]) => {
                  const Icon = section.icon;

                  return (
                    <button
                      key={id}
                      className={`placement-stat-card ${section.color}`}
                      onClick={() => setActiveTab(id)}
                    >
                      <div className="stat-card-top">
                        <span className="stat-icon">
                          <Icon size={17} />
                        </span>

                        <ArrowRight size={15} />
                      </div>

                      <h3>{section.label}</h3>

                      <div className="stat-progress-row">
                        <strong>
                          {stats[id].progress}%
                        </strong>

                        <span>
                          {stats[id].completed}/
                          {stats[id].total}
                        </span>
                      </div>

                      <div className="placement-progress">
                        <span
                          style={{
                            width: `${stats[id].progress}%`,
                          }}
                        />
                      </div>
                    </button>
                  );
                }
              )}
            </section>

            <section className="placement-overview-grid">
              <div className="placement-card">
                <div className="card-heading">
                  <h3>Preparation Areas</h3>
                  <p>
                    Select an area and continue your
                    preparation.
                  </p>
                </div>

                <div className="area-list">
                  {Object.entries(SECTIONS).map(
                    ([id, section]) => {
                      const Icon = section.icon;

                      return (
                        <button
                          className="area-row"
                          key={id}
                          onClick={() => setActiveTab(id)}
                        >
                          <span
                            className={`area-icon ${section.color}`}
                          >
                            <Icon size={16} />
                          </span>

                          <span className="area-info">
                            <strong>
                              {section.label}
                            </strong>

                            <small>
                              {stats[id].completed} of{" "}
                              {stats[id].total} completed
                            </small>
                          </span>

                          <strong className="area-percent">
                            {stats[id].progress}%
                          </strong>

                          <ChevronRight size={15} />
                        </button>
                      );
                    }
                  )}
                </div>
              </div>

              <div className="placement-ai-card">
                <div className="ai-card-icon">
                  <Bot size={22} />
                </div>

                <span className="placement-eyebrow purple">
                  AI PREPARATION
                </span>

                <h3>
                  Build topics with AI.
                </h3>

                <p>
                  Tell AI what you want to prepare or upload
                  your syllabus/preparation PDF. AI will later
                  organize it into your selected section.
                </p>

                <button
                  className="placement-ai-button wide"
                  onClick={() => setAiModal(true)}
                >
                  <Sparkles size={15} />
                  Add Topics with AI
                </button>
              </div>
            </section>
          </>
        )}

        {/* =================================================
            DSA / JAVA / CORE CS / APTITUDE / INTERVIEW
        ================================================= */}

        {activeSection && (
          <section className="placement-section">

            <div className="section-page-header">
              <div>
                <span
                  className={`placement-eyebrow ${activeSection.color}`}
                >
                  PREPARATION
                </span>

                <h2>{activeSection.label}</h2>

                <p>
                  {activeSection.description}
                </p>
              </div>

              <div className="section-progress">
                <strong>
                  {stats[activeTab].progress}%
                </strong>

                <span>
                  {stats[activeTab].completed}/
                  {stats[activeTab].total} completed
                </span>
              </div>
            </div>

            <div className="section-toolbar">
              <div>
                <strong>Topics</strong>

                <span>
                  Mark a topic complete after you finish
                  studying it.
                </span>
              </div>

              <div className="toolbar-actions">
                <button
                  className="placement-outline-button"
                  onClick={() => setTopicModal(true)}
                >
                  <Plus size={14} />
                  Add Topic
                </button>

                <button
                  className="placement-ai-button"
                  onClick={() => setAiModal(true)}
                >
                  <WandSparkles size={14} />
                  Add with AI
                </button>

                <label className="placement-upload-button">
                  <FileUp size={14} />
                  PDF → AI

                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handlePdf}
                  />
                </label>

                {activeTab === "dsa" && (
                  <button
                    className="placement-outline-button"
                    onClick={() =>
                      setQuestionModal(true)
                    }
                  >
                    <Code2 size={14} />
                    Add LeetCode
                  </button>
                )}
              </div>
            </div>

            {pdfName && (
              <div className="pdf-selected">
                <Upload size={15} />

                <span>
                  {pdfName} selected for future PDF → AI
                  processing.
                </span>

                <button
                  onClick={() => setPdfName("")}
                >
                  <X size={14} />
                </button>
              </div>
            )}

            <div className="topic-list">
              {data[activeTab].topics.map((topic) => (
                <div
                  className={
                    topic.completed
                      ? "topic-row completed"
                      : "topic-row"
                  }
                  key={topic.id}
                >
                  <button
                    className="topic-check"
                    onClick={() =>
                      toggleTopic(activeTab, topic.id)
                    }
                  >
                    {topic.completed && (
                      <Check size={13} />
                    )}
                  </button>

                  <div className="topic-main">
                    <strong>{topic.name}</strong>

                    <span>
                      {topic.completed
                        ? "Completed"
                        : "Not completed"}
                    </span>
                  </div>

                  <button
                    className="topic-remove"
                    onClick={() =>
                      removeTopic(activeTab, topic.id)
                    }
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>

            {/* ONLY DSA LEETCODE */}

            {activeTab === "dsa" && (
              <section className="leetcode-section">
                <div className="leetcode-header">
                  <div>
                    <h3>LeetCode Questions</h3>
                    <p>
                      Track the problems you actually solve.
                    </p>
                  </div>

                  <div className="leetcode-actions">
                    <button
                      className="placement-ai-button"
                      onClick={() => setAiModal(true)}
                    >
                      <Sparkles size={14} />
                      AI Questions
                    </button>

                    <button
                      className="placement-primary-button"
                      onClick={() =>
                        setQuestionModal(true)
                      }
                    >
                      <Plus size={14} />
                      Add Question
                    </button>
                  </div>
                </div>

                {data.dsa.questions.length === 0 ? (
                  <div className="empty-question-state">
                    <Code2 size={24} />

                    <strong>
                      No LeetCode questions added
                    </strong>

                    <span>
                      Add manually or use AI later.
                    </span>
                  </div>
                ) : (
                  <div className="question-list">
                    {data.dsa.questions.map(
                      (question) => (
                        <div
                          className={
                            question.completed
                              ? "question-row completed"
                              : "question-row"
                          }
                          key={question.id}
                        >
                          <button
                            className="topic-check"
                            onClick={() =>
                              toggleQuestion(
                                question.id
                              )
                            }
                          >
                            {question.completed && (
                              <Check size={13} />
                            )}
                          </button>

                          <span className="question-number">
                            #{question.number}
                          </span>

                          <div className="question-info">
                            <strong>
                              {question.title}
                            </strong>
                          </div>

                          <span
                            className={`difficulty ${question.difficulty.toLowerCase()}`}
                          >
                            {question.difficulty}
                          </span>

                          <button
                            className="topic-remove"
                            onClick={() =>
                              removeQuestion(
                                question.id
                              )
                            }
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )
                    )}
                  </div>
                )}
              </section>
            )}

            {/* INTERVIEW AI */}

            {activeTab === "interview" && (
              <section className="interview-ai-panel">
                <div className="interview-ai-icon">
                  <Sparkles size={22} />
                </div>

                <div className="interview-ai-content">
                  <span className="placement-eyebrow purple">
                    AI INTERVIEW PREPARATION
                  </span>

                  <h3>
                    Prepare with StudyOS AI
                  </h3>

                  <p>
                    Later, AI will use your actual Placement
                    Hub preparation to create technical,
                    DSA, Java, Core CS and HR interview
                    practice.
                  </p>

                  <div className="interview-types">
                    <span>Technical</span>
                    <span>DSA</span>
                    <span>Java</span>
                    <span>Core CS</span>
                    <span>HR</span>
                  </div>

                  <button
                    className="placement-ai-button"
                    onClick={() => setAiModal(true)}
                  >
                    <Bot size={15} />
                    AI Interview Practice
                  </button>
                </div>
              </section>
            )}
          </section>
        )}

        {/* =================================================
            ONLY PLACEMENT HUB ANALYTICS
        ================================================= */}

        {activeTab === "analytics" && (
          <section className="placement-analytics">

            <div className="section-page-header">
              <div>
                <span className="placement-eyebrow cyan">
                  PLACEMENT HUB
                </span>

                <h2>Preparation Analytics</h2>

                <p>
                  Your placement preparation progress only.
                  This is separate from the main StudyOS
                  Analytics page.
                </p>
              </div>
            </div>

            <div className="placement-analytics-kpis">

              <div className="placement-analytics-card indigo">
                <div className="analytics-icon">
                  <Target size={18} />
                </div>

                <span>Placement Readiness</span>

                <strong>
                  {placementAnalytics.placementReadiness}%
                </strong>
              </div>

              <div className="placement-analytics-card green">
                <div className="analytics-icon">
                  <Check size={18} />
                </div>

                <span>Topics Completed</span>

                <strong>
                  {placementAnalytics.completedItems}
                </strong>
              </div>

              <div className="placement-analytics-card purple">
                <div className="analytics-icon">
                  <Code2 size={18} />
                </div>

                <span>LeetCode Solved</span>

                <strong>
                  {placementAnalytics.leetcodeCompleted}
                </strong>
              </div>

              <div className="placement-analytics-card orange">
                <div className="analytics-icon">
                  <Trophy size={18} />
                </div>

                <span>Total Preparation Items</span>

                <strong>
                  {placementAnalytics.totalItems}
                </strong>
              </div>
            </div>

            <div className="placement-analytics-grid">

              <div className="placement-card">
                <div className="card-heading">
                  <h3>Preparation Progress</h3>

                  <p>
                    Only Placement Hub topics and
                    LeetCode questions.
                  </p>
                </div>

                <div className="placement-analysis-list">
                  {Object.entries(SECTIONS).map(
                    ([id, section]) => {
                      const Icon = section.icon;

                      return (
                        <button
                          className="placement-analysis-row"
                          key={id}
                          onClick={() =>
                            setActiveTab(id)
                          }
                        >
                          <span
                            className={`analysis-section-icon ${section.color}`}
                          >
                            <Icon size={16} />
                          </span>

                          <span className="analysis-name">
                            <strong>
                              {section.label}
                            </strong>

                            <small>
                              {stats[id].completed}/
                              {stats[id].total} completed
                            </small>
                          </span>

                          <strong className="analysis-percent">
                            {stats[id].progress}%
                          </strong>

                          <ChevronRight size={15} />
                        </button>
                      );
                    }
                  )}
                </div>
              </div>

              <div className="placement-card placement-next-focus">
                <span className="placement-eyebrow">
                  NEXT FOCUS
                </span>

                <h3>
                  Areas that need attention
                </h3>

                <div className="focus-list">
                  {Object.entries(SECTIONS)
                    .sort(
                      ([, a], [, b]) =>
                        stats[a === SECTIONS[a] ? a : "dsa"]?.progress -
                        stats[b === SECTIONS[b] ? b : "dsa"]?.progress
                    )
                    .slice(0, 3)
                    .map(([id, section]) => {
                      const Icon = section.icon;

                      return (
                        <button
                          key={id}
                          className="focus-item"
                          onClick={() => setActiveTab(id)}
                        >
                          <span
                            className={`focus-icon ${section.color}`}
                          >
                            <Icon size={15} />
                          </span>

                          <span>
                            <strong>
                              {section.label}
                            </strong>

                            <small>
                              {stats[id].progress}%
                              completed
                            </small>
                          </span>

                          <ChevronRight size={14} />
                        </button>
                      );
                    })}
                </div>

                <div className="analytics-note">
                  <Sparkles size={15} />

                  <span>
                    AI will later analyze these real
                    preparation values and create your
                    personalized placement roadmap.
                  </span>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* =================================================
          ADD TOPIC MODAL
      ================================================= */}

      {topicModal && (
        <div
          className="placement-modal-overlay"
          onMouseDown={() => setTopicModal(false)}
        >
          <div
            className="placement-modal"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <div className="modal-header">
              <div>
                <span className="placement-eyebrow">
                  MANUAL TOPIC
                </span>

                <h3>
                  Add {activeSection?.label} Topic
                </h3>
              </div>

              <button
                className="modal-close"
                onClick={() => setTopicModal(false)}
              >
                <X size={17} />
              </button>
            </div>

            <label>Topic name</label>

            <input
              autoFocus
              value={topicName}
              onChange={(event) =>
                setTopicName(event.target.value)
              }
              placeholder="e.g. Sliding Window"
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  addTopic();
                }
              }}
            />

            <div className="modal-ai-hint">
              <Sparkles size={14} />
              You can also add multiple topics using AI.
            </div>

            <div className="modal-actions">
              <button
                className="placement-outline-button"
                onClick={() => setTopicModal(false)}
              >
                Cancel
              </button>

              <button
                className="placement-primary-button"
                onClick={addTopic}
              >
                <Plus size={14} />
                Add Topic
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =================================================
          AI MODAL
      ================================================= */}

      {aiModal && (
        <div
          className="placement-modal-overlay"
          onMouseDown={() => setAiModal(false)}
        >
          <div
            className="placement-modal ai-modal"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <div className="modal-header">
              <div>
                <span className="placement-eyebrow purple">
                  AI TOPIC BUILDER
                </span>

                <h3>Add with AI</h3>
              </div>

              <button
                className="modal-close"
                onClick={() => setAiModal(false)}
              >
                <X size={17} />
              </button>
            </div>

            <div className="ai-modal-hero">
              <div className="ai-modal-icon">
                <WandSparkles size={19} />
              </div>

              <div>
                <strong>
                  Tell AI what you want to prepare.
                </strong>

                <span>
                  AI will later create structured
                  preparation topics.
                </span>
              </div>
            </div>

            <label>Instruction</label>

            <textarea
              value={aiPrompt}
              onChange={(event) =>
                setAiPrompt(event.target.value)
              }
              placeholder={`Example:
Add 20 important DSA topics for placements.

Or:
Add important Java topics from beginner to advanced.`}
            />

            <div className="ai-examples">
              <button
                onClick={() =>
                  setAiPrompt(
                    "Add 20 important DSA topics for placements."
                  )
                }
              >
                DSA
              </button>

              <button
                onClick={() =>
                  setAiPrompt(
                    "Add important Java topics for placement preparation."
                  )
                }
              >
                Java
              </button>

              <button
                onClick={() =>
                  setAiPrompt(
                    "Add important DBMS and SQL interview topics."
                  )
                }
              >
                Core CS
              </button>

              <button
                onClick={() =>
                  setAiPrompt(
                    "Add important aptitude topics for campus placements."
                  )
                }
              >
                Aptitude
              </button>
            </div>

            <div className="ai-pdf-box">
              <FileUp size={18} />

              <div>
                <strong>
                  Upload preparation PDF
                </strong>

                <span>
                  AI will later read the PDF and convert
                  its contents into topics.
                </span>
              </div>

              <label>
                Upload

                <input
                  type="file"
                  accept=".pdf"
                  onChange={handlePdf}
                />
              </label>
            </div>

            <div className="modal-actions">
              <button
                className="placement-outline-button"
                onClick={() => setAiModal(false)}
              >
                Cancel
              </button>

              <button
                className="placement-ai-button"
                onClick={generateAI}
              >
                <Sparkles size={14} />
                Generate Topics
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =================================================
          LEETCODE MODAL
      ================================================= */}

      {questionModal && (
        <div
          className="placement-modal-overlay"
          onMouseDown={() =>
            setQuestionModal(false)
          }
        >
          <div
            className="placement-modal"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <div className="modal-header">
              <div>
                <span className="placement-eyebrow">
                  DSA
                </span>

                <h3>Add LeetCode Question</h3>
              </div>

              <button
                className="modal-close"
                onClick={() =>
                  setQuestionModal(false)
                }
              >
                <X size={17} />
              </button>
            </div>

            <div className="form-grid">
              <div>
                <label>Question No.</label>

                <input
                  autoFocus
                  value={questionNumber}
                  onChange={(event) =>
                    setQuestionNumber(event.target.value)
                  }
                  placeholder="e.g. 1"
                />
              </div>

              <div>
                <label>Difficulty</label>

                <select
                  value={difficulty}
                  onChange={(event) =>
                    setDifficulty(event.target.value)
                  }
                >
                  <option>Easy</option>
                  <option>Medium</option>
                  <option>Hard</option>
                </select>
              </div>
            </div>

            <label>Question title</label>

            <input
              value={questionTitle}
              onChange={(event) =>
                setQuestionTitle(event.target.value)
              }
              placeholder="e.g. Two Sum"
            />

            <div className="modal-actions">
              <button
                className="placement-outline-button"
                onClick={() =>
                  setQuestionModal(false)
                }
              >
                Cancel
              </button>

              <button
                className="placement-primary-button"
                onClick={addQuestion}
              >
                <Plus size={14} />
                Add Question
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PlacementHub;