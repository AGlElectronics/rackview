-- Add 'unknown' status to devices table constraint
-- This allows devices without health check configuration to have an 'unknown' status

-- Drop the existing constraint
ALTER TABLE devices DROP CONSTRAINT IF EXISTS devices_status_check;

-- Add the new constraint with 'unknown' included
ALTER TABLE devices ADD CONSTRAINT devices_status_check 
  CHECK (status IN ('online', 'offline', 'warning', 'unknown'));

-- Add comment for documentation
COMMENT ON COLUMN devices.status IS 'Device status: online, offline, warning, or unknown (if health check not configured)';
