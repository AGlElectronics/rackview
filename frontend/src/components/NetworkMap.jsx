import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { networkAPI, deviceAPI, rackAPI } from '../services/api';
import './NetworkMap.css';

function NetworkMap() {
  const [connections, setConnections] = useState([]);
  const [devices, setDevices] = useState([]);
  const [racks, setRacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('node'); // 'node' or 'tree'
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!loading) {
      updateGraph();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [devices, connections, racks, viewMode, loading]);

  const loadData = async () => {
    try {
      const [connResponse, devResponse, racksResponse] = await Promise.all([
        networkAPI.getAllConnections(),
        deviceAPI.getAll(), // Get all devices without rack filter
        rackAPI.getAll(),
      ]);
      setConnections(connResponse.data);
      // Deduplicate devices by ID to prevent duplicates
      const uniqueDevices = devResponse.data.filter((device, index, self) =>
        index === self.findIndex(d => d.id === device.id)
      );
      setDevices(uniqueDevices);
      setRacks(racksResponse.data);
    } catch (error) {
      console.error('Failed to load network data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRackForDevice = (deviceId) => {
    const device = devices.find(d => d.id === deviceId);
    if (!device) return null;
    return racks.find(r => r.id === device.rack_id);
  };

  const isInterRackConnection = (connection) => {
    const sourceRack = getRackForDevice(connection.source_device_id);
    const targetRack = getRackForDevice(connection.target_device_id);
    return sourceRack && targetRack && sourceRack.id !== targetRack.id;
  };

  const getSpeedColor = (speed) => {
    if (!speed) return '#8b949e';
    const speedLower = speed.toLowerCase();
    if (speedLower.includes('100g')) return '#ff6b35'; // Orange
    if (speedLower.includes('25g')) return '#a371f7'; // Purple
    if (speedLower.includes('10g')) return '#58a6ff'; // Blue
    if (speedLower.includes('1g')) return '#3fb950'; // Green
    return '#8b949e'; // Gray
  };

  const getSpeedWidth = (speed) => {
    if (!speed) return 2;
    const speedLower = speed.toLowerCase();
    if (speedLower.includes('100g')) return 5;
    if (speedLower.includes('25g')) return 4;
    if (speedLower.includes('10g')) return 3;
    if (speedLower.includes('1g')) return 2;
    return 2;
  };

  const updateGraph = useCallback(() => {
    if (devices.length === 0) {
      setNodes([]);
      setEdges([]);
      return;
    }

    const deviceMap = new Map(devices.map(d => [d.id, d]));
    const rackMap = new Map(racks.map(r => [r.id, r]));

    // Create nodes
    const newNodes = devices.map((device, index) => {
      const rack = rackMap.get(device.rack_id);
      const isInterRack = connections.some(conn => 
        (conn.source_device_id === device.id || conn.target_device_id === device.id) &&
        isInterRackConnection(conn)
      );

      let position;
      if (viewMode === 'tree') {
        // Tree layout: hierarchical
        const level = Math.floor(index / 5);
        const offset = index % 5;
        position = { x: level * 300, y: offset * 150 };
      } else {
        // Node graph: circular or force-directed (simplified grid for now)
        const cols = Math.ceil(Math.sqrt(devices.length));
        const row = Math.floor(index / cols);
        const col = index % cols;
        position = { x: col * 250, y: row * 200 };
      }

      return {
        id: `device-${device.id}`,
        type: 'deviceNode',
        position,
        data: {
          label: device.name,
          device,
          rack: rack?.name || 'Unknown',
          icon: device.icon,
          type: device.type,
          status: device.status,
          isInterRack,
        },
        style: {
          background: isInterRack ? '#21262d' : '#161b22',
          border: `2px solid ${isInterRack ? '#58a6ff' : '#30363d'}`,
          borderRadius: '8px',
          padding: '10px',
          minWidth: '150px',
        },
      };
    });

    // Create edges
    const newEdges = connections.map((conn) => {
      const sourceDevice = deviceMap.get(conn.source_device_id);
      const targetDevice = deviceMap.get(conn.target_device_id);
      const interRack = isInterRackConnection(conn);
      const speedColor = getSpeedColor(conn.speed);
      const speedWidth = getSpeedWidth(conn.speed);

      return {
        id: `edge-${conn.id}`,
        source: `device-${conn.source_device_id}`,
        target: `device-${conn.target_device_id}`,
        type: interRack ? 'smoothstep' : 'default',
        animated: false,
        style: {
          stroke: speedColor,
          strokeWidth: speedWidth,
          strokeDasharray: interRack ? '5,5' : '0',
        },
        label: conn.speed || '',
        labelStyle: {
          fill: speedColor,
          fontWeight: 600,
          fontSize: '12px',
        },
        labelBgStyle: {
          fill: '#0d1117',
          fillOpacity: 0.8,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: speedColor,
        },
        data: {
          connection: conn,
          speed: conn.speed,
          interRack,
        },
      };
    });

    setNodes(newNodes);
    setEdges(newEdges);
  }, [devices, connections, racks, viewMode]);

  const nodeTypes = useMemo(() => ({
    deviceNode: ({ data }) => (
      <div className="device-node">
        <div className="device-node-header">
          <span className="device-node-icon">{data.icon}</span>
          <div className="device-node-info">
            <div className="device-node-name">{data.label}</div>
            <div className="device-node-rack">{data.rack}</div>
          </div>
          <span className={`device-node-status ${data.status}`}></span>
        </div>
        {data.isInterRack && (
          <div className="device-node-badge">Inter-Rack</div>
        )}
      </div>
    ),
  }), []);

  if (loading) {
    return <div className="network-map loading">Loading network map...</div>;
  }

  return (
    <div className="network-map">
      <div className="page-header">
        <h1>Network Topology</h1>
        <div className="network-controls">
          <div className="view-toggle">
            <button
              className={`view-btn ${viewMode === 'node' ? 'active' : ''}`}
              onClick={() => setViewMode('node')}
            >
              Node Graph
            </button>
            <button
              className={`view-btn ${viewMode === 'tree' ? 'active' : ''}`}
              onClick={() => setViewMode('tree')}
            >
              Tree Graph
            </button>
          </div>
          <div className="legend">
            <div className="legend-item">
              <div className="legend-line intra"></div>
              <span>Intra-Rack</span>
            </div>
            <div className="legend-item">
              <div className="legend-line inter"></div>
              <span>Inter-Rack</span>
            </div>
            <div className="legend-item">
              <div className="legend-speed" style={{ color: '#3fb950' }}>1Gbps</div>
              <div className="legend-speed" style={{ color: '#58a6ff' }}>10Gbps</div>
              <div className="legend-speed" style={{ color: '#a371f7' }}>25Gbps</div>
              <div className="legend-speed" style={{ color: '#ff6b35' }}>100Gbps</div>
            </div>
          </div>
        </div>
      </div>

      <div className="network-graph-container">
        {devices.length === 0 ? (
          <div className="no-devices">
            <p>No devices found. Add devices to racks first.</p>
          </div>
        ) : (
          <ReactFlowProvider>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              nodeTypes={nodeTypes}
              fitView
              attributionPosition="bottom-left"
            >
              <Background />
              <Controls />
              <MiniMap
                nodeColor={(node) => {
                  if (node.data?.isInterRack) return '#58a6ff';
                  return '#30363d';
                }}
                maskColor="rgba(0, 0, 0, 0.8)"
              />
            </ReactFlow>
          </ReactFlowProvider>
        )}
      </div>
    </div>
  );
}

export default NetworkMap;
