import { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  Check,
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronRight,
  Code2,
  Database,
  Eye,
  Globe2,
  Monitor,
  Network,
  Pencil,
  Plus,
  Search,
  Save,
  Sigma,
  Cpu,
  Brain,
  Calculator,
  FlaskConical,
  Palette,
  Languages,
  Terminal,
  GraduationCap,
  Atom,
  ArrowDownAZ,
  FileCode,
  LineChart,
  Trash2,
  X,
} from "lucide-react";

const ICON_OPTIONS = [
  { id: "monitor", color: "blue", Icon: Monitor }, { id: "network", color: "green", Icon: Network },
  { id: "database", color: "orange", Icon: Database }, { id: "globe", color: "pink", Icon: Globe2 },
  { id: "sigma", color: "purple", Icon: Sigma }, { id: "code", color: "gray", Icon: Code2 },
  { id: "cpu", color: "blue", Icon: Cpu }, { id: "brain", color: "purple", Icon: Brain },
  { id: "calculator", color: "orange", Icon: Calculator }, { id: "flask", color: "green", Icon: FlaskConical },
  { id: "palette", color: "pink", Icon: Palette }, { id: "languages", color: "blue", Icon: Languages },
  { id: "terminal", color: "gray", Icon: Terminal }, { id: "graduation", color: "purple", Icon: GraduationCap },
  { id: "atom", color: "green", Icon: Atom }, { id: "file-code", color: "orange", Icon: FileCode },
  { id: "line-chart", color: "pink", Icon: LineChart },
];

const EMPTY_FORM = {
  name: "",
  code: "",
  teacher: "",
  credits: "",
  semester: "",
  color: "blue",
  icon: "monitor",
};

const UNITS = [1, 2, 3, 4, 5];

function Subjects({ subjects = [], setSubjects }) {
  const [search, setSearch] = useState("");
  const [semesterFilter, setSemesterFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sortAZ, setSortAZ] = useState("A-Z");
  const [subjectModal, setSubjectModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [viewSubject, setViewSubject] = useState(null);
  const [topicSubject, setTopicSubject] = useState(null);
  const [topicSearch, setTopicSearch] = useState("");
  const [topicFilter, setTopicFilter] = useState("All");
  const [openUnits, setOpenUnits] = useState({ 1: true, 2: true, 3: true, 4: true, 5: true });
  const [topicModal, setTopicModal] = useState(false);
  const [editingTopicId, setEditingTopicId] = useState(null);
  const [topicForm, setTopicForm] = useState({ unit: 1, name: "", description: "" });
  const [deleteSubjectId, setDeleteSubjectId] = useState(null);
  const [deleteTopicId, setDeleteTopicId] = useState(null);
  const [notice, setNotice] = useState(null);
  const [formError, setFormError] = useState("");

  const getTopics = (subject) => (Array.isArray(subject?.topics) ? subject.topics : []);
  const getProgress = (subject) => {
    const topics = getTopics(subject);
    return topics.length ? Math.round((topics.filter((topic) => topic.completed).length / topics.length) * 100) : 0;
  };
  const getIconOption = (subject) => ICON_OPTIONS.find((item) => item.id === subject?.icon) || ICON_OPTIONS.find((item) => item.color === subject?.color) || ICON_OPTIONS[0];

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key !== "Escape") return;
      if (deleteSubjectId) setDeleteSubjectId(null);
      else if (deleteTopicId) setDeleteTopicId(null);
      else if (topicModal) setTopicModal(false);
      else if (subjectModal) closeSubjectModal();
      else if (viewSubject) setViewSubject(null);
      else if (topicSubject) setTopicSubject(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [deleteSubjectId, deleteTopicId, topicModal, subjectModal, viewSubject, topicSubject]);

  function showNotice(type, message) {
    setNotice({ type, message });
    window.setTimeout(() => setNotice(null), 3200);
  }

  const filteredSubjects = useMemo(() => {
    const query = search.trim().toLowerCase();
    const result = subjects.filter((subject) => {
      const matchesQuery = !query || [subject.name, subject.code, subject.teacher].some((value) => value?.toLowerCase().includes(query));
      const matchesSemester = semesterFilter === "All" || String(subject.semester) === semesterFilter;
      const progress = getProgress(subject);
      const matchesStatus = statusFilter === "All" || (statusFilter === "Completed" ? progress === 100 : progress < 100);
      return matchesQuery && matchesSemester && matchesStatus;
    });
    return [...result].sort((a, b) => {
      const comparison = (a.name || "").localeCompare(b.name || "");
      return sortAZ === "A-Z" ? comparison : -comparison;
    });
  }, [subjects, search, semesterFilter, statusFilter, sortAZ]);

  function openAddSubject() {
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
    setFormError("");
    setSubjectModal(true);
  }

  function openEditSubject(subject) {
    setEditingId(subject.id);
    setForm({ ...EMPTY_FORM, ...subject, name: subject.name || "", code: subject.code || "" });
    setFormError("");
    setSubjectModal(true);
  }

  function saveSubject() {
    const name = form.name.trim();
    const code = form.code.trim().toUpperCase();
    if (!name || name.length < 2) return setFormError("Enter a valid subject name.");
    if (!code || !/^[A-Z0-9][A-Z0-9 -]{1,19}$/.test(code)) return setFormError("Enter a valid subject code, such as CS301.");
    const duplicate = subjects.some((subject) => subject.id !== editingId && subject.code?.trim().toLowerCase() === code.toLowerCase());
    if (duplicate) return setFormError("A subject with this code already exists.");

    if (editingId) {
      setSubjects((previous) => previous.map((subject) => subject.id === editingId ? { ...subject, ...form, name, code } : subject));
      showNotice("success", "Subject updated successfully.");
    } else {
      setSubjects((previous) => [...previous, { id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, user_id: null, ...form, name, code, topics: [] }]);
      showNotice("success", "Subject added successfully.");
    }
    setSubjectModal(false);
    setEditingId(null);
  }

  function confirmDeleteSubject() {
    setSubjects((previous) => previous.filter((subject) => subject.id !== deleteSubjectId));
    setViewSubject(null);
    setTopicSubject(null);
    setDeleteSubjectId(null);
    showNotice("success", "Subject deleted successfully.");
  }

  function openTopicManager(subject) {
    setTopicSubject(subject);
    setTopicSearch("");
    setTopicFilter("All");
    setOpenUnits({ 1: true, 2: true, 3: true, 4: true, 5: true });
  }

  function openAddTopic(unit) {
    setEditingTopicId(null);
    setTopicForm({ unit, name: "", description: "" });
    setTopicModal(true);
  }

  function openEditTopic(topic) {
    setEditingTopicId(topic.id);
    setTopicForm({ unit: Number(topic.unit), name: topic.name || "", description: topic.description || "" });
    setTopicModal(true);
  }

  function saveTopic() {
    const name = topicForm.name.trim();
    if (!name) return showNotice("error", "Enter a topic name.");
    if (!topicSubject) return;
    const subjectId = topicSubject.id;
    const topicId = editingTopicId || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setSubjects((previous) => previous.map((subject) => {
      if (subject.id !== subjectId) return subject;
      const topics = getTopics(subject);
      const nextTopic = { id: topicId, unit: Number(topicForm.unit), name, description: topicForm.description.trim(), completed: false };
      return { ...subject, topics: editingTopicId ? topics.map((topic) => topic.id === editingTopicId ? { ...topic, ...nextTopic, completed: topic.completed } : topic) : [...topics, nextTopic] };
    }));
    setTopicSubject((previous) => {
      if (!previous) return previous;
      const topics = getTopics(previous);
      const nextTopic = { id: topicId, unit: Number(topicForm.unit), name, description: topicForm.description.trim(), completed: false };
      return { ...previous, topics: editingTopicId ? topics.map((topic) => topic.id === editingTopicId ? { ...topic, ...nextTopic, completed: topic.completed } : topic) : [...topics, nextTopic] };
    });
    setTopicModal(false);
    setEditingTopicId(null);
    showNotice("success", editingTopicId ? "Topic updated successfully." : "Topic added successfully.");
  }

  function toggleTopic(topicId) {
    if (!topicSubject) return;
    const subjectId = topicSubject.id;
    setSubjects((previous) => previous.map((subject) => subject.id === subjectId ? { ...subject, topics: getTopics(subject).map((topic) => topic.id === topicId ? { ...topic, completed: !topic.completed } : topic) } : subject));
    setTopicSubject((previous) => previous ? { ...previous, topics: getTopics(previous).map((topic) => topic.id === topicId ? { ...topic, completed: !topic.completed } : topic) } : previous);
  }

  function confirmDeleteTopic() {
    if (!topicSubject) return;
    const subjectId = topicSubject.id;
    setSubjects((previous) => previous.map((subject) => subject.id === subjectId ? { ...subject, topics: getTopics(subject).filter((topic) => topic.id !== deleteTopicId) } : subject));
    setTopicSubject((previous) => previous ? { ...previous, topics: getTopics(previous).filter((topic) => topic.id !== deleteTopicId) } : previous);
    setDeleteTopicId(null);
    showNotice("success", "Topic deleted successfully.");
  }

  function getFilteredTopics(unit) {
    if (!topicSubject) return [];
    const query = topicSearch.trim().toLowerCase();
    return getTopics(topicSubject).filter((topic) => {
      const matchesQuery = !query || topic.name?.toLowerCase().includes(query) || topic.description?.toLowerCase().includes(query);
      const matchesFilter = topicFilter === "All" || (topicFilter === "Completed" ? topic.completed : !topic.completed);
      return Number(topic.unit) === unit && matchesQuery && matchesFilter;
    });
  }

  function closeSubjectModal() {
    setSubjectModal(false);
    setEditingId(null);
    setFormError("");
  }

  return (
    <section className="subjects-page" aria-labelledby="subjects-title">
  {notice && (
    <div
      className={`subjects-toast ${notice.type}`}
      role="status"
    >
      <span>
        {notice.type === "success" ? (
          <Check size={18} />
        ) : (
          <X size={18} />
        )}
      </span>
      {notice.message}
    </div>
  )}

  <header className="subjects-header">
    <div className="subjects-heading">
      <div
        className="subjects-heading-icon"
        style={{
          width: "52px",
          height: "52px",
          minWidth: "52px",
          borderRadius: "15px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#ffffff",
          background:
            "linear-gradient(135deg, #6366f1, #a855f7)",
          boxShadow:
            "0 8px 24px rgba(99, 102, 241, 0.25)",
        }}
      >
        <BookOpen size={30} color="#ffffff" />
      </div>

      <div>
        <h1 id="subjects-title">Subjects</h1>
        <p>Manage your subjects and syllabus</p>
      </div>
    </div>

    <button
      className="subjects-primary"
      onClick={openAddSubject}
    >
      <Plus size={18} />
      Add Subject
    </button>
  </header>

  <div className="subjects-toolbar">
    <label className="subjects-search">
      <Search size={17} />
      <span className="visually-hidden">
        Search subjects
      </span>
      <input
        placeholder="Search subjects..."
        value={search}
        onChange={(event) =>
          setSearch(event.target.value)
        }
      />
    </label>

    <select
      className="subjects-filter semester-filter"
      value={semesterFilter}
      onChange={(event) =>
        setSemesterFilter(event.target.value)
      }
      aria-label="Filter by semester"
    >
      <option value="All">All Semesters</option>

      {Array.from(
        { length: 8 },
        (_, index) => index + 1
      ).map((semester) => (
        <option
          key={semester}
          value={semester}
        >
          Semester {semester}
        </option>
      ))}
    </select>

    <select
      className="subjects-filter status-filter"
      value={statusFilter}
      onChange={(event) =>
        setStatusFilter(event.target.value)
      }
      aria-label="Filter by status"
    >
      <option value="All">All Status</option>
      <option value="Ongoing">Ongoing</option>
      <option value="Completed">Completed</option>
    </select>

    <button
      className="subjects-sort"
      onClick={() =>
        setSortAZ((value) =>
          value === "A-Z" ? "Z-A" : "A-Z"
        )
      }
      aria-label={`Sort subjects ${
        sortAZ === "A-Z"
          ? "descending"
          : "ascending"
      }`}
    >
      <ArrowDownAZ size={16} />
      {sortAZ}
    </button>
  </div>
      {filteredSubjects.length === 0 ? <EmptyState onAdd={openAddSubject} /> : <div className="subjects-grid">{filteredSubjects.map((subject) => {
        const iconOption = getIconOption(subject);
        const Icon = iconOption.Icon;
        const topics = getTopics(subject);
        const progress = getProgress(subject);
        return <article className="subject-card" key={subject.id}>
          <div className="subject-card-top"><div className={`subject-icon ${iconOption.color}`}><Icon size={24} /></div><div className="subject-actions">
            <button title="View subject details" aria-label="View subject details" onClick={() => setViewSubject(subject)}><Eye size={16} /></button><button title="Manage topics" aria-label="Manage topics" onClick={() => openTopicManager(subject)}><Plus size={16} /></button><button title="Edit subject" aria-label="Edit subject" onClick={() => openEditSubject(subject)}><Pencil size={15} /></button><button className="danger" title="Delete subject" aria-label="Delete subject" onClick={() => setDeleteSubjectId(subject.id)}><Trash2 size={15} /></button>
          </div></div>
          <h2>{subject.name}</h2><p className="subject-code">{subject.code}</p><p className="subject-teacher">{subject.teacher || "Faculty / Teacher not added"}</p><div className="subject-meta"><span>{subject.credits || "-"} Credits</span><span>Semester {subject.semester || "-"}</span></div><div className="subject-progress-label"><span>{topics.filter((topic) => topic.completed).length} / {topics.length} topics</span><strong>{progress}%</strong></div><div className="subject-progress"><span style={{ width: `${progress}%` }} /></div><div className="subject-card-footer"><span>{progress === 100 ? "Completed" : "Ongoing"}</span><span className={progress === 100 ? "complete" : ""}>{progress === 100 ? "Complete" : "In progress"}</span></div>
        </article>;
      })}</div>}

      {subjectModal && <Modal onClose={closeSubjectModal}><div className="modal-heading"><div><h2>{editingId ? "Edit Subject" : "Add Subject"}</h2><p>{editingId ? "Update your subject information" : "Enter subject information below"}</p></div><button className="modal-close" onClick={closeSubjectModal} aria-label="Close"><X size={19} /></button></div>{formError && <div className="form-error" role="alert">{formError}</div>}<div className="subject-form-grid"><Field label="Subject Name"><input value={form.name} placeholder="e.g. Database Management" onChange={(event) => setForm({ ...form, name: event.target.value })} /></Field><Field label="Subject Code"><input value={form.code} placeholder="e.g. CS301" onChange={(event) => setForm({ ...form, code: event.target.value })} /></Field><Field label="Faculty / Teacher" full><input value={form.teacher} placeholder="e.g. Prof. A. Sharma" onChange={(event) => setForm({ ...form, teacher: event.target.value })} /></Field><Field label="Credits"><select value={form.credits} onChange={(event) => setForm({ ...form, credits: event.target.value })}><option value="">Select</option>{[1, 2, 3, 4, 5, 6].map((credit) => <option key={credit} value={credit}>{credit} {credit === 1 ? "Credit" : "Credits"}</option>)}</select></Field><Field label="Semester"><select value={form.semester} onChange={(event) => setForm({ ...form, semester: event.target.value })}><option value="">Select</option>{Array.from({ length: 8 }, (_, index) => index + 1).map((semester) => <option key={semester} value={semester}>Semester {semester}</option>)}</select></Field></div><div className="color-label">Color / Icon</div><div className="color-options">{ICON_OPTIONS.map(({ id, color, Icon }) => <button type="button" key={id} className={`color-option ${color} ${form.icon === id ? "selected" : ""}`} onClick={() => setForm({ ...form, icon: id, color })} title={`Select ${id} icon`} aria-label={`Select ${id} icon`}><Icon size={20} /></button>)}</div><ModalFooter><button className="subjects-cancel" onClick={closeSubjectModal}>Cancel</button><button className="subjects-primary" onClick={saveSubject}><Save size={17} />{editingId ? "Save Changes" : "Add Subject"}</button></ModalFooter></Modal>}
      {viewSubject && <Modal small onClose={() => setViewSubject(null)}>{(() => { const option = getIconOption(viewSubject); const Icon = option.Icon; return <><div className="modal-heading"><div className="details-title"><span className={`subject-icon ${option.color}`}><Icon size={21} /></span><div><h2>{viewSubject.name}</h2><p>{viewSubject.code}</p></div></div><button className="modal-close" onClick={() => setViewSubject(null)} aria-label="Close"><X size={19} /></button></div><div className="details-grid"><Detail label="Faculty / Teacher" value={viewSubject.teacher || "Not added"} /><Detail label="Credits" value={viewSubject.credits || "Not added"} /><Detail label="Semester" value={viewSubject.semester ? `Semester ${viewSubject.semester}` : "Not added"} /><Detail label="Total topics" value={getTopics(viewSubject).length} /><Detail label="Completed topics" value={getTopics(viewSubject).filter((topic) => topic.completed).length} /><Detail label="Pending topics" value={getTopics(viewSubject).filter((topic) => !topic.completed).length} /></div><div className="details-progress"><span>Progress <strong>{getProgress(viewSubject)}%</strong></span><div className="subject-progress"><span style={{ width: `${getProgress(viewSubject)}%` }} /></div></div><ModalFooter><button className="subjects-cancel" onClick={() => setViewSubject(null)}>Close</button></ModalFooter></>; })()}</Modal>}
      {topicSubject && <Modal wide onClose={() => setTopicSubject(null)}><div className="modal-heading"><div><h2>{topicSubject.name} Topics</h2><p>Manage Units 1-5 and track syllabus progress.</p></div><button className="modal-close" onClick={() => setTopicSubject(null)} aria-label="Close"><X size={19} /></button></div><div className="topic-toolbar"><label className="subjects-search"><Search size={17} /><span className="visually-hidden">Search topics</span><input placeholder="Search topics..." value={topicSearch} onChange={(event) => setTopicSearch(event.target.value)} /></label><select value={topicFilter} onChange={(event) => setTopicFilter(event.target.value)} aria-label="Filter topics"><option>All</option><option>Pending</option><option>Completed</option></select></div>{UNITS.map((unit) => { const topics = getFilteredTopics(unit); return <div className="topic-unit" key={unit}><button className="unit-header" onClick={() => setOpenUnits((previous) => ({ ...previous, [unit]: !previous[unit] }))}><span>{openUnits[unit] ? <ChevronDown size={17} /> : <ChevronRight size={17} />}Unit {unit}</span><small>{topics.length} topics</small></button>{openUnits[unit] && <div className="unit-content"><button className="add-topic" onClick={() => openAddTopic(unit)}><Plus size={15} />Add Topic</button>{topics.length === 0 ? <p className="no-topics">No topics added yet.</p> : topics.map((topic) => <div className="topic-row" key={topic.id}><button className={`topic-check ${topic.completed ? "done" : ""}`} onClick={() => toggleTopic(topic.id)} title={topic.completed ? "Mark pending" : "Mark completed"} aria-label={topic.completed ? "Mark pending" : "Mark completed"}>{topic.completed ? <CheckCircle2 size={21} /> : <Circle size={21} />}</button><div className="topic-copy"><strong className={topic.completed ? "completed" : ""}>{topic.name}</strong>{topic.description && <small>{topic.description}</small>}</div><div className="topic-actions"><button onClick={() => openEditTopic(topic)} title="Edit topic" aria-label="Edit topic"><Pencil size={15} /></button><button className="danger" onClick={() => setDeleteTopicId(topic.id)} title="Delete topic" aria-label="Delete topic"><Trash2 size={15} /></button></div></div>)}</div>}</div>; })}</Modal>}
      {topicModal && <Modal small onClose={() => setTopicModal(false)}><div className="modal-heading"><div><h2>{editingTopicId ? "Edit Topic" : "Add Topic"}</h2><p>Add a topic to the subject syllabus.</p></div><button className="modal-close" onClick={() => setTopicModal(false)} aria-label="Close"><X size={19} /></button></div><Field label="Unit"><select value={topicForm.unit} onChange={(event) => setTopicForm({ ...topicForm, unit: Number(event.target.value) })}>{UNITS.map((unit) => <option key={unit} value={unit}>Unit {unit}</option>)}</select></Field><Field label="Topic Name"><input value={topicForm.name} placeholder="e.g. Introduction to DBMS" onChange={(event) => setTopicForm({ ...topicForm, name: event.target.value })} /></Field><Field label="Description (Optional)"><textarea value={topicForm.description} placeholder="Add a short description..." onChange={(event) => setTopicForm({ ...topicForm, description: event.target.value })} /></Field><ModalFooter><button className="subjects-cancel" onClick={() => setTopicModal(false)}>Cancel</button><button className="subjects-primary" onClick={saveTopic}><Save size={17} />{editingTopicId ? "Save Changes" : "Add Topic"}</button></ModalFooter></Modal>}
      {deleteSubjectId && <ConfirmModal title="Delete Subject?" message="This will remove the subject and all of its topics." onCancel={() => setDeleteSubjectId(null)} onConfirm={confirmDeleteSubject} confirmLabel="Delete Subject" />}
      {deleteTopicId && <ConfirmModal title="Delete Topic?" message="This topic will be permanently removed from the syllabus." onCancel={() => setDeleteTopicId(null)} onConfirm={confirmDeleteTopic} confirmLabel="Delete Topic" />}
    </section>
  );
}

function EmptyState({ onAdd }) {
  return <div className="subjects-empty"><div className="books-illustration" aria-hidden="true"><span className="book book-back" /><span className="book book-middle" /><span className="book book-front" /><i className="book-spark spark-one" /><i className="book-spark spark-two" /></div><h2>No subjects found</h2><p>Add your first subject to start managing your syllabus.</p><button className="subjects-primary" onClick={onAdd}><Plus size={18} />Add Subject</button></div>;
}

function Field({ label, full = false, children }) {
  return <label className={`subject-field ${full ? "full" : ""}`}><span>{label}</span>{children}</label>;
}

function Detail({ label, value }) {
  return <div className="subject-detail"><span>{label}</span><strong>{value}</strong></div>;
}

function Modal({ children, small = false, wide = false, onClose }) {
  return <div className="subject-overlay" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><div className={`subject-modal ${small ? "small" : ""} ${wide ? "wide" : ""}`}>{children}</div></div>;
}

function ModalFooter({ children }) {
  return <div className="subject-modal-footer">{children}</div>;
}

function ConfirmModal({ title, message, onCancel, onConfirm, confirmLabel }) {
  return <Modal small onClose={onCancel}><div className="confirm-content"><div className="confirm-icon"><Trash2 size={22} /></div><h2>{title}</h2><p>{message}</p></div><ModalFooter><button className="subjects-cancel" onClick={onCancel}>Cancel</button><button className="subjects-danger" onClick={onConfirm}><Trash2 size={17} />{confirmLabel}</button></ModalFooter></Modal>;
}

export default Subjects;
