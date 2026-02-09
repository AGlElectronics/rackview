package services

import (
	"database/sql"
	"fmt"

	"rackview/internal/database"
	"rackview/internal/models"
)

// NetworkService handles network connection-related business logic
type NetworkService struct{}

// NewNetworkService creates a new network service
func NewNetworkService() *NetworkService {
	return &NetworkService{}
}

// GetAllConnections retrieves all network connections
func (s *NetworkService) GetAllConnections() ([]models.NetworkConnection, error) {
	rows, err := database.DB.Query(`
		SELECT id, source_device_id, target_device_id, connection_type, port_info, speed, created_at
		FROM network_connections
		ORDER BY id
	`)
	if err != nil {
		return nil, fmt.Errorf("failed to query connections: %w", err)
	}
	defer rows.Close()

	var connections []models.NetworkConnection
	deviceService := NewDeviceService()

	for rows.Next() {
		var conn models.NetworkConnection
		if err := rows.Scan(
			&conn.ID, &conn.SourceDeviceID, &conn.TargetDeviceID,
			&conn.ConnectionType, &conn.PortInfo, &conn.Speed, &conn.CreatedAt,
		); err != nil {
			return nil, fmt.Errorf("failed to scan connection: %w", err)
		}

		// Load device details
		source, err := deviceService.GetDeviceByID(conn.SourceDeviceID)
		if err == nil {
			conn.SourceDevice = source
		}
		target, err := deviceService.GetDeviceByID(conn.TargetDeviceID)
		if err == nil {
			conn.TargetDevice = target
		}

		connections = append(connections, conn)
	}

	return connections, nil
}

// GetConnectionByID retrieves a connection by ID
func (s *NetworkService) GetConnectionByID(id int) (*models.NetworkConnection, error) {
	var conn models.NetworkConnection
	err := database.DB.QueryRow(`
		SELECT id, source_device_id, target_device_id, connection_type, port_info, speed, created_at
		FROM network_connections
		WHERE id = $1
	`, id).Scan(
		&conn.ID, &conn.SourceDeviceID, &conn.TargetDeviceID,
		&conn.ConnectionType, &conn.PortInfo, &conn.Speed, &conn.CreatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("connection not found")
	}
	if err != nil {
		return nil, fmt.Errorf("failed to query connection: %w", err)
	}

	// Load device details
	deviceService := NewDeviceService()
	source, err := deviceService.GetDeviceByID(conn.SourceDeviceID)
	if err == nil {
		conn.SourceDevice = source
	}
	target, err := deviceService.GetDeviceByID(conn.TargetDeviceID)
	if err == nil {
		conn.TargetDevice = target
	}

	return &conn, nil
}

// CreateConnection creates a new network connection
func (s *NetworkService) CreateConnection(req models.CreateConnectionRequest) (*models.NetworkConnection, error) {
	// Validate devices exist
	deviceService := NewDeviceService()
	_, err := deviceService.GetDeviceByID(req.SourceDeviceID)
	if err != nil {
		return nil, fmt.Errorf("source device not found: %w", err)
	}

	_, err = deviceService.GetDeviceByID(req.TargetDeviceID)
	if err != nil {
		return nil, fmt.Errorf("target device not found: %w", err)
	}

	// Allow multiple connections between the same devices (e.g., multiple ports/interfaces)
	var conn models.NetworkConnection
	err = database.DB.QueryRow(`
		INSERT INTO network_connections (source_device_id, target_device_id, connection_type, port_info, speed)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id, source_device_id, target_device_id, connection_type, port_info, speed, created_at
	`, req.SourceDeviceID, req.TargetDeviceID, req.ConnectionType, req.PortInfo, req.Speed).Scan(
		&conn.ID, &conn.SourceDeviceID, &conn.TargetDeviceID,
		&conn.ConnectionType, &conn.PortInfo, &conn.Speed, &conn.CreatedAt,
	)

	if err != nil {
		return nil, fmt.Errorf("failed to create connection: %w", err)
	}

	// Load device details
	source, err := deviceService.GetDeviceByID(conn.SourceDeviceID)
	if err == nil {
		conn.SourceDevice = source
	}
	target, err := deviceService.GetDeviceByID(conn.TargetDeviceID)
	if err == nil {
		conn.TargetDevice = target
	}

	return &conn, nil
}

// UpdateConnection updates an existing network connection
func (s *NetworkService) UpdateConnection(id int, req models.UpdateConnectionRequest) (*models.NetworkConnection, error) {
	var conn models.NetworkConnection
	err := database.DB.QueryRow(`
		UPDATE network_connections
		SET connection_type = $1, port_info = $2, speed = $3
		WHERE id = $4
		RETURNING id, source_device_id, target_device_id, connection_type, port_info, speed, created_at
	`, req.ConnectionType, req.PortInfo, req.Speed, id).Scan(
		&conn.ID, &conn.SourceDeviceID, &conn.TargetDeviceID,
		&conn.ConnectionType, &conn.PortInfo, &conn.Speed, &conn.CreatedAt,
	)

	if err != nil {
		return nil, fmt.Errorf("failed to update connection: %w", err)
	}

	// Load device details
	deviceService := NewDeviceService()
	source, err := deviceService.GetDeviceByID(conn.SourceDeviceID)
	if err == nil {
		conn.SourceDevice = source
	}
	target, err := deviceService.GetDeviceByID(conn.TargetDeviceID)
	if err == nil {
		conn.TargetDevice = target
	}

	return &conn, nil
}

// DeleteConnection deletes a network connection
func (s *NetworkService) DeleteConnection(id int) error {
	result, err := database.DB.Exec("DELETE FROM network_connections WHERE id = $1", id)
	if err != nil {
		return fmt.Errorf("failed to delete connection: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("connection not found")
	}

	return nil
}
