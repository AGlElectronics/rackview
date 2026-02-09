import { useState, useEffect } from 'react';
import { deviceAPI } from '../services/api';
import './DeviceForm.css';

function DeviceForm({ rackId, positionU, device, onClose, onSave }) {
  const isEditing = !!device;
  const [formData, setFormData] = useState({
    name: device?.name || '',
    icon: device?.icon || '🖥️',
    type: device?.type || 'server',
    size_u: device?.size_u || 1,
    position_u: device?.position_u || positionU || 1,
    model: device?.model || '',
    status: device?.status || 'online',
    ip_address: device?.ip_address || '',
    health_check_url: device?.health_check_url || '',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (device) {
      setFormData({
        name: device.name,
        icon: device.icon,
        type: device.type,
        size_u: device.size_u,
        position_u: device.position_u,
        model: device.model || '',
        status: device.status,
        ip_address: device.ip_address || '',
        health_check_url: device.health_check_url || '',
      });
    } else if (positionU) {
      setFormData(prev => ({ ...prev, position_u: positionU }));
    }
  }, [device, positionU]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (isEditing) {
        await deviceAPI.update(device.id, formData);
      } else {
        const newDevice = await deviceAPI.create({
          ...formData,
          rack_id: rackId,
        });
        onSave(newDevice.data);
        return;
      }
      onSave();
    } catch (error) {
      setError(error.response?.data?.error || error.message || 'Failed to save device');
    }
  };

  return (
    <div className="device-form-overlay" onClick={onClose}>
      <div className="device-form-modal" onClick={(e) => e.stopPropagation()}>
        <div className="device-form-header">
          <h2>{isEditing ? 'Edit Device' : 'Add New Device'}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="device-form">
          {error && <div className="form-error">{error}</div>}

          <div className="form-group">
            <label>Name *</label>
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
              placeholder="🖥️"
            />
          </div>

          <div className="form-group">
            <label>Type *</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              required
            >
              <option value="server">Server</option>
              <option value="network">Network</option>
              <option value="storage">Storage</option>
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Position (U) *</label>
              <input
                type="number"
                min="1"
                value={formData.position_u}
                onChange={(e) => setFormData({ ...formData, position_u: parseInt(e.target.value) || 1 })}
                required
                disabled={!isEditing && !!positionU}
              />
            </div>

            <div className="form-group">
              <label>Size (U) *</label>
              <input
                type="number"
                min="1"
                value={formData.size_u}
                onChange={(e) => setFormData({ ...formData, size_u: parseInt(e.target.value) || 1 })}
                required
              />
            </div>
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
              placeholder="192.168.1.100 (for ping checks)"
            />
          </div>

          <div className="form-group">
            <label>Health Check URL</label>
            <input
              type="text"
              value={formData.health_check_url}
              onChange={(e) => setFormData({ ...formData, health_check_url: e.target.value })}
              placeholder="http://192.168.1.100:8080/health (optional)"
            />
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-primary">
              {isEditing ? 'Update Device' : 'Create Device'}
            </button>
            <button type="button" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default DeviceForm;
