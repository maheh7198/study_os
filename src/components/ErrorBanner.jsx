import { useState } from "react";
import { AlertCircle, ChevronDown, ChevronUp, RefreshCw } from "lucide-react";

export default function ErrorBanner({ error, onRetry, retryLabel = "Retry" }) {
  const [showDetails, setShowDetails] = useState(false);
  if (!error) return null;
  return (
    <section className="auth-error-banner" role="group" tabIndex={-1}>
      <AlertCircle size={18} aria-hidden="true" />
      <div className="auth-error-content">
        <strong>{error.title || "Request failed"}</strong>
        <p>{error.message || String(error)}</p>
        {error.fieldErrors && Object.keys(error.fieldErrors).length > 0 ? (
          <ul>{Object.entries(error.fieldErrors).map(([field, message]) => <li key={field}>{field}: {message}</li>)}</ul>
        ) : null}
        {error.retryable && onRetry ? <button className="auth-error-retry" type="button" onClick={onRetry}><RefreshCw size={14} />{retryLabel}</button> : null}
        {error.details || error.status ? (
          <>
            <button className="auth-error-details-toggle" type="button" onClick={() => setShowDetails((value) => !value)} aria-expanded={showDetails}>
              {showDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />} Details {error.status ? `· ${error.status} ${error.category || ""}` : ""}
            </button>
            {showDetails ? <pre className="auth-error-details">{error.details || error.code || "No additional details."}</pre> : null}
          </>
        ) : null}
      </div>
    </section>
  );
}
