import {
  Navigate,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";

import { useAuth } from "@/auth/useAuth";
import { CreateRoomPage } from "@/features/rooms/pages/CreateRoomPage";
import { EditRoomPage } from "@/features/rooms/pages/EditRoomPage";
import { ManagementRoomDetailPage } from "@/features/rooms/pages/ManagementRoomDetailPage";
import { ManagementRoomsPage } from "@/features/rooms/pages/ManagementRoomsPage";
import { PublicRoomDetailPage } from "@/features/rooms/pages/PublicRoomDetailPage";
import { PublicRoomsPage } from "@/features/rooms/pages/PublicRoomsPage";
import { RoomImageManagementPage } from "@/features/rooms/pages/RoomImageManagementPage";
import type { RoomStay } from "@/features/rooms/components/room-stay";
import type { PublicRoom, SearchRoomsQuery } from "@/features/rooms/types";

interface RoomLocationState {
  search?: SearchRoomsQuery;
}

const STAY_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function isRealCalendarDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(`${value}T00:00:00.000Z`);

  return (
    !Number.isNaN(parsed.getTime()) &&
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() + 1 === month &&
    parsed.getUTCDate() === day
  );
}

function isCompleteStay(
  stay: Partial<RoomStay> | RoomStay | null | undefined,
): stay is RoomStay {
  return Boolean(
    stay &&
      typeof stay.checkIn === "string" &&
      typeof stay.checkOut === "string" &&
      STAY_DATE_PATTERN.test(stay.checkIn) &&
      STAY_DATE_PATTERN.test(stay.checkOut) &&
      isRealCalendarDate(stay.checkIn) &&
      isRealCalendarDate(stay.checkOut) &&
      stay.checkOut > stay.checkIn &&
      Number.isInteger(stay.guests) &&
      (stay.guests as number) > 0,
  );
}

/** Stay from URL query parameters; invalid or incomplete values are dropped. */
function readStayFromSearchParams(
  searchParams: URLSearchParams,
): Partial<RoomStay> {
  const candidate = {
    checkIn: searchParams.get("checkIn") ?? "",
    checkOut: searchParams.get("checkOut") ?? "",
    guests: Number(searchParams.get("guests") ?? ""),
  };

  return isCompleteStay(candidate) ? candidate : {};
}

/** URL query carrying only a syntactically valid, complete stay. */
function buildDetailSearch(stay: RoomStay | null) {
  const params = new URLSearchParams();

  if (isCompleteStay(stay)) {
    params.set("checkIn", stay.checkIn);
    params.set("checkOut", stay.checkOut);
    params.set("guests", String(stay.guests));
  }

  const query = params.toString();
  return query ? `?${query}` : "";
}

function buildBookingRoomState(room: PublicRoom) {
  const coverImage = room.images.find((image) => image.isCover) ?? room.images[0];

  return {
    amenities: room.roomType.amenities.slice(0, 4).map((amenity) => amenity.name),
    basePrice: room.roomType.basePrice,
    coverImageUrl: coverImage?.imageUrl,
    description: room.description ?? room.roomType.description ?? undefined,
    id: room.id,
    maxGuests: room.roomType.maxGuests,
    name: room.name,
    roomTypeName: room.roomType.name,
  };
}

export function PublicRoomsRoute() {
  const navigate = useNavigate();

  return (
    <PublicRoomsPage
      onBookRoom={(room, search) =>
        navigate(createBookingUrl(room.id, search), {
          state: {
            room: buildBookingRoomState(room),
            search,
          },
        })
      }
      onViewRoom={(roomId, search) =>
        navigate(
          `/rooms/${roomId}${buildDetailSearch(
            search && isCompleteStay(search)
              ? {
                  checkIn: search.checkIn,
                  checkOut: search.checkOut,
                  guests: search.guests,
                }
              : null,
          )}`,
          search ? { state: { search } } : undefined,
        )
      }
    />
  );
}

/** Backward-compatible public route. The explorer itself now lives at /rooms. */
export function RoomSearchRoute() {
  const location = useLocation();

  return <Navigate replace to={{ pathname: "/rooms", search: location.search }} />;
}

function createBookingUrl(roomId: string, search?: SearchRoomsQuery) {
  const params = new URLSearchParams();

  if (search?.checkIn) {
    params.set("checkIn", search.checkIn);
  }
  if (search?.checkOut) {
    params.set("checkOut", search.checkOut);
  }
  if (search?.guests) {
    params.set("guests", String(search.guests));
  }

  const query = params.toString();
  return `/bookings/new/${roomId}${query ? `?${query}` : ""}`;
}

export function PublicRoomDetailRoute() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const state = location.state as RoomLocationState | null;

  if (!roomId || !/^[1-9][0-9]*$/.test(roomId)) {
    return <Navigate replace to="/rooms" />;
  }

  const urlStay = readStayFromSearchParams(searchParams);
  const hasCompleteUrlStay =
    urlStay.checkIn !== undefined &&
    urlStay.checkOut !== undefined &&
    urlStay.guests !== undefined;
  const stateStay = state?.search
    ? {
        checkIn: state.search.checkIn ?? "",
        checkOut: state.search.checkOut ?? "",
        guests: state.search.guests ?? Number.NaN,
      }
    : null;
  const hasCompleteStateStay = Boolean(
    stateStay &&
    stateStay.checkIn &&
    stateStay.checkOut &&
    Number.isInteger(stateStay.guests) &&
    (stateStay.guests as number) > 0,
  );

  const initialStay: RoomStay | undefined = hasCompleteUrlStay
    ? (urlStay as RoomStay)
    : hasCompleteStateStay
      ? (stateStay as RoomStay)
      : undefined;

  function handleStayChange(stay: RoomStay) {
    setSearchParams(buildDetailSearch(stay), { replace: true });
  }

  function bookRoom(room: PublicRoom, stay: RoomStay) {
    const bookingStay = isCompleteStay(stay) ? stay : undefined;
    navigate(createBookingUrl(room.id, bookingStay), {
      state: {
        room: buildBookingRoomState(room),
        search: bookingStay,
      },
    });
  }

  function findOtherRooms(stay: RoomStay) {
    navigate(
      `/rooms${buildDetailSearch(isCompleteStay(stay) ? stay : null)}`,
    );
  }

  return (
    <PublicRoomDetailPage
      initialStay={initialStay}
      onBack={() => navigate(-1)}
      onBook={bookRoom}
      onFindOtherRooms={findOtherRooms}
      onStayChange={handleStayChange}
      roomId={roomId}
    />
  );
}

export function ManagementRoomsRoute() {
  const { principal } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const roomsPath = pathname.startsWith("/staff")
    ? "/staff/rooms"
    : "/management/rooms";

  if (principal?.actorType !== "user") {
    return <Navigate replace to="/forbidden" />;
  }

  return (
    <ManagementRoomsPage
      onCreateRoom={
        principal.role === "ADMIN" ? () => navigate(`${roomsPath}/new`) : undefined
      }
      onEditRoom={
        principal.role === "ADMIN"
          ? (roomId) => navigate(`${roomsPath}/${roomId}/edit`)
          : undefined
      }
      onManageImages={
        principal.role === "ADMIN"
          ? (roomId) => navigate(`${roomsPath}/${roomId}/images`)
          : undefined
      }
      onViewRoom={(roomId) => navigate(`${roomsPath}/${roomId}`)}
      role={principal.role}
    />
  );
}

export function ManagementCreateRoomRoute() {
  const { principal } = useAuth();

  if (principal?.actorType !== "user" || principal.role !== "ADMIN") {
    return <Navigate replace to="/forbidden" />;
  }

  return <CreateRoomPage />;
}

export function ManagementEditRoomRoute() {
  const { principal } = useAuth();
  const { roomId } = useParams();
  const { pathname } = useLocation();
  const roomsPath = pathname.startsWith("/staff")
    ? "/staff/rooms"
    : "/management/rooms";

  if (principal?.actorType !== "user" || principal.role !== "ADMIN") {
    return <Navigate replace to="/forbidden" />;
  }

  if (!roomId || !/^[1-9][0-9]*$/.test(roomId)) {
    return <Navigate replace to={roomsPath} />;
  }

  return <EditRoomPage roomId={roomId} />;
}

export function ManagementRoomDetailRoute() {
  const { principal } = useAuth();
  const { roomId } = useParams();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const roomsPath = pathname.startsWith("/staff")
    ? "/staff/rooms"
    : "/management/rooms";

  if (principal?.actorType !== "user") {
    return <Navigate replace to="/forbidden" />;
  }

  if (!roomId || !/^[1-9][0-9]*$/.test(roomId)) {
    return <Navigate replace to={roomsPath} />;
  }

  return (
    <ManagementRoomDetailPage
      onBack={() => navigate(roomsPath)}
      onDeleted={() => navigate(roomsPath, { replace: true })}
      onEditRoom={
        principal.role === "ADMIN"
          ? () => navigate(`${roomsPath}/${roomId}/edit`)
          : undefined
      }
      onManageImages={
        principal.role === "ADMIN"
          ? () => navigate(`${roomsPath}/${roomId}/images`)
          : undefined
      }
      role={principal.role}
      roomId={roomId}
    />
  );
}

export function ManagementRoomImagesRoute() {
  const { principal } = useAuth();
  const { roomId } = useParams();
  const navigate = useNavigate();

  if (principal?.actorType !== "user" || principal.role !== "ADMIN") {
    return <Navigate replace to="/forbidden" />;
  }

  if (!roomId || !/^[1-9][0-9]*$/.test(roomId)) {
    return <Navigate replace to="/management/rooms" />;
  }

  return (
    <RoomImageManagementPage
      onBack={() => navigate(`/management/rooms/${roomId}`)}
      roomId={roomId}
    />
  );
}
