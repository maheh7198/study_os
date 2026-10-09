import { normalizeHttpError } from "../api/httpErrors.js";

export const API_BASE_URL = (import.meta.env.VITE_API_URL || "/api").replace(/\/+$/, "");

function reportStatus(status, message) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("studyos-api-status", { detail: { status, message } }));
  }
}

export async function apiRequest(path, { method = "GET", body, signal, timeoutMs = 15_000 } = {}) {
  const url = API_BASE_URL + (path.startsWith("/") ? path : "/" + path);
  const controller = new AbortController();
  const abortFromCaller = () => controller.abort(signal?.reason);
  signal?.addEventListener("abort", abortFromCaller, { once: true });
  const timeoutId = setTimeout(() => controller.abort(new DOMException("The request timed out.", "TimeoutError")), timeoutMs);
  const cleanup = () => {
    clearTimeout(timeoutId);
    signal?.removeEventListener("abort", abortFromCaller);
  };
  const isLogin = method === "POST" && path === "/auth/login";
  const requestType = isLogin ? "login" : method === "POST" && path === "/auth/register" ? "register" : "other";
  let response;
  try {
    response = await fetch(url, {
      method,
      credentials: "include",
      headers: body === undefined ? {} : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (error) {
    const timedOut = controller.signal.aborted && !signal?.aborted;
    cleanup();
    const normalized = normalizeHttpError({ error, online: typeof navigator === "undefined" || navigator.onLine, request: requestType, timeout: timedOut });
    const apiError = Object.assign(new Error(normalized.message), normalized, { code: timedOut ? "REQUEST_TIMEOUT" : "API_UNAVAILABLE" });
    reportStatus("error", normalized.message);
    throw apiError;
  }

  let payload = null;
  if (response.status !== 204) {
    try { payload = await response.json(); }
    catch (error) {
      const timedOut = controller.signal.aborted && !signal?.aborted;
      cleanup();
      if (timedOut) {
        const normalized = normalizeHttpError({ error, timeout: true, request: requestType });
        reportStatus("error", normalized.message);
        throw Object.assign(new Error(normalized.message), normalized, { code: "REQUEST_TIMEOUT" });
      }
      if (response.ok) {
        const invalid = new Error("StudyOS returned an invalid response.");
        Object.assign(invalid, { code: "INVALID_API_RESPONSE", status: response.status });
        throw invalid;
      }
    }
  }
  cleanup();
  if (!response.ok || (payload?.success !== true && response.status !== 204)) {
    const normalized = normalizeHttpError({ status: response.status, body: payload, headers: response.headers, request: requestType });
    const apiError = Object.assign(new Error(normalized.message), normalized, { code: payload?.code || payload?.error || "API_ERROR" });
    if (response.status === 401 && path !== "/auth/me" && path !== "/auth/logout") {
      window.dispatchEvent(new CustomEvent("studyos-auth-expired", { detail: { message: normalized.message } }));
    }
    reportStatus("error", normalized.message);
    throw apiError;
  }
  reportStatus("ok", "");
  return payload?.data;
}

// Keep the response body streaming while applying the shared status mapper to the handshake.
export async function apiStreamRequest(path, { method = "POST", body, signal, timeoutMs = 15_000 } = {}) {
  const url = API_BASE_URL + (path.startsWith("/") ? path : "/" + path);
  const controller = new AbortController();
  const abortFromCaller = () => controller.abort(signal?.reason);
  signal?.addEventListener("abort", abortFromCaller, { once: true });
  const timeoutId = setTimeout(() => controller.abort(new DOMException("The request timed out.", "TimeoutError")), timeoutMs);
  const cleanup = () => {
    clearTimeout(timeoutId);
    signal?.removeEventListener("abort", abortFromCaller);
  };

  let response;
  try {
    response = await fetch(url, {
      method,
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body ?? {}),
      signal: controller.signal,
    });
  } catch (error) {
    const timedOut = controller.signal.aborted && !signal?.aborted;
    cleanup();
    if (signal?.aborted) throw error;
    const normalized = normalizeHttpError({ error, online: typeof navigator === "undefined" || navigator.onLine, timeout: timedOut });
    reportStatus("error", normalized.message);
    throw Object.assign(new Error(normalized.message), normalized, { code: timedOut ? "REQUEST_TIMEOUT" : "API_UNAVAILABLE" });
  }
  cleanup();

  if (!response.ok || !response.body) {
    let payload = null;
    try { payload = await response.json(); } catch { /* The mapper can use the status without a JSON body. */ }
    const normalized = normalizeHttpError({ status: response.status, body: payload, headers: response.headers });
    const apiError = Object.assign(new Error(normalized.message), normalized, { code: payload?.code || payload?.error || "API_ERROR" });
    if (response.status === 401 && path !== "/auth/me" && path !== "/auth/logout") {
      window.dispatchEvent(new CustomEvent("studyos-auth-expired", { detail: { message: normalized.message } }));
    }
    reportStatus("error", normalized.message);
    throw apiError;
  }

  reportStatus("ok", "");
  return response;
}

export function apiCollection(path) {
  const base = `/${path.replace(/^\/+|\/+$/g, "")}`;
  return {
    list: () => apiRequest(base),
    create: (record) => apiRequest(base, { method: "POST", body: record }),
    update: (id, record) => apiRequest(`${base}/${encodeURIComponent(id)}`, { method: "PUT", body: record }),
    remove: (id) => apiRequest(`${base}/${encodeURIComponent(id)}`, { method: "DELETE" }),
  };
}

