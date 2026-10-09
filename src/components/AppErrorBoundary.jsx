import { Component } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export function ErrorPage({ status = 500, title, message, onRetry }) {
  const descriptions = {
    403: "You do not have permission to view this page.",
    404: "We could not find the page you requested.",
    500: "Something went wrong while displaying this page.",
    503: "StudyOS is temporarily unavailable. Please try again shortly.",
  };
  return (
    <section className="error-page" role="alert">
      <AlertTriangle size={30} aria-hidden="true" />
      <p className="error-page-code">{status}</p>
      <h1>{title || "Something went wrong"}</h1>
      <p>{message || descriptions[status] || "Please try again."}</p>
      <button type="button" onClick={onRetry || (() => window.location.reload())}><RefreshCw size={16} /> Reload</button>
    </section>
  );
}

export class AppErrorBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error) {
    if (import.meta.env.DEV) console.error("StudyOS interface crashed:", error);
  }
  render() {
    if (this.state.failed) return <ErrorPage />;
    return this.props.children;
  }
}
