import type { ApiFailure } from "./types";
import { recordUnknownErrorCode } from "./error-telemetry";

export type ApiErrorKind = "aborted" | "http" | "network" | "parse";

interface ApiErrorOptions {
  kind: ApiErrorKind;
  status?: number;
  retryAfterSeconds?: number;
  requestId?: string;
  serverMessage?: string;
  errorCode?: string;
  fieldErrors?: ApiFailure["fieldErrors"];
  details?: ApiFailure["details"];
  payload?: unknown;
  cause?: unknown;
}

export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly status?: number;
  readonly retryAfterSeconds?: number;
  readonly requestId?: string;
  readonly serverMessage?: string;
  readonly errorCode?: string;
  readonly fieldErrors?: ApiFailure["fieldErrors"];
  readonly details?: ApiFailure["details"];
  readonly payload?: unknown;

  constructor(message: string, options: ApiErrorOptions) {
    super(message, { cause: options.cause });
    this.name = "ApiError";
    this.kind = options.kind;
    this.status = options.status;
    this.retryAfterSeconds = options.retryAfterSeconds;
    this.requestId = options.requestId;
    this.serverMessage = options.serverMessage;
    this.errorCode = options.errorCode;
    this.fieldErrors = options.fieldErrors;
    this.details = options.details;
    this.payload = options.payload;
  }

  isStatus(status: number) {
    return this.status === status;
  }
}

export function getApiFieldErrorCode(error: unknown, field: string) {
  if (!(error instanceof ApiError)) {
    return undefined;
  }

  const errorCode = error.fieldErrors?.[field]?.[0]?.errorCode;
  return typeof errorCode === "string" ? errorCode : undefined;
}

export function getErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    if (error.kind === "http") {
      if (
        error.errorCode &&
        errorCodeMessages[error.errorCode] === undefined
      ) {
        recordUnknownErrorCode(error.errorCode, {
          requestId: error.requestId,
          status: error.status,
        });
      }

      return messageFromFailure(
        { errorCode: error.errorCode },
        error.status,
        error.retryAfterSeconds,
      );
    }

    if (error.kind === "network") {
      return "Không thể kết nối hệ thống. Vui lòng kiểm tra đường truyền và thử lại.";
    }

    if (error.kind === "parse") {
      return "Không thể đọc dữ liệu từ hệ thống. Vui lòng thử lại.";
    }

    return "Thao tác đã được dừng.";
  }

  return "Không thể hoàn tất thao tác. Vui lòng thử lại.";
}

export function getServerMessageFromFailure(payload: Partial<ApiFailure>) {
  if (Array.isArray(payload.message)) {
    return payload.message.join(" ");
  }

  return typeof payload.message === "string" && payload.message.trim()
    ? payload.message.trim()
    : undefined;
}

const errorCodeMessages: Record<string, string> = {
  COMMON_VALIDATION_FAILED:
    "Thông tin chưa hợp lệ. Vui lòng kiểm tra lại và thử lại.",
  COMMON_UNAUTHORIZED: "Bạn cần đăng nhập lại để tiếp tục.",
  COMMON_FORBIDDEN: "Bạn không có quyền thực hiện thao tác này.",
  COMMON_NOT_FOUND:
    "Không tìm thấy thông tin bạn cần. Dữ liệu có thể đã thay đổi hoặc xóa.",
  COMMON_CONFLICT:
    "Dữ liệu đã thay đổi hoặc xung đột. Vui lòng tải lại và thử lại.",
  COMMON_RATE_LIMITED: "Bạn thao tác quá nhanh. Vui lòng thử lại sau.",
  COMMON_PAYLOAD_TOO_LARGE:
    "Tệp tải lên quá lớn. Vui lòng chọn tệp nhỏ hơn.",
  COMMON_UNSUPPORTED_MEDIA_TYPE:
    "Định dạng tệp chưa được hỗ trợ. Vui lòng chọn tệp khác.",
  COMMON_SERVICE_UNAVAILABLE:
    "Hệ thống đang tạm thời gián đoạn. Vui lòng thử lại sau.",
  COMMON_INTERNAL_ERROR:
    "Hệ thống đang tạm thời gián đoạn. Vui lòng thử lại sau.",
};

export function messageFromFailure(
  payload: { errorCode?: string },
  status?: number,
  retryAfterSeconds?: number,
) {
  if (payload.errorCode) {
    if (payload.errorCode === "COMMON_RATE_LIMITED") {
      return retryAfterSeconds === undefined
        ? "Bạn thao tác quá nhanh. Vui lòng thử lại sau."
        : `Bạn thao tác quá nhanh. Vui lòng thử lại sau ${retryAfterSeconds} giây.`;
    }

    const translated = errorCodeMessages[payload.errorCode];

    if (translated) {
      return translated;
    }

  }

  if (status === 400 || status === 422) {
    return "Thông tin chưa hợp lệ. Vui lòng kiểm tra lại và thử lại.";
  }

  if (status === 401) {
    return "Bạn cần đăng nhập lại để tiếp tục.";
  }

  if (status === 403) {
    return "Bạn không có quyền thực hiện thao tác này.";
  }

  if (status === 409) {
    return "Dữ liệu đã thay đổi hoặc xung đột. Vui lòng tải lại và thử lại.";
  }

  if (status === 404) {
    return "Không tìm thấy thông tin bạn cần. Dữ liệu có thể đã được thay đổi hoặc xóa.";
  }

  if (status === 413) {
    return "Tệp tải lên quá lớn. Vui lòng chọn tệp nhỏ hơn.";
  }

  if (status === 415) {
    return "Định dạng tệp chưa được hỗ trợ. Vui lòng chọn tệp khác.";
  }

  if (status === 429) {
    return retryAfterSeconds === undefined
      ? "Bạn thao tác quá nhanh. Vui lòng thử lại sau."
      : `Bạn thao tác quá nhanh. Vui lòng thử lại sau ${retryAfterSeconds} giây.`;
  }

  if (status && status >= 500) {
    return "Hệ thống đang tạm thời gián đoạn. Vui lòng thử lại sau.";
  }

  return "Yêu cầu không thể hoàn tất. Vui lòng thử lại.";
}
