-- Add speed field to network_connections table
ALTER TABLE network_connections 
ADD COLUMN IF NOT EXISTS speed VARCHAR(50);

-- Add comment for documentation
COMMENT ON COLUMN network_connections.speed IS 'Connection speed (e.g., "1Gbps", "10Gbps", "25Gbps", "100Gbps")';
