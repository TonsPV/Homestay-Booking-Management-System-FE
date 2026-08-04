import type { LucideIcon } from "lucide-react";
import {
  BadgeDollarSign,
  CalendarCheck,
  Headphones,
  ShieldCheck,
  Sparkles,
  TimerReset,
} from "lucide-react";

export const homeContent = {
  hero: {
    heading: "Một nơi để thật sự nghỉ ngơi.",
    description:
      "Chọn kỳ lưu trú, khám phá phòng còn trống và hoàn tất đặt phòng trong một hành trình rõ ràng.",
    primaryCta: { label: "Tìm phòng trống", to: "/rooms/search" },
    secondaryCta: { label: "Khám phá không gian", to: "/rooms" },
  },
  trust: [
    {
      icon: CalendarCheck,
      title: "Phòng trống được đối chiếu",
      description: "Kết quả tìm kiếm dựa trên ngày lưu trú bạn chọn.",
    },
    {
      icon: BadgeDollarSign,
      title: "Giá hiển thị rõ ràng",
      description: "Mức giá phòng lấy trực tiếp từ hệ thống.",
    },
    {
      icon: ShieldCheck,
      title: "Booking có thể theo dõi",
      description: "Đăng nhập để xem trạng thái đặt phòng và thanh toán.",
    },
  ] satisfies Array<{
    icon: LucideIcon;
    title: string;
    description: string;
  }>,
  benefits: {
    heading: "Một kỳ nghỉ nhẹ đầu từ lúc bắt đầu",
    description:
      "Ít bước hơn, thông tin rõ hơn và luôn biết mình cần làm gì tiếp theo.",
    items: [
      {
        icon: Sparkles,
        name: "Không gian riêng tư",
        description:
          "Những căn phòng được trình bày bằng hình ảnh và tiện nghi thực tế.",
      },
      {
        icon: TimerReset,
        name: "Tìm phòng nhanh",
        description: "Chỉ cần ngày nhận, ngày trả và số khách để bắt đầu.",
      },
      {
        icon: Headphones,
        name: "Hỗ trợ rõ ràng",
        description:
          "Mỗi trạng thái booking đều có hướng dẫn cho bước tiếp theo.",
      },
      {
        icon: BadgeDollarSign,
        name: "Giá minh bạch",
        description: "So sánh mức giá theo đêm trước khi quyết định đặt phòng.",
      },
    ] satisfies Array<{
      icon: LucideIcon;
      name: string;
      description: string;
    }>,
  },
  experience: {
    heading: "Chậm lại, ở gần hơn với những điều dễ chịu.",
    description:
      "Một căn phòng tốt không chỉ để ngủ. Đó là khoảng riêng để nghỉ, trò chuyện và bắt đầu ngày mới theo nhịp của bạn.",
    moments: [
      "Sự thoải mái trong từng chi tiết",
      "Khoảng yên giữa một hành trình",
      "Không gian vừa đủ để kết nối",
    ],
    cta: { label: "Xem các phòng", to: "/rooms" },
  },
  finalCta: {
    heading: "Tìm kỳ nghỉ phù hợp với bạn hôm nay.",
    description: "Chọn ngày lưu trú và xem ngay những phòng thực sự còn trống.",
    primaryCta: { label: "Bắt đầu tìm phòng", to: "/rooms/search" },
    secondaryCta: { label: "Khám phá tất cả phòng", to: "/rooms" },
  },
} as const;
