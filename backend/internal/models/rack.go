package models

import "time"

// Rack represents a server rack
type Rack struct {
	ID          int       `json:"id" db:"id"`
	Name        string    `json:"name" db:"name"`
	Description string    `json:"description" db:"description"`
	SizeU       int       `json:"size_u" db:"size_u"`
	CreatedAt   time.Time `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time `json:"updated_at" db:"updated_at"`
	Devices     []Device  `json:"devices,omitempty"`
}

// CreateRackRequest represents a request to create a new rack
type CreateRackRequest struct {
	Name        string `json:"name" binding:"required"`
	Description string `json:"description"`
	SizeU       int    `json:"size_u" binding:"required,min=1"`
}

// UpdateRackRequest represents a request to update a rack
type UpdateRackRequest struct {
	Name        string `json:"name"`
	Description string `json:"description"`
	SizeU       *int   `json:"size_u"`
}
