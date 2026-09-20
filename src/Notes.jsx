import { useEffect, useMemo, useState } from "react";
import {
  FileText,
  Plus,
  Search,
  Star,
  Flame,
  Paperclip,
  Eye,
  Pencil,
  Trash2,
  Archive,
  Download,
  Copy,
  Sparkles,
  CheckCircle2,
  Clock3,
  File,
  FileImage,
  FileType2,
  Grid3X3,
  List,
  SlidersHorizontal,
  X,
  RotateCcw,
  BookOpen,
  Target,
  Link2,
  Brain,
  Upload,
  MoreHorizontal,
} from "lucide-react";
import "./Notes.css";

const STORAGE_KEY = "studyos-notes";

const NOTE_TYPES = [
  "Class Notes",
  "Revision",
  "Assignment",
  "Practical",
  "Important",
  "Personal",
];

const SEMESTERS = [
  "Semester 1",
  "Semester 2",
  "Semester 3",
  "Semester 4",
  "Semester 5",
  "Semester 6",
  "Semester 7",
  "Semester 8",
];

const createEmptyNote = () => ({
  id: Date.now(),
  title: "",
  subject: "",
  semester: "",
  unit: "",
  topic: "",
  type: "Class Notes",
  tags: [],
  content: "",
  attachments: [],
  favorite: false,
  important: false,
  archived: false,
  deleted: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

const formatDate = (date) => {
  if (!date) return "";

  const value = new Date(date);

  if (Number.isNaN(value.getTime())) return "";

  return value.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getFileIcon = (fileName = "") => {
  const extension = fileName.split(".").pop()?.toLowerCase();

  if (["png", "jpg", "jpeg", "webp", "gif"].includes(extension)) {
    return FileImage;
  }

  if (["pdf"].includes(extension)) {
    return FileType2;
  }

  return File;
};

const Notes = ({
  subjects = [],
  setNotifications,
}) => {
  const [notes, setNotes] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [search, setSearch] = useState("");
  const [semesterFilter, setSemesterFilter] = useState("All Semesters");
  const [subjectFilter, setSubjectFilter] = useState("All Subjects");
  const [typeFilter, setTypeFilter] = useState("All Types");
  const [tagFilter, setTagFilter] = useState("All Tags");
  const [sortBy, setSortBy] = useState("Recently Updated");

  const [viewMode, setViewMode] = useState("grid");

  const [showEditor, setShowEditor] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const [editingNote, setEditingNote] = useState(null);
  const [selectedNote, setSelectedNote] = useState(null);

  const [showFilters, setShowFilters] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  }, [notes]);

  useEffect(() => {
    if (!toast) return;

    const timer = setTimeout(() => {
      setToast(null);
    }, 2500);

    return () => clearTimeout(timer);
  }, [toast]);

  const showToast = (message, type = "success") => {
    setToast({
      message,
      type,
    });
  };
const addNotification = (
  title,
  message,
  type = "note"
) => {
  if (!setNotifications) return;

  setNotifications((previous) => [
    {
      id: `note-${Date.now()}-${Math.random()}`,
      type,
      title,
      message,
      read: false,
      createdAt: new Date().toISOString(),
      time: new Date().toISOString(),
    },
    ...(Array.isArray(previous)
      ? previous
      : []),
  ]);
};
  const subjectOptions = useMemo(() => {
    const names = subjects
      .map((subject) => subject?.name)
      .filter(Boolean);

    return [...new Set(names)];
  }, [subjects]);

  const allTags = useMemo(() => {
    return [
      ...new Set(
        notes.flatMap((note) =>
          Array.isArray(note.tags) ? note.tags : []
        )
      ),
    ];
  }, [notes]);

  const visibleNotes = useMemo(() => {
    let result = notes.filter((note) => !note.deleted);

    if (search.trim()) {
      const query = search.toLowerCase();

      result = result.filter((note) => {
        const searchableText = [
          note.title,
          note.subject,
          note.semester,
          note.unit,
          note.topic,
          note.type,
          note.content,
          ...(note.tags || []),
          ...(note.attachments || []).map((file) => file.name),
        ]
          .join(" ")
          .toLowerCase();

        return searchableText.includes(query);
      });
    }

    if (semesterFilter !== "All Semesters") {
      result = result.filter(
        (note) => note.semester === semesterFilter
      );
    }

    if (subjectFilter !== "All Subjects") {
      result = result.filter(
        (note) => note.subject === subjectFilter
      );
    }

    if (typeFilter !== "All Types") {
      result = result.filter(
        (note) => note.type === typeFilter
      );
    }

    if (tagFilter !== "All Tags") {
      result = result.filter((note) =>
        note.tags?.includes(tagFilter)
      );
    }

    switch (sortBy) {
      case "Recently Added":
        result.sort(
          (a, b) =>
            new Date(b.createdAt) -
            new Date(a.createdAt)
        );
        break;

      case "A-Z":
        result.sort((a, b) =>
          a.title.localeCompare(b.title)
        );
        break;

      case "Z-A":
        result.sort((a, b) =>
          b.title.localeCompare(a.title)
        );
        break;

      case "Most Viewed":
        result.sort(
          (a, b) =>
            Number(b.views || 0) -
            Number(a.views || 0)
        );
        break;

      default:
        result.sort(
          (a, b) =>
            new Date(b.updatedAt) -
            new Date(a.updatedAt)
        );
    }

    return result;
  }, [
    notes,
    search,
    semesterFilter,
    subjectFilter,
    typeFilter,
    tagFilter,
    sortBy,
  ]);

  const stats = useMemo(() => {
    const activeNotes = notes.filter(
      (note) =>
        !note.deleted &&
        !note.archived
    );

    return {
      total: activeNotes.length,

      files: activeNotes.reduce(
        (total, note) =>
          total +
          (note.attachments?.length || 0),
        0
      ),

      favorites: activeNotes.filter(
        (note) => note.favorite
      ).length,

      important: activeNotes.filter(
        (note) => note.important
      ).length,

      thisWeek: activeNotes.filter((note) => {
        const created = new Date(note.createdAt);
        const now = new Date();

        const difference =
          now.getTime() -
          created.getTime();

        return (
          difference <=
          7 * 24 * 60 * 60 * 1000
        );
      }).length,
    };
  }, [notes]);

  const openAddNote = () => {
    setEditingNote(createEmptyNote());
    setShowEditor(true);
  };

  const openEditNote = (note) => {
    setEditingNote({
      ...note,
      tags: [...(note.tags || [])],
      attachments: [...(note.attachments || [])],
    });

    setShowEditor(true);
  };

  const saveNote = (note) => {
    if (!note.title.trim()) {
      showToast(
        "Please enter a note title.",
        "error"
      );
      return;
    }

    const updatedNote = {
      ...note,
      title: note.title.trim(),
      updatedAt: new Date().toISOString(),
    };

    setNotes((previous) => {
      const exists = previous.some(
        (item) => item.id === updatedNote.id
      );

      if (exists) {
        return previous.map((item) =>
          item.id === updatedNote.id
            ? updatedNote
            : item
        );
      }

      return [
        updatedNote,
        ...previous,
      ];
    });

    setShowEditor(false);
    setEditingNote(null);

    showToast(
      note.createdAt
        ? "Note saved successfully."
        : "Note created successfully."
    );
    addNotification(
  "Note Saved",
  `"${updatedNote.title}" was saved successfully.`,
  "note"
);
  };

  const deleteNote = (id) => {
    setNotes((previous) =>
      previous.map((note) =>
        note.id === id
          ? {
              ...note,
              deleted: true,
              updatedAt:
                new Date().toISOString(),
            }
          : note
      )
    );

    showToast("Note moved to Trash.");
    addNotification(
  "Note Moved to Trash",
  "The note was moved to Trash.",
  "note"
);
  };

  const toggleFavorite = (id) => {
    setNotes((previous) =>
      previous.map((note) =>
        note.id === id
          ? {
              ...note,
              favorite: !note.favorite,
              updatedAt:
                new Date().toISOString(),
            }
          : note
      )
    );
  };

  const toggleImportant = (id) => {
    setNotes((previous) =>
      previous.map((note) =>
        note.id === id
          ? {
              ...note,
              important: !note.important,
              updatedAt:
                new Date().toISOString(),
            }
          : note
      )
    );
  };

  const archiveNote = (id) => {
    setNotes((previous) =>
      previous.map((note) =>
        note.id === id
          ? {
              ...note,
              archived: true,
              updatedAt:
                new Date().toISOString(),
            }
          : note
      )
    );

    showToast("Note archived.");
    addNotification(
  "Note Archived",
  "The note was archived successfully.",
  "note"
);
  };

  const duplicateNote = (note) => {
    const duplicate = {
      ...note,
      id: Date.now(),
      title: `${note.title} Copy`,
      favorite: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setNotes((previous) => [
      duplicate,
      ...previous,
    ]);

    showToast("Note duplicated.");
    addNotification(
  "Note Duplicated",
  `"${duplicate.title}" was created as a duplicate.`,
  "note"
);
  };

  const openPreview = (note) => {
    setSelectedNote(note);

    setNotes((previous) =>
      previous.map((item) =>
        item.id === note.id
          ? {
              ...item,
              views:
                Number(item.views || 0) + 1,
            }
          : item
      )
    );

    setShowPreview(true);
  };

  const clearFilters = () => {
    setSearch("");
    setSemesterFilter("All Semesters");
    setSubjectFilter("All Subjects");
    setTypeFilter("All Types");
    setTagFilter("All Tags");
  };

  return (
    <div className="notes-page">
      {/* PAGE HEADER */}
      <div className="notes-page-header">
        <div className="notes-title-wrap">
          <div className="notes-title-icon">
            <FileText size={30} />
          </div>

          <div>
            <h1>Notes</h1>
            <p>
              Organize, create and manage all your
              study notes
            </p>
          </div>
        </div>

        <button
          className="notes-primary-btn"
          onClick={openAddNote}
        >
          <Plus size={18} />
          Add Note
        </button>
      </div>

      {/* SUMMARY */}
      <div className="notes-stats">
        <div className="notes-stat-card">
          <div className="notes-stat-icon blue">
            <FileText size={20} />
          </div>

          <div>
            <strong>{stats.total}</strong>
            <span>Total Notes</span>
          </div>
        </div>

        <div className="notes-stat-card">
          <div className="notes-stat-icon purple">
            <Paperclip size={20} />
          </div>

          <div>
            <strong>{stats.files}</strong>
            <span>PDFs & Files</span>
          </div>
        </div>

        <div className="notes-stat-card">
          <div className="notes-stat-icon yellow">
            <Star size={20} />
          </div>

          <div>
            <strong>{stats.favorites}</strong>
            <span>Favorites</span>
          </div>
        </div>

        <div className="notes-stat-card">
          <div className="notes-stat-icon red">
            <Flame size={20} />
          </div>

          <div>
            <strong>{stats.important}</strong>
            <span>Exam Important</span>
          </div>
        </div>

        <div className="notes-stat-card">
          <div className="notes-stat-icon green">
            <Clock3 size={20} />
          </div>

          <div>
            <strong>{stats.thisWeek}</strong>
            <span>This Week</span>
          </div>
        </div>
      </div>

      {/* SEARCH + FILTERS */}
      <div className="notes-toolbar">
        <div className="notes-search">
          <Search size={18} />

          <input
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search notes..."
          />
        </div>

        <select
          value={semesterFilter}
          onChange={(event) =>
            setSemesterFilter(event.target.value)
          }
        >
          <option>All Semesters</option>

          {SEMESTERS.map((semester) => (
            <option
              key={semester}
              value={semester}
            >
              {semester}
            </option>
          ))}
        </select>

        <select
          value={subjectFilter}
          onChange={(event) =>
            setSubjectFilter(event.target.value)
          }
        >
          <option>All Subjects</option>

          {subjectOptions.map((subject) => (
            <option
              key={subject}
              value={subject}
            >
              {subject}
            </option>
          ))}
        </select>

        <select
          value={typeFilter}
          onChange={(event) =>
            setTypeFilter(event.target.value)
          }
        >
          <option>All Types</option>

          {NOTE_TYPES.map((type) => (
            <option
              key={type}
              value={type}
            >
              {type}
            </option>
          ))}
        </select>

        <select
          value={tagFilter}
          onChange={(event) =>
            setTagFilter(event.target.value)
          }
        >
          <option>All Tags</option>

          {allTags.map((tag) => (
            <option
              key={tag}
              value={tag}
            >
              {tag}
            </option>
          ))}
        </select>

        <button
          className="notes-filter-btn"
          onClick={() =>
            setShowFilters((value) => !value)
          }
        >
          <SlidersHorizontal size={17} />
          Filter
        </button>

        <div className="notes-view-switch">
          <button
            className={
              viewMode === "grid"
                ? "active"
                : ""
            }
            onClick={() =>
              setViewMode("grid")
            }
            title="Grid view"
          >
            <Grid3X3 size={16} />
            Grid
          </button>

          <button
            className={
              viewMode === "list"
                ? "active"
                : ""
            }
            onClick={() =>
              setViewMode("list")
            }
            title="List view"
          >
            <List size={16} />
            List
          </button>
        </div>

        <select
          className="notes-sort"
          value={sortBy}
          onChange={(event) =>
            setSortBy(event.target.value)
          }
        >
          <option>
            Recently Updated
          </option>
          <option>
            Recently Added
          </option>
          <option>A-Z</option>
          <option>Z-A</option>
          <option>Most Viewed</option>
        </select>
      </div>

      {showFilters && (
        <div className="notes-filter-panel">
          <div>
            <strong>Quick Filters</strong>
            <span>
              Refine your notes
            </span>
          </div>

          <button
            onClick={() => {
              setSearch("");
              setSemesterFilter(
                "All Semesters"
              );
              setSubjectFilter(
                "All Subjects"
              );
              setTypeFilter("All Types");
              setTagFilter("All Tags");
            }}
          >
            <RotateCcw size={14} />
            Reset Filters
          </button>

          <button
            onClick={() =>
              setNotes((previous) =>
                previous.map((note) => ({
                  ...note,
                  favorite: true,
                }))
              )
            }
          >
            <Star size={14} />
            Favorites
          </button>

          <button
            onClick={() =>
              setNotes((previous) =>
                previous.map((note) => ({
                  ...note,
                  important: true,
                }))
              )
            }
          >
            <Flame size={14} />
            Important
          </button>
        </div>
      )}

      {/* NOTES */}
      <div className="notes-section-header">
        <div>
          <h2>
            {search
              ? "Search Results"
              : "My Notes"}
          </h2>

          <span>
            {visibleNotes.length}{" "}
            {visibleNotes.length === 1
              ? "note"
              : "notes"}
          </span>
        </div>
      </div>

      {visibleNotes.length === 0 ? (
        <div className="notes-empty">
          <div className="notes-empty-icon">
            <BookOpen size={34} />
          </div>

          <h3>
            No notes found
          </h3>

          <p>
            Create your first note or upload
            your study material.
          </p>

          <button
            className="notes-primary-btn"
            onClick={openAddNote}
          >
            <Plus size={17} />
            Add Note
          </button>
        </div>
      ) : (
        <div
          className={
            viewMode === "grid"
              ? "notes-grid"
              : "notes-list"
          }
        >
          {visibleNotes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              onPreview={openPreview}
              onEdit={openEditNote}
              onDelete={deleteNote}
              onFavorite={toggleFavorite}
              onImportant={toggleImportant}
              onArchive={archiveNote}
              onDuplicate={duplicateNote}
            />
          ))}
        </div>
      )}

      {/* AI QUICK TOOLS */}
      <div className="notes-ai-strip">
        <div className="notes-ai-icon">
          <Sparkles size={22} />
        </div>

        <div>
          <strong>
            StudyOS AI for Notes
          </strong>

          <span>
            Summarize notes, generate questions,
            flashcards and explain difficult topics.
          </span>
        </div>

        <button>
          <Sparkles size={16} />
          Ask StudyOS AI
        </button>
      </div>

      {/* EDITOR */}
      {showEditor && editingNote && (
        <NoteEditor
          note={editingNote}
          subjects={subjects}
          onClose={() => {
            setShowEditor(false);
            setEditingNote(null);
          }}
          onSave={saveNote}
        />
      )}

      {/* PREVIEW */}
      {showPreview && selectedNote && (
        <NotePreview
          note={selectedNote}
          onClose={() => {
            setShowPreview(false);
            setSelectedNote(null);
          }}
          onEdit={() => {
            setShowPreview(false);
            openEditNote(selectedNote);
          }}
          onFavorite={() =>
            toggleFavorite(selectedNote.id)
          }
          onImportant={() =>
            toggleImportant(selectedNote.id)
          }
        />
      )}

      {toast && (
        <div
          className={`notes-toast ${toast.type}`}
        >
          <CheckCircle2 size={17} />
          {toast.message}
        </div>
      )}
    </div>
  );
};

/* =====================================================
   NOTE CARD
===================================================== */

const NoteCard = ({
  note,
  onPreview,
  onEdit,
  onDelete,
  onFavorite,
  onImportant,
  onArchive,
  onDuplicate,
}) => {
  const FileIcon =
    note.attachments?.length > 0
      ? getFileIcon(
          note.attachments[0]?.name
        )
      : FileText;

  return (
    <article className="note-card">
      <div className="note-card-top">
        <div className="note-subject-badge">
          {note.subject || "Note"}
        </div>

        <div className="note-card-actions">
          <button
            title="Preview"
            onClick={() =>
              onPreview(note)
            }
          >
            <Eye size={16} />
          </button>

          <button
            title="Edit"
            onClick={() =>
              onEdit(note)
            }
          >
            <Pencil size={16} />
          </button>

          <button
            title="More"
            className="note-more"
          >
            <MoreHorizontal size={16} />
          </button>
        </div>
      </div>

      <div className="note-card-icon">
        <FileIcon size={25} />
      </div>

      <div className="note-card-heading">
        <h3>{note.title}</h3>

        <button
          className={
            note.favorite
              ? "favorite active"
              : "favorite"
          }
          onClick={() =>
            onFavorite(note.id)
          }
          title="Favorite"
        >
          <Star
            size={17}
            fill={
              note.favorite
                ? "currentColor"
                : "none"
          }
        />
        </button>
      </div>

      <div className="note-card-meta">
        {note.semester && (
          <span>{note.semester}</span>
        )}

        {note.unit && (
          <span>{note.unit}</span>
        )}
      </div>

      {note.topic && (
        <p className="note-card-topic">
          {note.topic}
        </p>
      )}

      {note.content && (
        <p className="note-card-description">
          {note.content.replace(
            /<[^>]*>/g,
            ""
          ).slice(0, 120)}
          {note.content.length > 120
            ? "..."
            : ""}
        </p>
      )}

      <div className="note-card-labels">
        <span className="note-type-label">
          {note.type}
        </span>

        {note.important && (
          <span className="note-important-label">
            Important
          </span>
        )}
      </div>

      {note.tags?.length > 0 && (
        <div className="note-tags">
          {note.tags
            .slice(0, 3)
            .map((tag) => (
              <span key={tag}>
                #{tag}
              </span>
            ))}
        </div>
      )}

      <div className="note-card-footer">
        <div>
          {note.attachments?.length > 0 && (
            <span className="attachment-count">
              <Paperclip size={14} />
              {note.attachments.length}
            </span>
          )}

          {note.important && (
            <button
              className="important-mini"
              onClick={() =>
                onImportant(note.id)
              }
              title="Remove Important"
            >
              <Flame size={14} />
            </button>
          )}
        </div>

        <span>
          Updated{" "}
          {formatDate(note.updatedAt)}
        </span>
      </div>

      <div className="note-card-hidden-actions">
        <button
          onClick={() =>
            onDuplicate(note)
          }
        >
          <Copy size={14} />
          Duplicate
        </button>

        <button
          onClick={() =>
            onArchive(note.id)
          }
        >
          <Archive size={14} />
          Archive
        </button>

        <button
          className="danger"
          onClick={() =>
            onDelete(note.id)
          }
        >
          <Trash2 size={14} />
          Trash
        </button>
      </div>
    </article>
  );
};

/* =====================================================
   NOTE EDITOR
===================================================== */

const NoteEditor = ({
  note,
  subjects,
  onClose,
  onSave,
}) => {
  const [form, setForm] = useState(note);
  const [tagInput, setTagInput] =
    useState("");

  const updateField = (
    field,
    value
  ) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const addTag = () => {
    const value = tagInput.trim();

    if (
      !value ||
      form.tags.includes(value)
    ) {
      setTagInput("");
      return;
    }

    setForm((previous) => ({
      ...previous,
      tags: [
        ...previous.tags,
        value,
      ],
    }));

    setTagInput("");
  };

  const removeTag = (tag) => {
    setForm((previous) => ({
      ...previous,
      tags: previous.tags.filter(
        (item) => item !== tag
      ),
    }));
  };

  const handleFiles = (event) => {
    const selectedFiles = Array.from(
      event.target.files || []
    );

    const fileData =
      selectedFiles.map((file) => ({
        name: file.name,
        size: file.size,
        type: file.type,
      }));

    setForm((previous) => ({
      ...previous,
      attachments: [
        ...(previous.attachments || []),
        ...fileData,
      ],
    }));
  };

  return (
    <div className="notes-modal-overlay">
      <div className="notes-editor-modal">
        <div className="notes-modal-header">
          <div>
            <span>
              {note.title
                ? "Edit Note"
                : "Add New Note"}
            </span>

            <small>
              Organize your study material
            </small>
          </div>

          <button
            onClick={onClose}
            className="notes-close-btn"
          >
            <X size={19} />
          </button>
        </div>

        <div className="notes-editor-body">
          <div className="notes-form-grid">
            <label>
              <span>Note Title *</span>

              <input
                value={form.title}
                onChange={(event) =>
                  updateField(
                    "title",
                    event.target.value
                  )
                }
                placeholder="e.g. DBMS Normalization"
              />
            </label>

            <label>
              <span>Subject</span>

              <select
                value={form.subject}
                onChange={(event) =>
                  updateField(
                    "subject",
                    event.target.value
                  )
                }
              >
                <option value="">
                  Select subject
                </option>

                {subjects
                  .map(
                    (subject) =>
                      subject?.name
                  )
                  .filter(Boolean)
                  .map((subject) => (
                    <option
                      key={subject}
                      value={subject}
                    >
                      {subject}
                    </option>
                  ))}
              </select>
            </label>

            <label>
              <span>Semester</span>

              <select
                value={form.semester}
                onChange={(event) =>
                  updateField(
                    "semester",
                    event.target.value
                  )
                }
              >
                <option value="">
                  Select semester
                </option>

                {SEMESTERS.map(
                  (semester) => (
                    <option
                      key={semester}
                      value={semester}
                    >
                      {semester}
                    </option>
                  )
                )}
              </select>
            </label>

            <label>
              <span>Unit</span>

              <select
                value={form.unit}
                onChange={(event) =>
                  updateField(
                    "unit",
                    event.target.value
                  )
                }
              >
                <option value="">
                  Select unit
                </option>

                {[
                  "Unit 1",
                  "Unit 2",
                  "Unit 3",
                  "Unit 4",
                  "Unit 5",
                ].map((unit) => (
                  <option
                    key={unit}
                    value={unit}
                  >
                    {unit}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Topic</span>

              <input
                value={form.topic}
                onChange={(event) =>
                  updateField(
                    "topic",
                    event.target.value
                  )
                }
                placeholder="e.g. Normalization"
              />
            </label>

            <label>
              <span>Note Type</span>

              <select
                value={form.type}
                onChange={(event) =>
                  updateField(
                    "type",
                    event.target.value
                  )
                }
              >
                {NOTE_TYPES.map(
                  (type) => (
                    <option
                      key={type}
                      value={type}
                    >
                      {type}
                    </option>
                  )
                )}
              </select>
            </label>
          </div>

          <div className="notes-editor-field">
            <span>Tags</span>

            <div className="notes-tags-editor">
              {form.tags.map(
                (tag) => (
                  <span key={tag}>
                    #{tag}

                    <button
                      onClick={() =>
                        removeTag(tag)
                      }
                    >
                      <X size={12} />
                    </button>
                  </span>
                )
              )}

              <input
                value={tagInput}
                onChange={(event) =>
                  setTagInput(
                    event.target.value
                  )
                }
                onKeyDown={(event) => {
                  if (
                    event.key ===
                    "Enter"
                  ) {
                    event.preventDefault();
                    addTag();
                  }
                }}
                placeholder="Add tag..."
              />
            </div>
          </div>

          <div className="notes-rich-editor">
            <div className="notes-editor-tools">
              <button
                type="button"
                title="Bold"
              >
                <strong>B</strong>
              </button>

              <button
                type="button"
                title="Italic"
              >
                <em>I</em>
              </button>

              <button
                type="button"
                title="Underline"
              >
                <u>U</u>
              </button>

              <button
                type="button"
                title="Checklist"
              >
                <CheckCircle2 size={15} />
              </button>

              <button
                type="button"
                title="Link"
              >
                <Link2 size={15} />
              </button>

              <button
                type="button"
                title="AI"
              >
                <Sparkles size={15} />
              </button>
            </div>

            <textarea
              value={form.content}
              onChange={(event) =>
                updateField(
                  "content",
                  event.target.value
                )
              }
              placeholder="Write your notes here..."
            />
          </div>

          <div className="notes-attachment-box">
            <div>
              <Upload size={20} />

              <strong>
                Attach study material
              </strong>

              <span>
                PDF, DOC, PPT, images and TXT
              </span>
            </div>

            <label className="notes-upload-btn">
              <Paperclip size={15} />
              Choose Files

              <input
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.png,.jpg,.jpeg,.webp"
                onChange={handleFiles}
              />
            </label>
          </div>

          {form.attachments?.length >
            0 && (
            <div className="notes-attachment-list">
              {form.attachments.map(
                (file, index) => (
                  <div
                    key={`${file.name}-${index}`}
                  >
                    <FileText
                      size={16}
                    />

                    <span>
                      {file.name}
                    </span>

                    <button
                      onClick={() =>
                        setForm(
                          (previous) => ({
                            ...previous,
                            attachments:
                              previous.attachments.filter(
                                (
                                  _,
                                  fileIndex
                                ) =>
                                  fileIndex !==
                                  index
                              ),
                          })
                        )
                      }
                    >
                      <X size={14} />
                    </button>
                  </div>
                )
              )}
            </div>
          )}
        </div>

        <div className="notes-modal-footer">
          <button
            className="notes-secondary-btn"
            onClick={onClose}
          >
            Cancel
          </button>

          <button
            className="notes-primary-btn"
            onClick={() => onSave(form)}
          >
            <CheckCircle2 size={16} />
            Save Note
          </button>
        </div>
      </div>
    </div>
  );
};

/* =====================================================
   NOTE PREVIEW
===================================================== */

const NotePreview = ({
  note,
  onClose,
  onEdit,
  onFavorite,
  onImportant,
}) => {
  return (
    <div className="notes-modal-overlay">
      <div className="notes-preview-modal">
        <div className="notes-modal-header">
          <div>
            <span>{note.title}</span>

            <small>
              {note.subject || "No subject"}
              {note.semester
                ? ` • ${note.semester}`
                : ""}
              {note.unit
                ? ` • ${note.unit}`
                : ""}
            </small>
          </div>

          <button
            onClick={onClose}
            className="notes-close-btn"
          >
            <X size={19} />
          </button>
        </div>

        <div className="notes-preview-toolbar">
          <button onClick={onEdit}>
            <Pencil size={15} />
            Edit
          </button>

          <button
            onClick={onFavorite}
          >
            <Star
              size={15}
              fill={
                note.favorite
                  ? "currentColor"
                  : "none"
              }
            />
            Favorite
          </button>

          <button
            onClick={onImportant}
          >
            <Flame size={15} />
            Important
          </button>

          <button>
            <Download size={15} />
            Export
          </button>

          <button>
            <Brain size={15} />
            AI Study
          </button>
        </div>

        <div className="notes-preview-content">
          {note.topic && (
            <div className="notes-preview-topic">
              <Target size={16} />
              {note.topic}
            </div>
          )}

          <div className="notes-preview-text">
            {note.content ? (
              <p>
                {note.content}
              </p>
            ) : (
              <div className="notes-preview-empty">
                <FileText size={28} />
                <span>
                  This note does not have
                  content yet.
                </span>
              </div>
            )}
          </div>

          {note.attachments?.length >
            0 && (
            <div className="notes-preview-files">
              <h3>
                Attachments
              </h3>

              {note.attachments.map(
                (file, index) => (
                  <div
                    key={`${file.name}-${index}`}
                  >
                    <Paperclip size={15} />

                    <span>
                      {file.name}
                    </span>

                    <button>
                      <Eye size={14} />
                      Preview
                    </button>

                    <button>
                      <Download
                        size={14}
                      />
                      Download
                    </button>
                  </div>
                )
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Notes;