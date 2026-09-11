import { Search } from "lucide-react";
import { useMemo, useRef, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/shared/components/Button";
import { Field, Input } from "@/shared/components/FormControls";

import { FadeIn } from "./FadeIn";

function todayIso(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

interface SearchErrors {
  checkIn?: string;
  checkOut?: string;
  guests?: string;
}

export function HomeSearchPanel() {
  const navigate = useNavigate();
  const checkInRef = useRef<HTMLInputElement>(null);
  const checkOutRef = useRef<HTMLInputElement>(null);
  const guestsRef = useRef<HTMLInputElement>(null);
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState("2");
  const [errors, setErrors] = useState<SearchErrors>({});
  const minDate = useMemo(() => todayIso(), []);

  function validate(): SearchErrors {
    const next: SearchErrors = {};

    if (!checkIn) next.checkIn = "Vui lòng chọn ngày nhận phòng.";
    if (!checkOut) {
      next.checkOut = "Vui lòng chọn ngày trả phòng.";
    } else if (checkIn && checkOut <= checkIn) {
      next.checkOut = "Ngày trả phòng phải sau ngày nhận phòng.";
    }

    const guestsNumber = Number(guests);
    if (!Number.isInteger(guestsNumber) || guestsNumber < 1) {
      next.guests = "Số khách tối thiểu là 1.";
    }

    return next;
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);

    if (nextErrors.checkIn) checkInRef.current?.focus();
    else if (nextErrors.checkOut) checkOutRef.current?.focus();
    else if (nextErrors.guests) guestsRef.current?.focus();
    if (Object.keys(nextErrors).length > 0) return;

    const params = new URLSearchParams({ checkIn, checkOut, guests });
    navigate(`/rooms?${params.toString()}`);
  }

  return (
    <FadeIn
      className="absolute inset-x-0 bottom-0 z-10 mx-auto w-full max-w-app translate-y-1/2 px-4 sm:px-6 lg:px-8"
      delay={0.38}
      y={24}
    >
      <form
        aria-label="Tìm phòng trống"
        className="grid gap-3 rounded-card bg-surface p-4 shadow-elevation-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-[1fr_1fr_0.72fr_auto] lg:items-end"
        noValidate
        onSubmit={handleSubmit}
      >
        <Field error={errors.checkIn} label="Nhận phòng" required>
          <Input
            id="home-check-in"
            min={minDate}
            onChange={(event) => setCheckIn(event.target.value)}
            ref={checkInRef}
            type="date"
            value={checkIn}
          />
        </Field>
        <Field error={errors.checkOut} label="Trả phòng" required>
          <Input
            id="home-check-out"
            min={checkIn || minDate}
            onChange={(event) => setCheckOut(event.target.value)}
            ref={checkOutRef}
            type="date"
            value={checkOut}
          />
        </Field>
        <Field error={errors.guests} label="Số khách" required>
          <Input
            id="home-guests"
            inputMode="numeric"
            min={1}
            onChange={(event) => setGuests(event.target.value)}
            ref={guestsRef}
            step={1}
            type="number"
            value={guests}
          />
        </Field>
        <Button className="min-h-11 w-full px-6" type="submit">
          <Search aria-hidden="true" className="size-4" />
          Tìm phòng
        </Button>
      </form>
    </FadeIn>
  );
}
