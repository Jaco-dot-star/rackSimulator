import { X, BookOpen, Database, Radio, AlertTriangle } from 'lucide-react';

export default function ConnectionGuideModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="bg-slate-800 p-4 flex justify-between items-center border-b border-slate-700 shrink-0">
          <h2 className="text-lg font-semibold flex items-center gap-2 text-slate-50">
            <BookOpen size={18} className="text-indigo-400" />
            Integration & Connection Guide
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
          <p className="text-slate-300 text-sm">
            This simulator allows external projects (like a DCIM system) to read live sensor data. Depending on where this simulator is hosted, you have different connection options.
          </p>

          {/* MQTT Section */}
          <div className="bg-slate-800/50 rounded-lg border border-slate-700 p-4">
            <h3 className="text-md font-semibold text-blue-400 flex items-center gap-2 mb-3">
              <Radio size={16} />
              Method 1: MQTT (Recommended)
            </h3>
            <p className="text-slate-400 text-sm mb-3">
              The simulator streams live data out to a public MQTT broker instantly whenever a sensor value changes.
            </p>
            <div className="bg-slate-950 p-3 rounded font-mono text-xs text-slate-300 space-y-2">
              <div className="flex gap-2"><span className="text-slate-500">Broker URL:</span> <span className="text-emerald-400">mqtt://test.mosquitto.org:1883</span></div>
              <div className="flex gap-2"><span className="text-slate-500">Topic:</span> <span className="text-emerald-400">dcim/telemetry/&lt;RACK_ID&gt;</span></div>
            </div>
            <p className="text-slate-400 text-sm mt-3 italic">
              Your other project just needs an MQTT client to subscribe to that topic to receive real-time JSON payloads.
            </p>
          </div>

          {/* Database Section */}
          <div className="bg-slate-800/50 rounded-lg border border-slate-700 p-4">
            <h3 className="text-md font-semibold text-emerald-400 flex items-center gap-2 mb-3">
              <Database size={16} />
              Method 2: Direct Database Read
            </h3>
            <p className="text-slate-400 text-sm mb-3">
              The backend constantly writes telemetry history into a PostgreSQL database. Your project can connect directly to this database and run SELECT queries on the <code>reading</code> table.
            </p>
            <p className="text-slate-400 text-sm italic">
              Note: You will need the DATABASE_URL of the database where this simulator is deployed. Ask the administrator for the connection string.
            </p>
          </div>

          {/* SNMP Warning */}
          <div className="bg-orange-500/10 rounded-lg border border-orange-500/30 p-4">
            <h3 className="text-md font-semibold text-orange-400 flex items-center gap-2 mb-2">
              <AlertTriangle size={16} />
              Important Note on SNMP (IP & Port)
            </h3>
            <p className="text-orange-200/80 text-sm">
              If this simulator is hosted on a serverless platform (like <strong>Render</strong> or <strong>Heroku</strong>), it is impossible to connect via SNMP using an IP address and Port (e.g. 127.0.0.1:1611). Cloud platforms block custom UDP traffic. To use SNMP polling, you must host this simulator on a Virtual Private Server (VPS) or locally.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
