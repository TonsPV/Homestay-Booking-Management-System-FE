import { appConfig } from "./config";

type ErrorSource =
  | "global-error"
  | "react-boundary"
  | "unhandled-rejection"
  | "unknown-api-error-code";

interface RuntimeErrorContext {
  componentStack?: string | null;
  errorCode?: string;
  requestId?: string;
  status?: number;
}

function normalizeError(value: unknown) {
  if (value instanceof Error) {
    return {
      message: value.message,
      name: value.name,
      stack: value.stack ?? null,
    };
  }

  return {
    message: typeof value === "string" ? value : "Unknown runtime error",
    name: "UnknownError",
    stack: null,
  };
}

export function reportRuntimeError(
  error: unknown,
  source: ErrorSource,
  context: RuntimeErrorContext = {},
) {
  const endpoint = appConfig.errorReportingEndpoint;

  if (!endpoint) {
    if (import.meta.env.DEV) {
      console.error(`[${source}]`, error, context);
    }
    return;
  }

  const payload = JSON.stringify({
    ...normalizeError(error),
    componentStack: context.componentStack ?? null,
    errorCode: context.errorCode ?? null,
    occurredAt: new Date().toISOString(),
    path: `${window.location.origin}${window.location.pathname}`,
    release: appConfig.appRelease,
    requestId: context.requestId ?? null,
    source,
    status: context.status ?? null,
    userAgent: navigator.userAgent,
  });

  try {
    if (
      typeof navigator.sendBeacon === "function" &&
      navigator.sendBeacon(
        endpoint,
        new Blob([payload], { type: "application/json" }),
      )
    ) {
      return;
    }

    void fetch(endpoint, {
      body: payload,
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      method: "POST",
    }).catch(() => undefined);
  } catch {
    // Monitoring must never cause a second application failure.
  }
}

export function installGlobalErrorReporting() {
  const handleError = (event: ErrorEvent) => {
    reportRuntimeError(event.error ?? new Error(event.message), "global-error");
  };
  const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
    reportRuntimeError(event.reason, "unhandled-rejection");
  };

  window.addEventListener("error", handleError);
  window.addEventListener("unhandledrejection", handleUnhandledRejection);

  return () => {
    window.removeEventListener("error", handleError);
    window.removeEventListener("unhandledrejection", handleUnhandledRejection);
  };
}
