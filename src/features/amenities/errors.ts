import { ApiError, getErrorMessage } from "@/api/errors";

export function getAmenityActionError(error: unknown) {
  if (error instanceof ApiError && error.errorCode === "AMENITY_IN_USE") {
    return "Không thể xóa tiện nghi vì đang được sử dụng. Hãy gỡ tiện nghi khỏi các loại phòng liên quan rồi thử lại.";
  }

  if (
    error instanceof ApiError &&
    error.errorCode === "AMENITY_NAME_ALREADY_EXISTS"
  ) {
    return "Tên tiện nghi đã tồn tại, kể cả trong dữ liệu đã xóa. Vui lòng dùng tên khác hoặc khôi phục bản cũ.";
  }

  if (
    error instanceof ApiError &&
    (error.errorCode === "COMMON_CONFLICT" ||
      (!error.errorCode && error.isStatus(409)))
  ) {
    return "Tiện nghi chưa thể lưu vì dữ liệu vừa thay đổi. Vui lòng tải lại và thử lại.";
  }

  if (
    error instanceof ApiError &&
    (error.errorCode === "COMMON_NOT_FOUND" ||
      (!error.errorCode && error.isStatus(404)))
  ) {
    return "Không tìm thấy tiện nghi. Danh sách có thể vừa được cập nhật.";
  }

  return getErrorMessage(error);
}
