import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
  Handle,
  Position,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { networkAPI, deviceAPI, rackAPI } from '../services/api';
import './NetworkMap.css';

function NetworkMap() {
  const navigate = useNavigate();
  const [connections, setConnections] = useState([]);
  const [devices, setDevices] = useState([]);
  const [racks, setRacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('node'); // 'node' or 'tree'
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [connectMode, setConnectMode] = useState(false);
  const [selectedSourceDevice, setSelectedSourceDevice] = useState(null);
  const [showConnectionForm, setShowConnectionForm] = useState(false);
  const [pendingConnection, setPendingConnection] = useState(null);
  const [selectedConnection, setSelectedConnection] = useState(null);
  const [showConnectionDetails, setShowConnectionDetails] = useState(false);
  const [connectionFormData, setConnectionFormData] = useState({
    speed: '1Gbps',
    connection_type: 'Ethernet',
    port_info: '',
  });
  const nodePositionsRef = useRef(new Map()); // Store positions for node view
  const treePositionsRef = useRef(new Map()); // Store positions for tree view
  
  // Load saved positions from localStorage on mount
  useEffect(() => {
    try {
      const savedNodePositions = localStorage.getItem('networkMap_nodePositions');
      const savedTreePositions = localStorage.getItem('networkMap_treePositions');
      
      if (savedNodePositions) {
        const parsed = JSON.parse(savedNodePositions);
        const map = new Map(Object.entries(parsed).map(([k, v]) => [k, v]));
        nodePositionsRef.current = map;
      }
      
      if (savedTreePositions) {
        const parsed = JSON.parse(savedTreePositions);
        const map = new Map(Object.entries(parsed).map(([k, v]) => [k, v]));
        treePositionsRef.current = map;
      }
    } catch (err) {
      console.warn('Failed to load saved positions:', err);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!loading) {
      console.log('useEffect triggered - updating graph', { 
        devices: devices.length, 
        connections: connections.length, 
        viewMode 
      });
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
      console.log('Network data loaded:', {
        connections: connResponse.data?.length || 0,
        devices: devResponse.data?.length || 0,
        racks: racksResponse.data?.length || 0,
      });
      setConnections(connResponse.data || []);
      // Deduplicate devices by ID to prevent duplicates
      const uniqueDevices = (devResponse.data || []).filter((device, index, self) =>
        index === self.findIndex(d => d.id === device.id)
      );
      setDevices(uniqueDevices);
      setRacks(racksResponse.data || []);
    } catch (error) {
      console.error('Failed to load network data:', error);
      console.error('Error details:', error.response?.data || error.message);
      // Set empty arrays on error so UI can still render
      setConnections([]);
      setDevices([]);
      setRacks([]);
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

  // Hierarchical tree layout algorithm
  const calculateTreeLayout = useCallback((devices, connections) => {
    const deviceMap = new Map(devices.map(d => [d.id, d]));
    const adjacencyList = new Map();
    const inDegree = new Map();
    
    // Initialize
    devices.forEach(device => {
      adjacencyList.set(device.id, []);
      inDegree.set(device.id, 0);
    });

    // Build adjacency list
    connections.forEach(conn => {
      const source = conn.source_device_id;
      const target = conn.target_device_id;
      if (adjacencyList.has(source) && adjacencyList.has(target)) {
        adjacencyList.get(source).push(target);
        inDegree.set(target, (inDegree.get(target) || 0) + 1);
      }
    });

    // Find root nodes (devices with no incoming connections or fewest connections)
    const roots = [];
    devices.forEach(device => {
      if (inDegree.get(device.id) === 0) {
        roots.push(device.id);
      }
    });

    // If no clear roots, use devices with most connections as roots
    if (roots.length === 0) {
      const connectionCounts = new Map();
      devices.forEach(device => {
        const count = connections.filter(c => 
          c.source_device_id === device.id || c.target_device_id === device.id
        ).length;
        connectionCounts.set(device.id, count);
      });
      const maxConnections = Math.max(...Array.from(connectionCounts.values()));
      devices.forEach(device => {
        if (connectionCounts.get(device.id) === maxConnections) {
          roots.push(device.id);
        }
      });
      // If still no roots, use first device
      if (roots.length === 0 && devices.length > 0) {
        roots.push(devices[0].id);
      }
    }

    const positions = new Map();
    const visited = new Set();
    const levelWidth = 400;
    const levelHeight = 200;

    // BFS to assign levels
    const assignLevels = (rootId, startX = 0) => {
      const queue = [{ id: rootId, level: 0, x: startX }];
      const levelNodes = new Map();

      while (queue.length > 0) {
        const { id, level, x } = queue.shift();
        if (visited.has(id)) continue;
        visited.add(id);

        if (!levelNodes.has(level)) {
          levelNodes.set(level, []);
        }
        levelNodes.get(level).push({ id, x });

        const children = adjacencyList.get(id) || [];
        children.forEach(childId => {
          if (!visited.has(childId)) {
            queue.push({ id: childId, level: level + 1, x: x });
          }
        });
      }

      // Position nodes within levels
      levelNodes.forEach((nodesInLevel, level) => {
        const nodeCount = nodesInLevel.length;
        const totalHeight = nodeCount > 1 ? (nodeCount - 1) * levelHeight : levelHeight;
        const startY = 50;
        
        nodesInLevel.forEach((node, index) => {
          const y = nodeCount > 1 
            ? startY + (index * (totalHeight / (nodeCount - 1)))
            : startY + (levelHeight / 2);
          positions.set(node.id, {
            x: node.x + (level * levelWidth),
            y: y,
          });
        });
      });
    };

    // Assign positions for each root's tree
    roots.forEach((rootId, rootIndex) => {
      assignLevels(rootId, rootIndex * 600);
    });

    // Position unconnected devices
    devices.forEach(device => {
      if (!positions.has(device.id)) {
        const unconnectedIndex = Array.from(positions.keys()).length;
        positions.set(device.id, {
          x: (roots.length * levelWidth) + (unconnectedIndex % 5) * 250,
          y: Math.floor(unconnectedIndex / 5) * 200 + 50,
        });
      }
    });

    return positions;
  }, []);

  const updateGraph = useCallback(() => {
    console.log('Updating graph:', { devices: devices.length, connections: connections.length, racks: racks.length });
    
    if (devices.length === 0) {
      console.log('No devices, clearing graph');
      setNodes([]);
      setEdges([]);
      return;
    }

    const deviceMap = new Map(devices.map(d => [d.id, d]));
    const rackMap = new Map(racks.map(r => [r.id, r]));

    // Calculate positions based on view mode
    let positions;
    const nodeId = (deviceId) => `device-${deviceId}`;
    
    if (viewMode === 'tree') {
      // For tree view, use saved positions if available, otherwise calculate
      const savedPositions = new Map();
      devices.forEach(device => {
        const saved = treePositionsRef.current.get(nodeId(device.id));
        if (saved) {
          savedPositions.set(device.id, saved);
        }
      });
      
      if (savedPositions.size === devices.length) {
        // All positions saved, use them
        positions = savedPositions;
      } else {
        // Calculate new tree layout
        positions = calculateTreeLayout(devices, connections);
        // Save calculated positions
        positions.forEach((pos, deviceId) => {
          treePositionsRef.current.set(nodeId(deviceId), pos);
        });
        // Save to localStorage
        try {
          const toSave = Object.fromEntries(
            Array.from(treePositionsRef.current.entries()).map(([k, v]) => [k, v])
          );
          localStorage.setItem('networkMap_treePositions', JSON.stringify(toSave));
        } catch (err) {
          console.warn('Failed to save tree positions:', err);
        }
      }
    } else {
      // For node graph, preserve positions if they exist, otherwise use grid
      positions = new Map();
      devices.forEach((device, index) => {
        const id = nodeId(device.id);
        // Try to get existing position from ref
        const existingPos = nodePositionsRef.current.get(id);
        if (existingPos) {
          positions.set(device.id, existingPos);
        } else {
          // Use grid layout
          const cols = Math.ceil(Math.sqrt(devices.length));
          const row = Math.floor(index / cols);
          const col = index % cols;
          const gridPos = { x: col * 250, y: row * 200 };
          positions.set(device.id, gridPos);
          nodePositionsRef.current.set(id, gridPos);
        }
      });
    }

    // Create nodes
    const newNodes = devices.map((device) => {
      const rack = rackMap.get(device.rack_id);
      const isInterRack = connections.some(conn => 
        (conn.source_device_id === device.id || conn.target_device_id === device.id) &&
        isInterRackConnection(conn)
      );
      const id = nodeId(device.id);
      
      // Use calculated position
      const position = positions.get(device.id) || { x: 0, y: 0 };

      const isSelected = connectMode && selectedSourceDevice === device.id;
      const isPendingTarget = connectMode && selectedSourceDevice && selectedSourceDevice !== device.id;

      return {
        id: id,
        type: 'deviceNode',
        position,
        data: {
          label: device.name,
          device,
          rack: rack?.name || 'Unknown',
          icon: device.icon,
          type: device.type,
          status: device.status || 'unknown',
          isInterRack,
          isSelected,
          isPendingTarget,
        },
        style: {
          background: isSelected 
            ? '#1f6feb' 
            : isPendingTarget 
              ? '#238636' 
              : isInterRack 
                ? '#21262d' 
                : '#161b22',
          border: isSelected
            ? '3px solid #58a6ff'
            : isPendingTarget
              ? '2px solid #3fb950'
              : `2px solid ${isInterRack ? '#58a6ff' : '#30363d'}`,
          borderRadius: '8px',
          padding: '10px',
          minWidth: '150px',
          cursor: connectMode ? 'pointer' : 'default',
        },
      };
    });

    // Create edges - ensure each connection shows as a single clear line
    const newEdges = connections.map((conn) => {
      const sourceDevice = deviceMap.get(conn.source_device_id);
      const targetDevice = deviceMap.get(conn.target_device_id);
      if (!sourceDevice || !targetDevice) {
        console.warn(`Edge skipped: device not found`, { 
          source_id: conn.source_device_id, 
          target_id: conn.target_device_id,
          connection_id: conn.id 
        });
        return null;
      }
      
      const interRack = isInterRackConnection(conn);
      const speedColor = getSpeedColor(conn.speed);
      const speedWidth = getSpeedWidth(conn.speed);

      console.log('Creating edge:', {
        id: conn.id,
        source: `device-${conn.source_device_id}`,
        target: `device-${conn.target_device_id}`,
        speed: conn.speed,
        color: speedColor,
        width: speedWidth
      });

      return {
        id: `edge-${conn.id}`,
        source: `device-${conn.source_device_id}`,
        target: `device-${conn.target_device_id}`,
        sourceHandle: null, // Use default handle
        targetHandle: null, // Use default handle
        type: viewMode === 'tree' ? 'smoothstep' : 'default', // Use default for clearer lines
        animated: false,
        style: {
          stroke: speedColor,
          strokeWidth: speedWidth,
          strokeDasharray: interRack ? '5,5' : undefined, // Dashed for inter-rack, solid for intra-rack
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
          width: 20,
          height: 20,
        },
        data: {
          connection: conn,
          speed: conn.speed,
          interRack,
        },
      };
    }).filter(Boolean);

    console.log('Graph updated:', { 
      nodes: newNodes.length, 
      edges: newEdges.length,
      node_ids: newNodes.map(n => n.id).slice(0, 10), // First 10 for debugging
      edge_details: newEdges.map(e => ({ 
        id: e.id, 
        source: e.source, 
        target: e.target, 
        speed: e.data?.speed,
        color: e.style?.stroke,
        width: e.style?.strokeWidth
      }))
    });
    
    // Ensure we have valid edges
    const validEdges = newEdges.filter(e => {
      const sourceExists = newNodes.some(n => n.id === e.source);
      const targetExists = newNodes.some(n => n.id === e.target);
      if (!sourceExists || !targetExists) {
        console.warn('Edge has invalid source or target:', {
          edge: e.id,
          source: e.source,
          target: e.target,
          sourceExists,
          targetExists
        });
        return false;
      }
      return true;
    });
    
    console.log('Valid edges:', validEdges.length, 'out of', newEdges.length);
    setNodes(newNodes);
    setEdges(validEdges);
  }, [devices, connections, racks, viewMode, connectMode, selectedSourceDevice, calculateTreeLayout]);

  const handleNodeClick = useCallback((event, node) => {
    if (!connectMode) return;

    const deviceId = parseInt(node.id.replace('device-', ''));
    
    if (!selectedSourceDevice) {
      // Select source device
      setSelectedSourceDevice(deviceId);
    } else if (selectedSourceDevice === deviceId) {
      // Deselect if clicking same device
      setSelectedSourceDevice(null);
    } else {
      // Select target device and show form
      setPendingConnection({
        source_device_id: selectedSourceDevice,
        target_device_id: deviceId,
      });
      setShowConnectionForm(true);
    }
  }, [connectMode, selectedSourceDevice]);

  const handleEdgeClick = useCallback((event, edge) => {
    event.stopPropagation();
    // Extract connection ID from edge ID (format: "edge-{id}")
    const connectionId = parseInt(edge.id.replace('edge-', ''));
    const connection = connections.find(c => c.id === connectionId);
    if (connection) {
      setSelectedConnection(connection);
      setShowConnectionDetails(true);
      setConnectionFormData({
        speed: connection.speed || '1Gbps',
        connection_type: connection.connection_type || 'Ethernet',
        port_info: connection.port_info || '',
      });
    }
  }, [connections]);

  const handleCreateConnection = async () => {
    if (!pendingConnection) return;

    try {
      const connectionData = {
        ...pendingConnection,
        speed: connectionFormData.speed,
        connection_type: connectionFormData.connection_type,
        port_info: connectionFormData.port_info,
      };

      const response = await networkAPI.createConnection(connectionData);
      console.log('Connection created:', response.data);
      
      // Reload connections - this will trigger useEffect to update graph
      const connResponse = await networkAPI.getAllConnections();
      const newConnections = connResponse.data || [];
      console.log('Reloaded connections:', newConnections);
      console.log('Current devices:', devices.map(d => ({ id: d.id, name: d.name })));
      
      // Update connections state - this will trigger the useEffect that calls updateGraph
      setConnections(newConnections);
      
      // Reset connection mode
      setConnectMode(false);
      setSelectedSourceDevice(null);
      setShowConnectionForm(false);
      setPendingConnection(null);
      setConnectionFormData({
        speed: '1Gbps',
        connection_type: 'Ethernet',
        port_info: '',
      });
    } catch (error) {
      console.error('Failed to create connection:', error);
      alert(`Failed to create connection: ${error.response?.data?.error || error.message}`);
    }
  };

  const handleCancelConnection = () => {
    setConnectMode(false);
    setSelectedSourceDevice(null);
    setShowConnectionForm(false);
    setPendingConnection(null);
  };

  const handleUpdateConnection = async () => {
    if (!selectedConnection) return;

    try {
      const updateData = {
        speed: connectionFormData.speed,
        connection_type: connectionFormData.connection_type,
        port_info: connectionFormData.port_info,
      };

      await networkAPI.updateConnection(selectedConnection.id, updateData);
      
      // Reload connections
      const connResponse = await networkAPI.getAllConnections();
      setConnections(connResponse.data || []);
      
      // Close details panel
      setShowConnectionDetails(false);
      setSelectedConnection(null);
    } catch (error) {
      console.error('Failed to update connection:', error);
      alert(`Failed to update connection: ${error.response?.data?.error || error.message}`);
    }
  };

  const handleDeleteConnection = async () => {
    if (!selectedConnection) return;
    
    if (!confirm(`Are you sure you want to delete the connection between ${selectedConnection.source_device_id} and ${selectedConnection.target_device_id}?`)) {
      return;
    }

    try {
      await networkAPI.deleteConnection(selectedConnection.id);
      
      // Reload connections
      const connResponse = await networkAPI.getAllConnections();
      setConnections(connResponse.data || []);
      
      // Close details panel
      setShowConnectionDetails(false);
      setSelectedConnection(null);
    } catch (error) {
      console.error('Failed to delete connection:', error);
      alert(`Failed to delete connection: ${error.response?.data?.error || error.message}`);
    }
  };

  // Sync node positions when nodes change (for preserving manual positions)
  useEffect(() => {
    if (nodes.length > 0) {
      // Store current positions based on view mode
      nodes.forEach(node => {
        if (node.position) {
          if (viewMode === 'node') {
            nodePositionsRef.current.set(node.id, node.position);
          } else {
            treePositionsRef.current.set(node.id, node.position);
          }
        }
      });
      
      // Save to localStorage
      try {
        if (viewMode === 'node') {
          const toSave = Object.fromEntries(
            Array.from(nodePositionsRef.current.entries()).map(([k, v]) => [k, v])
          );
          localStorage.setItem('networkMap_nodePositions', JSON.stringify(toSave));
        } else {
          const toSave = Object.fromEntries(
            Array.from(treePositionsRef.current.entries()).map(([k, v]) => [k, v])
          );
          localStorage.setItem('networkMap_treePositions', JSON.stringify(toSave));
        }
      } catch (err) {
        console.warn('Failed to save positions:', err);
      }
    }
  }, [nodes, viewMode]);

  const nodeTypes = useMemo(() => ({
    deviceNode: ({ data }) => (
      <div className="device-node">
        {/* Source handle - for outgoing connections */}
        <Handle
          type="source"
          position={Position.Right}
          style={{ background: '#58a6ff', width: '8px', height: '8px' }}
        />
        {/* Target handle - for incoming connections */}
        <Handle
          type="target"
          position={Position.Left}
          style={{ background: '#3fb950', width: '8px', height: '8px' }}
        />
        <div className="device-node-header">
          <span className="device-node-icon">{data.icon}</span>
          <div className="device-node-info">
            <div className="device-node-name">{data.label}</div>
            <div className="device-node-rack">{data.rack}</div>
          </div>
          <span className={`device-node-status ${data.status || 'unknown'}`}></span>
        </div>
        {data.isInterRack && (
          <div className="device-node-badge">Inter-Rack</div>
        )}
        {data.isSelected && (
          <div className="device-node-badge selected">Selected</div>
        )}
        {data.isPendingTarget && (
          <div className="device-node-badge pending">Click to connect</div>
        )}
      </div>
    ),
  }), []);

  if (loading) {
    return <div className="network-map loading">Loading network map...</div>;
  }

  console.log('NetworkMap render:', { 
    loading, 
    devices: devices.length, 
    connections: connections.length, 
    racks: racks.length,
    nodes: nodes.length,
    edges: edges.length 
  });

  return (
    <div className="network-map">
      <div className="page-header">
        <div className="header-top">
          <button
            className="back-btn"
            onClick={() => navigate('/')}
            title="Back to Racks"
          >
            ← Back to Racks
          </button>
          <h1>Network Topology</h1>
        </div>
        <div className="network-controls">
          <div className="view-toggle">
            <button
              className={`view-btn ${viewMode === 'node' ? 'active' : ''}`}
              onClick={() => {
                setViewMode('node');
              }}
            >
              Node Graph
            </button>
            <button
              className={`view-btn ${viewMode === 'tree' ? 'active' : ''}`}
              onClick={() => {
                setViewMode('tree');
              }}
            >
              Tree Graph
            </button>
          </div>
          <button
            className={`connect-btn ${connectMode ? 'active' : ''}`}
            onClick={() => {
              if (connectMode) {
                handleCancelConnection();
              } else {
                setConnectMode(true);
              }
            }}
          >
            {connectMode ? 'Cancel Connection' : 'Create Connection'}
          </button>
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

      {connectMode && (
        <div className="connection-hint">
          {selectedSourceDevice 
            ? 'Click on a target device to create a connection'
            : 'Click on a source device to start creating a connection'}
        </div>
      )}

      {showConnectionForm && pendingConnection && (
        <div className="connection-form-overlay" onClick={(e) => {
          if (e.target.classList.contains('connection-form-overlay')) {
            handleCancelConnection();
          }
        }}>
          <div className="connection-form" onClick={(e) => e.stopPropagation()}>
            <h3>Create Connection</h3>
            <div className="form-group">
              <label>Speed:</label>
              <select
                value={connectionFormData.speed}
                onChange={(e) => setConnectionFormData({ ...connectionFormData, speed: e.target.value })}
              >
                <option value="1Gbps">1Gbps</option>
                <option value="10Gbps">10Gbps</option>
                <option value="25Gbps">25Gbps</option>
                <option value="100Gbps">100Gbps</option>
              </select>
            </div>
            <div className="form-group">
              <label>Connection Type:</label>
              <select
                value={connectionFormData.connection_type}
                onChange={(e) => setConnectionFormData({ ...connectionFormData, connection_type: e.target.value })}
              >
                <option value="Ethernet">Ethernet</option>
                <option value="Fiber">Fiber</option>
                <option value="Wireless">Wireless</option>
                <option value="Virtual">Virtual</option>
              </select>
            </div>
            <div className="form-group">
              <label>Port Info (optional):</label>
              <input
                type="text"
                value={connectionFormData.port_info}
                onChange={(e) => setConnectionFormData({ ...connectionFormData, port_info: e.target.value })}
                placeholder="e.g., eth0, port 1"
              />
            </div>
            <div className="form-actions">
              <button onClick={handleCreateConnection} className="btn-primary">Create</button>
              <button onClick={handleCancelConnection} className="btn-secondary">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Connection Details/Edit Panel */}
      {showConnectionDetails && selectedConnection && (
        <div className="connection-details-overlay">
          <div className="connection-details-panel">
            <div className="connection-details-header">
              <h3>Connection Details</h3>
              <button 
                onClick={() => {
                  setShowConnectionDetails(false);
                  setSelectedConnection(null);
                }} 
                className="close-btn"
              >
                ×
              </button>
            </div>
            <div className="connection-details-content">
              <div className="connection-info">
                <div className="info-row">
                  <label>Source Device:</label>
                  <span>
                    {devices.find(d => d.id === selectedConnection.source_device_id)?.name || `Device ${selectedConnection.source_device_id}`}
                  </span>
                </div>
                <div className="info-row">
                  <label>Target Device:</label>
                  <span>
                    {devices.find(d => d.id === selectedConnection.target_device_id)?.name || `Device ${selectedConnection.target_device_id}`}
                  </span>
                </div>
              </div>
              <div className="form-group">
                <label>Speed:</label>
                <select
                  value={connectionFormData.speed}
                  onChange={(e) => setConnectionFormData({ ...connectionFormData, speed: e.target.value })}
                >
                  <option value="1Gbps">1Gbps</option>
                  <option value="10Gbps">10Gbps</option>
                  <option value="25Gbps">25Gbps</option>
                  <option value="100Gbps">100Gbps</option>
                </select>
              </div>
              <div className="form-group">
                <label>Connection Type:</label>
                <select
                  value={connectionFormData.connection_type}
                  onChange={(e) => setConnectionFormData({ ...connectionFormData, connection_type: e.target.value })}
                >
                  <option value="Ethernet">Ethernet</option>
                  <option value="Fiber">Fiber</option>
                  <option value="Wireless">Wireless</option>
                  <option value="Virtual">Virtual</option>
                </select>
              </div>
              <div className="form-group">
                <label>Port Info (optional):</label>
                <input
                  type="text"
                  value={connectionFormData.port_info}
                  onChange={(e) => setConnectionFormData({ ...connectionFormData, port_info: e.target.value })}
                  placeholder="e.g., eth0, port 1/0/1"
                />
              </div>
            </div>
            <div className="form-actions">
              <button onClick={handleUpdateConnection} className="btn-primary">Update</button>
              <button onClick={handleDeleteConnection} className="btn-danger">Delete</button>
              <button 
                onClick={() => {
                  setShowConnectionDetails(false);
                  setSelectedConnection(null);
                }} 
                className="btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="network-graph-container">
        {devices.length === 0 ? (
          <div className="no-devices">
            <p>No devices found. Add devices to racks first.</p>
          </div>
        ) : nodes.length === 0 ? (
          <div className="no-devices">
            <p>Loading graph...</p>
          </div>
        ) : (
          <ReactFlowProvider>
            <ReactFlow
              key={`${viewMode}-${connections.length}-${edges.length}-${nodes.length}`}
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onNodeClick={handleNodeClick}
              onEdgeClick={handleEdgeClick}
              onNodeDragStop={(event, node) => {
                // Save node position when dragging stops
                if (viewMode === 'node') {
                  nodePositionsRef.current.set(node.id, node.position);
                  // Save to localStorage
                  try {
                    const toSave = Object.fromEntries(
                      Array.from(nodePositionsRef.current.entries()).map(([k, v]) => [k, v])
                    );
                    localStorage.setItem('networkMap_nodePositions', JSON.stringify(toSave));
                  } catch (err) {
                    console.warn('Failed to save node positions:', err);
                  }
                } else {
                  treePositionsRef.current.set(node.id, node.position);
                  // Save to localStorage
                  try {
                    const toSave = Object.fromEntries(
                      Array.from(treePositionsRef.current.entries()).map(([k, v]) => [k, v])
                    );
                    localStorage.setItem('networkMap_treePositions', JSON.stringify(toSave));
                  } catch (err) {
                    console.warn('Failed to save tree positions:', err);
                  }
                }
              }}
              nodeTypes={nodeTypes}
              fitView
              fitViewOptions={{ padding: 0.2 }}
              attributionPosition="bottom-left"
              defaultViewport={{ x: 0, y: 0, zoom: 1 }}
              style={{ width: '100%', height: '100%' }}
              connectionLineStyle={{ stroke: '#58a6ff', strokeWidth: 2 }}
              onInit={(instance) => {
                console.log('ReactFlow initialized with:', {
                  nodes: instance.getNodes().length,
                  edges: instance.getEdges().length,
                  nodeIds: instance.getNodes().map(n => n.id),
                  edgeDetails: instance.getEdges().map(e => ({
                    id: e.id,
                    source: e.source,
                    target: e.target,
                    style: e.style
                  }))
                });
                // Force fit view to ensure everything is visible
                setTimeout(() => {
                  instance.fitView({ padding: 0.2, duration: 200 });
                }, 100);
              }}
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
