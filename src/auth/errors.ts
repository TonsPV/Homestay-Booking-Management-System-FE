import { ApiError, getErrorMessage } from "@/api/errors";

export function getAuthActionError(error: unknown) {
  if (error instanceof ApiError) {
    if (
      error.errorCode === "COMMON_UNAUTHORIZED" ||
      (!error.errorCode && error.isStatus(401))
    ) {
      return "Email, số điện thoại hoặc mật khẩu chưa chính xác. Vui lòng kiểm tra và thử lại.";
    }

    if (error.errorCode === "COMMON_FORBIDDEN") {
      return "Tài khoản hiện không thể đăng nhập. Vui lòng liên hệ Homi Stay để được hỗ trợ.";
    }

    if (error.errorCode === "COMMON_CONFLICT") {
      return "Email hoặc số điện thoại đã được sử dụng. Vui lòng đăng nhập hoặc dùng thông tin khác.";
    }

    if (error.errorCode === "AUTH_GOOGLE_ACCOUNT_CONFLICT") {
      return "Email Google này đã được đăng ký. Vui lòng đăng nhập bằng mật khẩu hiện tại.";
    }

    if (error.errorCode === "AUTH_GOOGLE_INVALID_TOKEN") {
      return "Phiên đăng nhập Google không hợp lệ hoặc đã hết hạn. Vui lòng thử lại.";
    }
  }

  return getErrorMessage(error);
}
