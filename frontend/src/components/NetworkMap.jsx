import { useState, useEffect } from 'react';
import { networkAPI, deviceAPI } from '../services/api';
import './NetworkMap.css';

function NetworkMap() {
  const [connections, setConnections] = useState([]);
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [connResponse, devResponse] = await Promise.all([
        networkAPI.getAllConnections(),
        deviceAPI.getAll(),
      ]);
      setConnections(connResponse.data);
      setDevices(devResponse.data);
    } catch (error) {
      console.error('Failed to load network data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="network-map loading">Loading network map...</div>;
  }

  return (
    <div className="network-map">
      <div className="page-header">
        <h1>Network Topology</h1>
        <p>Visual representation of device connections</p>
      </div>

      <div className="network-content">
        {connections.length === 0 ? (
          <div className="no-connections">
            <p>No network connections configured yet.</p>
            <p>Connections can be added through the API.</p>
          </div>
        ) : (
          <div className="connections-list">
            {connections.map(conn => (
              <div key={conn.id} className="connection-item">
                <div className="connection-source">
                  <span className="device-icon">{conn.source_device?.icon || '🖥️'}</span>
                  <span className="device-name">{conn.source_device?.name || `Device ${conn.source_device_id}`}</span>
                </div>
                <div className="connection-arrow">→</div>
                <div className="connection-target">
                  <span className="device-icon">{conn.target_device?.icon || '🖥️'}</span>
                  <span className="device-name">{conn.target_device?.name || `Device ${conn.target_device_id}`}</span>
                </div>
                {conn.connection_type && (
                  <div className="connection-type">{conn.connection_type}</div>
                )}
                {conn.port_info && (
                  <div className="connection-ports">{conn.port_info}</div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="devices-summary">
          <h2>All Devices ({devices.length})</h2>
          <div className="devices-grid">
            {devices.map(device => (
              <div key={device.id} className="device-card">
                <span className="device-icon">{device.icon}</span>
                <div className="device-info">
                  <div className="device-name">{device.name}</div>
                  <div className="device-type">{device.type}</div>
                </div>
                <span className={`device-status ${device.status}`}>{device.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default NetworkMap;
