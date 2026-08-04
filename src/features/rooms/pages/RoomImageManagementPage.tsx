import { Button } from "@/shared/components/Button";
import { PageHeader } from "@/shared/components/PageHeader";

import { RoomImageManager } from "../components/RoomImageManager";

interface RoomImageManagementPageProps {
  onBack: () => void;
  roomId: string;
}

export function RoomImageManagementPage({
  onBack,
  roomId,
}: RoomImageManagementPageProps) {
  return (
    <div className="grid gap-6">
      <PageHeader
        actions={
          <Button onClick={onBack} variant="outline">
            Quay lại chi tiết phòng
          </Button>
        }
        description="Tải ảnh mới, chọn ảnh bìa và loại bỏ ảnh không còn sử dụng."
        eyebrow="Quản lý phòng"
        title="Thư viện ảnh"
      />
      <RoomImageManager roomId={roomId} />
    </div>
  );
}
