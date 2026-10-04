# StudyOS

StudyOS is a student productivity and placement-prep dashboard built with React and Vite.

## Run locally

1. Install dependencies:
   npm install
2. Start the app in development mode:
   npm run dev
3. Build for production:
   npm run build
4. Lint the codebase:
   npm run lint

## Project structure

- src/App.jsx — app shell, navigation, theme, notifications
- src/Settings.jsx — user settings page with local persistence
- src/Help.jsx — help and feedback page
- src/components — shared UI primitives
- src/*.jsx — module pages for notes, goals, tasks, analytics, and more

## LocalStorage keys

StudyOS stores its app data in browser localStorage under keys such as:

- studyos-tasks
- studyos-subjects
- studyos-goals
- studyos-habits
- studyos-notes
- studyos-notifications
- studyos-placement-hub
- studyos-pomodoro-sessions
- studyos-study-plans
- studyos-ai-history
- studyos-settings
- studyos-feedback

This makes the app work without a backend while keeping the data local to the browser.
