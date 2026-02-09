<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Hardware - Dual 25U Racks</title>
    <style>
        :root {
            --bg-color: #0d1117;
            --rack-chassis: #161b22;
            --rack-width: 380px;
            /* REDUCED: 34px is ~2/3 of 50px */
            --unit-height: 34px;
            --accent: #58a6ff;
            --border-color: #30363d;
        }
        
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
        body { background: var(--bg-color); color: #c9d1d9; padding-top: 70px; }
        
        nav {
            background: rgba(13, 17, 23, 0.95);
            backdrop-filter: blur(10px);
            padding: 1rem 5%;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid var(--border-color);
            position: fixed;
            width: 100%;
            top: 0;
            z-index: 1000;
        }
        .logo { font-size: 1.5rem; font-weight: 700; color: var(--accent); }
        .nav-links a { color: #8b949e; text-decoration: none; margin-left: 24px; font-weight: 500; }
        .nav-links a:hover { color: var(--accent); }
        .page-header { text-align: center; padding: 30px 20px; }
        .page-header h1 { font-size: 2rem; color: #f0f6fc; font-weight: 700; }
        .page-header p { color: #8b949e; margin-top: 8px; font-size: 0.95rem; }
        
        .main-layout {
            max-width: 1400px;
            margin: 0 auto;
            padding: 20px;
            display: grid;
            grid-template-columns: auto 400px;
            gap: 30px;
            align-items: start;
        }
        @media (max-width: 1100px) {
            .main-layout { grid-template-columns: 1fr; }
            .racks-container { flex-direction: column; }
        }
        
        .racks-container {
            display: flex;
            gap: 40px;
            background: linear-gradient(180deg, #21262d 0%, #161b22 100%);
            border: 1px solid var(--border-color);
            border-radius: 12px;
            padding: 30px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.5);
        }
        
        .rack-column {
            width: var(--rack-width);
            flex-shrink: 0;
        }
        .rack-title {
            text-align: center;
            margin-bottom: 15px;
            color: var(--accent);
            font-size: 0.9rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 2px;
            padding: 8px;
            background: rgba(88, 166, 255, 0.1);
            border: 1px solid rgba(88, 166, 255, 0.3);
            border-radius: 6px;
        }
        .rack-frame {
            background: #0d1117;
            border-left: 10px solid #252525;
            border-right: 10px solid #252525;
            border-top: 6px solid #1a1a1a;
            border-bottom: 6px solid #1a1a1a;
            border-radius: 4px;
            padding: 0 40px;
            position: relative;
            box-shadow: inset 0 0 30px rgba(0,0,0,0.8);
            /* REMOVE fixed height - let it grow naturally with content */
            /* height: calc(var(--unit-height) * 25); */
            /* min-height: calc(var(--unit-height) * 25); */
        }
        
        .rail {
            position: absolute;
            top: 0;
            bottom: 0; /* This will now stretch with the content */
            width: 40px;
            background: linear-gradient(90deg, #333 0%, #1a1a1a 50%, #333 100%);
            border: 1px solid #444;
        }
        .rail.left { left: 0; }
        .rail.right { right: 0; }
        
        .u-label {
            position: absolute;
            left: -32px;
            width: 26px;
            text-align: right;
            color: #555;
            font-size: 0.7rem; /* Slightly smaller for compact view */
            font-family: monospace;
            font-weight: bold;
            height: var(--unit-height);
            line-height: var(--unit-height);
        }
        .rail.right .u-label {
            left: auto;
            right: -32px;
            text-align: left;
        }
        
        .rack-unit {
            height: var(--unit-height);
            margin: 0;
            background: linear-gradient(180deg, #1f2329 0%, #161b20 100%);
            border-left: 3px solid var(--accent);
            border-right: 1px solid #333;
            border-top: 1px solid #3a3f47;
            border-bottom: 1px solid #111;
            border-radius: 3px;
            cursor: pointer;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            padding: 0 12px; /* Reduced padding */
            gap: 10px;
            position: relative;
            overflow: hidden;
        }
        
        /* Multi-U sizing - exact multiples */
        .rack-unit.u-2 { height: calc(var(--unit-height) * 2); }
        .rack-unit.u-3 { height: calc(var(--unit-height) * 3); }
        .rack-unit.u-4 { height: calc(var(--unit-height) * 4); }
        .rack-unit.u-6 { height: calc(var(--unit-height) * 6); }
        .rack-unit.u-10 { height: calc(var(--unit-height) * 10); }
        
        .rack-unit:hover {
            background: linear-gradient(180deg, #2a2f36 0%, #1f242a 100%);
            border-left-color: #fff;
            transform: translateX(2px);
            box-shadow: 0 0 15px rgba(88, 166, 255, 0.25);
            z-index: 10;
        }
        .rack-unit.selected {
            border-left-color: #fff;
            border-right-color: var(--accent);
            background: linear-gradient(180deg, #30363d 0%, #252b33 100%);
            box-shadow: 0 0 0 2px rgba(88, 166, 255, 0.3), 0 5px 15px rgba(0,0,0,0.3);
        }
        
        .unit-led {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: #333;
            box-shadow: inset 0 1px 2px rgba(0,0,0,0.5);
            flex-shrink: 0;
        }
        .unit-led.on { background: #3fb950; box-shadow: 0 0 5px #3fb950; }
        .unit-led.warning { background: #f0883e; box-shadow: 0 0 5px #f0883e; }
        
        .unit-icon { font-size: 1.1rem; }
        .unit-info { flex: 1; min-width: 0; }
        .unit-name { 
            font-weight: 600; 
            font-size: 0.9rem; 
            color: #f0f6fc; 
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            margin-bottom: 1px;
        }
        .unit-meta { 
            font-size: 0.7rem; 
            color: #8b949e; 
            font-family: monospace;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        .unit-bezel {
            position: absolute;
            right: 0;
            top: 0;
            bottom: 0;
            width: 5px;
            background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.03) 100%);
            border-left: 1px solid #222;
        }
        
        .u-empty {
            height: var(--unit-height);
            border-bottom: 1px solid #1a1a1a;
            opacity: 0.3;
            position: relative;
            margin: 0;
        }
        
        .info-panel {
            background: #161b22;
            border: 1px solid var(--border-color);
            border-radius: 12px;
            padding: 0;
            box-shadow: 0 20px 40px rgba(0,0,0,0.4);
            min-height: 400px;
        }
        .info-placeholder {
            padding: 60px 30px;
            text-align: center;
            color: #8b949e;
        }
        .info-placeholder-icon { font-size: 4rem; margin-bottom: 20px; }
        .info-placeholder h3 { color: #f0f6fc; font-size: 1.4rem; margin-bottom: 10px; }
        .device-details { display: none; }
        .device-details.active { display: block; animation: slideIn 0.3s ease; }
        @keyframes slideIn {
            from { opacity: 0; transform: translateX(20px); }
            to { opacity: 1; transform: translateX(0); }
        }
        .details-header {
            padding: 30px;
            background: linear-gradient(180deg, #21262d 0%, #1a1d23 100%);
            border-bottom: 2px solid var(--accent);
            text-align: center;
        }
        .details-icon { font-size: 3.5rem; margin-bottom: 15px; }
        .details-name { font-size: 1.6rem; font-weight: 700; color: #f0f6fc; margin-bottom: 8px; }
        .details-location { 
            color: #8b949e; 
            font-family: monospace; 
            font-size: 1rem;
            background: rgba(88, 166, 255, 0.1);
            padding: 4px 12px;
            border-radius: 20px;
            display: inline-block;
        }
        .details-content { padding: 30px; }
        .spec-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 16px 0;
            border-bottom: 1px solid #222;
            font-size: 0.95rem;
        }
        .spec-row:last-child { border-bottom: none; }
        .spec-label { color: #8b949e; font-weight: 500; }
        .spec-value { color: #f0f6fc; font-weight: 600; text-align: right; max-width: 60%; }
        .status-section {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 2px solid #222;
            text-align: center;
        }
        .status-badge {
            display: inline-flex;
            align-items: center;
            gap: 10px;
            padding: 10px 20px;
            background: #0d1117;
            border: 1px solid #333;
            border-radius: 25px;
            font-size: 0.9rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .status-dot { width: 10px; height: 10px; border-radius: 50%; }
        .status-dot.online { background: #3fb950; box-shadow: 0 0 10px #3fb950; }
        .status-dot.warning { background: #f0883e; box-shadow: 0 0 10px #f0883e; }
        .close-btn {
            width: calc(100% - 60px);
            margin: 0 30px 30px;
            padding: 14px;
            background: #21262d;
            border: 1px solid var(--border-color);
            color: #c9d1d9;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
            font-size: 1rem;
            transition: all 0.2s;
        }
        .close-btn:hover { 
            background: var(--accent); 
            color: #000; 
            border-color: var(--accent);
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(88, 166, 255, 0.3);
        }
        .type-server { border-left-color: #58a6ff; }
        .type-network { border-left-color: #f85149; }
        .type-storage { border-left-color: #a371f7; }
    </style>
</head>
<body>
    <nav>
        <div class="logo">⚡ MyHomelab</div>
        <div class="nav-links">
            <a href="index.html">Home</a>
            <a href="gear.html" style="color: var(--accent)">Hardware</a>
            <a href="gallery.html">Gallery</a>
            <a href="contact.html">Contact</a>
        </div>
    </nav>
    <div class="page-header">
        <h1>Infrastructure Racks</h1>
        <p>Dual 25U • Compact View • 34px per U</p>
    </div>
    <div class="main-layout">
        <div class="racks-container" id="racksArea">
            <div class="rack-column">
                <div class="rack-title">Rack A — Compute</div>
                <div class="rack-frame" id="rackA">
                    <div class="rail left"></div>
                    <div class="rail right"></div>
                </div>
            </div>
            <div class="rack-column">
                <div class="rack-title">Rack B — Network & Storage</div>
                <div class="rack-frame" id="rackB">
                    <div class="rail left"></div>
                    <div class="rail right"></div>
                </div>
            </div>
        </div>
        <div class="info-panel" id="infoPanel">
            <div class="info-placeholder" id="placeholder">
                <div class="info-placeholder-icon">🖱️</div>
                <h3>Select a Device</h3>
                <p>Click any server to view specifications</p>
            </div>
            <div class="device-details" id="deviceDetails"></div>
        </div>
    </div>
    <script>
        const devices = [
            // Rack A - Compute (with 10U HP BladeCenter)
            { id: 'atlas-01', name: 'Atlas 01', icon: '🖥️', type: 'server', rack: 'A', u: 21, size: 2, status: 'online', specs: {
                'Model': 'HP Proliant DL380 G10', 'CPU': '2x Xeon Gold 6148', 'Memory': '512GB DDR4', 'Storage': '2× 1TB NVMe'
            }},
            { id: 'nas', name: 'TrueNAS', icon: '🥧', type: 'server', rack: 'A', u: 18, size: 1, status: 'online', specs: {
                'Model': 'HP DL360 G9', 'CPU': '2x Xeon Gold', 'Memory': '64GB', 'Network': '10GbE'
            }},
            { id: 'jbod-1', name: 'JBOD 12x3.5', icon: '💻', type: 'server', rack: 'A', u: 16, size: 2, status: 'online', specs: {
                'Model': 'HP MSA60', 'Storage': '12x6TB HDD'
            }},
            { id: 'jbod-2', name: 'JBOD 24x2.5', icon: '💻', type: 'server', rack: 'A', u: 14, size: 2, status: 'online', specs: {
                'Model': 'HP 3Par', 'Storage': '16x600GB'
            }},
            { id: 'jbod-3', name: 'JBOD 24x2.5', icon: '💻', type: 'server', rack: 'A', u: 12, size: 2, status: 'online', specs: {
                'Model': 'HP 3Par',
                'Storage': '24x600GB HDD'
            }},
            // HP BladeCenter - 10U starting at U10 (occupies U10 down to U1)
            { id: 'bladecenter', name: 'HP BladeCenter', icon: '🔷', type: 'server', rack: 'A', u: 10, size: 10, status: 'online', specs: {
                'Model': 'HP C7000',
                'Blades 1': '1x HP BL460 G10',
                'Blades 2': '6x HP BL460 G19',
                'Blades 3': '1x HP BL460 G8',
                'Switches': '2x Virtual Connect',
                'PSU': '6x 2400W'
            }},
            
            // Rack B - Network/Storage
            { id: 'router', name: 'Router', icon: '🛡️', type: 'network', rack: 'B', u: 24, size: 1, status: 'online', specs: {
                'Model': 'Unifi Dreammachine PRO',
                'WAN': '1GBe SFP',
                'LAN': '10GBe SFP +'
            }},
            { id: 'patchpanel-1',name: 'Fiber PatchPanel', icon: '🔌', type: 'network', rack: 'B', u: 23, size: 1, status: 'online', specs: {
                'Model': 'Arista 7050SX'
            }},
            { id: 'switch-1',name: 'Core Switch', icon: '🔌', type: 'network', rack: 'B', u: 22, size: 1, status: 'online', specs: {
                'Model': 'Arista 7050SX',
                'Ports': '48× SFP+ + 4× QSFP'
            }},
            { id: 'patchpanel-2',name: 'RJ45 PatchPanel', icon: '🔌', type: 'network', rack: 'B', u: 21, size: 1, status: 'online', specs: {
                'Model': 'Arista 7050SX'
            }},
            { id: 'switch-2',name: 'RJ45 PoE Switch', icon: '🔌', type: 'network', rack: 'B', u: 20, size: 1, status: 'online', specs: {
                'Model': 'Zyxel 2210-28HP',
                'Ports': '24× GbE POE + 4× SFP+'
            }},
            { id: 'power-1',name: 'UPS-PDU 1', icon: '🔌', type: 'network', rack: 'B', u: 17, size: 1, status: 'online', specs: {
                'Model': 'Zyxel 2210-28HP',
                'Ports': '24× GbE + 4× SFP+'
            }},
            { id: 'power-2',name: 'UPS-PDU 2', icon: '🔌', type: 'network', rack: 'B', u: 15, size: 1, status: 'online', specs: {
                'Model': 'Zyxel 2210-28HP',
                'Ports': '24× GbE + 4× SFP+'
            }},
            { id: 'ups-1', name: 'UPS System', icon: '🔋', type: 'network', rack: 'B', u: 10, size: 4, status: 'online', specs: {
                'Model': 'APC Smart-UPS 3000VA',
                'Capacity': '2700W',
                'Runtime': '~45 min'
            }},
            { id: 'ups-2', name: 'UPS System', icon: '🔋', type: 'network', rack: 'B', u: 4, size: 4, status: 'online', specs: {
                'Model': 'APC Smart-UPS 3000VA',
                'Capacity': '2700W',
                'Runtime': '~45 min'
            }}
        ];

        function init() {
            renderRack('A', 'rackA');
            renderRack('B', 'rackB');
        }

        function renderRack(rackId, elementId) {
            const rackDevices = devices.filter(d => d.rack === rackId).sort((a, b) => b.u - a.u);
            const container = document.getElementById(elementId);
            
            let html = '';
            let currentU = 25;
            
            rackDevices.forEach(device => {
                const deviceTopU = device.u;
                const deviceBottomU = device.u - device.size + 1;
                
                // Fill empty slots above
                while (currentU > deviceTopU) {
                    html += renderEmptySlot(currentU);
                    currentU--;
                }
                
                // Place device
                html += renderDevice(device);
                currentU = deviceBottomU - 1;
            });
            
            // Fill remaining slots
            while (currentU >= 1) {
                html += renderEmptySlot(currentU);
                currentU--;
            }
            
            const rails = '<div class="rail left"></div><div class="rail right"></div>';
            container.innerHTML = rails + html;
        }

        function renderEmptySlot(uNum) {
            return `
                <div class="u-empty">
                    <span class="u-label">U${uNum}</span>
                    <span class="u-label" style="right:-32px;left:auto;text-align:left;">U${uNum}</span>
                </div>
            `;
        }

        function renderDevice(device) {
            const sizeClass = device.size > 1 ? `u-${device.size}` : '';
            const typeClass = `type-${device.type}`;
            const bottomU = device.u - device.size + 1;
            
            // For large devices (6U+), only show top, middle, and bottom labels to avoid crowding
            let leftLabels = '';
            let rightLabels = '';
            
            if (device.size <= 4) {
                // Show all labels for small devices
                for (let i = 0; i < device.size; i++) {
                    const uNum = device.u - i;
                    const topPos = (i * 34) + 17; // 34px per U, centered
                    leftLabels += `<span class="u-label" style="top: ${topPos}px; transform: translateY(-50%);">U${uNum}</span>`;
                    rightLabels += `<span class="u-label" style="right: -32px; left: auto; text-align: left; top: ${topPos}px; transform: translateY(-50%);">U${uNum}</span>`;
                }
            } else {
                // Large devices: show top, middle, and bottom only
                const positions = [0, Math.floor(device.size/2), device.size - 1];
                positions.forEach(i => {
                    const uNum = device.u - i;
                    const topPos = (i * 34) + 17;
                    leftLabels += `<span class="u-label" style="top: ${topPos}px; transform: translateY(-50%); font-size: 0.65rem;">U${uNum}</span>`;
                    rightLabels += `<span class="u-label" style="right: -32px; left: auto; text-align: left; top: ${topPos}px; transform: translateY(-50%); font-size: 0.65rem;">U${uNum}</span>`;
                });
            }
            
            return `
                <div class="rack-unit ${sizeClass} ${typeClass}" id="unit-${device.id}" onclick="selectDevice('${device.id}')">
                    ${leftLabels}
                    ${rightLabels}
                    <div class="unit-led ${device.status}"></div>
                    <div class="unit-icon">${device.icon}</div>
                    <div class="unit-info">
                        <div class="unit-name">${device.name}</div>
                        <div class="unit-meta">U${device.u}${device.size > 1 ? `-${bottomU}` : ''} • ${device.size}U</div>
                    </div>
                    <div class="unit-bezel"></div>
                </div>
            `;
        }

        function selectDevice(deviceId) {
            const device = devices.find(d => d.id === deviceId);
            document.querySelectorAll('.rack-unit').forEach(u => u.classList.remove('selected'));
            document.getElementById(`unit-${deviceId}`).classList.add('selected');
            
            const detailsDiv = document.getElementById('deviceDetails');
            document.getElementById('placeholder').style.display = 'none';
            detailsDiv.style.display = 'block';
            detailsDiv.classList.add('active');
            
            const bottomU = device.u - device.size + 1;
            const specsHtml = Object.entries(device.specs).map(([key, val]) => `
                <div class="spec-row"><span class="spec-label">${key}</span><span class="spec-value">${val}</span></div>
            `).join('');
            
            const statusColor = device.status === 'online' ? 'online' : (device.status === 'warning' ? 'warning' : 'offline');
            
            detailsDiv.innerHTML = `
                <div class="details-header">
                    <div class="details-icon">${device.icon}</div>
                    <div class="details-name">${device.name}</div>
                    <div class="details-location">Rack ${device.rack} • U${device.u}${device.size > 1 ? `-${bottomU}` : ''}</div>
                </div>
                <div class="details-content">
                    ${specsHtml}
                    <div class="status-section">
                        <span class="status-badge">
                            <span class="status-dot ${statusColor}"></span>
                            ${device.status.toUpperCase()}
                        </span>
                    </div>
                </div>
                <button class="close-btn" onclick="clearSelection()">Close Details</button>
            `;
        }

        function clearSelection() {
            document.querySelectorAll('.rack-unit').forEach(u => u.classList.remove('selected'));
            document.getElementById('deviceDetails').style.display = 'none';
            document.getElementById('placeholder').style.display = 'block';
        }

        init();
    </script>
</body>
</html>