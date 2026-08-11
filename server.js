require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mqtt = require('mqtt');
const { Pool } = require('pg');
const snmp = require('net-snmp');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;

// MQTT Client
const mqttClient = mqtt.connect(process.env.MQTT_BROKER);
mqttClient.on('connect', () => {
    console.log('Connected to MQTT Broker:', process.env.MQTT_BROKER);
});

// Postgres Connection
const pgPool = new Pool({
    connectionString: process.env.DATABASE_URL,
});
pgPool.connect().then(() => console.log('Connected to Postgres')).catch(err => console.error('Postgres Connection Error', err));

// State Management for Virtual Racks
// rack: { id, ip, port, protocol: 'mqtt'|'snmp'|'both', state: { inlet_temp: 22, ... } }
const virtualRacks = new Map();
const snmpAgents = new Map();

// Default values for a rack
const DEFAULT_STATE = {
    inlet_temp: 22,
    outlet_temp: 35,
    humidity: 45,
    power_kw: 5,
    voltage: 230,
    current: 10,
    ups_load_pct: 40
};

// SNMP OID mapping based on plan
const OID_MAPPING = {
    '1.3.6.1.4.1.318.1.1.1.2.2.2.0': 'inlet_temp',
    '1.3.6.1.4.1.318.1.1.1.2.2.3.0': 'outlet_temp',
    '1.3.6.1.4.1.318.1.1.1.2.2.4.0': 'humidity',
    '1.3.6.1.4.1.318.1.1.1.4.2.3.0': 'power_kw',
    '1.3.6.1.4.1.318.1.1.1.4.2.2.0': 'voltage',
    '1.3.6.1.4.1.318.1.1.1.4.2.4.0': 'current',
    '1.3.6.1.4.1.318.1.1.1.4.2.5.0': 'ups_load_pct'
};

function createSnmpAgent(rackId, ip, port) {
    try {
        const agent = snmp.createAgent({
            port: port,
            address: ip,
            disableAuthorization: true,
            community: 'public'
        });

        // Add public community to authorizer if required by net-snmp
        try {
            agent.getAuthorizer().addCommunity("public");
        } catch (e) { /* ignore if already exists or method differs */ }

        agent.getMib().addProvider({
            name: "rackProvider",
            type: snmp.MibProviderType.Scalar,
            oid: "1.3.6.1.4.1.318",
            scalarType: snmp.ObjectType.Integer,
            handler: function (mibRequest) {
                const rack = virtualRacks.get(rackId);
                if (!rack) {
                    mibRequest.done(snmp.ErrorStatus.NoSuchName);
                    return;
                }
                const oid = mibRequest.oidString;
                const field = OID_MAPPING[oid];
                
                if (field && rack.state[field] !== undefined) {
                    let value = rack.state[field];
                    mibRequest.done(snmp.ErrorStatus.Success, Math.round(value));
                } else {
                    mibRequest.done(snmp.ErrorStatus.NoSuchName);
                }
            }
        });

        snmpAgents.set(rackId, agent);
        console.log(`SNMP Agent started for rack ${rackId} at ${ip}:${port}`);
    } catch (e) {
        console.error(`Failed to start SNMP agent for rack ${rackId} at ${ip}:${port}`, e);
    }
}

function stopSnmpAgent(rackId) {
    const agent = snmpAgents.get(rackId);
    if (agent) {
        try { agent.close(); } catch(e) {}
        snmpAgents.delete(rackId);
        console.log(`SNMP Agent stopped for rack ${rackId}`);
    }
}

// REST Endpoints
app.get('/api/racks', (req, res) => {
    const safeRacks = Array.from(virtualRacks.values()).map(r => {
        const { snmpInterval, ...safeRack } = r;
        return safeRack;
    });
    res.json(safeRacks);
});

const unitMap = {
    'inlet_temp': 'celsius',
    'outlet_temp': 'celsius',
    'humidity': 'percent',
    'power_kw': 'kw',
    'voltage': 'volt',
    'current': 'amp',
    'ups_load_pct': 'percent'
};

function insertSimulatedReading(rack, sensor_type, value, source_tier) {
    const query = `
        INSERT INTO reading (facility_id, rack_id, sensor_type, value, unit, source_tier, timestamp)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
    `;
    pgPool.query(query, [
        rack.facility_id, rack.id, sensor_type, value, unitMap[sensor_type] || 'percent', source_tier, new Date().toISOString()
    ]).catch(err => console.error("Simulated Ingest Error:", err));
}

app.post('/api/racks', (req, res) => {
    const { id, facility_id, ip, port, protocol } = req.body;
    if (virtualRacks.has(id)) {
        return res.status(400).json({ error: 'Rack already exists' });
    }

    const rack = {
        id,
        facility_id,
        ip,
        port: parseInt(port, 10),
        protocol,
        ip_enabled: true,
        port_enabled: true,
        state: { ...DEFAULT_STATE }
    };

    virtualRacks.set(id, rack);

    if (protocol === 'snmp' || protocol === 'both') {
        createSnmpAgent(id, ip, rack.port);
        
        // Simulate SNMP polling every 30 seconds
        rack.snmpInterval = setInterval(() => {
            if (rack.port_enabled === false) return; // Simulate port being down
            for (const [key, value] of Object.entries(rack.state)) {
                insertSimulatedReading(rack, key, value, 'api_snmp');
            }
        }, 30000);
    }

    const { snmpInterval, ...safeRack } = rack;
    res.status(201).json(safeRack);
});

app.put('/api/racks/:id', (req, res) => {
    const rack = virtualRacks.get(req.params.id);
    if (!rack) return res.status(404).json({ error: 'Rack not found' });

    const { state, ip, port, ip_enabled, port_enabled } = req.body;
    
    let needsSnmpRestart = false;
    let snmpShouldRun = rack.port_enabled;

    // Update network settings if provided
    if (ip !== undefined && ip !== rack.ip) {
        rack.ip = ip;
        needsSnmpRestart = true;
    }
    if (port !== undefined && parseInt(port, 10) !== rack.port) {
        rack.port = parseInt(port, 10);
        needsSnmpRestart = true;
    }
    if (port_enabled !== undefined && port_enabled !== rack.port_enabled) {
        rack.port_enabled = port_enabled;
        snmpShouldRun = port_enabled;
        needsSnmpRestart = true;
    }
    if (ip_enabled !== undefined) rack.ip_enabled = ip_enabled;

    if (needsSnmpRestart && (rack.protocol === 'snmp' || rack.protocol === 'both')) {
        stopSnmpAgent(rack.id);
        if (snmpShouldRun) {
            createSnmpAgent(rack.id, rack.ip, rack.port);
        }
    }

    if (state) {
        // Determine which fields actually changed
        const changedFields = {};
        for (const [key, value] of Object.entries(state)) {
            if (rack.state[key] !== value) {
                changedFields[key] = value;
            }
        }

        rack.state = { ...rack.state, ...state };

        // If MQTT, publish immediately AND simulate DB insertion
        // ONLY if the IP is currently enabled (simulating network link UP)
        if ((rack.protocol === 'mqtt' || rack.protocol === 'both') && rack.ip_enabled !== false) {
            for (const [key, value] of Object.entries(changedFields)) {
                const payload = {
                    facility_id: rack.facility_id,
                    rack_id: rack.id,
                    sensor_type: key,
                    value: value,
                    timestamp: new Date().toISOString()
                };
                mqttClient.publish(`dcim/telemetry/${rack.id}`, JSON.stringify(payload));
                
                // Directly insert to Postgres to simulate dcim-ingest worker
                insertSimulatedReading(rack, key, value, 'mqtt_iot');
            }
        }
    }

    virtualRacks.set(req.params.id, rack);
    const { snmpInterval, ...safeRack } = rack;
    res.json(safeRack);
});

app.delete('/api/racks/:id', async (req, res) => {
    const rackId = req.params.id;
    const rack = virtualRacks.get(rackId);
    
    if (!rack) return res.status(404).json({ error: 'Rack not found' });

    // Stop SNMP polling if active
    if (rack.snmpInterval) {
        clearInterval(rack.snmpInterval);
    }
    
    // Physically close the SNMP port
    stopSnmpAgent(rackId);

    // Remove from in-memory store
    virtualRacks.delete(rackId);

    // Erase simulated readings from database
    try {
        await pgPool.query('DELETE FROM reading WHERE rack_id = $1', [rackId]);
    } catch (err) {
        console.error("Failed to delete rack data from DB:", err);
    }

    res.status(200).json({ success: true });
});

app.get('/api/db/racks', async (req, res) => {
    try {
        const result = await pgPool.query('SELECT id, label, facility_id FROM rack');
        res.json(result.rows);
    } catch (error) {
        console.error('Failed to fetch real racks:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/verify/:rackId', async (req, res) => {
    try {
        const { rackId } = req.params;
        const query = `
            SELECT id, sensor_type, value, unit, source_tier, timestamp 
            FROM reading 
            WHERE rack_id = $1 
            ORDER BY timestamp DESC 
            LIMIT 10
        `;
        const result = await pgPool.query(query, [rackId]);
        res.json(result.rows);
    } catch (error) {
        console.error('Verify error:', error);
        res.status(500).json({ error: 'Failed to fetch from DB', details: error.message });
    }
});

app.get('/api/ping', (req, res) => res.status(200).send('pong'));

// Keep-alive mechanism for Render
const KEEP_ALIVE_URL = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;
setInterval(() => {
    fetch(`${KEEP_ALIVE_URL}/api/ping`).catch(err => console.error('Keep-alive ping failed:', err.message));
}, 30000); // 30 seconds

app.listen(PORT, () => {
    console.log(`Simulator Controller running on port ${PORT}`);
});
