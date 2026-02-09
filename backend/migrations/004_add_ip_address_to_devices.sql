-- Add IP address and health check URL fields to devices table
ALTER TABLE devices 
ADD COLUMN IF NOT EXISTS ip_address VARCHAR(255),
ADD COLUMN IF NOT EXISTS health_check_url VARCHAR(500);

-- Add comment for documentation
COMMENT ON COLUMN devices.ip_address IS 'IP address for ping/health checks';
COMMENT ON COLUMN devices.health_check_url IS 'URL for HTTP health check (e.g., http://192.168.1.100:8080/health)';
