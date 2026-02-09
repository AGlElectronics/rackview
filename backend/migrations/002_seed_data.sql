-- Seed initial data from gear.php

-- Insert initial racks
INSERT INTO racks (id, name, description, size_u) VALUES
(1, 'Rack A — Compute', 'Compute rack', 25),
(2, 'Rack B — Network & Storage', 'Network and Storage rack', 25)
ON CONFLICT DO NOTHING;

-- Reset sequence to avoid conflicts
SELECT setval('racks_id_seq', (SELECT MAX(id) FROM racks));

-- Insert devices for Rack A
INSERT INTO devices (rack_id, name, icon, type, position_u, size_u, status, model) VALUES
(1, 'Atlas 01', '🖥️', 'server', 21, 2, 'online', 'HP Proliant DL380 G10'),
(1, 'TrueNAS', '🥧', 'server', 18, 1, 'online', 'HP DL360 G9'),
(1, 'JBOD 12x3.5', '💻', 'storage', 16, 2, 'online', 'HP MSA60'),
(1, 'JBOD 24x2.5', '💻', 'storage', 14, 2, 'online', 'HP 3Par'),
(1, 'JBOD 24x2.5', '💻', 'storage', 12, 2, 'online', 'HP 3Par'),
(1, 'HP BladeCenter', '🔷', 'server', 10, 10, 'online', 'HP C7000')
ON CONFLICT DO NOTHING;

-- Insert devices for Rack B
INSERT INTO devices (rack_id, name, icon, type, position_u, size_u, status, model) VALUES
(2, 'Router', '🛡️', 'network', 24, 1, 'online', 'Unifi Dreammachine PRO'),
(2, 'Fiber PatchPanel', '🔌', 'network', 23, 1, 'online', 'Arista 7050SX'),
(2, 'Core Switch', '🔌', 'network', 22, 1, 'online', 'Arista 7050SX'),
(2, 'RJ45 PatchPanel', '🔌', 'network', 21, 1, 'online', 'Arista 7050SX'),
(2, 'RJ45 PoE Switch', '🔌', 'network', 20, 1, 'online', 'Zyxel 2210-28HP'),
(2, 'UPS-PDU 1', '🔌', 'network', 17, 1, 'online', 'Zyxel 2210-28HP'),
(2, 'UPS-PDU 2', '🔌', 'network', 15, 1, 'online', 'Zyxel 2210-28HP'),
(2, 'UPS System', '🔋', 'network', 10, 4, 'online', 'APC Smart-UPS 3000VA'),
(2, 'UPS System', '🔋', 'network', 4, 4, 'online', 'APC Smart-UPS 3000VA')
ON CONFLICT DO NOTHING;

-- Insert device specs
-- Atlas 01 specs
INSERT INTO device_specs (device_id, spec_key, spec_value) VALUES
((SELECT id FROM devices WHERE name = 'Atlas 01' AND rack_id = 1 LIMIT 1), 'CPU', '2x Xeon Gold 6148'),
((SELECT id FROM devices WHERE name = 'Atlas 01' AND rack_id = 1 LIMIT 1), 'Memory', '512GB DDR4'),
((SELECT id FROM devices WHERE name = 'Atlas 01' AND rack_id = 1 LIMIT 1), 'Storage', '2× 1TB NVMe')
ON CONFLICT DO NOTHING;

-- TrueNAS specs
INSERT INTO device_specs (device_id, spec_key, spec_value) VALUES
((SELECT id FROM devices WHERE name = 'TrueNAS' AND rack_id = 1 LIMIT 1), 'CPU', '2x Xeon Gold'),
((SELECT id FROM devices WHERE name = 'TrueNAS' AND rack_id = 1 LIMIT 1), 'Memory', '64GB'),
((SELECT id FROM devices WHERE name = 'TrueNAS' AND rack_id = 1 LIMIT 1), 'Network', '10GbE')
ON CONFLICT DO NOTHING;

-- JBOD specs
INSERT INTO device_specs (device_id, spec_key, spec_value) VALUES
((SELECT id FROM devices WHERE name = 'JBOD 12x3.5' AND rack_id = 1 LIMIT 1), 'Storage', '12x6TB HDD'),
((SELECT id FROM devices WHERE name = 'JBOD 24x2.5' AND rack_id = 1 AND position_u = 14 LIMIT 1), 'Storage', '16x600GB'),
((SELECT id FROM devices WHERE name = 'JBOD 24x2.5' AND rack_id = 1 AND position_u = 12 LIMIT 1), 'Storage', '24x600GB HDD')
ON CONFLICT DO NOTHING;

-- HP BladeCenter specs
INSERT INTO device_specs (device_id, spec_key, spec_value) VALUES
((SELECT id FROM devices WHERE name = 'HP BladeCenter' AND rack_id = 1 LIMIT 1), 'Blades 1', '1x HP BL460 G10'),
((SELECT id FROM devices WHERE name = 'HP BladeCenter' AND rack_id = 1 LIMIT 1), 'Blades 2', '6x HP BL460 G19'),
((SELECT id FROM devices WHERE name = 'HP BladeCenter' AND rack_id = 1 LIMIT 1), 'Blades 3', '1x HP BL460 G8'),
((SELECT id FROM devices WHERE name = 'HP BladeCenter' AND rack_id = 1 LIMIT 1), 'Switches', '2x Virtual Connect'),
((SELECT id FROM devices WHERE name = 'HP BladeCenter' AND rack_id = 1 LIMIT 1), 'PSU', '6x 2400W')
ON CONFLICT DO NOTHING;

-- Router specs
INSERT INTO device_specs (device_id, spec_key, spec_value) VALUES
((SELECT id FROM devices WHERE name = 'Router' AND rack_id = 2 LIMIT 1), 'WAN', '1GBe SFP'),
((SELECT id FROM devices WHERE name = 'Router' AND rack_id = 2 LIMIT 1), 'LAN', '10GBe SFP +')
ON CONFLICT DO NOTHING;

-- Core Switch specs
INSERT INTO device_specs (device_id, spec_key, spec_value) VALUES
((SELECT id FROM devices WHERE name = 'Core Switch' AND rack_id = 2 LIMIT 1), 'Ports', '48× SFP+ + 4× QSFP')
ON CONFLICT DO NOTHING;

-- RJ45 PoE Switch specs
INSERT INTO device_specs (device_id, spec_key, spec_value) VALUES
((SELECT id FROM devices WHERE name = 'RJ45 PoE Switch' AND rack_id = 2 LIMIT 1), 'Ports', '24× GbE POE + 4× SFP+')
ON CONFLICT DO NOTHING;

-- UPS specs
INSERT INTO device_specs (device_id, spec_key, spec_value) VALUES
((SELECT id FROM devices WHERE name = 'UPS System' AND rack_id = 2 AND position_u = 10 LIMIT 1), 'Capacity', '2700W'),
((SELECT id FROM devices WHERE name = 'UPS System' AND rack_id = 2 AND position_u = 10 LIMIT 1), 'Runtime', '~45 min'),
((SELECT id FROM devices WHERE name = 'UPS System' AND rack_id = 2 AND position_u = 4 LIMIT 1), 'Capacity', '2700W'),
((SELECT id FROM devices WHERE name = 'UPS System' AND rack_id = 2 AND position_u = 4 LIMIT 1), 'Runtime', '~45 min')
ON CONFLICT DO NOTHING;
