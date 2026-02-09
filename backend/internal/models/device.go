package models

import "time"

// DeviceType represents the type of device
type DeviceType string

const (
	DeviceTypeServer  DeviceType = "server"
	DeviceTypeNetwork DeviceType = "network"
	DeviceTypeStorage DeviceType = "storage"
)

// DeviceStatus represents the status of a device
type DeviceStatus string

const (
	DeviceStatusOnline  DeviceStatus = "online"
	DeviceStatusOffline DeviceStatus = "offline"
	DeviceStatusWarning DeviceStatus = "warning"
	DeviceStatusUnknown DeviceStatus = "unknown"
)

// Device represents a device in a rack
type Device struct {
	ID             int                    `json:"id" db:"id"`
	RackID         int                    `json:"rack_id" db:"rack_id"`
	Name           string                 `json:"name" db:"name"`
	Icon           string                 `json:"icon" db:"icon"`
	Type           DeviceType             `json:"type" db:"type"`
	PositionU      int                    `json:"position_u" db:"position_u"`
	SizeU          int                    `json:"size_u" db:"size_u"`
	Status         DeviceStatus           `json:"status" db:"status"`
	Model          string                 `json:"model" db:"model"`
	IPAddress      string                 `json:"ip_address" db:"ip_address"`
	HealthCheckURL string                 `json:"health_check_url" db:"health_check_url"`
	CreatedAt      time.Time              `json:"created_at" db:"created_at"`
	UpdatedAt      time.Time              `json:"updated_at" db:"updated_at"`
	Specs          map[string]string      `json:"specs,omitempty"`
}

// DeviceSpec represents a device specification
type DeviceSpec struct {
	ID        int       `json:"id" db:"id"`
	DeviceID  int       `json:"device_id" db:"device_id"`
	SpecKey   string    `json:"spec_key" db:"spec_key"`
	SpecValue string    `json:"spec_value" db:"spec_value"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
}

// CreateDeviceRequest represents a request to create a new device
type CreateDeviceRequest struct {
	RackID         int         `json:"rack_id" binding:"required"`
	Name           string      `json:"name" binding:"required"`
	Icon           string      `json:"icon"`
	Type           DeviceType  `json:"type" binding:"required,oneof=server network storage"`
	PositionU      int         `json:"position_u" binding:"required,min=1"`
	SizeU          int         `json:"size_u" binding:"required,min=1"`
	Status         DeviceStatus `json:"status" binding:"oneof=online offline warning unknown"`
	Model          string      `json:"model"`
	IPAddress      string      `json:"ip_address"`
	HealthCheckURL string      `json:"health_check_url"`
	Specs          map[string]string `json:"specs"`
}

// UpdateDeviceRequest represents a request to update a device
type UpdateDeviceRequest struct {
	Name           *string      `json:"name"`
	Icon           *string      `json:"icon"`
	Type           *DeviceType  `json:"type"`
	PositionU      *int         `json:"position_u"`
	SizeU          *int         `json:"size_u"`
	Status         *DeviceStatus `json:"status"`
	Model          *string      `json:"model"`
	IPAddress      *string      `json:"ip_address"`
	HealthCheckURL *string      `json:"health_check_url"`
	Specs          map[string]string `json:"specs"`
}
