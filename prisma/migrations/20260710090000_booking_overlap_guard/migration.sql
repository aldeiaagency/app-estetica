-- PostgreSQL-level invariant: one professional cannot have two active bookings
-- whose time ranges overlap. Application checks remain useful for friendly
-- errors, but this constraint is the final protection against race conditions.
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE "Booking"
ADD CONSTRAINT "Booking_staff_active_no_overlap"
EXCLUDE USING gist (
  "staffId" WITH =,
  tstzrange("startAt", "endAt", '[)') WITH &&
)
WHERE (
  "staffId" IS NOT NULL
  AND "status" IN ('PENDING'::"BookingStatus", 'CONFIRMED'::"BookingStatus")
);
