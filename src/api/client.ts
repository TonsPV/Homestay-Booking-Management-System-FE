import { appConfig } from "@/app/config";

import {
  ApiError,
  getServerMessageFromFailure,
  messageFromFailure,
} from "./errors";
import type {
  ApiFailure,
  ApiResult,
  ApiSuccess,
  QueryParams,
  QueryPrimitive,
} from "./types";

type AccessTokenProvider = () => string | null;
type UnauthorizedHandler = () => void;

function resolveRequestOrigin() {
  if (import.meta.env.DEV && typeof window !== "undefined") {
    return window.location.origin;
  }

  return appConfig.apiOrigin;
}

function assertRelativeApiPath(path: string) {
  if (
    path.startsWith('//') ||
    path.startsWith('\\\\') ||
    /^[a-z][a-z\d+.-]*:/i.test(path)
  ) {
    throw new Error('API path must be relative to the configured API origin.');
  }
}

interface ApiRequestOptions extends Omit<
  RequestInit,
  "body" | "headers" | "method"
> {
  auth?: boolean;
  body?: unknown;
  headers?: HeadersInit;
  method?: "DELETE" | "GET" | "PATCH" | "POST" | "PUT";
  query?: QueryParams;
}

let accessTokenProvider: AccessTokenProvider = () => null;
let unauthorizedHandler: UnauthorizedHandler | null = null;

export function configureAccessTokenProvider(provider: AccessTokenProvider) {
  accessTokenProvider = provider;
}

export function configureUnauthorizedHandler(
  handler: UnauthorizedHandler | null,
) {
  unauthorizedHandler = handler;
}

function appendQueryValue(
  searchParams: URLSearchParams,
  key: string,
  value: QueryPrimitive,
) {
  if (value === null || value === undefined || value === "") {
    return;
  }

  searchParams.append(key, String(value));
}

export function buildApiUrl(path: string, query?: QueryParams) {
  assertRelativeApiPath(path);
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(
    `${appConfig.apiPrefix}${normalizedPath}`,
    resolveRequestOrigin(),
  );

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (Array.isArray(value)) {
        for (const item of value) {
          appendQueryValue(url.searchParams, key, item);
        }
      } else {
        appendQueryValue(url.searchParams, key, value);
      }
    }
  }

  return url;
}

function parseRetryAfter(value: string | null) {
  if (!value) {
    return undefined;
  }

  const seconds = Number.parseInt(value, 10);
  return Number.isFinite(seconds) && seconds >= 0 ? seconds : undefined;
}

function isApiSuccess<T>(value: unknown): value is ApiSuccess<T> {
  return (
    typeof value === "object" &&
    value !== null &&
    "success" in value &&
    value.success === true &&
    "data" in value &&
    "requestId" in value &&
    typeof value.requestId === "string" &&
    value.requestId.length > 0
  );
}

function failureFromUnknown(value: unknown): Partial<ApiFailure> {
  return typeof value === "object" && value !== null
    ? (value as Partial<ApiFailure>)
    : {};
}

async function parseResponseBody(response: Response) {
  if (response.status === 204) {
    return null;
  }

  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch (cause) {
    if (!response.ok) {
      return null;
    }

    throw new ApiError("Phản hồi từ máy chủ không đúng định dạng JSON.", {
      kind: "parse",
      status: response.status,
      cause,
    });
  }
}

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<ApiResult<T>> {
  const {
    auth = true,
    body,
    headers: customHeaders,
    method = "GET",
    query,
    ...requestOptions
  } = options;
  const headers = new Headers(customHeaders);
  const token = auth ? accessTokenProvider() : null;

  headers.set("Accept", "application/json");

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let requestBody: BodyInit | undefined;

  if (body !== undefined) {
    if (body instanceof FormData) {
      requestBody = body;
    } else {
      headers.set("Content-Type", "application/json");
      requestBody = JSON.stringify(body);
    }
  }

  let response: Response;

  try {
    response = await fetch(buildApiUrl(path, query), {
      ...requestOptions,
      body: requestBody,
      headers,
      method,
    });
  } catch (cause) {
    if (cause instanceof DOMException && cause.name === "AbortError") {
      throw new ApiError("Yêu cầu đã bị hủy.", {
        kind: "aborted",
        cause,
      });
    }

    throw new ApiError(
      "Không thể kết nối tới máy chủ. Vui lòng kiểm tra đường truyền.",
      {
        kind: "network",
        cause,
      },
    );
  }

  const payload = await parseResponseBody(response);

  if (!response.ok) {
    const failure = failureFromUnknown(payload);
    const retryAfterSeconds = parseRetryAfter(
      response.headers.get("Retry-After"),
    );

    if (
      auth &&
      response.status === 401 &&
      token &&
      accessTokenProvider() === token
    ) {
      queueMicrotask(() => {
        if (accessTokenProvider() === token) {
          unauthorizedHandler?.();
        }
      });
    }

    throw new ApiError(
      messageFromFailure(failure, response.status, retryAfterSeconds),
      {
        kind: "http",
        status: response.status,
        retryAfterSeconds,
        requestId:
          typeof failure.requestId === "string" ? failure.requestId : undefined,
        errorCode:
          typeof failure.errorCode === "string" ? failure.errorCode : undefined,
        fieldErrors:
          failure.fieldErrors !== null &&
          typeof failure.fieldErrors === "object"
            ? failure.fieldErrors
            : undefined,
        details:
          failure.details !== null && typeof failure.details === "object"
            ? failure.details
            : undefined,
        serverMessage: getServerMessageFromFailure(failure),
        payload,
      },
    );
  }

  if (!isApiSuccess<T>(payload)) {
    throw new ApiError("Phản hồi thành công thiếu response envelope hợp lệ.", {
      kind: "parse",
      status: response.status,
      payload,
    });
  }

  return {
    data: payload.data,
    meta: payload.meta,
    requestId: payload.requestId,
  };
}
