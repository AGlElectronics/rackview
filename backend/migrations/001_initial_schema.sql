-- RackView Database Schema

-- Racks table
CREATE TABLE IF NOT EXISTS racks (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    size_u INTEGER NOT NULL CHECK (size_u > 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Devices table
CREATE TABLE IF NOT EXISTS devices (
    id SERIAL PRIMARY KEY,
    rack_id INTEGER NOT NULL REFERENCES racks(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    icon VARCHAR(50) DEFAULT '🖥️',
    type VARCHAR(50) NOT NULL CHECK (type IN ('server', 'network', 'storage')),
    position_u INTEGER NOT NULL CHECK (position_u > 0),
    size_u INTEGER NOT NULL CHECK (size_u > 0),
    status VARCHAR(50) DEFAULT 'online' CHECK (status IN ('online', 'offline', 'warning')),
    model VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT device_fits_in_rack CHECK (
        position_u + size_u - 1 <= (SELECT size_u FROM racks WHERE id = rack_id)
    )
);

-- Device specs table (key-value pairs for flexible specifications)
CREATE TABLE IF NOT EXISTS device_specs (
    id SERIAL PRIMARY KEY,
    device_id INTEGER NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    spec_key VARCHAR(255) NOT NULL,
    spec_value TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(device_id, spec_key)
);

-- Network connections table (for network mapping)
CREATE TABLE IF NOT EXISTS network_connections (
    id SERIAL PRIMARY KEY,
    source_device_id INTEGER NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    target_device_id INTEGER NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    connection_type VARCHAR(100),
    port_info TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CHECK (source_device_id != target_device_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_devices_rack_id ON devices(rack_id);
CREATE INDEX IF NOT EXISTS idx_devices_position ON devices(rack_id, position_u);
CREATE INDEX IF NOT EXISTS idx_device_specs_device_id ON device_specs(device_id);
CREATE INDEX IF NOT EXISTS idx_network_connections_source ON network_connections(source_device_id);
CREATE INDEX IF NOT EXISTS idx_network_connections_target ON network_connections(target_device_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to auto-update updated_at
CREATE TRIGGER update_racks_updated_at BEFORE UPDATE ON racks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_devices_updated_at BEFORE UPDATE ON devices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
