package database

import (
	"embed"
	"fmt"
	"io/fs"
	"path/filepath"
	"sort"
	"strings"

	_ "github.com/lib/pq"
)

//go:embed migrations/*.sql
var migrationsFS embed.FS

// initMigrationTable creates the migrations tracking table if it doesn't exist
func initMigrationTable() error {
	_, err := DB.Exec(`
		CREATE TABLE IF NOT EXISTS schema_migrations (
			id SERIAL PRIMARY KEY,
			filename VARCHAR(255) NOT NULL UNIQUE,
			executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)
	`)
	if err != nil {
		return fmt.Errorf("failed to create migrations table: %w", err)
	}
	return nil
}

// hasMigrationBeenRun checks if a migration has already been executed
func hasMigrationBeenRun(filename string) (bool, error) {
	var count int
	err := DB.QueryRow(
		"SELECT COUNT(*) FROM schema_migrations WHERE filename = $1",
		filename,
	).Scan(&count)
	if err != nil {
		return false, fmt.Errorf("failed to check migration status: %w", err)
	}
	return count > 0, nil
}

// recordMigration records that a migration has been executed
func recordMigration(filename string) error {
	_, err := DB.Exec(
		"INSERT INTO schema_migrations (filename) VALUES ($1) ON CONFLICT (filename) DO NOTHING",
		filename,
	)
	if err != nil {
		return fmt.Errorf("failed to record migration: %w", err)
	}
	return nil
}

// RunMigrations executes all SQL migration files in order, skipping already executed ones
func RunMigrations() error {
	// Initialize migration tracking table
	if err := initMigrationTable(); err != nil {
		return err
	}

	// Read all migration files
	files, err := fs.ReadDir(migrationsFS, "migrations")
	if err != nil {
		return fmt.Errorf("failed to read migrations directory: %w", err)
	}

	// Filter and sort SQL files
	var sqlFiles []string
	for _, file := range files {
		if !file.IsDir() && strings.HasSuffix(file.Name(), ".sql") {
			sqlFiles = append(sqlFiles, file.Name())
		}
	}
	sort.Strings(sqlFiles)

	// Execute each migration that hasn't been run yet
	for _, filename := range sqlFiles {
		// Check if migration has already been run
		alreadyRun, err := hasMigrationBeenRun(filename)
		if err != nil {
			return err
		}

		if alreadyRun {
			fmt.Printf("Skipping already executed migration: %s\n", filename)
			continue
		}

		content, err := migrationsFS.ReadFile(filepath.Join("migrations", filename))
		if err != nil {
			return fmt.Errorf("failed to read migration %s: %w", filename, err)
		}

		// Execute the migration
		if _, err := DB.Exec(string(content)); err != nil {
			return fmt.Errorf("failed to execute migration %s: %w", filename, err)
		}

		// Record that this migration has been executed
		if err := recordMigration(filename); err != nil {
			return fmt.Errorf("failed to record migration %s: %w", filename, err)
		}

		fmt.Printf("Executed migration: %s\n", filename)
	}

	return nil
}
