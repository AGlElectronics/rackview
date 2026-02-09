package services

import (
	"context"
	"fmt"
	"net"
	"net/http"
	"time"

	"rackview/internal/database"
	"rackview/internal/models"
)

// HealthService handles device health checks
type HealthService struct{}

// NewHealthService creates a new health service
func NewHealthService() *HealthService {
	return &HealthService{}
}

// HealthCheckResult represents the result of a health check
type HealthCheckResult struct {
	Status    models.DeviceStatus `json:"status"`
	Message   string              `json:"message"`
	Latency   int64               `json:"latency_ms,omitempty"`
	Timestamp time.Time           `json:"timestamp"`
}

// CheckDeviceHealth performs a health check on a device
func (s *HealthService) CheckDeviceHealth(deviceID int) (*HealthCheckResult, error) {
	// Get device
	var device models.Device
	err := database.DB.QueryRow(`
		SELECT id, name, ip_address, health_check_url, status
		FROM devices
		WHERE id = $1
	`, deviceID).Scan(
		&device.ID, &device.Name, &device.IPAddress, &device.HealthCheckURL, &device.Status,
	)

	if err != nil {
		return nil, fmt.Errorf("device not found: %w", err)
	}

	result := &HealthCheckResult{
		Timestamp: time.Now(),
	}

	// Try HTTP health check first if URL is provided
	if device.HealthCheckURL != "" {
		status, latency, err := s.checkHTTPHealth(device.HealthCheckURL)
		if err == nil {
			result.Status = status
			result.Latency = latency
			result.Message = fmt.Sprintf("HTTP check successful (%dms)", latency)
			return result, nil
		}
		result.Message = fmt.Sprintf("HTTP check failed: %v", err)
	}

	// Fall back to ping if IP address is provided
	if device.IPAddress != "" {
		latency, err := s.pingDevice(device.IPAddress)
		if err == nil {
			result.Status = models.DeviceStatusOnline
			result.Latency = latency
			result.Message = fmt.Sprintf("Ping successful (%dms)", latency)
			return result, nil
		}
		if result.Message == "" {
			result.Message = fmt.Sprintf("Ping failed: %v", err)
		} else {
			result.Message += fmt.Sprintf("; Ping failed: %v", err)
		}
	}

	// If no health check method is configured, return warning
	if device.IPAddress == "" && device.HealthCheckURL == "" {
		result.Status = models.DeviceStatusWarning
		result.Message = "No health check configured (IP address or health check URL required)"
		return result, nil
	}

	// All checks failed
	result.Status = models.DeviceStatusOffline
	if result.Message == "" {
		result.Message = "Health check failed"
	}

	return result, nil
}

// checkHTTPHealth performs an HTTP health check
func (s *HealthService) checkHTTPHealth(url string) (models.DeviceStatus, int64, error) {
	start := time.Now()

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
	if err != nil {
		return models.DeviceStatusOffline, 0, err
	}

	client := &http.Client{
		Timeout: 5 * time.Second,
	}

	resp, err := client.Do(req)
	if err != nil {
		return models.DeviceStatusOffline, 0, err
	}
	defer resp.Body.Close()

	latency := time.Since(start).Milliseconds()

	if resp.StatusCode >= 200 && resp.StatusCode < 300 {
		return models.DeviceStatusOnline, latency, nil
	} else if resp.StatusCode >= 500 {
		return models.DeviceStatusOffline, latency, fmt.Errorf("server error: %d", resp.StatusCode)
	} else {
		return models.DeviceStatusWarning, latency, fmt.Errorf("unexpected status: %d", resp.StatusCode)
	}
}

// pingDevice performs a TCP ping to check if a device is reachable
func (s *HealthService) pingDevice(ipAddress string) (int64, error) {
	// Try common ports to see if device is reachable
	ports := []string{"80", "443", "22", "8080", "8443", "3389"}
	
	for _, port := range ports {
		start := time.Now()
		conn, err := net.DialTimeout("tcp", net.JoinHostPort(ipAddress, port), 2*time.Second)
		if err == nil {
			conn.Close()
			return time.Since(start).Milliseconds(), nil
		}
	}
	
	return 0, fmt.Errorf("device unreachable on common ports")
}

// UpdateDeviceStatusFromHealthCheck updates a device's status based on health check result
func (s *HealthService) UpdateDeviceStatusFromHealthCheck(deviceID int, result *HealthCheckResult) error {
	_, err := database.DB.Exec(`
		UPDATE devices
		SET status = $1, updated_at = CURRENT_TIMESTAMP
		WHERE id = $2
	`, result.Status, deviceID)

	if err != nil {
		return fmt.Errorf("failed to update device status: %w", err)
	}

	return nil
}
