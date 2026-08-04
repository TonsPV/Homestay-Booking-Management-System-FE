import { ApiError, getErrorMessage } from "@/api/errors";

export function getPaymentActionError(error: unknown) {
  if (error instanceof ApiError) {
    if (error.errorCode === "PAYMENT_REFUND_REJECTED") {
      return "Yêu cầu hoàn tiền đã bị từ chối. Vui lòng kiểm tra giao dịch trước khi thử lại.";
    }

    if (error.errorCode === "PAYMENT_REFUND_NOT_ALLOWED") {
      return "Giao dịch không thể hoàn tiền ở trạng thái hiện tại.";
    }

    if (error.errorCode === "PAYMENT_REFUND_OUTCOME_UNKNOWN") {
      return "Chưa xác định được kết quả hoàn tiền. Vui lòng đối soát trước khi thao tác lại.";
    }

    if (error.errorCode === "PAYMENT_IDEMPOTENCY_KEY_CONFLICT") {
      return "Yêu cầu này trùng khóa xử lý với một giao dịch khác. Vui lòng tải lại trước khi thử lại.";
    }
  }

  if (
    error instanceof ApiError &&
    (error.errorCode === "COMMON_CONFLICT" ||
      (!error.errorCode && error.isStatus(409)))
  ) {
    return "Thanh toán chưa thể hoàn tất vì dữ liệu vừa thay đổi. Vui lòng tải lại lịch sử trước khi thử lại.";
  }

  return getErrorMessage(error);
}
