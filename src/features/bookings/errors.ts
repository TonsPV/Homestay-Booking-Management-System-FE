import { ApiError, getErrorMessage } from "@/api/errors";

const bookingCodeMessages: Record<string, string> = {
  BOOKING_GUEST_CAPACITY_EXCEEDED:
    "Số khách vượt quá sức chứa của phòng. Vui lòng giảm số khách hoặc chọn phòng khác.",
  BOOKING_CUSTOMER_CONTACT_REQUIRED:
    "Vui lòng nhập đầy đủ tên và số điện thoại của khách tại quầy.",
  BOOKING_ACTIVE_UNPAID_LIMIT_REACHED:
    "Bạn đang có quá nhiều booking chờ thanh toán. Hãy thanh toán, hủy hoặc chờ booking cũ hết hạn.",
  BOOKING_HELD_NIGHTS_LIMIT_REACHED:
    "Số đêm đang được giữ đã đạt giới hạn. Vui lòng xử lý các booking hiện có trước.",
  BOOKING_ROOM_NOT_BOOKABLE:
    "Phòng hiện không thể nhận booking. Vui lòng chọn phòng khác.",
  BOOKING_CHECKIN_IN_PAST: "Ngày nhận phòng không được nằm trong quá khứ.",
  BOOKING_CHECKIN_TOO_FAR:
    "Ngày nhận phòng vượt quá khoảng thời gian được phép đặt trước.",
  BOOKING_DATE_RANGE_INVALID:
    "Ngày trả phòng phải sau ngày nhận phòng.",
  BOOKING_STAY_TOO_LONG:
    "Thời gian lưu trú vượt quá giới hạn cho một booking.",
  BOOKING_TOTAL_LIMIT_EXCEEDED:
    "Tổng tiền booking vượt quá giới hạn hệ thống. Vui lòng kiểm tra lại thời gian lưu trú.",
  BOOKING_ROOM_UNAVAILABLE:
    "Phòng vừa được đặt hoặc khóa trong khoảng ngày này. Vui lòng chọn phòng hoặc ngày khác.",
  BOOKING_CREATE_CONFLICT:
    "Booking chưa thể tạo vì dữ liệu vừa thay đổi. Vui lòng tải lại và thử lại.",
  CUSTOMER_EMAIL_IN_USE:
    "Email đã được sử dụng. Vui lòng chọn khách hiện có hoặc dùng email khác.",
  CUSTOMER_PHONE_IN_USE:
    "Số điện thoại đã được sử dụng. Vui lòng chọn khách hiện có hoặc dùng số khác.",
  BOOKING_CANCELLATION_REASON_REQUIRED: "Vui lòng nhập lý do hủy đặt phòng.",
  BOOKING_REFUND_PENDING:
    "Booking đang chờ đối soát hoàn tiền. Vui lòng thử lại sau.",
  BOOKING_TRANSITION_NOT_ALLOWED:
    "Trạng thái booking không thể chuyển theo quy trình hiện tại.",
  BOOKING_CONFIRMATION_REQUIRES_PAYMENT:
    "Booking online cần được thanh toán trước khi xác nhận.",
  BOOKING_CHECKIN_REQUIRES_PAYMENT:
    "Booking cần được thanh toán trước khi check-in.",
  BOOKING_CHECKIN_OUTSIDE_STAY_WINDOW:
    "Chỉ có thể check-in trong khoảng thời gian lưu trú.",
  BOOKING_ROOM_NOT_FOUND: "Phòng của booking không còn tồn tại.",
  BOOKING_ROOM_NOT_READY: "Phòng chưa ở trạng thái sẵn sàng để check-in.",
  BOOKING_CANCELLATION_ALREADY_PAID:
    "Booking đã thanh toán. Cần hoàn tiền trước khi hủy.",
  BOOKING_CANCELLATION_NOT_ALLOWED:
    "Booking không thể hủy ở trạng thái hiện tại.",
};

export function getBookingActionError(error: unknown) {
  if (error instanceof ApiError && error.errorCode) {
    return bookingCodeMessages[error.errorCode] ?? getErrorMessage(error);
  }

  return getErrorMessage(error);
}

export function getBookingTransitionReason(reasonCode: string | null) {
  if (reasonCode === null) {
    return undefined;
  }

  return (
    bookingCodeMessages[reasonCode] ??
    "Thao tác này chưa khả dụng với trạng thái hiện tại của booking."
  );
}
