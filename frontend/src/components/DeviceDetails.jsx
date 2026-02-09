import { useState, useEffect, useRef } from 'react';
import { deviceAPI } from '../services/api';
import './DeviceDetails.css';

function DeviceDetails({ device, onClose, onUpdate }) {
  const detailsRef = useRef(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);
  const [healthCheckResult, setHealthCheckResult] = useState(null);
  const [formData, setFormData] = useState({
    name: device.name,
    icon: device.icon,
    model: device.model || '',
    status: device.status,
    ip_address: device.ip_address || '',
    health_check_url: device.health_check_url || '',
  });

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await deviceAPI.update(device.id, formData);
      setIsEditing(false);
      onUpdate();
    } catch (error) {
      alert('Error: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this device?')) {
      return;
    }
    try {
      await deviceAPI.delete(device.id);
      // Close the details panel and refresh
      onClose();
      onUpdate();
    } catch (error) {
      alert('Error: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleHealthCheck = async () => {
    setIsCheckingHealth(true);
    setHealthCheckResult(null);
    try {
      const response = await deviceAPI.checkHealth(device.id, true);
      setHealthCheckResult(response.data);
      onUpdate(); // Refresh device data to get updated status
    } catch (error) {
      setHealthCheckResult({
        status: 'offline',
        message: error.response?.data?.error || error.message || 'Health check failed',
        timestamp: new Date().toISOString(),
      });
    } finally {
      setIsCheckingHealth(false);
    }
  };

  // Handle Escape key to close
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (detailsRef.current && !detailsRef.current.contains(e.target)) {
        onClose();
      }
    };
    // Use a small delay to avoid closing immediately when opening
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);
    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  // Determine status color - use 'unknown' if status is not set or is 'unknown'
  const statusColor = device.status === 'online' ? 'online' 
    : (device.status === 'warning' ? 'warning' 
    : (device.status === 'unknown' ? 'unknown' : 'offline'));
  const bottomU = device.position_u - device.size_u + 1;

  return (
    <div className="device-details active" ref={detailsRef}>
      <div className="details-header">
        <div className="details-icon">{device.icon}</div>
        <div className="details-name">{device.name}</div>
        <div className="details-location">
          U{device.position_u}{device.size_u > 1 ? `-${bottomU}` : ''} • {device.size_u}U
        </div>
      </div>

      <div className="details-content">
        {isEditing ? (
          <form onSubmit={handleUpdate} className="device-form">
            <div className="form-group">
              <label>Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Icon</label>
              <input
                type="text"
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Model</label>
              <input
                type="text"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="online">Online</option>
                <option value="warning">Warning</option>
                <option value="offline">Offline</option>
              </select>
            </div>
            <div className="form-group">
              <label>IP Address</label>
              <input
                type="text"
                value={formData.ip_address}
                onChange={(e) => setFormData({ ...formData, ip_address: e.target.value })}
                placeholder="192.168.1.100"
              />
            </div>
            <div className="form-group">
              <label>Health Check URL</label>
              <input
                type="text"
                value={formData.health_check_url}
                onChange={(e) => setFormData({ ...formData, health_check_url: e.target.value })}
                placeholder="http://192.168.1.100:8080/health"
              />
            </div>
            <div className="form-actions">
              <button type="submit" className="btn-primary">Save</button>
              <button type="button" onClick={() => setIsEditing(false)}>Cancel</button>
            </div>
          </form>
        ) : (
          <>
            {device.model && (
              <div className="spec-row">
                <span className="spec-label">Model</span>
                <span className="spec-value">{device.model}</span>
              </div>
            )}
            {device.specs && Object.entries(device.specs).map(([key, value]) => (
              <div key={key} className="spec-row">
                <span className="spec-label">{key}</span>
                <span className="spec-value">{value}</span>
              </div>
            ))}
            <div className="status-section">
              <span className="status-badge">
                <span className={`status-dot ${statusColor}`}></span>
                {device.status.toUpperCase()}
              </span>
              {(device.ip_address || device.health_check_url) && (
                <button 
                  className="btn-health-check" 
                  onClick={handleHealthCheck}
                  disabled={isCheckingHealth}
                >
                  {isCheckingHealth ? 'Checking...' : '🔍 Check Health'}
                </button>
              )}
            </div>
            {healthCheckResult && (
              <div className={`health-check-result ${healthCheckResult.status}`}>
                <div className="health-check-status">
                  <strong>Status:</strong> {healthCheckResult.status.toUpperCase()}
                </div>
                <div className="health-check-message">{healthCheckResult.message}</div>
                {healthCheckResult.latency && (
                  <div className="health-check-latency">Latency: {healthCheckResult.latency}ms</div>
                )}
              </div>
            )}
            {device.ip_address && (
              <div className="spec-row">
                <span className="spec-label">IP Address</span>
                <span className="spec-value">{device.ip_address}</span>
              </div>
            )}
            {device.health_check_url && (
              <div className="spec-row">
                <span className="spec-label">Health Check URL</span>
                <span className="spec-value">{device.health_check_url}</span>
              </div>
            )}
            <div className="device-actions">
              <button className="btn-edit" onClick={() => setIsEditing(true)}>Edit</button>
              <button className="btn-delete" onClick={handleDelete}>Delete</button>
            </div>
          </>
        )}
      </div>

      <button className="close-btn" onClick={onClose}>Close Details</button>
    </div>
  );
}

export default DeviceDetails;
