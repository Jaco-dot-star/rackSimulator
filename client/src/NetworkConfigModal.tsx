import React, { useState } from 'react';
import { X, Network, Server } from 'lucide-react';

export default function NetworkConfigModal({ onClose, onCreated }: { onClose: () => void, onCreated: () => void }) {
  const [dbRacks, setDbRacks] = useState<any[]>([]);
  const [selectedRack, setSelectedRack] = useState<any>(null);
  const [ip, setIp] = useState('127.0.0.1');
  const [port, setPort] = useState('1611');
  const [protocol, setProtocol] = useState('both');
  const [error, setError] = useState('');

  // Generate pool of 20 IPs and 20 Ports
  const ips = Array.from({ length: 20 }, (_, i) => `127.0.0.${i + 1}`);
  const ports = Array.from({ length: 20 }, (_, i) => `${1611 + i}`);

  React.useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL || `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}`}/api/db/racks`)
      .then(res => res.json())
      .then(data => {
        setDbRacks(data);
        if (data.length > 0) setSelectedRack(data[0]);
      })
      .catch(err => setError('Failed to fetch real racks from DB: ' + err.message));
  }, []);

  const handleCreate = async () => {
    if (!selectedRack) {
      setError('Please select a rack from the database.');
      return;
    }
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}`}/api/racks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id: selectedRack.id, 
          facility_id: selectedRack.facility_id, 
          ip, 
          port, 
          protocol 
        })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create rack');
      }
      onCreated();
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="bg-slate-800 p-4 flex justify-between items-center border-b border-slate-700">
          <h2 className="text-lg font-semibold flex items-center gap-2 text-slate-50">
            <Network size={18} className="text-blue-400" />
            Network Pool Manager
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {error && <div className="bg-red-500/20 text-red-400 p-3 rounded text-sm border border-red-500/50">{error}</div>}

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Target Rack (from dcimMonitoring DB)</label>
            <div className="relative">
              <Server size={16} className="absolute left-3 top-3 text-slate-500" />
              <select 
                value={selectedRack?.id || ''}
                onChange={e => {
                  const rack = dbRacks.find(r => r.id === e.target.value);
                  setSelectedRack(rack);
                }}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2 pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-200 font-mono"
              >
                {dbRacks.length === 0 ? <option value="">Loading racks...</option> : null}
                {dbRacks.map(rack => (
                  <option key={rack.id} value={rack.id}>{rack.label || rack.id.substring(0, 8)}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">IP Address (Pool)</label>
              <select 
                value={ip}
                onChange={e => setIp(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-200 font-mono"
              >
                {ips.map(ip => <option key={ip} value={ip}>{ip}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">SNMP Port (Pool)</label>
              <select 
                value={port}
                onChange={e => setPort(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-200 font-mono"
              >
                {ports.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Reporting Protocol</label>
            <div className="flex gap-2">
              <label className="flex-1 flex items-center justify-center gap-2 p-2 rounded-lg border border-slate-700 cursor-pointer hover:bg-slate-800 transition-colors bg-slate-950">
                <input type="radio" name="protocol" value="mqtt" checked={protocol === 'mqtt'} onChange={() => setProtocol('mqtt')} className="accent-blue-500" />
                <span className="text-sm">MQTT Only</span>
              </label>
              <label className="flex-1 flex items-center justify-center gap-2 p-2 rounded-lg border border-slate-700 cursor-pointer hover:bg-slate-800 transition-colors bg-slate-950">
                <input type="radio" name="protocol" value="snmp" checked={protocol === 'snmp'} onChange={() => setProtocol('snmp')} className="accent-blue-500" />
                <span className="text-sm">SNMP Only</span>
              </label>
              <label className="flex-1 flex items-center justify-center gap-2 p-2 rounded-lg border border-slate-700 cursor-pointer hover:bg-slate-800 transition-colors bg-slate-950">
                <input type="radio" name="protocol" value="both" checked={protocol === 'both'} onChange={() => setProtocol('both')} className="accent-blue-500" />
                <span className="text-sm">Both</span>
              </label>
            </div>
          </div>
        </div>

        <div className="p-4 bg-slate-800 border-t border-slate-700 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-slate-100 transition-colors">
            Cancel
          </button>
          <button onClick={handleCreate} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors shadow-lg shadow-blue-500/20">
            Allocate Virtual Rack
          </button>
        </div>
      </div>
    </div>
  );
}
