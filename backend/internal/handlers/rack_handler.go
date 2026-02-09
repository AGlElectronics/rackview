package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"rackview/internal/models"
	"rackview/internal/services"
)

// RackHandler handles rack-related HTTP requests
type RackHandler struct {
	service *services.RackService
}

// NewRackHandler creates a new rack handler
func NewRackHandler() *RackHandler {
	return &RackHandler{
		service: services.NewRackService(),
	}
}

// GetAllRacks handles GET /api/racks
func (h *RackHandler) GetAllRacks(c *gin.Context) {
	racks, err := h.service.GetAllRacks()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, racks)
}

// GetRackByID handles GET /api/racks/:id
func (h *RackHandler) GetRackByID(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid rack ID"})
		return
	}

	rack, err := h.service.GetRackByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, rack)
}

// CreateRack handles POST /api/racks
func (h *RackHandler) CreateRack(c *gin.Context) {
	var req models.CreateRackRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	rack, err := h.service.CreateRack(req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, rack)
}

// UpdateRack handles PUT /api/racks/:id
func (h *RackHandler) UpdateRack(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid rack ID"})
		return
	}

	var req models.UpdateRackRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	rack, err := h.service.UpdateRack(id, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, rack)
}

// DeleteRack handles DELETE /api/racks/:id
func (h *RackHandler) DeleteRack(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid rack ID"})
		return
	}

	if err := h.service.DeleteRack(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "rack deleted successfully"})
}
