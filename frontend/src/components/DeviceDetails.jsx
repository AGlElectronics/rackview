import { useState } from 'react';
import { deviceAPI } from '../services/api';
import './DeviceDetails.css';

function DeviceDetails({ device, onClose, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: device.name,
    icon: device.icon,
    model: device.model || '',
    status: device.status,
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
      onUpdate();
    } catch (error) {
      alert('Error: ' + (error.response?.data?.error || error.message));
    }
  };

  const statusColor = device.status === 'online' ? 'online' : (device.status === 'warning' ? 'warning' : 'offline');
  const bottomU = device.position_u - device.size_u + 1;

  return (
    <div className="device-details active">
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
            </div>
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
