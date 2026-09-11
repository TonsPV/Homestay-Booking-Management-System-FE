import { ApiError, getErrorMessage } from "@/api/errors";

const bookingCodeMessages: Record<string, string> = {
  BOOKING_GUEST_CAPACITY_EXCEEDED:
    "Số khách vượt quá sức chứa của phòng. Vui lòng giảm số khách hoặc chọn phòng khác.",
  BOOKING_CUSTOMER_CONTACT_REQUIRED:
    "Vui lòng nhập đầy đủ tên và số điện thoại của khách tại quầy.",
  BOOKING_ACTIVE_UNPAID_LIMIT_REACHED:
    "Bạn đang có quá nhiều đặt phòng chờ thanh toán. Hãy thanh toán, hủy hoặc chờ đơn cũ hết hạn.",
  BOOKING_HELD_NIGHTS_LIMIT_REACHED:
    "Số đêm đang được giữ đã đạt giới hạn. Vui lòng xử lý các đặt phòng hiện có trước.",
  BOOKING_ROOM_NOT_BOOKABLE:
    "Phòng hiện không thể nhận đặt phòng. Vui lòng chọn phòng khác.",
  BOOKING_CHECKIN_IN_PAST: "Ngày nhận phòng không được nằm trong quá khứ.",
  BOOKING_CHECKIN_TOO_FAR:
    "Ngày nhận phòng vượt quá khoảng thời gian được phép đặt trước.",
  BOOKING_DATE_RANGE_INVALID:
    "Ngày trả phòng phải sau ngày nhận phòng.",
  BOOKING_STAY_TOO_LONG:
    "Thời gian lưu trú vượt quá giới hạn cho một lần đặt phòng.",
  BOOKING_TOTAL_LIMIT_EXCEEDED:
    "Tổng tiền đặt phòng vượt quá giới hạn hệ thống. Vui lòng kiểm tra lại thời gian lưu trú.",
  BOOKING_ROOM_UNAVAILABLE:
    "Phòng vừa được đặt hoặc khóa trong khoảng ngày này. Vui lòng chọn phòng hoặc ngày khác.",
  BOOKING_CREATE_CONFLICT:
    "Đặt phòng chưa thể được tạo vì dữ liệu vừa thay đổi. Vui lòng tải lại và thử lại.",
  BOOKING_REQUEST_INTENT_CONFLICT:
    "Thông tin của lần tạo đặt phòng này vừa thay đổi. Hệ thống đang đồng bộ lại dữ liệu; hãy kiểm tra danh sách đặt phòng rồi xác nhận lại thông tin để tạo một đơn mới.",
  CUSTOMER_EMAIL_IN_USE:
    "Email đã được sử dụng. Vui lòng chọn khách hiện có hoặc dùng email khác.",
  CUSTOMER_PHONE_IN_USE:
    "Số điện thoại đã được sử dụng. Vui lòng chọn khách hiện có hoặc dùng số khác.",
  BOOKING_CANCELLATION_REASON_REQUIRED: "Vui lòng nhập lý do hủy đặt phòng.",
  BOOKING_REFUND_PENDING:
    "Đặt phòng đang chờ đối soát hoàn tiền. Vui lòng thử lại sau.",
  BOOKING_TRANSITION_NOT_ALLOWED:
    "Trạng thái đặt phòng không thể chuyển theo quy trình hiện tại.",
  BOOKING_CONFIRMATION_REQUIRES_PAYMENT:
    "Đặt phòng trực tuyến cần được thanh toán trước khi xác nhận.",
  BOOKING_CHECKIN_REQUIRES_PAYMENT:
    "Đặt phòng cần được thanh toán trước khi nhận phòng.",
  BOOKING_CHECKIN_OUTSIDE_STAY_WINDOW:
    "Chỉ có thể check-in trong khoảng thời gian lưu trú.",
  BOOKING_ROOM_NOT_FOUND: "Phòng của đặt phòng này không còn tồn tại.",
  BOOKING_ROOM_MISSING_FOR_BOOKING:
    "Đặt phòng không còn liên kết với phòng. Không thể tiếp tục chuyển trạng thái; vui lòng kiểm tra lại thông tin đặt phòng.",
  BOOKING_ROOM_NOT_READY: "Phòng chưa ở trạng thái sẵn sàng để check-in.",
  BOOKING_CANCELLATION_ALREADY_PAID:
    "Đặt phòng đã thanh toán. Cần hoàn tiền trước khi hủy.",
  BOOKING_CANCELLATION_NOT_ALLOWED:
    "Đặt phòng không thể hủy ở trạng thái hiện tại.",
};

const customerBookingCodeMessages: Record<string, string> = {
  BOOKING_GUEST_CAPACITY_EXCEEDED:
    "Số khách vượt quá sức chứa của phòng. Vui lòng giảm số khách hoặc chọn phòng khác.",
  BOOKING_ACTIVE_UNPAID_LIMIT_REACHED:
    "Bạn đang có quá nhiều đặt phòng chờ thanh toán. Hãy xử lý các đặt phòng đó trước khi tạo mới.",
  BOOKING_HELD_NIGHTS_LIMIT_REACHED:
    "Bạn đã giữ chỗ quá nhiều đêm. Hãy xử lý các đặt phòng hiện có trước khi thử lại.",
  BOOKING_ROOM_NOT_BOOKABLE:
    "Phòng này hiện chưa thể đặt. Vui lòng chọn phòng khác.",
  BOOKING_CHECKIN_IN_PAST: "Ngày nhận phòng không được nằm trong quá khứ.",
  BOOKING_CHECKIN_TOO_FAR:
    "Ngày nhận phòng vượt quá khoảng thời gian được phép đặt trước.",
  BOOKING_DATE_RANGE_INVALID: "Ngày trả phòng phải sau ngày nhận phòng.",
  BOOKING_STAY_TOO_LONG:
    "Thời gian lưu trú vượt quá giới hạn cho một lần đặt phòng.",
  BOOKING_TOTAL_LIMIT_EXCEEDED:
    "Tổng tiền vượt mức cho phép. Vui lòng rút ngắn kỳ lưu trú hoặc chọn phòng khác.",
  BOOKING_ROOM_UNAVAILABLE:
    "Phòng này không còn trống trong kỳ bạn đã chọn. Hãy chọn ngày hoặc phòng khác.",
  BOOKING_CREATE_CONFLICT:
    "Thông tin phòng vừa thay đổi. Hãy kiểm tra lại kỳ lưu trú rồi thử đặt lại.",
  BOOKING_REQUEST_INTENT_CONFLICT:
    "Thông tin đặt phòng vừa thay đổi. Hãy kiểm tra lại và thử đặt lại.",
  CUSTOMER_EMAIL_IN_USE: "Email này đã được sử dụng. Vui lòng dùng email khác.",
  CUSTOMER_PHONE_IN_USE:
    "Số điện thoại này đã được sử dụng. Vui lòng dùng số khác.",
  BOOKING_CANCELLATION_REASON_REQUIRED: "Vui lòng nhập lý do hủy đặt phòng.",
  BOOKING_REFUND_PENDING:
    "Yêu cầu hoàn tiền đang được xử lý. Chúng tôi sẽ cập nhật khi có kết quả.",
  BOOKING_CANCELLATION_NOT_ALLOWED:
    "Đặt phòng này chưa thể hủy ở thời điểm hiện tại.",
};

export function getBookingActionError(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.errorCode && bookingCodeMessages[error.errorCode]) {
      return bookingCodeMessages[error.errorCode];
    }

    return getErrorMessage(error);
  }

  return getErrorMessage(error);
}

/**
 * Nội dung dành cho khách lưu trú: chỉ giải thích điều khách có thể làm tiếp,
 * không đưa mã tham chiếu hay trạng thái nội bộ ra giao diện công khai.
 */
export function getCustomerBookingActionError(error: unknown): string {
  if (error instanceof ApiError) {
    const errorCodes = [
      error.errorCode,
      ...Object.values(error.fieldErrors ?? {}).flatMap((fieldErrors) =>
        fieldErrors.map((fieldError) => fieldError.errorCode),
      ),
    ];
    const customerMessage = errorCodes
      .filter((errorCode): errorCode is string => typeof errorCode === "string")
      .map((errorCode) => customerBookingCodeMessages[errorCode])
      .find(Boolean);

    if (customerMessage) {
      return customerMessage;
    }
  }

  return getErrorMessage(error);
}

export function isBookingRoomConflictError(error: unknown): boolean {
  if (!(error instanceof ApiError)) {
    return false;
  }

  if (error.errorCode === "BOOKING_REQUEST_INTENT_CONFLICT") {
    return false;
  }

  if (
    error.errorCode === "BOOKING_ROOM_UNAVAILABLE" ||
    error.errorCode === "BOOKING_ROOM_NOT_BOOKABLE" ||
    error.errorCode === "BOOKING_CREATE_CONFLICT"
  ) {
    return true;
  }

  const checkInErr = error.fieldErrors?.checkInDate?.[0]?.errorCode;
  const checkOutErr = error.fieldErrors?.checkOutDate?.[0]?.errorCode;
  const roomErr = error.fieldErrors?.roomId?.[0]?.errorCode;

  if (
    checkInErr === "BOOKING_ROOM_UNAVAILABLE" ||
    checkInErr === "BOOKING_ROOM_NOT_BOOKABLE" ||
    checkOutErr === "BOOKING_ROOM_UNAVAILABLE" ||
    checkOutErr === "BOOKING_ROOM_NOT_BOOKABLE" ||
    roomErr === "BOOKING_ROOM_UNAVAILABLE" ||
    roomErr === "BOOKING_ROOM_NOT_BOOKABLE"
  ) {
    return true;
  }

  return error.status === 409;
}

export function buildRoomSearchUrl(params: {
  checkIn?: string;
  checkOut?: string;
  guests?: number | string;
}): string {
  const searchParams = new URLSearchParams();
  if (params.checkIn) {
    searchParams.set("checkIn", params.checkIn);
  }
  if (params.checkOut) {
    searchParams.set("checkOut", params.checkOut);
  }
  if (params.guests && Number(params.guests) > 0) {
    searchParams.set("guests", String(params.guests));
  }

  const query = searchParams.toString();
  return `/rooms${query ? `?${query}` : ""}`;
}

export function getBookingTransitionReason(reasonCode: string | null) {
  if (reasonCode === null) {
    return undefined;
  }

  return (
    bookingCodeMessages[reasonCode] ??
    "Thao tác này chưa khả dụng với trạng thái hiện tại của đặt phòng."
  );
}
