package models

import "time"

// NetworkConnection represents a network connection between devices
type NetworkConnection struct {
	ID             int       `json:"id" db:"id"`
	SourceDeviceID int       `json:"source_device_id" db:"source_device_id"`
	TargetDeviceID int       `json:"target_device_id" db:"target_device_id"`
	ConnectionType string    `json:"connection_type" db:"connection_type"`
	PortInfo       string    `json:"port_info" db:"port_info"`
	Speed          string    `json:"speed" db:"speed"`
	CreatedAt      time.Time `json:"created_at" db:"created_at"`
	SourceDevice   *Device   `json:"source_device,omitempty"`
	TargetDevice   *Device   `json:"target_device,omitempty"`
}

// CreateConnectionRequest represents a request to create a network connection
type CreateConnectionRequest struct {
	SourceDeviceID int    `json:"source_device_id" binding:"required"`
	TargetDeviceID int    `json:"target_device_id" binding:"required"`
	ConnectionType string `json:"connection_type"`
	PortInfo       string `json:"port_info"`
	Speed          string `json:"speed"`
}
