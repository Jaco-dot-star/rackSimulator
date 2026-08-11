import React, { useState, useEffect } from 'react';
import { SlidersHorizontal, Thermometer, Droplets, Zap, Battery } from 'lucide-react';

export default function ControlPanel({ rack, onUpdate }: { rack: any, onUpdate: () => void }) {
  const [localState, setLocalState] = useState(rack.state);

  useEffect(() => {
    setLocalState(rack.state);
  }, [rack]);

  // Debounced update to backend
  useEffect(() => {
    const timer = setTimeout(() => {
      // Check if state changed to avoid unnecessary API calls on first render
      if (JSON.stringify(localState) !== JSON.stringify(rack.state)) {
        fetch(`${import.meta.env.VITE_API_URL || `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}`}/api/racks/${rack.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ state: localState })
        }).then(() => onUpdate());
      }
    }, 500); // 500ms debounce
    return () => clearTimeout(timer);
  }, [localState, rack.id]);

  const handleChange = (field: string, value: number) => {
    setLocalState((prev: any) => ({ ...prev, [field]: value }));
  };

  const controls = [
    { id: 'inlet_temp', label: 'Inlet Temp', unit: '°C', min: 10, max: 50, icon: <Thermometer size={16} className="text-blue-400" /> },
    { id: 'outlet_temp', label: 'Outlet Temp', unit: '°C', min: 15, max: 60, icon: <Thermometer size={16} className="text-orange-400" /> },
    { id: 'humidity', label: 'Humidity', unit: '%', min: 0, max: 100, icon: <Droplets size={16} className="text-cyan-400" /> },
    { id: 'power_kw', label: 'Power Draw', unit: 'kW', min: 0, max: 20, icon: <Zap size={16} className="text-yellow-400" /> },
    { id: 'current', label: 'Current', unit: 'A', min: 0, max: 32, icon: <Zap size={16} className="text-purple-400" /> },
    { id: 'ups_load_pct', label: 'UPS Load', unit: '%', min: 0, max: 100, icon: <Battery size={16} className="text-emerald-400" /> },
  ];

  return (
    <div className="flex flex-col h-full">
      <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
        <SlidersHorizontal size={18} className="text-emerald-400" />
        Sensor Controls
      </h2>

      <div className="space-y-6 flex-1 overflow-y-auto pr-2 custom-scrollbar">
        {controls.map(ctrl => (
          <div key={ctrl.id} className="bg-slate-800/50 p-4 rounded-lg border border-slate-700 hover:border-slate-600 transition-colors">
            <div className="flex justify-between items-center mb-2">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
                {ctrl.icon}
                {ctrl.label}
              </label>
              <span className="font-mono text-sm bg-slate-900 px-2 py-1 rounded text-slate-200 border border-slate-700">
                {localState[ctrl.id]}{ctrl.unit}
              </span>
            </div>
            <input 
              type="range" 
              min={ctrl.min} 
              max={ctrl.max} 
              value={localState[ctrl.id]}
              onChange={(e) => handleChange(ctrl.id, Number(e.target.value))}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>
        ))}
        
        {/* Voltage Input (Number) */}
        <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
          <div className="flex justify-between items-center mb-2">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
              <Zap size={16} className="text-pink-400" />
              Voltage
            </label>
          </div>
          <div className="flex items-center gap-2">
            <input 
              type="number" 
              min={110} 
              max={240} 
              value={localState.voltage}
              onChange={(e) => handleChange('voltage', Number(e.target.value))}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            />
            <span className="text-slate-400 font-mono">V</span>
          </div>
        </div>
      </div>
    </div>
  );
}
