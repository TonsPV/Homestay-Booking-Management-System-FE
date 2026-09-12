import { ApiError, getErrorMessage } from "@/api/errors";
import type { ActorType } from "./types";

export function getAuthActionError(
  error: unknown,
  actor: ActorType = "customer",
) {
  if (error instanceof ApiError) {
    if (
      error.errorCode === "COMMON_UNAUTHORIZED" ||
      (!error.errorCode && error.isStatus(401))
    ) {
      return actor === "user"
        ? "Email hoặc mật khẩu tài khoản vận hành chưa chính xác. Nếu bạn vừa được cấp tài khoản, hãy liên hệ quản trị viên để kiểm tra hoặc đặt lại mật khẩu."
        : "Email, số điện thoại hoặc mật khẩu chưa chính xác. Nếu đây là tài khoản nhân viên hoặc quản trị viên, hãy đăng nhập tại khu vực vận hành.";
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
