import { useState, useEffect } from 'react';
import { rackAPI, deviceAPI } from '../services/api';
import RackRenderer from './RackRenderer';
import RackManager from './RackManager';
import DeviceDetails from './DeviceDetails';
import './RackView.css';

function RackView() {
  const [racks, setRacks] = useState([]);
  const [selectedRackId, setSelectedRackId] = useState(null);
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showRackManager, setShowRackManager] = useState(false);

  useEffect(() => {
    loadRacks();
  }, []);

  useEffect(() => {
    if (selectedRackId) {
      loadDevices(selectedRackId);
    }
  }, [selectedRackId]);

  const loadRacks = async () => {
    try {
      const response = await rackAPI.getAll();
      const racksData = response.data;
      setRacks(racksData);
      if (racksData.length > 0 && !selectedRackId) {
        setSelectedRackId(racksData[0].id);
      }
    } catch (error) {
      console.error('Failed to load racks:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDevices = async (rackId) => {
    try {
      const response = await deviceAPI.getAll(rackId);
      setDevices(response.data);
    } catch (error) {
      console.error('Failed to load devices:', error);
    }
  };

  const handleRackCreated = (newRack) => {
    setRacks([...racks, newRack]);
    setSelectedRackId(newRack.id);
    setShowRackManager(false);
  };

  const handleRackUpdated = (updatedRack) => {
    setRacks(racks.map(r => r.id === updatedRack.id ? updatedRack : r));
    if (updatedRack.id === selectedRackId) {
      loadDevices(updatedRack.id);
    }
    setShowRackManager(false);
  };

  const handleRackDeleted = (rackId) => {
    setRacks(racks.filter(r => r.id !== rackId));
    if (selectedRackId === rackId) {
      if (racks.length > 1) {
        const newSelected = racks.find(r => r.id !== rackId);
        setSelectedRackId(newSelected ? newSelected.id : null);
      } else {
        setSelectedRackId(null);
      }
    }
    setShowRackManager(false);
  };

  const handleDeviceSelect = (device) => {
    setSelectedDevice(device);
  };

  const handleDeviceUpdated = () => {
    if (selectedRackId) {
      loadDevices(selectedRackId);
    }
    setSelectedDevice(null);
  };

  const selectedRack = racks.find(r => r.id === selectedRackId);

  if (loading) {
    return <div className="rack-view loading">Loading...</div>;
  }

  return (
    <div className="rack-view">
      <div className="page-header">
        <h1>Infrastructure Racks</h1>
        <div className="rack-controls">
          <select
            value={selectedRackId || ''}
            onChange={(e) => setSelectedRackId(parseInt(e.target.value))}
            className="rack-selector"
          >
            {racks.map(rack => (
              <option key={rack.id} value={rack.id}>
                {rack.name} ({rack.size_u}U)
              </option>
            ))}
          </select>
          <button
            className="btn-add-rack"
            onClick={() => setShowRackManager(true)}
          >
            + Add Rack
          </button>
        </div>
      </div>

      <div className="main-layout">
        {selectedRack && (
          <div className="racks-container">
            <RackRenderer
              rack={selectedRack}
              devices={devices}
              onDeviceSelect={handleDeviceSelect}
              selectedDeviceId={selectedDevice?.id}
            />
          </div>
        )}

        <div className="info-panel">
          {selectedDevice ? (
            <DeviceDetails
              device={selectedDevice}
              onClose={() => setSelectedDevice(null)}
              onUpdate={handleDeviceUpdated}
            />
          ) : (
            <div className="info-placeholder">
              <div className="info-placeholder-icon">🖱️</div>
              <h3>Select a Device</h3>
              <p>Click any device to view specifications</p>
            </div>
          )}
        </div>
      </div>

      {showRackManager && (
        <RackManager
          racks={racks}
          onClose={() => setShowRackManager(false)}
          onRackCreated={handleRackCreated}
          onRackUpdated={handleRackUpdated}
          onRackDeleted={handleRackDeleted}
        />
      )}
    </div>
  );
}

export default RackView;
