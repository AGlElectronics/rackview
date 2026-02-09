package services

import (
	"database/sql"
	"fmt"

	"rackview/internal/database"
	"rackview/internal/models"
)

// RackService handles rack-related business logic
type RackService struct{}

// NewRackService creates a new rack service
func NewRackService() *RackService {
	return &RackService{}
}

// GetAllRacks retrieves all racks
func (s *RackService) GetAllRacks() ([]models.Rack, error) {
	rows, err := database.DB.Query(`
		SELECT id, name, description, size_u, created_at, updated_at
		FROM racks
		ORDER BY id
	`)
	if err != nil {
		return nil, fmt.Errorf("failed to query racks: %w", err)
	}
	defer rows.Close()

	var racks []models.Rack
	for rows.Next() {
		var rack models.Rack
		if err := rows.Scan(&rack.ID, &rack.Name, &rack.Description, &rack.SizeU, &rack.CreatedAt, &rack.UpdatedAt); err != nil {
			return nil, fmt.Errorf("failed to scan rack: %w", err)
		}
		racks = append(racks, rack)
	}

	return racks, nil
}

// GetRackByID retrieves a rack by ID with its devices
func (s *RackService) GetRackByID(id int) (*models.Rack, error) {
	var rack models.Rack
	err := database.DB.QueryRow(`
		SELECT id, name, description, size_u, created_at, updated_at
		FROM racks
		WHERE id = $1
	`, id).Scan(&rack.ID, &rack.Name, &rack.Description, &rack.SizeU, &rack.CreatedAt, &rack.UpdatedAt)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("rack not found")
	}
	if err != nil {
		return nil, fmt.Errorf("failed to query rack: %w", err)
	}

	// Load devices for this rack
	devices, err := NewDeviceService().GetDevicesByRackID(id)
	if err != nil {
		return nil, fmt.Errorf("failed to load devices: %w", err)
	}
	rack.Devices = devices

	return &rack, nil
}

// CreateRack creates a new rack
func (s *RackService) CreateRack(req models.CreateRackRequest) (*models.Rack, error) {
	var rack models.Rack
	err := database.DB.QueryRow(`
		INSERT INTO racks (name, description, size_u)
		VALUES ($1, $2, $3)
		RETURNING id, name, description, size_u, created_at, updated_at
	`, req.Name, req.Description, req.SizeU).Scan(
		&rack.ID, &rack.Name, &rack.Description, &rack.SizeU, &rack.CreatedAt, &rack.UpdatedAt,
	)

	if err != nil {
		return nil, fmt.Errorf("failed to create rack: %w", err)
	}

	return &rack, nil
}

// UpdateRack updates an existing rack
func (s *RackService) UpdateRack(id int, req models.UpdateRackRequest) (*models.Rack, error) {
	// Build dynamic update query
	updates := []string{}
	args := []interface{}{}
	argPos := 1

	if req.Name != "" {
		updates = append(updates, fmt.Sprintf("name = $%d", argPos))
		args = append(args, req.Name)
		argPos++
	}
	if req.Description != "" {
		updates = append(updates, fmt.Sprintf("description = $%d", argPos))
		args = append(args, req.Description)
		argPos++
	}
	if req.SizeU != nil {
		updates = append(updates, fmt.Sprintf("size_u = $%d", argPos))
		args = append(args, *req.SizeU)
		argPos++
	}

	if len(updates) == 0 {
		return s.GetRackByID(id)
	}

	args = append(args, id)
	setClause := ""
	for i, update := range updates {
		if i > 0 {
			setClause += ", "
		}
		setClause += update
	}

	query := fmt.Sprintf(`
		UPDATE racks
		SET %s
		WHERE id = $%d
		RETURNING id, name, description, size_u, created_at, updated_at
	`, setClause, argPos)

	var rack models.Rack
	err := database.DB.QueryRow(query, args...).Scan(
		&rack.ID, &rack.Name, &rack.Description, &rack.SizeU, &rack.CreatedAt, &rack.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("rack not found")
	}
	if err != nil {
		return nil, fmt.Errorf("failed to update rack: %w", err)
	}

	return &rack, nil
}

// DeleteRack deletes a rack
func (s *RackService) DeleteRack(id int) error {
	result, err := database.DB.Exec("DELETE FROM racks WHERE id = $1", id)
	if err != nil {
		return fmt.Errorf("failed to delete rack: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("rack not found")
	}

	return nil
}
