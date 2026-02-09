package services

import (
	"database/sql"
	"fmt"

	"rackview/internal/database"
	"rackview/internal/models"
)

// DeviceService handles device-related business logic
type DeviceService struct{}

// NewDeviceService creates a new device service
func NewDeviceService() *DeviceService {
	return &DeviceService{}
}

// GetDevicesByRackID retrieves all devices for a specific rack
func (s *DeviceService) GetDevicesByRackID(rackID int) ([]models.Device, error) {
	rows, err := database.DB.Query(`
		SELECT id, rack_id, name, icon, type, position_u, size_u, status, model, ip_address, health_check_url, created_at, updated_at
		FROM devices
		WHERE rack_id = $1
		ORDER BY position_u DESC
	`, rackID)
	if err != nil {
		return nil, fmt.Errorf("failed to query devices: %w", err)
	}
	defer rows.Close()

	var devices []models.Device
	for rows.Next() {
		var device models.Device
		var ipAddress, healthCheckURL sql.NullString
		if err := rows.Scan(
			&device.ID, &device.RackID, &device.Name, &device.Icon, &device.Type,
			&device.PositionU, &device.SizeU, &device.Status, &device.Model,
			&ipAddress, &healthCheckURL,
			&device.CreatedAt, &device.UpdatedAt,
		); err != nil {
			return nil, fmt.Errorf("failed to scan device: %w", err)
		}
		// Convert NullString to string
		if ipAddress.Valid {
			device.IPAddress = ipAddress.String
		}
		if healthCheckURL.Valid {
			device.HealthCheckURL = healthCheckURL.String
		}

		// Load specs
		specs, err := s.getDeviceSpecs(device.ID)
		if err != nil {
			return nil, fmt.Errorf("failed to load specs: %w", err)
		}
		device.Specs = specs

		devices = append(devices, device)
	}

	return devices, nil
}

// GetAllDevices retrieves all devices, optionally filtered by rack
func (s *DeviceService) GetAllDevices(rackID *int) ([]models.Device, error) {
	var rows *sql.Rows
	var err error

	if rackID != nil {
		return s.GetDevicesByRackID(*rackID)
	}

	rows, err = database.DB.Query(`
		SELECT id, rack_id, name, icon, type, position_u, size_u, status, model, ip_address, health_check_url, created_at, updated_at
		FROM devices
		ORDER BY rack_id, position_u DESC
	`)
	if err != nil {
		return nil, fmt.Errorf("failed to query devices: %w", err)
	}
	defer rows.Close()

	var devices []models.Device
	for rows.Next() {
		var device models.Device
		var ipAddress, healthCheckURL sql.NullString
		if err := rows.Scan(
			&device.ID, &device.RackID, &device.Name, &device.Icon, &device.Type,
			&device.PositionU, &device.SizeU, &device.Status, &device.Model,
			&ipAddress, &healthCheckURL,
			&device.CreatedAt, &device.UpdatedAt,
		); err != nil {
			return nil, fmt.Errorf("failed to scan device: %w", err)
		}
		// Convert NullString to string
		if ipAddress.Valid {
			device.IPAddress = ipAddress.String
		}
		if healthCheckURL.Valid {
			device.HealthCheckURL = healthCheckURL.String
		}

		// Load specs
		specs, err := s.getDeviceSpecs(device.ID)
		if err != nil {
			return nil, fmt.Errorf("failed to load specs: %w", err)
		}
		device.Specs = specs

		devices = append(devices, device)
	}

	return devices, nil
}

// GetDeviceByID retrieves a device by ID
func (s *DeviceService) GetDeviceByID(id int) (*models.Device, error) {
	var device models.Device
	var ipAddress, healthCheckURL sql.NullString
	err := database.DB.QueryRow(`
		SELECT id, rack_id, name, icon, type, position_u, size_u, status, model, ip_address, health_check_url, created_at, updated_at
		FROM devices
		WHERE id = $1
	`, id).Scan(
		&device.ID, &device.RackID, &device.Name, &device.Icon, &device.Type,
		&device.PositionU, &device.SizeU, &device.Status, &device.Model,
		&ipAddress, &healthCheckURL,
		&device.CreatedAt, &device.UpdatedAt,
	)
	
	// Convert NullString to string
	if ipAddress.Valid {
		device.IPAddress = ipAddress.String
	}
	if healthCheckURL.Valid {
		device.HealthCheckURL = healthCheckURL.String
	}

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("device not found")
	}
	if err != nil {
		return nil, fmt.Errorf("failed to query device: %w", err)
	}

	// Load specs
	specs, err := s.getDeviceSpecs(device.ID)
	if err != nil {
		return nil, fmt.Errorf("failed to load specs: %w", err)
	}
	device.Specs = specs

	return &device, nil
}

// CreateDevice creates a new device
func (s *DeviceService) CreateDevice(req models.CreateDeviceRequest) (*models.Device, error) {
	// Validate device fits in rack
	var rackSize int
	err := database.DB.QueryRow("SELECT size_u FROM racks WHERE id = $1", req.RackID).Scan(&rackSize)
	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("rack not found")
	}
	if err != nil {
		return nil, fmt.Errorf("failed to query rack: %w", err)
	}

	// position_u is the TOP slot, device extends downward
	// So bottom U = position_u - size_u + 1
	bottomU := req.PositionU - req.SizeU + 1
	if bottomU < 1 {
		return nil, fmt.Errorf("device does not fit in rack (position %d - size %d + 1 = %d is below U1)", req.PositionU, req.SizeU, bottomU)
	}
	if req.PositionU > rackSize {
		return nil, fmt.Errorf("device does not fit in rack (position %d exceeds rack size %d)", req.PositionU, rackSize)
	}

	// Check for overlaps
	overlaps, err := s.checkDeviceOverlap(req.RackID, req.PositionU, req.SizeU, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to check overlaps: %w", err)
	}
	if overlaps {
		return nil, fmt.Errorf("device overlaps with existing device")
	}

	// Set defaults
	if req.Icon == "" {
		req.Icon = "🖥️"
	}
	if req.Status == "" {
		req.Status = models.DeviceStatusOnline
	}

	var device models.Device
	err = database.DB.QueryRow(`
		INSERT INTO devices (rack_id, name, icon, type, position_u, size_u, status, model, ip_address, health_check_url)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
		RETURNING id, rack_id, name, icon, type, position_u, size_u, status, model, ip_address, health_check_url, created_at, updated_at
	`, req.RackID, req.Name, req.Icon, req.Type, req.PositionU, req.SizeU, req.Status, req.Model, req.IPAddress, req.HealthCheckURL).Scan(
		&device.ID, &device.RackID, &device.Name, &device.Icon, &device.Type,
		&device.PositionU, &device.SizeU, &device.Status, &device.Model,
		&device.IPAddress, &device.HealthCheckURL,
		&device.CreatedAt, &device.UpdatedAt,
	)

	if err != nil {
		return nil, fmt.Errorf("failed to create device: %w", err)
	}

	// Insert specs
	if req.Specs != nil {
		if err := s.setDeviceSpecs(device.ID, req.Specs); err != nil {
			return nil, fmt.Errorf("failed to set specs: %w", err)
		}
		device.Specs = req.Specs
	}

	return &device, nil
}

// UpdateDevice updates an existing device
func (s *DeviceService) UpdateDevice(id int, req models.UpdateDeviceRequest) (*models.Device, error) {
	// Get current device
	current, err := s.GetDeviceByID(id)
	if err != nil {
		return nil, err
	}

	// Build update query
	updates := []string{}
	args := []interface{}{}
	argPos := 1

	if req.Name != nil {
		updates = append(updates, fmt.Sprintf("name = $%d", argPos))
		args = append(args, *req.Name)
		argPos++
	}
	if req.Icon != nil {
		updates = append(updates, fmt.Sprintf("icon = $%d", argPos))
		args = append(args, *req.Icon)
		argPos++
	}
	if req.Type != nil {
		updates = append(updates, fmt.Sprintf("type = $%d", argPos))
		args = append(args, *req.Type)
		argPos++
	}
	if req.PositionU != nil {
		updates = append(updates, fmt.Sprintf("position_u = $%d", argPos))
		args = append(args, *req.PositionU)
		argPos++
	}
	if req.SizeU != nil {
		updates = append(updates, fmt.Sprintf("size_u = $%d", argPos))
		args = append(args, *req.SizeU)
		argPos++
	}
	if req.Status != nil {
		updates = append(updates, fmt.Sprintf("status = $%d", argPos))
		args = append(args, *req.Status)
		argPos++
	}
	if req.Model != nil {
		updates = append(updates, fmt.Sprintf("model = $%d", argPos))
		args = append(args, *req.Model)
		argPos++
	}
	if req.IPAddress != nil {
		updates = append(updates, fmt.Sprintf("ip_address = $%d", argPos))
		args = append(args, *req.IPAddress)
		argPos++
	}
	if req.HealthCheckURL != nil {
		updates = append(updates, fmt.Sprintf("health_check_url = $%d", argPos))
		args = append(args, *req.HealthCheckURL)
		argPos++
	}

	// Validate position/size if changed
	if req.PositionU != nil || req.SizeU != nil {
		positionU := current.PositionU
		sizeU := current.SizeU
		if req.PositionU != nil {
			positionU = *req.PositionU
		}
		if req.SizeU != nil {
			sizeU = *req.SizeU
		}

		// Check rack size
		var rackSize int
		err := database.DB.QueryRow("SELECT size_u FROM racks WHERE id = $1", current.RackID).Scan(&rackSize)
		if err != nil {
			return nil, fmt.Errorf("failed to query rack: %w", err)
		}

		// position_u is the TOP slot, device extends downward
		// So bottom U = position_u - size_u + 1
		bottomU := positionU - sizeU + 1
		if bottomU < 1 {
			return nil, fmt.Errorf("device does not fit in rack (position %d - size %d + 1 = %d is below U1)", positionU, sizeU, bottomU)
		}
		if positionU > rackSize {
			return nil, fmt.Errorf("device does not fit in rack (position %d exceeds rack size %d)", positionU, rackSize)
		}

		// Check overlaps
		overlaps, err := s.checkDeviceOverlap(current.RackID, positionU, sizeU, &id)
		if err != nil {
			return nil, fmt.Errorf("failed to check overlaps: %w", err)
		}
		if overlaps {
			return nil, fmt.Errorf("device overlaps with existing device")
		}
	}

	if len(updates) == 0 && req.Specs == nil {
		return current, nil
	}

	if len(updates) > 0 {
		args = append(args, id)
		setClause := ""
		for i, update := range updates {
			if i > 0 {
				setClause += ", "
			}
			setClause += update
		}

		query := fmt.Sprintf(`
			UPDATE devices
			SET %s
			WHERE id = $%d
			RETURNING id, rack_id, name, icon, type, position_u, size_u, status, model, ip_address, health_check_url, created_at, updated_at
		`, setClause, argPos)

		var ipAddress, healthCheckURL sql.NullString
		err = database.DB.QueryRow(query, args...).Scan(
			&current.ID, &current.RackID, &current.Name, &current.Icon, &current.Type,
			&current.PositionU, &current.SizeU, &current.Status, &current.Model,
			&ipAddress, &healthCheckURL,
			&current.CreatedAt, &current.UpdatedAt,
		)

		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("device not found")
		}
		if err != nil {
			return nil, fmt.Errorf("failed to update device: %w", err)
		}
		
		// Convert NullString to string
		if ipAddress.Valid {
			current.IPAddress = ipAddress.String
		} else {
			current.IPAddress = ""
		}
		if healthCheckURL.Valid {
			current.HealthCheckURL = healthCheckURL.String
		} else {
			current.HealthCheckURL = ""
		}
	}

	// Update specs if provided
	if req.Specs != nil {
		if err := s.setDeviceSpecs(id, req.Specs); err != nil {
			return nil, fmt.Errorf("failed to update specs: %w", err)
		}
		current.Specs = req.Specs
	} else {
		// Reload specs
		specs, err := s.getDeviceSpecs(id)
		if err != nil {
			return nil, fmt.Errorf("failed to reload specs: %w", err)
		}
		current.Specs = specs
	}

	return current, nil
}

// DeleteDevice deletes a device
func (s *DeviceService) DeleteDevice(id int) error {
	result, err := database.DB.Exec("DELETE FROM devices WHERE id = $1", id)
	if err != nil {
		return fmt.Errorf("failed to delete device: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("device not found")
	}

	return nil
}

// getDeviceSpecs retrieves all specs for a device
func (s *DeviceService) getDeviceSpecs(deviceID int) (map[string]string, error) {
	rows, err := database.DB.Query(`
		SELECT spec_key, spec_value
		FROM device_specs
		WHERE device_id = $1
	`, deviceID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	specs := make(map[string]string)
	for rows.Next() {
		var key, value string
		if err := rows.Scan(&key, &value); err != nil {
			return nil, err
		}
		specs[key] = value
	}

	return specs, nil
}

// setDeviceSpecs sets specs for a device (replaces all existing)
func (s *DeviceService) setDeviceSpecs(deviceID int, specs map[string]string) error {
	// Delete existing specs
	_, err := database.DB.Exec("DELETE FROM device_specs WHERE device_id = $1", deviceID)
	if err != nil {
		return err
	}

	// Insert new specs
	for key, value := range specs {
		_, err := database.DB.Exec(`
			INSERT INTO device_specs (device_id, spec_key, spec_value)
			VALUES ($1, $2, $3)
		`, deviceID, key, value)
		if err != nil {
			return err
		}
	}

	return nil
}

// checkDeviceOverlap checks if a device position overlaps with existing devices
// position_u is the TOP slot, device extends downward
// So a device at position_u with size_u occupies: [position_u, position_u - size_u + 1]
func (s *DeviceService) checkDeviceOverlap(rackID, positionU, sizeU int, excludeDeviceID *int) (bool, error) {
	// Calculate the bottom U slot for the new device
	newTopU := positionU
	newBottomU := positionU - sizeU + 1
	
	// Check if any existing device overlaps with the range [newTopU, newBottomU]
	// An existing device at position_u with size_u occupies: [position_u, position_u - size_u + 1]
	// Two ranges [a_top, a_bottom] and [b_top, b_bottom] overlap if:
	//   a_top >= b_bottom AND a_bottom <= b_top
	query := `
		SELECT COUNT(*) > 0
		FROM devices
		WHERE rack_id = $1
		AND id != COALESCE($3, -1)
		AND (
			-- Existing device's top is within new device's range
			(position_u <= $2 AND position_u >= $4) OR
			-- Existing device's bottom is within new device's range
			(position_u - size_u + 1 <= $2 AND position_u - size_u + 1 >= $4) OR
			-- Existing device completely contains new device
			(position_u >= $2 AND position_u - size_u + 1 <= $4) OR
			-- New device completely contains existing device
			(position_u <= $2 AND position_u - size_u + 1 >= $4)
		)
	`

	var excludeID interface{} = nil
	if excludeDeviceID != nil {
		excludeID = *excludeDeviceID
	}

	var overlaps bool
	// Parameters: $1=rackID, $2=newTopU, $3=excludeID, $4=newBottomU
	err := database.DB.QueryRow(query, rackID, newTopU, excludeID, newBottomU).Scan(&overlaps)
	return overlaps, err
}
