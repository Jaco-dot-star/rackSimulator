
export default function RackVisualizer({ state }: { state: any }) {
  // A flat, 1D straight-on view of a server rack
  
  // We'll simulate 5 rack units with varying U-sizes
  const servers = [
    { id: 1, type: 'network', status: 'ok', size: '1U' },
    { id: 2, type: 'compute', status: state.inlet_temp > 35 ? 'warning' : 'ok', size: '2U' },
    { id: 3, type: 'compute', status: state.power_kw > 15 ? 'danger' : 'ok', size: '2U' },
    { id: 4, type: 'storage', status: 'ok', size: '4U' },
    { id: 5, type: 'power', status: state.ups_load_pct > 80 ? 'warning' : 'ok', size: '1U' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'warning': return 'bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.8)]';
      case 'danger': return 'bg-red-500 shadow-[0_0_12px_rgba(239,68,68,1)]';
      default: return 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]';
    }
  };
  
  const getHeight = (size: string) => {
    switch (size) {
      case '1U': return 'h-10';
      case '2U': return 'h-20';
      case '4U': return 'h-32';
      default: return 'h-10';
    }
  };

  return (
    <div className="w-full h-full flex items-center justify-center py-8 relative">
      <div className="relative w-72 bg-slate-900 border-8 border-slate-800 rounded-sm shadow-2xl flex flex-col p-1 gap-1">
        
        {/* Left and Right Rack Rails */}
        <div className="absolute -left-2 top-0 bottom-0 w-2 bg-slate-700/50 flex flex-col justify-evenly items-center">
          {[...Array(20)].map((_, i) => <div key={i} className="w-1 h-1 rounded-full bg-slate-900"></div>)}
        </div>
        <div className="absolute -right-2 top-0 bottom-0 w-2 bg-slate-700/50 flex flex-col justify-evenly items-center">
          {[...Array(20)].map((_, i) => <div key={i} className="w-1 h-1 rounded-full bg-slate-900"></div>)}
        </div>
        
        {servers.map((server) => (
          <div 
            key={server.id}
            className={`relative w-full ${getHeight(server.size)} bg-gradient-to-b from-slate-700 to-slate-800 border-2 border-slate-600 rounded flex items-center px-4 group hover:from-slate-600 hover:to-slate-700 transition-colors cursor-default overflow-hidden`}
          >
            {/* Rack Mount Ears */}
            <div className="absolute left-0 top-0 bottom-0 w-2 bg-slate-500/20 border-r border-slate-600"></div>
            <div className="absolute right-0 top-0 bottom-0 w-2 bg-slate-500/20 border-l border-slate-600"></div>

            {/* Blinking Status Light */}
            <div className={`w-3 h-3 rounded-full ml-1 ${getStatusColor(server.status)}`}></div>
            
            <span className="ml-4 text-xs font-mono text-slate-300 font-semibold tracking-wider opacity-80">
              {server.type.toUpperCase()}
            </span>
            
            {/* Front Panel details (Grill) */}
            <div className="ml-auto flex flex-col gap-1 pr-2">
              <div className="w-12 h-1 bg-slate-900/60 rounded-full"></div>
              <div className="w-12 h-1 bg-slate-900/60 rounded-full"></div>
              <div className="w-12 h-1 bg-slate-900/60 rounded-full"></div>
            </div>
            
            {/* Tooltip on Hover */}
             <div className="absolute left-full ml-4 top-1/2 -translate-y-1/2 bg-slate-950 text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-slate-800 text-slate-300 pointer-events-none z-10 shadow-lg">
                Unit {server.id} - {server.size}
            </div>
          </div>
        ))}
      </div>

      {/* Floating Temp/Power Overlay */}
      <div className="absolute top-4 right-4 flex flex-col gap-2">
        <div className="bg-slate-900/80 backdrop-blur border border-slate-700 p-2 rounded text-xs flex justify-between items-center w-32 shadow-lg">
          <span className="text-slate-400">Temp</span>
          <span className="font-mono text-blue-400">{state.inlet_temp}°C</span>
        </div>
        <div className="bg-slate-900/80 backdrop-blur border border-slate-700 p-2 rounded text-xs flex justify-between items-center w-32 shadow-lg">
          <span className="text-slate-400">Power</span>
          <span className="font-mono text-emerald-400">{state.power_kw}kW</span>
        </div>
      </div>
    </div>
  );
}
