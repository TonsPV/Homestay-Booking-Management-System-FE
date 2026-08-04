import { reportRuntimeError } from "@/app/error-reporting";

const reportedCodes = new Set<string>();

export function recordUnknownErrorCode(
  errorCode: string,
  context: { requestId?: string; status?: number } = {},
) {
  if (reportedCodes.has(errorCode)) {
    return;
  }

  reportedCodes.add(errorCode);
  reportRuntimeError(
    new Error(`Unknown Backend error code: ${errorCode}`),
    "unknown-api-error-code",
    {
      errorCode,
      requestId: context.requestId,
      status: context.status,
    },
  );
}
