import { ApiError, getErrorMessage } from '@/api/errors'

const BOOKING_CONFLICT_MESSAGE =
  'Dữ liệu đặt phòng vừa thay đổi. Vui lòng tải lại tình trạng phòng và thử lại.'

const bookingErrorMessages: Record<string, string> = {
  'Booking da thanh toan. Can hoan tien truoc khi huy.':
    'Đặt phòng đã được thanh toán. Cần hoàn tiền trước khi hủy.',
  'Booking khong duoc vuot qua 90 dem.':
    'Thời gian lưu trú không được vượt quá 90 đêm.',
  'Customer khong the huy booking o trang thai hien tai.':
    'Bạn không thể hủy đặt phòng ở trạng thái hiện tại.',
  'Khong tim thay booking.':
    'Không tìm thấy đặt phòng hoặc bạn không có quyền xem.',
  'Khong tim thay phong.':
    'Không tìm thấy phòng đã chọn.',
  'Ngay check-in khong duoc nam trong qua khu.':
    'Ngày nhận phòng không được ở trong quá khứ.',
  'Ngay check-out phai sau ngay check-in.':
    'Ngày trả phòng phải sau ngày nhận phòng.',
  'Phong da duoc dat hoac bi khoa trong khoang ngay nay.':
    'Phòng đã được đặt hoặc tạm khóa trong khoảng ngày này.',
  'Phong hien khong the dat.':
    'Phòng hiện không thể đặt. Vui lòng chọn phòng khác.',
  'So luong khach vuot qua suc chua cua loai phong.':
    'Số khách vượt quá sức chứa của phòng đã chọn.',
}

export function getBookingActionError(error: unknown) {
  if (error instanceof ApiError) {
    const translatedMessage = bookingErrorMessages[error.message]

    if (translatedMessage) {
      return translatedMessage
    }

    if (error.isStatus(409)) {
      return BOOKING_CONFLICT_MESSAGE
    }
  }

  return getErrorMessage(error)
}
