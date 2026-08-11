import { useState, useEffect } from 'react';
import { Database, CheckCircle2, Clock } from 'lucide-react';

export default function VerificationPanel({ rackId }: { rackId: string }) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastPolled, setLastPolled] = useState<Date>(new Date());

  useEffect(() => {
    let isMounted = true;
    
    const fetchVerifyData = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}`}/api/verify/${rackId}`);
        const dbRows = await res.json();
        if (isMounted) {
          if (Array.isArray(dbRows)) {
            setData(dbRows);
          } else {
            console.error('DB fetch returned error:', dbRows);
            setData([]); // fallback to empty array to prevent crash
          }
          setLastPolled(new Date());
          setLoading(false);
        }
      } catch (e) {
        console.error('Verify error', e);
      }
    };

    fetchVerifyData();
    const interval = setInterval(fetchVerifyData, 2000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [rackId]);

  return (
    <div className="flex flex-col h-full p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Database size={18} className="text-purple-400" />
          Live DB Sync
        </h2>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Clock size={12} />
          {lastPolled.toLocaleTimeString()}
        </div>
      </div>

      <div className="flex-1 bg-slate-950 rounded-lg border border-slate-800 p-4 overflow-y-auto custom-scrollbar font-mono text-sm relative">
        {loading ? (
          <div className="flex h-full items-center justify-center text-slate-500">
            Querying dcimMonitoring database...
          </div>
        ) : data.length === 0 ? (
          <div className="flex flex-col h-full items-center justify-center text-slate-500 gap-2">
            <Database size={32} className="opacity-20" />
            <p>No telemetry found for this rack.</p>
            <p className="text-xs text-slate-600 text-center px-4">Move sliders or ensure dcim-ingest is running.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {data.map((row: any, i: number) => (
              <div key={i} className="flex flex-col gap-1 p-3 bg-slate-900 border border-slate-800 rounded group hover:border-slate-700 transition-colors">
                <div className="flex justify-between text-xs text-slate-400 border-b border-slate-800 pb-1 mb-1">
                  <span className="flex items-center gap-1"><CheckCircle2 size={12} className="text-emerald-500" /> INSERT OK</span>
                  <span>{new Date(row.timestamp).toLocaleTimeString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-300">{row.sensor_type}</span>
                  <span className="text-emerald-300 font-bold">{row.value} {row.unit}</span>
                </div>
                {/* raw JSON view */}
                <div className="text-[10px] text-slate-600 break-all mt-1 hidden group-hover:block transition-all">
                  {JSON.stringify(row)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
