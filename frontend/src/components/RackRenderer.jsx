import { useState, useRef } from 'react';
import './RackRenderer.css';

const UNIT_HEIGHT = 34; // px per U

function RackRenderer({ rack, devices, onDeviceSelect, selectedDeviceId, onEmptySlotClick, onDeviceMove, isSelectedForAdd, allRacks, allDevices }) {
  const [draggedDevice, setDraggedDevice] = useState(null);
  const [hoveredSlot, setHoveredSlot] = useState(null);
  const [dragOverU, setDragOverU] = useState(null);
  const [dragPreview, setDragPreview] = useState(null);
  // Use ref to persist drag state across re-renders
  const draggedDeviceRef = useRef(null);

  // Check if a position is valid for dropping a device
  const isValidDropPosition = (targetU, deviceSize, deviceId) => {
    // Check if device fits in rack (targetU is the TOP slot, device extends downward)
    if (targetU > rack.size_u || targetU - deviceSize + 1 < 1) {
      return false;
    }
    
    // Check for overlaps with other devices (excluding the dragged device)
    const targetTopU = targetU;
    const targetBottomU = targetU - deviceSize + 1;
    const rackDevices = allDevices ? allDevices.filter(d => d.rack_id === rack.id) : devices;
    const hasOverlap = rackDevices.some(d => {
      if (deviceId && d.id === deviceId) return false;
      const deviceTopU = d.position_u;
      const deviceBottomU = d.position_u - d.size_u + 1;
      // Check if ranges overlap: ranges overlap if they share any U slot
      // Two ranges [a1, a2] and [b1, b2] overlap if: !(a2 < b1 || a1 > b2)
      // In our case: targetTopU >= deviceBottomU && targetBottomU <= deviceTopU
      const overlaps = targetTopU >= deviceBottomU && targetBottomU <= deviceTopU;
      if (overlaps) {
      }
      return overlaps;
    });
    const isValid = !hasOverlap;
    return isValid;
  };

  const renderEmptySlot = (uNum) => {
    // Check if this slot is occupied by the device being dragged
    const currentDraggedDevice = draggedDeviceRef.current || draggedDevice;
    let isOccupiedByDraggedDevice = false;
    if (currentDraggedDevice) {
      const draggedDeviceObj = allDevices ? allDevices.find(d => d.id === currentDraggedDevice) : devices.find(d => d.id === currentDraggedDevice);
      if (draggedDeviceObj && draggedDeviceObj.rack_id === rack.id) {
        const deviceTopU = draggedDeviceObj.position_u;
        const deviceBottomU = draggedDeviceObj.position_u - draggedDeviceObj.size_u + 1;
        // Check if this U slot is within the dragged device's range
        isOccupiedByDraggedDevice = uNum <= deviceTopU && uNum >= deviceBottomU;
      }
    }
    
    const isHovered = hoveredSlot === uNum && !draggedDevice;
    const isSelected = isSelectedForAdd && isHovered;
    
    // Don't highlight individual slots - we'll use the overlay box instead
    const isPartOfDropZone = false;
    const isValidDrop = false;
    
    // Hide empty slots that are occupied by the dragged device to prevent ghosting
    if (isOccupiedByDraggedDevice) {
      return null;
    }
    
    return (
      <div 
        key={`empty-${uNum}`} 
        className={`u-empty clickable ${isSelected ? 'selected-for-add' : ''}`}
        onClick={() => onEmptySlotClick && onEmptySlotClick(rack.id, uNum)}
        onMouseEnter={() => !draggedDevice && setHoveredSlot(uNum)}
        onMouseLeave={() => !draggedDevice && setHoveredSlot(null)}
        onDragEnter={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          
          // Update drag preview for visual feedback
          const currentDraggedDevice = draggedDeviceRef.current || draggedDevice;
          if (currentDraggedDevice) {
            setDragOverU(uNum);
            const device = allDevices ? allDevices.find(d => d.id === currentDraggedDevice) : devices.find(d => d.id === currentDraggedDevice);
            if (device) {
              const isValid = isValidDropPosition(uNum, device.size_u, currentDraggedDevice);
              setDragPreview({
                topU: uNum,
                bottomU: uNum - device.size_u + 1,
                sizeU: device.size_u,
                isValid: isValid,
              });
            }
          }
        }}
        onDragLeave={(e) => {
          // Only clear if we're actually leaving the slot (not entering a child)
          if (!e.currentTarget.contains(e.relatedTarget)) {
            if (dragOverU === uNum) {
              setDragOverU(null);
              setDragPreview(null);
            }
          }
          e.preventDefault();
          e.stopPropagation();
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          
          // Read device ID from dataTransfer (this is the reliable source)
          let deviceId = null;
          try {
            const data = e.dataTransfer.getData('text/plain');
            if (data) {
              deviceId = parseInt(data);
            }
          } catch (err) {
            console.warn('Could not read drag data:', err);
          }
          
          // Fall back to ref, then state if dataTransfer didn't work
          if (!deviceId && draggedDeviceRef.current) {
            deviceId = draggedDeviceRef.current;
          } else if (!deviceId && draggedDevice) {
            deviceId = draggedDevice;
          }
          
          if (deviceId && onDeviceMove) {
            const device = allDevices ? allDevices.find(d => d.id === deviceId) : devices.find(d => d.id === deviceId);
            if (device) {
              const isValid = isValidDropPosition(uNum, device.size_u, deviceId);
              if (isValid) {
                onDeviceMove(deviceId, rack.id, uNum);
              }
            }
          }
          
          // Clear drag state and ref
          draggedDeviceRef.current = null;
          setDraggedDevice(null);
          setDragOverU(null);
          setDragPreview(null);
        }}
        style={{
          backgroundColor: isHovered && !draggedDevice ? 'rgba(88, 166, 255, 0.15)' : 'transparent',
          border: isHovered && !draggedDevice ? '1px solid var(--accent)' : 'none',
        }}
      >
        <span className="u-label left">U{uNum}</span>
        <span className="u-label right">U{uNum}</span>
        {isHovered && !draggedDevice && (
          <div className="slot-hint">Click to add device</div>
        )}
      </div>
    );
  };

  const renderDevice = (device) => {
    const typeClass = `type-${device.type}`;
    const bottomU = device.position_u - device.size_u + 1;
    const isSelected = selectedDeviceId === device.id;

    // Generate unit labels - show ALL U labels for any device size
    const leftLabels = [];
    const rightLabels = [];

    for (let i = 0; i < device.size_u; i++) {
      const uNum = device.position_u - i;
      const topPos = (i * UNIT_HEIGHT) + (UNIT_HEIGHT / 2);
      leftLabels.push(
        <span
          key={`left-${uNum}`}
          className="u-label"
          style={{
            position: 'absolute',
            left: '-32px',
            top: `${topPos}px`,
            transform: 'translateY(-50%)',
          }}
        >
          U{uNum}
        </span>
      );
      rightLabels.push(
        <span
          key={`right-${uNum}`}
          className="u-label"
          style={{
            position: 'absolute',
            right: '-32px',
            left: 'auto',
            textAlign: 'left',
            top: `${topPos}px`,
            transform: 'translateY(-50%)',
          }}
        >
          U{uNum}
        </span>
      );
    }

    const isDragging = draggedDevice === device.id;
    const calculatedHeight = device.size_u * UNIT_HEIGHT;
    
    return (
      <div
        key={device.id}
        className={`rack-unit ${typeClass} ${isSelected ? 'selected' : ''} ${isDragging ? 'dragging' : ''} draggable`}
        style={{
          height: `${calculatedHeight}px`,
          opacity: isDragging ? 0 : 1,
          pointerEvents: isDragging ? 'none' : 'auto',
          cursor: onDeviceMove ? 'grab' : 'default',
        }}
        draggable={!!onDeviceMove}
        onDragStart={(e) => {
          if (onDeviceMove) {
            e.stopPropagation();
            // Set ref immediately (persists across re-renders)
            draggedDeviceRef.current = device.id;
            // Delay state update to prevent re-render from cancelling drag
            setTimeout(() => {
              setDraggedDevice(device.id);
            }, 0);
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', device.id.toString());
            e.dataTransfer.setData('application/json', JSON.stringify({ deviceId: device.id, rackId: rack.id }));
            // Use a simple, visible drag image
            const dragImage = document.createElement('div');
            dragImage.textContent = device.name;
            dragImage.style.position = 'fixed';
            dragImage.style.top = '-1000px';
            dragImage.style.left = '-1000px';
            dragImage.style.padding = '8px 12px';
            dragImage.style.background = '#161b22';
            dragImage.style.border = '1px solid #30363d';
            dragImage.style.borderRadius = '4px';
            dragImage.style.color = '#f0f6fc';
            dragImage.style.fontSize = '14px';
            dragImage.style.whiteSpace = 'nowrap';
            dragImage.style.zIndex = '9999';
            document.body.appendChild(dragImage);
            e.dataTransfer.setDragImage(dragImage, 0, 0);
            // Clean up after a short delay
            requestAnimationFrame(() => {
              if (document.body.contains(dragImage)) {
                document.body.removeChild(dragImage);
              }
            });
          } else {
            // Prevent drag if no handler
            e.preventDefault();
          }
        }}
        onDragEnd={(e) => {
          e.stopPropagation();
          // Don't clear state immediately - let the drop handler process first
          // Only clear if drop didn't happen (e.g., dragged outside)
          // The drop handler will clear state after processing
          // Use a longer timeout to ensure drop handler has time to execute
          setTimeout(() => {
            // Only clear if we still have drag state (drop didn't clear it)
            if (draggedDeviceRef.current || draggedDevice) {
              draggedDeviceRef.current = null;
              setDraggedDevice(null);
              setDragOverU(null);
              setDragPreview(null);
              setHoveredSlot(null);
            }
          }, 200);
        }}
        onDrag={(e) => {
          e.stopPropagation(); // Prevent container scroll during device drag
        }}
        onMouseDown={(e) => {
          // Only stop propagation if we're not starting a drag
          // Allow the drag to start naturally
          // Don't stop propagation here - let the drag start
        }}
        onClick={(e) => {
          if (!isDragging) {
            e.stopPropagation();
            onDeviceSelect(device);
          }
        }}
      >
        {leftLabels}
        {rightLabels}
        <div className={`unit-led ${device.status || 'unknown'}`}></div>
        <div className="unit-icon">{device.icon}</div>
        <div className="unit-info">
          <div className="unit-name">{device.name}</div>
          <div className="unit-meta">
            U{device.position_u}{device.size_u > 1 ? `-${bottomU}` : ''} • {device.size_u}U
          </div>
        </div>
        <div className="unit-bezel"></div>
      </div>
    );
  };

  // Sort devices by position (highest first, so U25 is first)
  // Filter out the dragged device so its slots are rendered as empty (then we'll hide those empty slots)
  const currentDraggedDevice = draggedDeviceRef.current || draggedDevice;
  const devicesForSlotBuilding = currentDraggedDevice 
    ? devices.filter(d => d.id !== currentDraggedDevice)
    : devices;
  const sortedDevices = [...devicesForSlotBuilding].sort((a, b) => b.position_u - a.position_u);

  // Build rack slots from top (U25) to bottom (U1)
  // We'll reverse the array so U1 is first, then column-reverse CSS will put U1 at bottom
  const slots = [];
  let currentU = rack.size_u;

  sortedDevices.forEach((device) => {
    const deviceTopU = device.position_u;
    const deviceBottomU = device.position_u - device.size_u + 1;

    // Fill empty slots above device
    while (currentU > deviceTopU) {
      slots.push(renderEmptySlot(currentU));
      currentU--;
    }

    // Place device (position_u is the TOP slot, device extends downward)
    slots.push(renderDevice(device));
    currentU = deviceBottomU - 1;
  });
  
  // If a device is being dragged, we need to render it separately (but hidden)
  // and ensure its slots are rendered as empty (then hidden by renderEmptySlot)
  if (currentDraggedDevice) {
    const draggedDeviceObj = devices.find(d => d.id === currentDraggedDevice);
    if (draggedDeviceObj && draggedDeviceObj.rack_id === rack.id) {
      const deviceTopU = draggedDeviceObj.position_u;
      const deviceBottomU = draggedDeviceObj.position_u - draggedDeviceObj.size_u + 1;
      
      // Fill empty slots above the dragged device
      while (currentU > deviceTopU) {
        slots.push(renderEmptySlot(currentU));
        currentU--;
      }
      
      // Render the dragged device (it will be hidden with opacity: 0)
      slots.push(renderDevice(draggedDeviceObj));
      currentU = deviceBottomU - 1;
    }
  }

  // Fill remaining slots down to U1
  while (currentU >= 1) {
    slots.push(renderEmptySlot(currentU));
    currentU--;
  }

  // Reverse slots so U1 is first in array
  // With column-reverse CSS, first item (U1) appears at bottom, last item (U25) at top
  const reversedSlots = [...slots].reverse();

  return (
    <div className={`rack-column ${isSelectedForAdd ? 'selected-for-add' : ''}`}>
      <div className="rack-title">
        {rack.name} • {rack.size_u}U
      </div>
      <div
        className={`rack-frame ${draggedDevice ? 'drag-active' : ''}`}
        style={{
          minHeight: `${rack.size_u * UNIT_HEIGHT}px`,
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          
          // Update drag preview for cross-rack dragging
          const currentDraggedDevice = draggedDeviceRef.current || draggedDevice;
          if (currentDraggedDevice) {
            // Calculate which U slot the mouse is over based on position
            const rect = e.currentTarget.getBoundingClientRect();
            const y = e.clientY - rect.bottom; // Distance from bottom
            const uNum = Math.max(1, Math.min(rack.size_u, Math.floor((rect.height - y) / UNIT_HEIGHT) + 1));
            
            setDragOverU(uNum);
            const device = allDevices ? allDevices.find(d => d.id === currentDraggedDevice) : devices.find(d => d.id === currentDraggedDevice);
            if (device) {
              const isValid = isValidDropPosition(uNum, device.size_u, currentDraggedDevice);
              setDragPreview({
                topU: uNum,
                bottomU: uNum - device.size_u + 1,
                sizeU: device.size_u,
                isValid: isValid,
              });
            }
          }
        }}
        onDragEnter={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onDragLeave={(e) => {
          // Only clear if we're actually leaving the rack frame
          if (!e.currentTarget.contains(e.relatedTarget)) {
            setDragOverU(null);
            setDragPreview(null);
          }
          e.preventDefault();
          e.stopPropagation();
        }}
        onDrop={(e) => {
          // Handle drop at rack frame level for cross-rack moves
          e.preventDefault();
          e.stopPropagation();
          
          // Read device ID from dataTransfer
          let deviceId = null;
          try {
            const data = e.dataTransfer.getData('text/plain');
            if (data) {
              deviceId = parseInt(data);
            }
          } catch (err) {
            console.warn('Could not read drag data:', err);
          }
          
          // Fall back to ref, then state if dataTransfer didn't work
          if (!deviceId && draggedDeviceRef.current) {
            deviceId = draggedDeviceRef.current;
          } else if (!deviceId && draggedDevice) {
            deviceId = draggedDevice;
          }
          
          if (deviceId && onDeviceMove) {
            const device = allDevices ? allDevices.find(d => d.id === deviceId) : devices.find(d => d.id === deviceId);
            if (device) {
              // Use the drag preview position if available, otherwise find first available
              let targetU = null;
              if (dragPreview && dragPreview.isValid) {
                targetU = dragPreview.topU;
              } else {
                // Find the first available position in this rack (top slot that fits)
                let searchU = rack.size_u;
                while (searchU >= device.size_u) {
                  const isValid = isValidDropPosition(searchU, device.size_u, deviceId);
                  if (isValid) {
                    targetU = searchU;
                    break;
                  }
                  searchU--;
                }
              }
              
              if (targetU) {
                onDeviceMove(deviceId, rack.id, targetU);
              } else {
                console.warn('No valid position found in rack', rack.id, 'for device', deviceId);
              }
            }
          }
          
          // Clear drag state and ref
          draggedDeviceRef.current = null;
          setDraggedDevice(null);
          setDragOverU(null);
          setDragPreview(null);
        }}
      >
        <div className="rail left"></div>
        <div className="rail right"></div>
        {reversedSlots}
        {dragPreview && (draggedDeviceRef.current || draggedDevice) && (
          <div
            className="drop-preview-overlay"
            style={{
              position: 'absolute',
              left: '40px',
              right: '40px',
              bottom: `${(dragPreview.bottomU - 1) * UNIT_HEIGHT}px`,
              height: `${dragPreview.sizeU * UNIT_HEIGHT}px`,
              backgroundColor: dragPreview.isValid ? 'rgba(63, 185, 80, 0.2)' : 'rgba(218, 54, 51, 0.2)',
              border: `2px ${dragPreview.isValid ? 'solid' : 'dashed'} ${dragPreview.isValid ? '#3fb950' : '#da3633'}`,
              borderRadius: '4px',
              pointerEvents: 'none',
              zIndex: 100,
              boxShadow: dragPreview.isValid 
                ? '0 0 20px rgba(63, 185, 80, 0.5)' 
                : '0 0 20px rgba(218, 54, 51, 0.5)',
              maxHeight: `${rack.size_u * UNIT_HEIGHT}px`,
            }}
          />
        )}
      </div>
    </div>
  );
}

export default RackRenderer;
