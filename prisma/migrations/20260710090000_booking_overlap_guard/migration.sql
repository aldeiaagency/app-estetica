-- PostgreSQL-level invariant: one professional cannot have two active bookings
-- whose time ranges overlap. Prisma DateTime maps to timestamp without time zone,
-- therefore tsrange is required; tstzrange would introduce a timezone-dependent
-- cast that PostgreSQL correctly rejects as non-immutable in an index expression.
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE "Booking"
ADD CONSTRAINT "Booking_staff_active_no_overlap"
EXCLUDE USING gist (
  "staffId" WITH =,
  tsrange("startAt", "endAt", '[)') WITH &&
)
WHERE (
  "staffId" IS NOT NULL
  AND "status" IN ('PENDING'::"BookingStatus", 'CONFIRMED'::"BookingStatus")
);
