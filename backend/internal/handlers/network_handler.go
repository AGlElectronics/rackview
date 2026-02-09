package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"rackview/internal/models"
	"rackview/internal/services"
)

// NetworkHandler handles network connection-related HTTP requests
type NetworkHandler struct {
	service *services.NetworkService
}

// NewNetworkHandler creates a new network handler
func NewNetworkHandler() *NetworkHandler {
	return &NetworkHandler{
		service: services.NewNetworkService(),
	}
}

// GetAllConnections handles GET /api/network/connections
func (h *NetworkHandler) GetAllConnections(c *gin.Context) {
	connections, err := h.service.GetAllConnections()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, connections)
}

// GetConnectionByID handles GET /api/network/connections/:id
func (h *NetworkHandler) GetConnectionByID(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid connection ID"})
		return
	}

	conn, err := h.service.GetConnectionByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, conn)
}

// CreateConnection handles POST /api/network/connections
func (h *NetworkHandler) CreateConnection(c *gin.Context) {
	var req models.CreateConnectionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	conn, err := h.service.CreateConnection(req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, conn)
}

// UpdateConnection handles PUT /api/network/connections/:id
func (h *NetworkHandler) UpdateConnection(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid connection ID"})
		return
	}

	var req models.UpdateConnectionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	conn, err := h.service.UpdateConnection(id, req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, conn)
}

// DeleteConnection handles DELETE /api/network/connections/:id
func (h *NetworkHandler) DeleteConnection(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid connection ID"})
		return
	}

	if err := h.service.DeleteConnection(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "connection deleted successfully"})
}
