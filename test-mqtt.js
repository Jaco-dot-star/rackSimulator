const mqtt = require('mqtt');
const client = mqtt.connect('mqtt://test.mosquitto.org:1883');
client.on('connect', () => {
    const payload = {
        facility_id: "6f6e160f-d560-4424-8fa3-cce0995b6cec",
        rack_id: "7969edcd-f0bd-43e0-abf9-4656df580e22",
        sensor_type: "inlet_temp",
        value: 99.9,
        timestamp: new Date().toISOString()
    };
    client.publish('dcim/telemetry/7969edcd-f0bd-43e0-abf9-4656df580e22', JSON.stringify(payload), () => {
        console.log("Published MQTT message manually");
        setTimeout(() => process.exit(0), 1000);
    });
});
