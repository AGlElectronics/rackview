import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { rackAPI, deviceAPI } from '../services/api';
import RackRenderer from './RackRenderer';
import RackManager from './RackManager';
import DeviceDetails from './DeviceDetails';
import DeviceForm from './DeviceForm';
import './RackView.css';

function RackView() {
  const navigate = useNavigate();
  const [racks, setRacks] = useState([]);
  const [devicesByRack, setDevicesByRack] = useState({});
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showRackManager, setShowRackManager] = useState(false);
  const [showDeviceForm, setShowDeviceForm] = useState(false);
  const [deviceFormData, setDeviceFormData] = useState({ rackId: null, positionU: null, device: null });
  const [selectedRackForAdd, setSelectedRackForAdd] = useState(null);
  
  // Drag-to-scroll state
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  useEffect(() => {
    loadRacks();
  }, []);

  useEffect(() => {
    if (racks.length > 0) {
      loadAllDevices();
    }
  }, [racks]);

  const loadRacks = async () => {
    try {
      const response = await rackAPI.getAll();
      const racksData = response.data;
      setRacks(racksData);
    } catch (error) {
      console.error('Failed to load racks:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAllDevices = async () => {
    try {
      const allDevices = {};
      for (const rack of racks) {
        try {
          const response = await deviceAPI.getAll(rack.id);
          const devices = response.data || [];
          
          // Set status to unknown for devices without health check config
          const devicesWithStatus = devices.map(device => {
            if (!device.ip_address && !device.health_check_url) {
              return { ...device, status: 'unknown' };
            }
            return device;
          });
          
          // Auto-check health for devices with IP or health check URL (non-blocking)
          devicesWithStatus.forEach((device) => {
            if (device.ip_address || device.health_check_url) {
              // Check health and update status (non-blocking)
              deviceAPI.checkHealth(device.id, true).then(() => {
                // Reload device after health check to get updated status
                deviceAPI.getById(device.id).then((updatedResponse) => {
                  setDevicesByRack(prev => {
                    const updated = { ...prev };
                    if (updated[rack.id]) {
                      updated[rack.id] = updated[rack.id].map(d => 
                        d.id === device.id ? updatedResponse.data : d
                      );
                    }
                    return updated;
                  });
                }).catch(() => {});
              }).catch(() => {});
            }
          });
          
          allDevices[rack.id] = devicesWithStatus;
        } catch (error) {
          console.error(`Failed to load devices for rack ${rack.id}:`, error);
          allDevices[rack.id] = [];
        }
      }
      setDevicesByRack(allDevices);
    } catch (error) {
      console.error('Failed to load devices:', error);
    }
  };

  const loadDevicesForRack = async (rackId) => {
    try {
      const response = await deviceAPI.getAll(rackId);
      setDevicesByRack(prev => ({ ...prev, [rackId]: response.data }));
    } catch (error) {
      console.error(`Failed to load devices for rack ${rackId}:`, error);
    }
  };

  const handleRackCreated = (newRack) => {
    setRacks(prevRacks => [...prevRacks, newRack]);
    setDevicesByRack(prev => ({ ...prev, [newRack.id]: [] }));
    setShowRackManager(false);
    loadDevicesForRack(newRack.id);
  };

  const handleRackUpdated = (updatedRack) => {
    setRacks(prevRacks => prevRacks.map(r => r.id === updatedRack.id ? updatedRack : r));
    setShowRackManager(false);
    loadDevicesForRack(updatedRack.id);
  };

  const handleRackDeleted = (rackId) => {
    setRacks(prevRacks => prevRacks.filter(r => r.id !== rackId));
    setDevicesByRack(prev => {
      const newDevices = { ...prev };
      delete newDevices[rackId];
      return newDevices;
    });
    setShowRackManager(false);
  };

  const handleDeviceSelect = (device) => {
    setSelectedDevice(device);
  };

  const handleDeviceUpdated = () => {
    // Reload all devices to ensure UI is in sync
    loadAllDevices();
    setSelectedDevice(null);
  };

  const handleEmptySlotClick = (rackId, positionU) => {
    setSelectedRackForAdd(rackId);
    setDeviceFormData({ rackId, positionU, device: null });
    setShowDeviceForm(true);
  };

  const handleDeviceCreated = (newDevice) => {
    loadDevicesForRack(newDevice.rack_id);
    setShowDeviceForm(false);
    setDeviceFormData({ rackId: null, positionU: null, device: null });
  };

  const handleDeviceMove = async (deviceId, newRackId, newPositionU) => {
    try {
      const device = Object.values(devicesByRack).flat().find(d => d.id === deviceId);
      if (!device) {
        console.error('Device not found:', deviceId);
        return;
      }

      const updateData = { position_u: newPositionU };
      // If moving to a different rack, update rack_id
      if (newRackId !== device.rack_id) {
        updateData.rack_id = newRackId;
      }

      console.log('Updating device:', deviceId, 'with data:', updateData);
      await deviceAPI.update(deviceId, updateData);
      
      // Reload devices for both old and new racks
      loadDevicesForRack(device.rack_id);
      if (newRackId !== device.rack_id) {
        loadDevicesForRack(newRackId);
      }
      console.log('Device moved successfully');
    } catch (error) {
      console.error('Error moving device:', error);
      alert('Error moving device: ' + (error.response?.data?.error || error.message));
    }
  };

  // Drag-to-scroll handlers
  const handleMouseDown = (e) => {
    // Don't start drag if clicking on interactive elements (buttons, devices, etc.)
    // Check if it's a draggable device unit first
    if (e.target.closest('button') || 
        e.target.closest('.rack-unit.draggable') || 
        e.target.closest('.u-empty.clickable')) {
      return;
    }
    // Only start drag-to-scroll on the container background, not on rack elements
    if (e.target.closest('.rack-frame') || 
        e.target.closest('.rack-column') ||
        e.target.closest('.rack-unit')) {
      return;
    }
    setIsDragging(true);
    const container = e.currentTarget;
    setStartX(e.pageX - container.offsetLeft);
    setScrollLeft(container.scrollLeft);
    container.style.cursor = 'grabbing';
    e.preventDefault();
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    // Don't prevent default if a drag operation is in progress (check for drag events)
    // This allows device dragging to work while preventing scroll drag interference
    if (e.buttons === 0) {
      // Mouse button released, stop drag-to-scroll
      setIsDragging(false);
      return;
    }
    e.preventDefault();
    const container = e.currentTarget;
    const x = e.pageX - container.offsetLeft;
    const walk = (x - startX) * 2; // Scroll speed multiplier
    container.scrollLeft = scrollLeft - walk;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  if (loading) {
    return <div className="rack-view loading">Loading...</div>;
  }

  return (
    <div className="rack-view">
      <div className="page-header">
        <h1>Infrastructure Racks</h1>
        <div className="rack-controls">
          <button
            className="btn-network-map"
            onClick={() => navigate('/network-map')}
            title="View Network Topology"
          >
            <span className="btn-icon">🗺️</span>
            <span>Network Map</span>
          </button>
          <button
            className="btn-add-rack"
            onClick={() => setShowRackManager(true)}
          >
            + Add Rack
          </button>
        </div>
      </div>

      <div className={`main-layout ${selectedDevice ? 'with-info-panel' : ''}`}>
        <div 
          className={`racks-container ${isDragging ? 'dragging' : ''}`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
        >
          {racks.length === 0 ? (
            <div className="no-racks">
              <p>No racks configured yet.</p>
              <button className="btn-add-rack" onClick={() => setShowRackManager(true)}>
                + Add Your First Rack
              </button>
            </div>
          ) : (
            racks.map(rack => (
              <RackRenderer
                key={rack.id}
                rack={rack}
                devices={devicesByRack[rack.id] || []}
                onDeviceSelect={handleDeviceSelect}
                selectedDeviceId={selectedDevice?.id}
                onEmptySlotClick={handleEmptySlotClick}
                onDeviceMove={handleDeviceMove}
                isSelectedForAdd={selectedRackForAdd === rack.id}
                allRacks={racks}
                allDevices={Object.values(devicesByRack).flat()}
              />
            ))
          )}
        </div>

        {selectedDevice && (
          <div className="info-panel">
            <DeviceDetails
              device={selectedDevice}
              onClose={() => setSelectedDevice(null)}
              onUpdate={handleDeviceUpdated}
            />
          </div>
        )}
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

      {showDeviceForm && (
        <DeviceForm
          rackId={deviceFormData.rackId}
          positionU={deviceFormData.positionU}
          device={deviceFormData.device}
          onClose={() => {
            setShowDeviceForm(false);
            setDeviceFormData({ rackId: null, positionU: null, device: null });
            setSelectedRackForAdd(null);
          }}
          onSave={handleDeviceCreated}
        />
      )}
    </div>
  );
}

export default RackView;
