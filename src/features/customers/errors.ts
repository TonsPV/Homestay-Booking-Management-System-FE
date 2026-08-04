import { ApiError, getErrorMessage } from "@/api/errors";

export function getCustomerCredentialActionError(error: unknown) {
  if (
    error instanceof ApiError &&
    error.errorCode === "CUSTOMER_INITIAL_PASSWORD_ALREADY_CONFIGURED"
  ) {
    return "Khách hàng đã có mật khẩu. Hãy tải lại thông tin trước khi thử lại.";
  }

  return getErrorMessage(error);
}

export function getCustomerProfileActionError(error: unknown) {
  if (error instanceof ApiError) {
    if (error.errorCode === "CUSTOMER_EMAIL_IN_USE") {
      return "Email đã được sử dụng. Vui lòng dùng email khác.";
    }

    if (error.errorCode === "CUSTOMER_PHONE_IN_USE") {
      return "Số điện thoại đã được sử dụng. Vui lòng dùng số khác.";
    }
  }

  if (
    error instanceof ApiError &&
    (error.errorCode === "COMMON_CONFLICT" ||
      (!error.errorCode && error.isStatus(409)))
  ) {
    return "Thông tin liên hệ đã được sử dụng hoặc vừa thay đổi. Vui lòng tải lại trước khi chỉnh sửa tiếp.";
  }

  return getErrorMessage(error);
}

export function getCustomerPasswordActionError(error: unknown) {
  if (error instanceof ApiError) {
    if (error.errorCode === "CUSTOMER_CURRENT_PASSWORD_INVALID") {
      return "Mật khẩu hiện tại chưa chính xác. Vui lòng kiểm tra lại.";
    }

    if (error.errorCode === "CUSTOMER_PASSWORD_REUSE_NOT_ALLOWED") {
      return "Mật khẩu mới phải khác mật khẩu hiện tại.";
    }
  }

  return getErrorMessage(error);
}
