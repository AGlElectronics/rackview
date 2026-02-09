import './RackRenderer.css';

const UNIT_HEIGHT = 34; // px per U

function RackRenderer({ rack, devices, onDeviceSelect, selectedDeviceId }) {
  const renderEmptySlot = (uNum) => (
    <div key={`empty-${uNum}`} className="u-empty">
      <span className="u-label left">U{uNum}</span>
      <span className="u-label right">U{uNum}</span>
    </div>
  );

  const renderDevice = (device) => {
    const sizeClass = device.size_u > 1 ? `u-${device.size_u}` : '';
    const typeClass = `type-${device.type}`;
    const bottomU = device.position_u - device.size_u + 1;
    const isSelected = selectedDeviceId === device.id;

    // Generate unit labels
    let leftLabels = '';
    let rightLabels = '';

    if (device.size_u <= 4) {
      // Show all labels for small devices
      for (let i = 0; i < device.size_u; i++) {
        const uNum = device.position_u - i;
        const topPos = (i * UNIT_HEIGHT) + (UNIT_HEIGHT / 2);
        leftLabels += (
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
        rightLabels += (
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
    } else {
      // Large devices: show top, middle, and bottom only
      const positions = [0, Math.floor(device.size_u / 2), device.size_u - 1];
      positions.forEach((i) => {
        const uNum = device.position_u - i;
        const topPos = (i * UNIT_HEIGHT) + (UNIT_HEIGHT / 2);
        leftLabels += (
          <span
            key={`left-${uNum}`}
            className="u-label"
            style={{
              position: 'absolute',
              left: '-32px',
              top: `${topPos}px`,
              transform: 'translateY(-50%)',
              fontSize: '0.65rem',
            }}
          >
            U{uNum}
          </span>
        );
        rightLabels += (
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
              fontSize: '0.65rem',
            }}
          >
            U{uNum}
          </span>
        );
      });
    }

    return (
      <div
        key={device.id}
        className={`rack-unit ${sizeClass} ${typeClass} ${isSelected ? 'selected' : ''}`}
        onClick={() => onDeviceSelect(device)}
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

  // Sort devices by position (highest first)
  const sortedDevices = [...devices].sort((a, b) => b.position_u - a.position_u);

  // Build rack slots
  const slots = [];
  let currentU = rack.size_u;

  sortedDevices.forEach((device) => {
    const deviceTopU = device.position_u;
    const deviceBottomU = device.position_u - device.size_u + 1;

    // Fill empty slots above
    while (currentU > deviceTopU) {
      slots.push(renderEmptySlot(currentU));
      currentU--;
    }

    // Place device
    slots.push(renderDevice(device));
    currentU = deviceBottomU - 1;
  });

  // Fill remaining slots
  while (currentU >= 1) {
    slots.push(renderEmptySlot(currentU));
    currentU--;
  }

  return (
    <div className="rack-column">
      <div className="rack-title">
        {rack.name} • {rack.size_u}U
      </div>
      <div
        className="rack-frame"
        style={{
          minHeight: `${rack.size_u * UNIT_HEIGHT}px`,
        }}
      >
        <div className="rail left"></div>
        <div className="rail right"></div>
        {slots}
      </div>
    </div>
  );
}

export default RackRenderer;
