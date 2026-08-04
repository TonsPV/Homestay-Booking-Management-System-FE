import { ApiError, getErrorMessage } from "@/api/errors";

export function getRoomCalendarActionError(error: unknown) {
  if (
    error instanceof ApiError &&
    (error.errorCode === "COMMON_CONFLICT" ||
      (!error.errorCode && error.isStatus(409)))
  ) {
    return "Khoảng ngày này đã có đặt phòng hoặc vừa được cập nhật. Vui lòng kiểm tra lịch và chọn lại.";
  }

  return getErrorMessage(error);
}
