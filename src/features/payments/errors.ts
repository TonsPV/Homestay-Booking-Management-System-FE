import { ApiError, getErrorMessage } from "@/api/errors";

const customerPaymentCodeMessages: Record<string, string> = {
  PAYMENT_IDEMPOTENCY_KEY_CONFLICT:
    "Thông tin thanh toán vừa thay đổi. Vui lòng tải lại trang trước khi thử lại.",
  PAYMENT_REFUND_REJECTED:
    "Yêu cầu hoàn tiền chưa thể hoàn tất. Vui lòng liên hệ Homi Stay nếu cần hỗ trợ.",
  PAYMENT_REFUND_NOT_ALLOWED:
    "Khoản thanh toán này chưa thể hoàn tiền ở thời điểm hiện tại.",
  PAYMENT_REFUND_OUTCOME_UNKNOWN:
    "Kết quả hoàn tiền đang được cập nhật. Vui lòng kiểm tra lại sau.",
};

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
      return "Thông tin thanh toán vừa thay đổi hoặc thao tác này đã được xử lý. Vui lòng tải lại lịch sử trước khi thử lại.";
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

export function getCustomerPaymentActionError(error: unknown) {
  if (error instanceof ApiError) {
    if (error.errorCode && customerPaymentCodeMessages[error.errorCode]) {
      return customerPaymentCodeMessages[error.errorCode];
    }

    if (
      error.errorCode === "COMMON_CONFLICT" ||
      (!error.errorCode && error.isStatus(409))
    ) {
      return "Thông tin thanh toán vừa thay đổi. Vui lòng tải lại trang trước khi thử lại.";
    }
  }

  return getErrorMessage(error);
}
