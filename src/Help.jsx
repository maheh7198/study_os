import { useEffect, useRef, useState } from 'react';
import { BookOpen, ChevronDown, HelpCircle, MessageSquareText, Sparkles, ThumbsUp } from 'lucide-react';
import './components/ui.css';
import './Help.css';
import Button from './components/Button.jsx';
import Card from './components/Card.jsx';
import Field from './components/Field.jsx';
import PageHeader from './components/PageHeader.jsx';

const STORAGE_KEY = 'studyos-feedback';

const helpCategories = [
  {
    icon: BookOpen,
    title: 'Study planning',
    description: 'Map subjects, tasks, and revision blocks to your week without overwhelm.',
  },
  {
    icon: Sparkles,
    title: 'Focus habits',
    description: 'Use Pomodoro and streak tracking to stay consistent and build momentum.',
  },
  {
    icon: MessageSquareText,
    title: 'Career prep',
    description: 'Turn placement topics and practice goals into a realistic roadmap.',
  },
];

const faqs = [
  {
    question: 'How do I use my Dashboard?',
    answer: 'The Dashboard gives you a quick overview of your study activity and shortcuts to the main StudyOS modules.',
  },
  {
    question: 'How do I organize my Subjects?',
    answer: 'Open Subjects to add the courses you are studying. Your subjects can then be used to organize tasks and study sessions.',
  },
  {
    question: 'How do I keep track of Tasks?',
    answer: 'Add tasks with their due dates and subjects, then update their status as you make progress.',
  },
  {
    question: 'Can I organize my study Notes?',
    answer: 'Use Notes to create and search your saved study notes, keeping useful material together as you learn.',
  },
  {
    question: 'Where do I track my goals?',
    answer: 'Use Goals to set milestones, update progress, and keep deadlines visible as you work toward them.',
  },
  {
    question: 'How do I create a study plan?',
    answer: 'Open Study Plan, add a session, and choose its date, subject, topic, and time.',
  },
  {
    question: 'How does Pomodoro help me focus?',
    answer: 'Use Pomodoro to work in focused intervals with breaks between sessions. Choose a duration that suits your task.',
  },
  {
    question: 'Where can I build consistent habits?',
    answer: 'Habit Tracker helps you record the habits you want to practice and review your consistency over time.',
  },
  {
    question: 'How do I prepare for placements?',
    answer: 'Use Placement Hub to work through career-prep topics and track progress toward placement readiness.',
  },
  {
    question: 'What can AI Mentor help me with?',
    answer: 'AI Mentor can help explain study topics and suggest ways to structure your learning. Review suggestions and adapt them to your needs.',
  },
];

function loadFeedback() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

export default function Help() {
  const [form, setForm] = useState({ name: 'Student', email: '', category: 'General', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [history, setHistory] = useState(loadFeedback);
  const [openFaq, setOpenFaq] = useState(null);
  const feedbackRef = useRef(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch {
      // Ignore storage failures gracefully.
    }
  }, [history]);

  const handleSubmit = (event) => {
    event.preventDefault();
    const nextEntry = { ...form, createdAt: new Date().toISOString() };
    setHistory((previous) => [nextEntry, ...previous]);
    setSubmitted(true);
    setForm({ name: form.name, email: '', category: 'General', message: '' });
  };

  return (
    <div className="help-page page-shell">
      <PageHeader
        icon={HelpCircle}
        title="Help & Feedback"
        subtitle="Quick guidance, FAQs, and a place to send product feedback."
        action={<Button variant="secondary" type="button" onClick={() => feedbackRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}><ThumbsUp size={15} /> Share feedback</Button>}
      />

      <div className="help-grid">
        {helpCategories.map(({ icon: Icon, title, description }) => (
          <Card key={title} className="help-card">
            <div className="help-icon"><Icon size={19} strokeWidth={1.9} /></div>
            <div className="help-card-copy">
              <h3>{title}</h3>
              <p>{description}</p>
            </div>
          </Card>
        ))}
      </div>

      <div className="help-lower-grid">
        <Card className="help-panel faq-panel">
          <div className="help-panel-heading">
            <div>
              <span className="help-eyebrow">NEED A HAND?</span>
              <h3>Frequently asked questions</h3>
            </div>
          </div>
          <div className="faq-list">
            {faqs.map(({ question, answer }, index) => {
              const isOpen = openFaq === index;
              const answerId = `help-faq-answer-${index}`;
              return (
                <div key={question} className={`faq-item ${isOpen ? 'open' : ''}`}>
                  <button
                    className="faq-question"
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={answerId}
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                  >
                    <span>{question}</span>
                    <ChevronDown size={17} aria-hidden="true" />
                  </button>
                  <div className="faq-answer" id={answerId} hidden={!isOpen}>
                    <p>{answer}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="help-panel feedback-panel" ref={feedbackRef}>
          <div className="help-panel-heading">
            <div>
              <span className="help-eyebrow">HELP US IMPROVE</span>
              <h3>Send feedback</h3>
            </div>
          </div>
          <form onSubmit={handleSubmit} className="feedback-form">
            <Field label="Name">
              <input value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} placeholder="Your name" />
            </Field>
            <Field label="Email">
              <input type="email" value={form.email} onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))} placeholder="you@example.com" />
            </Field>
            <Field label="Category">
              <select value={form.category} onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}>
                <option value="General">General</option>
                <option value="Study plan">Study plan</option>
                <option value="Productivity">Productivity</option>
                <option value="Placement">Placement</option>
              </select>
            </Field>
            <Field label="Message">
              <textarea value={form.message} onChange={(event) => setForm((prev) => ({ ...prev, message: event.target.value }))} placeholder="Tell us what would help you most..." />
            </Field>
            <Button type="submit" className="feedback-submit">Submit feedback</Button>
            {submitted ? <div className="feedback-success">Feedback saved locally in StudyOS.</div> : null}
          </form>
        </Card>
      </div>
    </div>
  );
}
