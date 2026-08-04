import { ApiError, getErrorMessage } from "@/api/errors";

export function getAuthActionError(error: unknown) {
  if (error instanceof ApiError) {
    if (
      error.errorCode === "COMMON_UNAUTHORIZED" ||
      (!error.errorCode && error.isStatus(401))
    ) {
      return "Email, số điện thoại hoặc mật khẩu chưa chính xác.";
    }

    if (error.errorCode === "COMMON_FORBIDDEN") {
      return "Tài khoản hiện không thể đăng nhập. Vui lòng liên hệ Homestay Green để được hỗ trợ.";
    }

    if (error.errorCode === "COMMON_CONFLICT") {
      return "Email hoặc số điện thoại đã được sử dụng. Vui lòng đăng nhập hoặc dùng thông tin khác.";
    }
  }

  return getErrorMessage(error);
}
