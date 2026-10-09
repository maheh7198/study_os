import { useEffect, useState } from "react";
import {
  Bell,
  CheckCircle2,
  MoonStar,
  Palette,
  Settings as SettingsIcon,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
  UserRoundCog,
  Volume2,
} from "lucide-react";
import "./components/ui.css";
import "./Settings.css";
import Button from "./components/Button.jsx";
import Card from "./components/Card.jsx";
import Field from "./components/Field.jsx";
import Modal from "./components/Modal.jsx";
import PageHeader from "./components/PageHeader.jsx";
import { apiRequest } from "./services/api.js";

// Settings page stores the app profile and preferences that are shared across the shell UI.
const STORAGE_KEY = "studyos-settings";
const STUDYOS_KEYS = [
  "studyos-tasks",
  "studyos-subjects",
  "studyos-goals",
  "studyos-habits",
  "studyos-notes",
  "studyos-notifications",
  "studyos-placement-hub",
  "studyos-pomodoro-sessions",
  "studyos-pomodoro-active-timer",
  "studyos-study-plans",
  "studyos-studyplan-sessions",
  "studyos-study-timetable",
  "studyos-ai-history",
  "studyos-task-reminders-sent",
  "studyos-notifications-version",
  "studyos-settings",
  "studyos-feedback",
];

const defaultSettings = {
  profileName: "Student",
  email: "",
  theme: "light",
  notifications: true,
  notificationSound: true,
  reducedMotion: false,
  compactMode: false,
  analytics: true,
};

function readSettings() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      return { ...defaultSettings };
    }
    return { ...defaultSettings, ...JSON.parse(saved) };
  } catch {
    return { ...defaultSettings };
  }
}

function saveSettings(nextSettings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSettings));
    window.dispatchEvent(new Event("studyos-settings-changed"));
  } catch {
    // Ignore storage failures and continue safely.
  }
}

export default function Settings() {
  const [settings, setSettings] = useState(readSettings);
  const [showClearModal, setShowClearModal] = useState(false);
  const [toast, setToast] = useState("");
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!toast) return undefined;
    const timeoutId = setTimeout(() => setToast(""), 1600);
    return () => clearTimeout(timeoutId);
  }, [toast]);

  const updateSetting = (field, value) => {
    const nextSettings = { ...settings, [field]: value };
    setSettings(nextSettings);
    saveSettings(nextSettings);
    setToast("Saved");
  };

  const saveProfile = async () => {
    const trimmedName = settings.profileName.trim();
    const nextErrors = {};

    if (!trimmedName) {
      nextErrors.profileName = "Display name is required.";
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    try {
      await apiRequest("/profile", {
        method: "PUT",
        body: { name: trimmedName },
      });
      const nextSettings = { ...settings, profileName: trimmedName };
      setSettings(nextSettings);
      saveSettings(nextSettings);
      setToast("Saved");
    } catch (error) {
      setErrors({ profile: error.message || "Profile could not be saved." });
    }
  };

  const clearStudyData = async () => {
    try {
      await apiRequest("/data", { method: "DELETE" });
    } catch (error) {
      setToast(error.message || "Study data could not be cleared.");
      return;
    }
    STUDYOS_KEYS.forEach((key) => localStorage.removeItem(key));
    window.dispatchEvent(new Event("studyos-data-changed"));
    setShowClearModal(false);
    setToast("Data cleared");
  };

  const toggle = (field) => {
    updateSetting(field, !settings[field]);
  };

  return (
    <div className="settings-page page-shell">
      <PageHeader
        icon={SettingsIcon}
        title="Settings"
        subtitle="Customize the app around your study flow and focus preferences."
        action={
          <Button variant="secondary" type="button">
            <SlidersHorizontal size={15} />
            Preferences
          </Button>
        }
      />

      <div className="settings-grid">
        <Card className="settings-panel profile-panel">
          <div className="section-header">
            <div className="section-title-wrap">
              <UserRoundCog size={18} />
              <h3>Profile</h3>
            </div>
          </div>

          <div className="profile-summary">
            <div className="profile-avatar-ring">{(settings.profileName || "S").trim().charAt(0).toUpperCase() || "S"}</div>
            <div>
              <strong>{settings.profileName || "Student"}</strong>
              <small>{settings.email || "Add your email for reminders"}</small>
            </div>
          </div>

          <Field label="Display name">
            <input
              value={settings.profileName}
              onChange={(event) => setSettings((previous) => ({ ...previous, profileName: event.target.value }))}
              placeholder="Enter your name"
            />
            {errors.profileName ? <span className="field-error">{errors.profileName}</span> : null}
            {errors.profile ? <span className="field-error" role="alert">{errors.profile}</span> : null}
          </Field>

          <Field label="Email (optional)">
            <input
              type="email"
              value={settings.email}
              onChange={(event) => setSettings((previous) => ({ ...previous, email: event.target.value }))}
              placeholder="you@example.com"
            />
          </Field>

          <Button type="button" className="settings-save-button" onClick={saveProfile}>
            Save profile
          </Button>
        </Card>

        <Card className="settings-panel appearance-panel">
          <div className="section-header">
            <div className="section-title-wrap">
              <Palette size={18} />
              <h3>Appearance</h3>
            </div>
          </div>

          <div className="segmented-row">
            {[
              { value: "light", label: "Light" },
              { value: "dark", label: "Night" },
              { value: "system", label: "System" },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                className={`segmented-option ${settings.theme === option.value ? "active" : ""}`}
                aria-pressed={settings.theme === option.value}
                onClick={() => updateSetting("theme", option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>

          <div className="mini-copy">
            The app theme updates instantly in the study shell and all modal content.
          </div>
        </Card>

        <Card className="settings-panel">
          <div className="section-header">
            <div className="section-title-wrap">
              <Bell size={18} />
              <h3>Notifications</h3>
            </div>
          </div>

          <div className="toggle-row">
            <div>
              <strong>Important alerts</strong>
              <span>Task, goal and habit reminders.</span>
            </div>
            <button type="button" className={`switch-toggle ${settings.notifications ? "enabled" : ""}`} onClick={() => toggle("notifications")} aria-label="Toggle important alerts" aria-pressed={settings.notifications}>
              <span className="switch-knob" />
            </button>
          </div>

          <div className="toggle-row">
            <div>
              <strong>Notification sound</strong>
              <span>Play the subtle reminder chime.</span>
            </div>
            <button type="button" className={`switch-toggle ${settings.notificationSound ? "enabled" : ""}`} onClick={() => toggle("notificationSound")} aria-label="Toggle notification sound" aria-pressed={settings.notificationSound}>
              <span className="switch-knob" />
            </button>
          </div>
        </Card>

        <Card className="settings-panel">
          <div className="section-header">
            <div className="section-title-wrap">
              <MoonStar size={18} />
              <h3>Preferences</h3>
            </div>
          </div>

          <div className="toggle-row">
            <div>
              <strong>Reduced motion</strong>
              <span>Limit extra transitions and animation.</span>
            </div>
            <button type="button" className={`switch-toggle ${settings.reducedMotion ? "enabled" : ""}`} onClick={() => toggle("reducedMotion")} aria-label="Toggle reduced motion" aria-pressed={settings.reducedMotion}>
              <span className="switch-knob" />
            </button>
          </div>

          <div className="toggle-row">
            <div>
              <strong>Compact cards</strong>
              <span>Use tighter spacing across modules.</span>
            </div>
            <button type="button" className={`switch-toggle ${settings.compactMode ? "enabled" : ""}`} onClick={() => toggle("compactMode")} aria-label="Toggle compact cards" aria-pressed={settings.compactMode}>
              <span className="switch-knob" />
            </button>
          </div>

          <div className="toggle-row">
            <div>
              <strong>Smart analytics</strong>
              <span>Keep tracking and progress insights on.</span>
            </div>
            <button type="button" className={`switch-toggle ${settings.analytics ? "enabled" : ""}`} onClick={() => toggle("analytics")} aria-label="Toggle smart analytics" aria-pressed={settings.analytics}>
              <span className="switch-knob" />
            </button>
          </div>
        </Card>
      </div>

      <Card className="settings-panel danger-panel">
        <div className="section-header danger-header">
          <div className="section-title-wrap">
            <ShieldCheck size={18} />
            <h3>Privacy & data</h3>
          </div>
        </div>

        <div className="danger-block">
          <div>
            <strong>Clear all StudyOS data</strong>
            <p>This removes your local StudyOS browsing data from this device.</p>
          </div>
          <Button variant="secondary" type="button" onClick={() => setShowClearModal(true)}>
            <Trash2 size={15} />
            Clear all StudyOS data
          </Button>
        </div>
      </Card>

      {showClearModal ? (
        <Modal
          title="Clear all StudyOS data"
          onClose={() => setShowClearModal(false)}
          footer={
            <>
              <Button variant="secondary" type="button" onClick={() => setShowClearModal(false)}>
                Cancel
              </Button>
              <Button type="button" onClick={clearStudyData}>
                <CheckCircle2 size={15} />
                Confirm clear
              </Button>
            </>
          }
        >
          <div className="modal-body">
            <Volume2 size={24} />
            <p>This removes all saved StudyOS records and cannot be undone in this browser.</p>
          </div>
        </Modal>
      ) : null}

      {toast ? <div className="settings-toast">{toast}</div> : null}
    </div>
  );
}
