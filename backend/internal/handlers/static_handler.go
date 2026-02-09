package handlers

import (
	"net/http"
	"path/filepath"

	"github.com/gin-gonic/gin"
)

// StaticHandler handles serving static files (React build)
type StaticHandler struct {
	staticPath string
	indexPath  string
}

// NewStaticHandler creates a new static file handler
func NewStaticHandler(staticPath, indexPath string) *StaticHandler {
	return &StaticHandler{
		staticPath: staticPath,
		indexPath:  indexPath,
	}
}

// ServeStatic serves static files
func (h *StaticHandler) ServeStatic(c *gin.Context) {
	path := c.Param("filepath")
	// Security: prevent directory traversal
	if filepath.IsAbs(path) {
		c.AbortWithStatus(http.StatusBadRequest)
		return
	}

	c.File(filepath.Join(h.staticPath, path))
}

// ServeIndex serves the React index.html for client-side routing
func (h *StaticHandler) ServeIndex(c *gin.Context) {
	c.File(h.indexPath)
}
