package main

import (
	"fmt"
	"log"
	"os"
	"path/filepath"

	"rackview/internal/api"
	"rackview/internal/database"
)

func main() {
	// Connect to database
	if err := database.Connect(); err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer database.Close()

	// Run migrations
	if err := database.RunMigrations(); err != nil {
		log.Fatalf("Failed to run migrations: %v", err)
	}

	// Determine static file paths
	// In production, these will be set by Docker
	// In development, we'll use placeholder paths
	staticPath := os.Getenv("STATIC_PATH")
	indexPath := os.Getenv("INDEX_PATH")

	if staticPath == "" {
		// Default to frontend/dist for production
		staticPath = filepath.Join("..", "..", "frontend", "dist")
	}
	if indexPath == "" {
		indexPath = filepath.Join(staticPath, "index.html")
	}

	// Setup routes
	router := api.SetupRoutes(staticPath, indexPath)

	// Get port from environment or use default
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	fmt.Printf("Server starting on port %s\n", port)
	fmt.Printf("Static path: %s\n", staticPath)
	fmt.Printf("Index path: %s\n", indexPath)

	if err := router.Run(":" + port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
