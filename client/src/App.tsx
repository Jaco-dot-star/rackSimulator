import { useState, useEffect } from 'react';
import RackVisualizer from './RackVisualizer';
import ControlPanel from './ControlPanel';
import VerificationPanel from './VerificationPanel';
import NetworkConfigModal from './NetworkConfigModal';
import { Settings, Server, Activity } from 'lucide-react';

export default function App() {
  const [activeRackId, setActiveRackId] = useState<string | null>(null);
  const [showConfig, setShowConfig] = useState(false);
  const [racks, setRacks] = useState<any[]>([]);

  const fetchRacks = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}`}/api/racks`);
      const data = await res.json();
      setRacks(data);
      if (data.length > 0) {
        setActiveRackId(prev => prev || data[0].id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchRacks();
    const interval = setInterval(fetchRacks, 5000);
    return () => clearInterval(interval);
  }, []);

  const activeRack = racks.find(r => r.id === activeRackId);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex flex-col font-sans">
      <header className="bg-slate-900 border-b border-slate-800 p-4 flex justify-between items-center shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/20 rounded-lg border border-blue-500/30">
            <Server className="text-blue-400" size={24} />
          </div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
            Hardware Simulator
          </h1>
        </div>
        <button 
          onClick={() => setShowConfig(true)}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700 text-sm font-medium"
        >
          <Settings size={16} />
          New Virtual Rack
        </button>
      </header>

      <main className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-hidden">
        {/* Left Column: Visualizer & Selector */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col shadow-xl flex-1 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Activity size={18} className="text-blue-400" />
              Active Rack View
            </h2>
            
            {racks.length > 0 ? (
              <div className="mb-4 flex items-center gap-2">
                <select 
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={activeRackId || ''}
                  onChange={(e) => setActiveRackId(e.target.value)}
                >
                  {racks.map(r => (
                    <option key={r.id} value={r.id}>{r.id} - {r.protocol.toUpperCase()}</option>
                  ))}
                </select>
                
                <button
                  onClick={async () => {
                    if (!activeRackId) return;
                    if (!confirm("Are you sure you want to delete this simulated rack and clear its data?")) return;
                    try {
                      await fetch(`${import.meta.env.VITE_API_URL || `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}`}/api/racks/${activeRackId}`, { method: 'DELETE' });
                      setActiveRackId(null);
                      fetchRacks();
                    } catch (e) {
                      console.error("Failed to delete rack:", e);
                    }
                  }}
                  className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg transition-colors"
                  title="Delete Rack"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                </button>
              </div>
            ) : (
              <div className="mb-4 p-3 bg-slate-800/50 border border-slate-700/50 rounded-lg text-sm text-slate-400">
                No virtual racks running. Create one to begin.
              </div>
            )}

            <div className="flex-1 min-h-[300px] flex items-center justify-center bg-slate-950/50 rounded-lg border border-slate-800/80 overflow-hidden relative">
              {activeRack ? (
                <>
                  <RackVisualizer state={activeRack.state} />
                  {/* IP and Port overlay */}
                  <div className="absolute top-4 left-4 flex flex-col gap-2">
                    <div className={`bg-slate-900/90 backdrop-blur border ${activeRack.ip_enabled !== false ? 'border-slate-600' : 'border-red-900/50'} p-2 rounded shadow-lg flex items-center gap-3 transition-colors`}>
                      <div className="flex flex-col">
                        <span className="text-[10px] uppercase font-bold text-slate-500 mb-1 tracking-wider">IP Address</span>
                        <input 
                          type="text"
                          value={activeRack.ip}
                          onChange={(e) => {
                            const newRacks = [...racks];
                            const idx = newRacks.findIndex(r => r.id === activeRack.id);
                            if (idx > -1) newRacks[idx].ip = e.target.value;
                            setRacks(newRacks);
                          }}
                          onBlur={(e) => {
                            fetch(`${import.meta.env.VITE_API_URL || `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}`}/api/racks/${activeRack.id}`, {
                              method: 'PUT',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ ip: e.target.value })
                            }).then(fetchRacks);
                          }}
                          disabled={activeRack.ip_enabled === false}
                          className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs font-mono text-blue-300 focus:outline-none focus:border-blue-500 w-32 disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                      </div>
                      <button 
                        onClick={() => {
                          fetch(`${import.meta.env.VITE_API_URL || `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}`}/api/racks/${activeRack.id}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ ip_enabled: activeRack.ip_enabled === false ? true : false })
                          }).then(fetchRacks);
                        }}
                        className={`w-10 h-5 rounded-full relative transition-colors ${activeRack.ip_enabled !== false ? 'bg-blue-500' : 'bg-slate-700'}`}
                        title="Toggle Network Interface"
                      >
                        <div className={`w-3 h-3 bg-white rounded-full absolute top-1 transition-all ${activeRack.ip_enabled !== false ? 'left-6' : 'left-1'}`}></div>
                      </button>
                    </div>

                    <div className={`bg-slate-900/90 backdrop-blur border ${activeRack.port_enabled !== false ? 'border-slate-600' : 'border-red-900/50'} p-2 rounded shadow-lg flex items-center gap-3 transition-colors`}>
                      <div className="flex flex-col">
                        <span className="text-[10px] uppercase font-bold text-slate-500 mb-1 tracking-wider">SNMP Port</span>
                        <input 
                          type="text"
                          value={activeRack.port}
                          onChange={(e) => {
                            const newRacks = [...racks];
                            const idx = newRacks.findIndex(r => r.id === activeRack.id);
                            if (idx > -1) newRacks[idx].port = e.target.value;
                            setRacks(newRacks);
                          }}
                          onBlur={(e) => {
                            fetch(`${import.meta.env.VITE_API_URL || `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}`}/api/racks/${activeRack.id}`, {
                              method: 'PUT',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ port: e.target.value })
                            }).then(fetchRacks);
                          }}
                          disabled={activeRack.port_enabled === false}
                          className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs font-mono text-orange-300 focus:outline-none focus:border-orange-500 w-32 disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                      </div>
                      <button 
                        onClick={() => {
                          fetch(`${import.meta.env.VITE_API_URL || `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}`}/api/racks/${activeRack.id}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ port_enabled: activeRack.port_enabled === false ? true : false })
                          }).then(fetchRacks);
                        }}
                        className={`w-10 h-5 rounded-full relative transition-colors ${activeRack.port_enabled !== false ? 'bg-orange-500' : 'bg-slate-700'}`}
                        title="Toggle SNMP Port"
                      >
                        <div className={`w-3 h-3 bg-white rounded-full absolute top-1 transition-all ${activeRack.port_enabled !== false ? 'left-6' : 'left-1'}`}></div>
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-slate-500 flex flex-col items-center">
                  <Server size={48} className="opacity-20 mb-2" />
                  <span>Waiting for rack allocation...</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Middle Column: Control Panel */}
        <div className="lg:col-span-4 flex flex-col">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex-1 shadow-xl relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-500"></div>
            {activeRack ? (
              <ControlPanel rack={activeRack} onUpdate={fetchRacks} />
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500">Select a rack to control sensors.</div>
            )}
          </div>
        </div>

        {/* Right Column: Database Verification */}
        <div className="lg:col-span-4 flex flex-col">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-0 flex-1 shadow-xl relative overflow-hidden flex flex-col">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-pink-500 z-10"></div>
            {activeRack ? (
              <VerificationPanel rackId={activeRack.id} />
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500">Awaiting telemetry...</div>
            )}
          </div>
        </div>
      </main>

      {showConfig && (
        <NetworkConfigModal 
          onClose={() => setShowConfig(false)} 
          onCreated={() => {
            setShowConfig(false);
            fetchRacks();
          }} 
        />
      )}
    </div>
  );
}
