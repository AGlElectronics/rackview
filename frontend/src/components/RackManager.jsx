import { useState } from 'react';
import { rackAPI } from '../services/api';
import './RackManager.css';

function RackManager({ racks, onClose, onRackCreated, onRackUpdated, onRackDeleted }) {
  const [showForm, setShowForm] = useState(false);
  const [editingRack, setEditingRack] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    size_u: 25,
    customSize: false,
  });

  const standardSizes = [12, 25, 42, 48];

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingRack) {
        const response = await rackAPI.update(editingRack.id, formData);
        onRackUpdated(response.data);
      } else {
        const response = await rackAPI.create(formData);
        onRackCreated(response.data);
      }
      resetForm();
    } catch (error) {
      alert('Error: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleDelete = async (rackId) => {
    if (!confirm('Are you sure you want to delete this rack? All devices will be deleted.')) {
      return;
    }
    try {
      await rackAPI.delete(rackId);
      onRackDeleted(rackId);
    } catch (error) {
      alert('Error: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleEdit = (rack) => {
    setEditingRack(rack);
    setFormData({
      name: rack.name,
      description: rack.description || '',
      size_u: rack.size_u,
      customSize: !standardSizes.includes(rack.size_u),
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      size_u: 25,
      customSize: false,
    });
    setEditingRack(null);
    setShowForm(false);
  };

  return (
    <div className="rack-manager-overlay" onClick={onClose}>
      <div className="rack-manager-modal" onClick={(e) => e.stopPropagation()}>
        <div className="rack-manager-header">
          <h2>Manage Racks</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="rack-manager-content">
          {!showForm ? (
            <>
              <button className="btn-primary" onClick={() => setShowForm(true)}>
                + Add New Rack
              </button>
              <div className="rack-list">
                {racks.map(rack => (
                  <div key={rack.id} className="rack-item">
                    <div className="rack-item-info">
                      <h3>{rack.name}</h3>
                      <p>{rack.description || 'No description'}</p>
                      <span className="rack-size">{rack.size_u}U</span>
                    </div>
                    <div className="rack-item-actions">
                      <button onClick={() => handleEdit(rack)}>Edit</button>
                      <button className="btn-danger" onClick={() => handleDelete(rack.id)}>Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <form onSubmit={handleSubmit} className="rack-form">
              <div className="form-group">
                <label>Rack Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows="3"
                />
              </div>

              <div className="form-group">
                <label>Rack Size (U) *</label>
                <select
                  value={formData.customSize ? 'custom' : formData.size_u}
                  onChange={(e) => {
                    if (e.target.value === 'custom') {
                      setFormData({ ...formData, customSize: true });
                    } else {
                      setFormData({ ...formData, size_u: parseInt(e.target.value), customSize: false });
                    }
                  }}
                >
                  {standardSizes.map(size => (
                    <option key={size} value={size}>{size}U</option>
                  ))}
                  <option value="custom">Custom</option>
                </select>
              </div>

              {formData.customSize && (
                <div className="form-group">
                  <label>Custom Size (U) *</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.size_u}
                    onChange={(e) => setFormData({ ...formData, size_u: parseInt(e.target.value) || 1 })}
                    required
                  />
                </div>
              )}

              <div className="form-actions">
                <button type="submit" className="btn-primary">
                  {editingRack ? 'Update Rack' : 'Create Rack'}
                </button>
                <button type="button" onClick={resetForm}>Cancel</button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default RackManager;
