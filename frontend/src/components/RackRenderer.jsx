import { useState } from 'react';
import './RackRenderer.css';

const UNIT_HEIGHT = 34; // px per U

function RackRenderer({ rack, devices, onDeviceSelect, selectedDeviceId, onEmptySlotClick, onDeviceMove, isSelectedForAdd, allRacks, allDevices }) {
  const [draggedDevice, setDraggedDevice] = useState(null);
  const [dragOverU, setDragOverU] = useState(null);
  const [hoveredSlot, setHoveredSlot] = useState(null);
  const [dragPreview, setDragPreview] = useState(null);

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
    return !rackDevices.some(d => {
      if (deviceId && d.id === deviceId) return false;
      const deviceTopU = d.position_u;
      const deviceBottomU = d.position_u - d.size_u + 1;
      // Check if ranges overlap: ranges overlap if they share any U slot
      // Two ranges [a1, a2] and [b1, b2] overlap if: !(a2 < b1 || a1 > b2)
      // In our case: targetTopU >= deviceBottomU && targetBottomU <= deviceTopU
      return targetTopU >= deviceBottomU && targetBottomU <= deviceTopU;
    });
  };

  const renderEmptySlot = (uNum) => {
    const isHovered = hoveredSlot === uNum && !draggedDevice;
    const isDragOver = dragOverU === uNum;
    const isSelected = isSelectedForAdd && isHovered;
    
    // Check if this slot is part of a valid drop zone for the dragged device
    let isValidDrop = false;
    let isPartOfDropZone = false;
    if (draggedDevice && dragOverU) {
      const device = allDevices ? allDevices.find(d => d.id === draggedDevice) : devices.find(d => d.id === draggedDevice);
      if (device) {
        const dropTopU = dragOverU;
        const dropBottomU = dragOverU - device.size_u + 1;
        isPartOfDropZone = uNum <= dropTopU && uNum >= dropBottomU;
        isValidDrop = isValidDropPosition(dragOverU, device.size_u, draggedDevice);
      }
    }
    
    return (
      <div 
        key={`empty-${uNum}`} 
        className={`u-empty clickable ${isSelected ? 'selected-for-add' : ''} ${isPartOfDropZone ? (isValidDrop ? 'valid-drop-zone' : 'invalid-drop-zone') : ''}`}
        onClick={() => onEmptySlotClick && onEmptySlotClick(rack.id, uNum)}
        onMouseEnter={() => !draggedDevice && setHoveredSlot(uNum)}
        onMouseLeave={() => !draggedDevice && setHoveredSlot(null)}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (draggedDevice) {
            setDragOverU(uNum);
            const device = allDevices ? allDevices.find(d => d.id === draggedDevice) : devices.find(d => d.id === draggedDevice);
            if (device) {
              setDragPreview({
                topU: uNum,
                bottomU: uNum - device.size_u + 1,
                sizeU: device.size_u,
                isValid: isValidDropPosition(uNum, device.size_u, draggedDevice),
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
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (draggedDevice && onDeviceMove) {
            const device = allDevices ? allDevices.find(d => d.id === draggedDevice) : devices.find(d => d.id === draggedDevice);
            if (device && isValidDropPosition(uNum, device.size_u, draggedDevice)) {
              onDeviceMove(draggedDevice, rack.id, uNum);
            }
          }
          setDraggedDevice(null);
          setDragOverU(null);
          setDragPreview(null);
        }}
        style={{
          backgroundColor: isPartOfDropZone 
            ? (isValidDrop ? 'rgba(63, 185, 80, 0.2)' : 'rgba(218, 54, 51, 0.2)')
            : isDragOver 
              ? 'rgba(88, 166, 255, 0.3)' 
              : isHovered 
                ? 'rgba(88, 166, 255, 0.15)' 
                : 'transparent',
          border: isPartOfDropZone
            ? (isValidDrop ? '2px solid #3fb950' : '2px solid #da3633')
            : isDragOver 
              ? '2px dashed var(--accent)' 
              : isHovered 
                ? '1px solid var(--accent)' 
                : 'none',
        }}
      >
        <span className="u-label left">U{uNum}</span>
        <span className="u-label right">U{uNum}</span>
        {isHovered && !draggedDevice && (
          <div className="slot-hint">Click to add device</div>
        )}
        {isPartOfDropZone && dragPreview && (
          <div className={`drop-preview ${isValidDrop ? 'valid' : 'invalid'}`}>
            {isValidDrop ? '✓ Drop here' : '✗ Invalid'}
          </div>
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
    
    return (
      <div
        key={device.id}
        className={`rack-unit ${typeClass} ${isSelected ? 'selected' : ''} ${isDragging ? 'dragging' : ''} draggable`}
        style={{
          height: `${device.size_u * UNIT_HEIGHT}px`,
        }}
        draggable={!!onDeviceMove}
        onDragStart={(e) => {
          if (onDeviceMove) {
            e.stopPropagation(); // Prevent triggering container scroll drag
            setDraggedDevice(device.id);
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', device.id.toString());
            e.dataTransfer.setData('application/json', JSON.stringify({ deviceId: device.id, rackId: rack.id }));
            // Create custom drag image
            const dragImage = e.currentTarget.cloneNode(true);
            dragImage.style.opacity = '0.8';
            dragImage.style.transform = 'rotate(2deg)';
            document.body.appendChild(dragImage);
            e.dataTransfer.setDragImage(dragImage, e.clientX - e.currentTarget.getBoundingClientRect().left, e.clientY - e.currentTarget.getBoundingClientRect().top);
            setTimeout(() => document.body.removeChild(dragImage), 0);
          }
        }}
        onDragEnd={(e) => {
          e.stopPropagation();
          setDraggedDevice(null);
          setDragOverU(null);
          setDragPreview(null);
          setHoveredSlot(null);
        }}
        onDrag={(e) => {
          e.stopPropagation(); // Prevent container scroll during device drag
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
        <div className={`unit-led ${device.status}`}></div>
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
  const sortedDevices = [...devices].sort((a, b) => b.position_u - a.position_u);

  // Build rack slots from top (U25) to bottom (U1)
  // We'll reverse the array later so U1 appears at bottom visually
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

  // Fill remaining slots down to U1
  while (currentU >= 1) {
    slots.push(renderEmptySlot(currentU));
    currentU--;
  }

  // Reverse slots so U1 is at bottom, U25 at top (for bottom-anchored display)
  const reversedSlots = [...slots].reverse();

  const isDragOverRack = draggedDevice && dragOverU !== null;
  
  return (
    <div className={`rack-column ${isSelectedForAdd ? 'selected-for-add' : ''} ${isDragOverRack ? 'drag-over' : ''}`}>
      <div className="rack-title">
        {rack.name} • {rack.size_u}U
        {isSelectedForAdd && <span className="add-indicator">Adding device...</span>}
        {isDragOverRack && dragPreview && (
          <span className={`drag-status ${dragPreview.isValid ? 'valid' : 'invalid'}`}>
            {dragPreview.isValid ? '✓ Valid drop' : '✗ Invalid'}
          </span>
        )}
      </div>
      <div
        className={`rack-frame ${draggedDevice ? 'drag-active' : ''}`}
        style={{
          minHeight: `${rack.size_u * UNIT_HEIGHT}px`,
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          // Allow drag over for cross-rack dragging
        }}
        onDragEnter={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onDragLeave={(e) => {
          // Clear drag state when leaving the entire rack frame
          if (!e.currentTarget.contains(e.relatedTarget)) {
            setDragOverU(null);
            setDragPreview(null);
          }
        }}
        onDrop={(e) => {
          // Handle drop at rack frame level for cross-rack moves
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        <div className="rail left"></div>
        <div className="rail right"></div>
        {reversedSlots}
        {dragPreview && draggedDevice && (
          <div 
            className="drag-preview-overlay"
            style={{
              position: 'absolute',
              // Calculate from bottom: U1 is at bottom, so position from bottom up
              bottom: `${(dragPreview.bottomU - 1) * UNIT_HEIGHT}px`,
              left: '40px',
              right: '40px',
              height: `${dragPreview.sizeU * UNIT_HEIGHT}px`,
              backgroundColor: dragPreview.isValid ? 'rgba(63, 185, 80, 0.15)' : 'rgba(218, 54, 51, 0.15)',
              border: `2px ${dragPreview.isValid ? 'solid' : 'dashed'} ${dragPreview.isValid ? '#3fb950' : '#da3633'}`,
              borderRadius: '4px',
              pointerEvents: 'none',
              zIndex: 100,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: dragPreview.isValid ? '#3fb950' : '#da3633',
              fontWeight: 700,
              fontSize: '0.9rem',
              boxShadow: dragPreview.isValid 
                ? '0 0 20px rgba(63, 185, 80, 0.5)' 
                : '0 0 20px rgba(218, 54, 51, 0.5)',
            }}
          >
            {dragPreview.isValid ? '✓ Drop here' : '✗ Invalid position'}
          </div>
        )}
      </div>
    </div>
  );
}

export default RackRenderer;
