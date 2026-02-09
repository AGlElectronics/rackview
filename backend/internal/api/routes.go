package api

import (
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"rackview/internal/handlers"
)

// SetupRoutes configures all API routes
func SetupRoutes(staticPath, indexPath string) *gin.Engine {
	router := gin.Default()

	// CORS configuration
	config := cors.DefaultConfig()
	config.AllowOrigins = []string{"http://localhost:5173", "http://localhost:3000"} // Vite dev server
	config.AllowMethods = []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"}
	config.AllowHeaders = []string{"Origin", "Content-Type", "Accept", "Authorization"}
	router.Use(cors.New(config))

	// Initialize handlers
	rackHandler := handlers.NewRackHandler()
	deviceHandler := handlers.NewDeviceHandler()
	networkHandler := handlers.NewNetworkHandler()
	staticHandler := handlers.NewStaticHandler(staticPath, indexPath)

	// API routes
	api := router.Group("/api")
	{
		// Rack routes
		racks := api.Group("/racks")
		{
			racks.GET("", rackHandler.GetAllRacks)
			racks.GET("/:id", rackHandler.GetRackByID)
			racks.POST("", rackHandler.CreateRack)
			racks.PUT("/:id", rackHandler.UpdateRack)
			racks.DELETE("/:id", rackHandler.DeleteRack)
		}

		// Device routes
		devices := api.Group("/devices")
		{
			devices.GET("", deviceHandler.GetAllDevices)
			devices.GET("/:id", deviceHandler.GetDeviceByID)
			devices.POST("", deviceHandler.CreateDevice)
			devices.PUT("/:id", deviceHandler.UpdateDevice)
			devices.DELETE("/:id", deviceHandler.DeleteDevice)
			devices.POST("/:id/health-check", deviceHandler.CheckDeviceHealth)
		}

		// Network routes
		network := api.Group("/network")
		{
			connections := network.Group("/connections")
			{
				connections.GET("", networkHandler.GetAllConnections)
				connections.GET("/:id", networkHandler.GetConnectionByID)
				connections.POST("", networkHandler.CreateConnection)
				connections.DELETE("/:id", networkHandler.DeleteConnection)
			}
		}
	}

	// Static files
	router.Static("/static", staticPath+"/static")

	// Serve React app for all other routes (client-side routing)
	router.NoRoute(staticHandler.ServeIndex)

	return router
}
