import { useState, useEffect } from "react";
import { supabase } from "@/shared/lib/supabase";
import { CheckCircle2, RefreshCw, Activity, ShieldCheck } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/lib/utils";

interface HealthStatus {
  id: string;
  service_name: string;
  status: "healthy" | "unhealthy" | "degraded";
  latency?: number;
  last_checked: string;
  details?: string;
}

const MOCK_HEALTH: HealthStatus[] = [
  { id: "1", service_name: "Vapi Voice API", status: "healthy", latency: 120, last_checked: new Date().toISOString() },
  { id: "2", service_name: "Supabase Database", status: "healthy", latency: 45, last_checked: new Date().toISOString() },
  { id: "3", service_name: "n8n Automation", status: "degraded", latency: 850, last_checked: new Date().toISOString(), details: "High load on primary worker" },
  { id: "4", service_name: "OpenAI Whisper", status: "healthy", latency: 210, last_checked: new Date().toISOString() },
];

export const HealthMonitor = () => {
  const [services, setServices] = useState<HealthStatus[]>(MOCK_HEALTH);
  const [loading, setLoading] = useState(false);

  const fetchHealth = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from("system_health")
        .select("*")
        .order("service_name");

      if (data && data.length > 0) {
        setServices(data as HealthStatus[]);
      }
    } catch (err) {
      console.warn("Using mock health data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const hasConfig = import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY;
    if (hasConfig) fetchHealth();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-primary">System Health</h2>
          <p className="text-primary/40 text-sm font-medium">Real-time status of critical infrastructure.</p>
        </div>
        <Button 
          variant="outline" 
          onClick={fetchHealth} 
          disabled={loading}
          className="rounded-xl border-primary/10 hover:bg-primary/5"
        >
          <RefreshCw className={cn("w-4 h-4 mr-2", loading && "animate-spin")} />
          Refresh Status
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((service) => (
          <div key={service.id} className="bg-white p-6 rounded-3xl border border-primary/5 shadow-sm hover:shadow-md transition-all group">
            <div className="flex items-start justify-between mb-6">
              <div className={cn(
                "p-3 rounded-2xl",
                service.status === 'healthy' ? "bg-green-100 text-green-600" : (service.status === 'unhealthy' ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-600")
              )}>
                {service.status === 'healthy' ? <CheckCircle2 className="w-6 h-6" /> : <ShieldCheck className="w-6 h-6" />}
              </div>
              <div className="flex flex-col items-end">
                <span className={cn(
                  "text-sm font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg",
                  service.status === 'healthy' ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                )}>
                  {service.status}
                </span>
                {service.latency && (
                  <span className="text-sm text-primary/40 font-bold mt-1.5">{service.latency}ms latency</span>
                )}
              </div>
            </div>

            <h3 className="text-lg font-bold text-primary mb-1">{service.service_name}</h3>
            <p className="text-sm text-primary/40 font-medium mb-4 truncate">{service.details || "Operating normally"}</p>
            
            <div className="flex items-center justify-between pt-4 border-t border-primary/5">
              <div className="flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 text-primary/20" />
                <span className="text-xs font-bold text-primary/40 uppercase tracking-tight">Updated: {new Date(service.last_checked).toLocaleTimeString()}</span>
              </div>
              <Button variant="ghost" size="sm" className="h-7 text-xs font-bold uppercase tracking-widest text-primary/50 hover:text-primary">View Metrics</Button>
            </div>
          </div>
        ))}
      </div>

      {/* Connectivity Visualization (Decorative) */}
      <div className="bg-primary/5 rounded-[2rem] p-8 mt-12 overflow-hidden relative border border-primary/5">
        <div className="flex items-center gap-4 mb-6">
           <div className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
           <p className="text-xs font-bold uppercase tracking-widest text-primary/60">Global Cluster Signal</p>
        </div>
        <div className="h-32 flex items-end justify-between gap-1">
          {[...Array(40)].map((_, i) => (
            <div 
              key={i} 
              className="w-1 bg-secondary/30 rounded-t-full transition-all duration-1000"
              style={{ 
                height: `${20 + Math.random() * 80}%`,
                animationDelay: `${i * 0.1}s`
              }} 
            />
          ))}
        </div>
      </div>
    </div>
  );
};
