import { ApiError, getErrorMessage } from "@/api/errors";

export function getUserActionError(error: unknown) {
  if (
    error instanceof ApiError &&
    (error.errorCode === "COMMON_CONFLICT" ||
      (!error.errorCode && error.isStatus(409)))
  ) {
    return "Thông tin tài khoản đã tồn tại. Vui lòng kiểm tra lại email và số điện thoại.";
  }

  return getErrorMessage(error);
}
