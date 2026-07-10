CREATE OR REPLACE FUNCTION app_critical_audit_log()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  actor TEXT;
  action_name TEXT;
  safe_metadata JSONB;
BEGIN
  actor := COALESCE(NULLIF(current_setting('app.actor_id', true), ''), 'system:database');
  action_name := TG_TABLE_NAME || '.' || lower(TG_OP);

  IF TG_TABLE_NAME = 'Booking' THEN
    IF OLD."status" IS NOT DISTINCT FROM NEW."status"
       AND OLD."startAt" IS NOT DISTINCT FROM NEW."startAt"
       AND OLD."endAt" IS NOT DISTINCT FROM NEW."endAt" THEN
      RETURN NEW;
    END IF;
    safe_metadata := jsonb_build_object(
      'oldStatus', OLD."status",
      'newStatus', NEW."status",
      'timeChanged', OLD."startAt" IS DISTINCT FROM NEW."startAt" OR OLD."endAt" IS DISTINCT FROM NEW."endAt"
    );
  ELSIF TG_TABLE_NAME = 'Order' THEN
    IF OLD."status" IS NOT DISTINCT FROM NEW."status" THEN RETURN NEW; END IF;
    safe_metadata := jsonb_build_object('oldStatus', OLD."status", 'newStatus', NEW."status");
  ELSIF TG_TABLE_NAME = 'Organization' THEN
    IF OLD."plan" IS NOT DISTINCT FROM NEW."plan" THEN RETURN NEW; END IF;
    safe_metadata := jsonb_build_object('oldPlan', OLD."plan", 'newPlan', NEW."plan");
  ELSIF TG_TABLE_NAME = 'User' THEN
    IF OLD."role" IS NOT DISTINCT FROM NEW."role"
       AND OLD."organizationId" IS NOT DISTINCT FROM NEW."organizationId"
       AND OLD."active" IS NOT DISTINCT FROM NEW."active"
       AND OLD."sessionVersion" IS NOT DISTINCT FROM NEW."sessionVersion" THEN
      RETURN NEW;
    END IF;
    safe_metadata := jsonb_build_object(
      'oldRole', OLD."role",
      'newRole', NEW."role",
      'organizationChanged', OLD."organizationId" IS DISTINCT FROM NEW."organizationId",
      'activeChanged', OLD."active" IS DISTINCT FROM NEW."active",
      'sessionsRevoked', OLD."sessionVersion" IS DISTINCT FROM NEW."sessionVersion"
    );
  ELSE
    RETURN NEW;
  END IF;

  INSERT INTO "AdminAuditLog" ("id", "actorId", "action", "targetType", "targetId", "metadata", "createdAt")
  VALUES (
    md5(random()::text || clock_timestamp()::text || NEW."id"::text),
    actor,
    action_name,
    TG_TABLE_NAME,
    NEW."id"::text,
    safe_metadata,
    CURRENT_TIMESTAMP
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS "Booking_critical_audit_trg" ON "Booking";
CREATE TRIGGER "Booking_critical_audit_trg"
AFTER UPDATE ON "Booking"
FOR EACH ROW EXECUTE FUNCTION app_critical_audit_log();

DROP TRIGGER IF EXISTS "Order_critical_audit_trg" ON "Order";
CREATE TRIGGER "Order_critical_audit_trg"
AFTER UPDATE ON "Order"
FOR EACH ROW EXECUTE FUNCTION app_critical_audit_log();

DROP TRIGGER IF EXISTS "Organization_critical_audit_trg" ON "Organization";
CREATE TRIGGER "Organization_critical_audit_trg"
AFTER UPDATE ON "Organization"
FOR EACH ROW EXECUTE FUNCTION app_critical_audit_log();

DROP TRIGGER IF EXISTS "User_critical_audit_trg" ON "User";
CREATE TRIGGER "User_critical_audit_trg"
AFTER UPDATE ON "User"
FOR EACH ROW EXECUTE FUNCTION app_critical_audit_log();
