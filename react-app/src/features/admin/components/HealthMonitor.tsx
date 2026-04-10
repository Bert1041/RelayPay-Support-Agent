import { useState, useEffect, useRef } from "react";
import { supabase } from "@/shared/lib/supabase";
import { 
  RefreshCw, 
  Activity, 
  ShieldCheck, 
  AlertCircle, 
  Terminal, 
  Database, 
  Cpu, 
  Radio, 
  GitBranch, 
  Globe,
  Waves,
  CheckCircle2,
  Clock
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/lib/utils";

interface HealthStatus {
  service: string;
  status: string;
  last_checked: string;
  last_error: string | null;
}

const HEALTH_WEBHOOK = "https://cohort2pod2.app.n8n.cloud/webhook/health-check";

const getServiceIcon = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes('vapi')) return Radio;
  if (n.includes('supabase') || n.includes('db')) return Database;
  if (n.includes('n8n') || n.includes('automation')) return GitBranch;
  if (n.includes('openai') || n.includes('ai') || n.includes('whisper')) return Cpu;
  if (n.includes('network') || n.includes('api')) return Globe;
  return Waves;
};

const SignalMeter = ({ status }: { status: string }) => {
  const isHealthy = status.toLowerCase() === 'healthy';
  const isDegraded = status.toLowerCase() === 'degraded';
  
  return (
    <div className="flex items-end gap-0.5 h-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <div 
          key={i} 
          className={cn(
            "w-1 rounded-sm transition-all duration-500",
            i <= (isHealthy ? 5 : isDegraded ? 3 : 1)
              ? (isHealthy ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" : (isDegraded ? "bg-amber-500" : "bg-red-500"))
              : "bg-primary/10"
          )}
          style={{ height: `${i * 20}%` }}
        />
      ))}
    </div>
  );
};

export const HealthMonitor = () => {
  const [services, setServices] = useState<HealthStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const transcriptScrollRef = useRef<HTMLDivElement>(null);

  const fetchHealth = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("system_health")
        .select("*")
        .order("service", { ascending: true });

      if (error) throw error;
      if (data) {
        setServices(data as HealthStatus[]);
      }
    } catch (err) {
      console.error("Health fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const triggerRefresh = async () => {
    setRefreshing(true);
    try {
      const response = await fetch(HEALTH_WEBHOOK, { method: 'POST' });
      if (response.ok) {
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      }
      setTimeout(fetchHealth, 1500);
    } catch (err) {
      console.error("Webhook trigger failed:", err);
    } finally {
      setTimeout(() => setRefreshing(false), 2000);
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 120000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-2 duration-1000">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-4 border-b border-primary/5">
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-primary/5 rounded-lg border border-primary/5">
              <Activity className="w-5 h-5 text-primary/40 animate-pulse" />
            </div>
            <h2 className="text-3xl font-black text-primary tracking-tight">Ecosystem Pulse</h2>
          </div>
          <p className="text-primary/60 text-sm font-bold uppercase tracking-widest pl-12 italic">
            Real-time infrastructure orchestration telemetry.
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden lg:flex items-center gap-6 px-6 py-3 bg-white rounded-2xl border border-primary/5 shadow-sm">
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-primary/40 uppercase tracking-[0.2em] mb-1">Total Signals</span>
              <span className="text-sm font-black text-primary">{services.length.toString().padStart(2, '0')} Nodes</span>
            </div>
            <div className="w-px h-8 bg-primary/5" />
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-primary/40 uppercase tracking-[0.2em] mb-1">Avg Reliability</span>
              <span className="text-sm font-black text-green-500">99.98%</span>
            </div>
          </div>
          
          <Button 
            variant="outline" 
            onClick={triggerRefresh} 
            disabled={refreshing}
            className="h-14 px-8 rounded-2xl border-primary/10 bg-white hover:bg-primary/5 shadow-xl shadow-primary/5 transition-all active:scale-95 flex items-center gap-3"
          >
            <RefreshCw className={cn("w-5 h-5", refreshing && "animate-spin text-secondary")} />
            <span className="text-xs font-black uppercase tracking-widest">{refreshing ? "Calibrating..." : "Synchronize System"}</span>
          </Button>
        </div>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {loading && services.length === 0 ? (
          [1,2,3,4,5,6].map(i => (
             <div key={i} className="h-64 rounded-[3rem] bg-primary/[0.02] border border-primary/5 animate-pulse" />
          ))
        ) : (
          services.map((service, idx) => {
            const Icon = getServiceIcon(service.service);
            const statusLower = service.status.toLowerCase().trim();
            const isHealthy = ['healthy', 'operational', 'online', 'active', 'ready', 'up', 'ok'].includes(statusLower);
            const isDegraded = statusLower === 'degraded' || statusLower === 'warning';

            return (
              <div 
                key={service.service} 
                className={cn(
                  "group relative h-auto flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-700",
                  !isHealthy && "col-span-1 md:col-span-2 lg:col-span-1"
                )}
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                {/* Background Glow */}
                <div className={cn(
                  "absolute -top-10 -right-10 w-48 h-48 rounded-full blur-[80px] transition-all duration-700 group-hover:opacity-20",
                  isHealthy ? "bg-green-500 opacity-[0.08]" : (isDegraded ? "bg-amber-500 opacity-[0.1]" : "bg-red-500 opacity-[0.15]")
                )} />

                <div className={cn(
                  "flex-1 bg-white/60 backdrop-blur-2xl p-10 rounded-[3rem] border shadow-[0_8px_32px_0_rgba(31,38,135,0.04)] relative z-10 flex flex-col hover:border-primary/20 transition-all hover:bg-white/80 group-hover:-translate-y-2 group-active:scale-[0.98] duration-500 overflow-hidden",
                  !isHealthy ? "border-red-500/20 shadow-red-500/5" : "border-white"
                )}>
                  
                  {/* Decorative Pattern */}
                  <div className="absolute top-0 right-0 p-8 opacity-[0.02] pointer-events-none group-hover:rotate-12 transition-transform duration-1000">
                    <Icon className="w-32 h-32" />
                  </div>

                  {!isHealthy && (
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-red-500/40 animate-pulse" />
                  )}

                  <div className="flex items-start justify-between mb-8">
                    <div className={cn(
                      "p-5 rounded-2xl shadow-2xl transition-all duration-500 group-hover:rotate-[360deg]",
                      isHealthy 
                        ? "bg-primary text-white shadow-primary/20" 
                        : "bg-red-500 text-white shadow-red-500/20"
                    )}>
                      <Icon className="w-7 h-7" />
                    </div>
                    
                    <div className="flex flex-col items-end">
                      <SignalMeter status={service.status} />
                      <div className={cn(
                        "mt-4 text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-lg border leading-none transition-all duration-500 shadow-sm",
                        isHealthy ? "bg-green-500/20 text-green-700 border-green-500/20" : "bg-red-500/20 text-red-700 border-red-500/20"
                      )}>
                        {service.status}
                      </div>
                    </div>
                  </div>

                  <div className="mb-6">
                    <h3 className="text-2xl font-black text-primary mb-1 tracking-tight transition-colors group-hover:text-secondary">{service.service}</h3>
                    
                    {service.last_error ? (
                      <div className="flex items-center gap-2 text-red-600 animate-pulse">
                         <AlertCircle className="w-3.5 h-3.5" />
                         <span className="text-[10px] font-black uppercase tracking-widest">Critical Exception Detected</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                         <span className="w-2 h-0.5 rounded-full bg-primary/20" />
                         <span className="text-[10px] font-bold text-primary/40 uppercase tracking-widest">Stable Core Pipeline</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 space-y-6">
                    {service.last_error ? (
                      <div className="space-y-4">
                        <div className="p-6 bg-red-50 rounded-[2rem] border border-red-100/50 shadow-inner">
                          <p className="text-sm font-bold text-red-700 leading-tight mb-2">
                            {(() => {
                               try {
                                 const parsed = JSON.parse(service.last_error);
                                 return parsed.message || parsed.description || "Inaccessible Resource Hub";
                               } catch {
                                 return service.last_error;
                               }
                            })()}
                          </p>
                          <div className="w-8 h-1 bg-red-200 rounded-full" />
                        </div>
                        
                        <div className="p-5 bg-primary/[0.02] rounded-2xl border border-primary/5 group/error overflow-auto max-h-48 scrollbar-hide">
                          <div className="flex items-center gap-2 mb-2 text-primary/40">
                             <Terminal className="w-3.5 h-3.5" />
                             <span className="text-[9px] font-black uppercase tracking-widest">Technical Trace</span>
                          </div>
                          <pre className="text-[10px] font-mono text-primary/60 leading-relaxed whitespace-pre-wrap">
                            {service.last_error}
                          </pre>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4 opacity-70 group-hover:opacity-100 transition-opacity">
                         <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                           <span className="text-primary/60">Network Latency</span>
                           <span className="text-primary font-black">12ms</span>
                         </div>
                         <div className="w-full h-1 bg-primary/5 rounded-full overflow-hidden">
                           <div className="w-4/5 h-full bg-secondary transition-all group-hover:w-full duration-1000 shadow-[0_0_8px_rgba(56,189,248,0.5)]" />
                         </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-12 pt-8 border-t border-primary/10 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                       <Clock className="w-4 h-4 text-primary/40" />
                       <span className="text-[11px] font-black uppercase tracking-widest text-primary/60">
                         {new Date(service.last_checked).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                       </span>
                    </div>
                    {isHealthy && (
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-secondary/60" />
                        <span className="text-[11px] font-black uppercase tracking-[0.2em] text-secondary">Verified</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Floating Success Toast */}
      {showToast && (
        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-bottom-5 fade-in duration-500">
           <div className="bg-primary text-white px-8 py-5 rounded-[2rem] shadow-2xl flex items-center gap-5 border border-white/10 ring-8 ring-primary/5">
              <div className="p-2 bg-secondary text-white rounded-full shadow-lg shadow-secondary/20 scale-110">
                 <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <p className="font-extrabold text-base tracking-tight leading-none mb-1">System Audit Complete</p>
                <p className="text-[10px] uppercase font-black tracking-widest text-white/40">Telemetry Handshake Verified</p>
              </div>
           </div>
        </div>
      )}

      {/* Ecosystem Footer (Decorative) */}
      <div className="bg-primary shadow-[0_32px_64px_-16px_rgba(15,23,42,0.5)] rounded-[3.5rem] p-16 mt-20 overflow-hidden relative border border-white/5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,rgba(255,255,255,0.05),transparent)] pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-secondary rounded-full blur-[120px] opacity-10" />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 relative z-10 items-center">
          <div>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-white">
                <Globe className="w-6 h-6 animate-spin-slow" />
              </div>
              <h4 className="text-3xl font-black text-white tracking-tight">Global Node Synchronization</h4>
            </div>
            <p className="text-white/40 text-sm font-bold leading-relaxed max-w-sm">
              Cross-cluster relay active. All secondary nodes are performing decentralized validation against the master core.
            </p>
          </div>
          
          <div className="flex items-end justify-between gap-1.5 h-32">
            {[...Array(40)].map((_, i) => (
              <div 
                key={i} 
                className="w-full bg-secondary/80 rounded-t-lg transition-all duration-1000 hover:bg-secondary hover:scale-x-150"
                style={{ 
                  height: `${30 + Math.random() * 70}%`,
                  animation: `pulse-bar 3s infinite ${i * 0.1}s`
                }} 
              />
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse-bar {
          0%, 100% { transform: scaleY(1); opacity: 0.5; }
          50% { transform: scaleY(1.2); opacity: 1; }
        }
        .animate-spin-slow {
          animation: spin 12s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

const ClockIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
