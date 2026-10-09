const ERROR_MESSAGES = {
  400: "Some details are not valid. Please check and try again.",
  401: "Your session expired. Please log in again.",
  403: "You do not have permission to do this.",
  404: "We could not find what you asked for.",
  408: "The request took too long. Please try again.",
  409: "An account with this email already exists.",
  422: "Some details are not valid. Please check and try again.",
  429: "Too many attempts. Please wait before trying again.",
  500: "Something went wrong on our side. Please try again.",
  502: "StudyOS server is temporarily unavailable. Please try again in a moment.",
  503: "StudyOS server is temporarily unavailable. Please try again in a moment.",
  504: "StudyOS server is temporarily unavailable. Please try again in a moment.",
};

function headerValue(headers, name) {
  if (!headers) return null;
  if (typeof headers.get === "function") return headers.get(name);
  return headers[name] ?? headers[name.toLowerCase()] ?? null;
}

function normalizeFieldErrors(body) {
  const source = body?.errors ?? body?.fieldErrors;
  if (!source || typeof source !== "object") return {};
  return Object.fromEntries(Object.entries(source).map(([field, value]) => [
    field,
    Array.isArray(value) ? String(value[0] ?? "Invalid value.") : String(value?.message ?? value),
  ]));
}

// Fetch follows ordinary redirects, and does not surface informational 1xx responses.
export function normalizeHttpError({ status = 0, body = null, headers, error, request = "other", online = true, timeout = false } = {}) {
  const fieldErrors = normalizeFieldErrors(body);
  const retryAfterValue = headerValue(headers, "retry-after");
  const retryAfterNumber = Number(retryAfterValue);
  const retryAfterSeconds = Number.isFinite(retryAfterNumber) && retryAfterNumber > 0
    ? Math.ceil(retryAfterNumber)
    : retryAfterValue && Number.isFinite(Date.parse(retryAfterValue))
      ? Math.max(1, Math.ceil((Date.parse(retryAfterValue) - Date.now()) / 1000))
      : null;
  let category = "client";
  let title = "Request failed";
  let message = "The request could not be completed. Please try again.";
  let retryable = false;

  if (timeout) return { status: 408, category: "client", title: "Request timed out", message: ERROR_MESSAGES[408], retryAfterSeconds: null, fieldErrors, retryable: true, details: error?.message || null };
  if (status >= 100 && status < 200) return { status, category: "informational", title: "", message: "", retryAfterSeconds: null, fieldErrors: {}, retryable: false };
  if (status >= 200 && status < 300) return { status, category: "success", title: "Success", message: "", retryAfterSeconds: null, fieldErrors: {}, retryable: false };
  if (status >= 300 && status < 400) return { status, category: "redirect", title: "Unexpected redirect", message: "The server returned an unexpected redirect. Please try again.", retryAfterSeconds: null, fieldErrors, retryable: false };
  if (!status) {
    category = "network";
    title = online ? "Connection problem" : "You’re offline";
    message = online ? "Cannot reach the server. Check your internet connection, or make sure the backend is running." : "You appear to be offline. Reconnect and try again.";
    retryable = true;
  } else if (status >= 400 && status < 500) {
    title = "Check your request";
    message = ERROR_MESSAGES[status] || "We could not complete that request. Please check and try again.";
    if (status === 401 && request === "login") message = "Incorrect email or password.";
    if (status === 409 && request === "register") message = "An account with this email already exists.";
    if (status === 408) retryable = true;
    if (status === 429) {
      retryable = true;
      if (retryAfterSeconds) message = `Too many attempts. Please wait ${retryAfterSeconds} seconds.`;
    }
  } else if (status >= 500) {
    category = "server";
    title = status === 503 ? "Service unavailable" : "Server error";
    message = ERROR_MESSAGES[status] || "Something went wrong on our side. Please try again.";
    retryable = [500, 502, 503, 504].includes(status);
  }

  // Keep server details secondary and avoid replacing the safe, status-specific message.
  const details = error?.message || body?.message || body?.error || null;
  return { status, category, title, message, retryAfterSeconds, fieldErrors, retryable, details };
}
