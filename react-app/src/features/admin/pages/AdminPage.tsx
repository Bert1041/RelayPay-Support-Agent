import { useSearchParams } from "react-router-dom";
import { useRef, useState, useEffect } from "react";
import { Sidebar } from "../components/Sidebar";
import { LogsTable } from "../components/LogsTable";
import { EscalationsTable } from "../components/EscalationsTable";
import { HealthMonitor } from "../components/HealthMonitor";
import { KnowledgeBaseView } from "../components/KnowledgeBaseView";
import { KeywordsManager } from "../components/KeywordsManager";
import { supabase } from "@/shared/lib/supabase";
import { cn } from "@/shared/lib/utils";
import { 
  Activity, 
  AlertTriangle, 
  ShieldCheck, 
  ArrowUpRight,
  Database,
  MessageSquare,
  Globe,
  Terminal,
  Zap
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { AdminLogin } from "../components/AdminLogin";

interface DashboardStats {
  sessions: number;
  totalToday: number;
  escalations: number;
  health: number;
  knowledge: number;
  accuracy: number;
  events: Array<{
    icon: any;
    label: string;
    time: string;
    detail: string;
    type: 'log' | 'health' | 'kb';
  }>;
}

export default function AdminPage() {
  const [searchParams] = useSearchParams();
  const currentTab = searchParams.get("tab") || "dashboard";
  const mainContentRef = useRef<HTMLDivElement>(null);
  
  const [isAuthorized, setIsAuthorized] = useState(() => {
    return sessionStorage.getItem("relaypay_admin_auth") === "true";
  });

  const [stats, setStats] = useState<DashboardStats>({
    sessions: 0,
    totalToday: 0,
    escalations: 0,
    health: 0,
    knowledge: 0,
    accuracy: 94,
    events: []
  });
  const [loading, setLoading] = useState(true);

  const formatRelativeTime = (dateString: string) => {
    const now = new Date();
    const past = new Date(dateString);
    const diffInMs = now.getTime() - past.getTime();
    const diffInMins = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMins / 60);

    if (diffInMins < 1) return "Just now";
    if (diffInMins < 60) return `${diffInMins}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return past.toLocaleDateString();
  };

  const fetchStats = async () => {
    if (!isAuthorized) return;
    setLoading(true);
    try {
      const isSystemHealthy = (status: string) => {
        const s = status?.toLowerCase().trim();
        return ['healthy', 'operational', 'online', 'active', 'ready', 'up', 'ok'].includes(s);
      };

      // 1. Fetch conversation metrics & escalations
      const [logsResponse, escalationsResponse] = await Promise.all([
        supabase.from("conversation_log").select("call_id, escalation_triggered, created_at").order("created_at", { ascending: false }),
        supabase.from("escalations").select("*", { count: 'exact', head: true })
      ]);

      const logs = logsResponse.data || [];
      const now = new Date();
      const fifteenMinsAgo = new Date(now.getTime() - 15 * 60 * 1000);
      const startOfToday = new Date(now.setHours(0, 0, 0, 0));

      const activeLogs = logs.filter(l => new Date(l.created_at) > fifteenMinsAgo);
      const uniqueActiveSessions = new Set(activeLogs.map(l => l.call_id)).size;

      const todayLogs = logs.filter(l => new Date(l.created_at) > startOfToday);
      const uniqueTodaySessions = new Set(todayLogs.map(l => l.call_id)).size;

      const escalationCount = escalationsResponse.count || 0;
      
      const successRate = uniqueTodaySessions > 0 
        ? Math.round(((uniqueTodaySessions - new Set(todayLogs.filter(l => l.escalation_triggered).map(l => l.call_id)).size) / uniqueTodaySessions) * 100) 
        : 100;

      // 2. Fetch system health
      const { data: healthData } = await supabase.from("system_health").select("status, service, last_checked");
      const healthyNodes = healthData?.filter(n => isSystemHealthy(n.status)).length || 0;
      const healthPercentage = healthData?.length ? Math.round((healthyNodes / healthData.length) * 100) : 100;

      // 3. Fetch knowledge base
      const { count: kbCount } = await supabase.from("documents").select("*", { count: 'exact', head: true });

      // 4. Gather Recent Events (Interleave logs and health checks by original timestamp)
      const logEvents = logs.slice(0, 5).map(l => ({
        icon: MessageSquare,
        label: "Live Session",
        timestamp: new Date(l.created_at),
        detail: l.escalation_triggered ? "Escalation requested" : "Session verified",
        type: 'log' as const
      }));

      const healthEvents = (healthData?.slice(0, 5) || []).map(h => ({
        icon: Zap,
        label: "Internal Pulse",
        timestamp: new Date(h.last_checked),
        detail: `${h.service} status: ${h.status}`,
        type: 'health' as const
      }));

      const sortedEvents = [...logEvents, ...healthEvents]
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, 4)
        .map(e => ({
          icon: e.icon,
          label: e.label,
          time: formatRelativeTime(e.timestamp.toISOString()),
          detail: e.detail,
          type: e.type
        }));

      setStats({
        sessions: uniqueActiveSessions,
        totalToday: uniqueTodaySessions,
        escalations: escalationCount,
        health: healthPercentage,
        knowledge: kbCount || 0,
        accuracy: successRate,
        events: sortedEvents
      });
    } catch (err) {
      console.error("Dashboard stats fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthorized) {
      fetchStats();
      const interval = setInterval(fetchStats, 60000); // 1 min sync
      return () => clearInterval(interval);
    }
  }, [isAuthorized, currentTab]);

  if (!isAuthorized) {
    return <AdminLogin onSuccess={() => setIsAuthorized(true)} />;
  }

  const scrollToTop = () => {
    mainContentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  const metricCards = [
    { 
      label: "Active Sessions", 
      value: stats.sessions.toString(), 
      icon: Activity, 
      trend: stats.sessions > 0 ? "LIVE" : "IDLE", 
      subTrend: `${stats.totalToday} Today`,
      color: "text-blue-500", 
      bg: "bg-blue-500/10" 
    },
    { 
      label: "Escalations", 
      value: stats.escalations.toString(), 
      icon: AlertTriangle, 
      trend: stats.escalations > 0 ? "Action Req" : "Optimal", 
      color: "text-red-500", 
      bg: "bg-red-500/10" 
    },
    { 
      label: "System Health", 
      value: `${stats.health}%`, 
      icon: ShieldCheck, 
      trend: "Stable", 
      color: "text-green-500", 
      bg: "bg-green-500/10" 
    },
    { 
      label: "Docs Indexed", 
      value: stats.knowledge.toString(), 
      icon: Database, 
      trend: "Synced", 
      color: "text-secondary", 
      bg: "bg-secondary/10" 
    },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-[#F8F9FA]">
      <Sidebar />
      
      <main 
        ref={mainContentRef}
        className="flex-1 p-8 md:p-12 overflow-y-auto scroll-smooth"
      >
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div onClick={scrollToTop} className="cursor-pointer group select-none">
            <h1 className="text-4xl font-black text-primary tracking-tighter mb-2 group-active:scale-[0.98] transition-all">
              RelayPay Command
            </h1>
            <p className="text-primary/40 font-bold uppercase tracking-[0.2em] text-xs">
               Intelligence Orchestration Interface — <span className="text-secondary">v2.4.0</span>
            </p>
          </div>
          
          <div className="flex items-center gap-4 bg-white p-2 rounded-2xl shadow-sm border border-primary/5">
            <div className="px-5 py-2.5 bg-primary/5 text-primary rounded-xl font-black flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] uppercase tracking-widest">Global Cluster Active</span>
            </div>
            <Button variant="ghost" size="icon" className="w-12 h-12 rounded-xl text-primary/30 hover:text-primary">
               <Zap className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Dynamic Content Area */}
        <div className={cn(
           "transition-all duration-700 animate-in fade-in slide-in-from-bottom-4",
           currentTab === "dashboard" ? "" : "bg-white/50 backdrop-blur-sm rounded-[3rem] border border-primary/5 p-12"
        )}>
          {currentTab === "logs" && <LogsTable onTitleClick={scrollToTop} />}
          {currentTab === "escalations" && <EscalationsTable />}
          {currentTab === "health" && <HealthMonitor />}
          {currentTab === "kb" && <KnowledgeBaseView />}
          {currentTab === "keywords" && <KeywordsManager />}

          {currentTab === "dashboard" && (
            <div className="space-y-12 animate-in fade-in slide-in-from-bottom-2 duration-700">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12 animate-in fade-in slide-in-from-top-4 duration-1000">
                {metricCards.map((stat, idx) => (
                  <div 
                    key={stat.label} 
                    className="bg-white p-8 rounded-[2.5rem] border border-primary/5 shadow-xl shadow-primary/5 hover:shadow-primary/10 transition-all group relative overflow-hidden"
                    style={{ animationDelay: `${idx * 0.1}s` }}
                  >
                    <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:scale-125 transition-transform duration-700">
                      <stat.icon className="w-24 h-24" />
                    </div>
                    <div className="flex items-center justify-between mb-8">
                      <div className={cn("p-4 rounded-2xl shadow-lg", stat.bg, stat.color)}>
                        <stat.icon className="w-6 h-6" />
                      </div>
                      <div className="flex flex-col items-end">
                        <span className={cn(
                          "text-[10px] font-black px-2.5 py-1 rounded-lg border",
                          stat.trend === "LIVE" || stat.trend === "Stable" || stat.trend === "Optimal" 
                            ? "bg-green-100 text-green-700 border-green-200" 
                            : "bg-primary/5 text-primary/40 border-primary/10"
                        )}>
                          {stat.trend}
                        </span>
                        {stat.subTrend && (
                          <span className="text-[10px] font-bold text-primary/20 mt-1 uppercase tracking-tight">
                            {stat.subTrend}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="relative z-10">
                      <h3 className="text-4xl font-black text-primary mb-1 tracking-tighter">{loading ? "..." : stat.value}</h3>
                      <p className="text-[10px] font-black text-primary/30 uppercase tracking-[0.2em]">{stat.label}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Dashboard Hero & Events */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-primary rounded-[3.5rem] p-16 relative overflow-hidden shadow-2xl shadow-primary/20 border border-white/5">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.05),transparent)] pointer-events-none" />
                  <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-secondary rounded-full blur-[120px] opacity-10" />
                  <div className="relative z-10 max-w-lg">
                    <div className="px-4 py-1.5 bg-white/10 rounded-full border border-white/10 w-fit mb-8">
                      <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Live Telemetry Stream</span>
                    </div>
                    <h2 className="text-5xl font-black text-white mb-6 tracking-tight leading-none">Intelligence Synchronization</h2>
                    <p className="text-white/40 font-bold leading-relaxed mb-10 text-lg">
                      RelayPay is currently processing signals across {stats.sessions} active conversation lanes with a {stats.health}% ecosystem health score.
                    </p>
                    <div className="flex items-center gap-6">
                       <div className="flex -space-x-3">
                          {[1,2,3,4].map(i => (
                            <div key={i} className="w-12 h-12 rounded-full border-4 border-primary bg-primary/20 flex items-center justify-center text-xs font-black text-white/40">A{i}</div>
                          ))}
                       </div>
                       <span className="text-white/20 font-black text-xs uppercase tracking-widest">Active Validators</span>
                    </div>
                  </div>
                  <div className="absolute right-0 bottom-0 p-16 opacity-5">
                     <Globe className="w-80 h-80 animate-spin-slow" />
                  </div>
                </div>

                <div className="bg-white rounded-[3.5rem] p-12 border border-primary/5 shadow-xl shadow-primary/5 flex flex-col">
                  <div className="flex items-center justify-between mb-10">
                    <h4 className="text-xl font-black text-primary tracking-tight">System Events</h4>
                    <Terminal className="w-5 h-5 text-primary/20" />
                  </div>
                  <div className="flex-1 space-y-8 overflow-y-auto pr-4 scrollbar-hide">
                    {stats.events.length > 0 ? stats.events.map((event, i) => (
                      <div key={i} className="flex gap-6 items-start group">
                         <div className="p-3 bg-primary/5 text-primary/40 rounded-xl group-hover:bg-primary group-hover:text-white transition-all">
                            <event.icon className="w-4 h-4" />
                         </div>
                         <div>
                            <div className="flex items-center gap-2 mb-1">
                               <span className="text-sm font-black text-primary">{event.label}</span>
                               <span className="text-[9px] font-black text-primary/20 uppercase">{event.time}</span>
                            </div>
                            <p className="text-xs font-bold text-primary/40 italic">{event.detail}</p>
                         </div>
                      </div>
                    )) : (
                      <div className="flex flex-col items-center justify-center h-full text-primary/20 gap-4">
                         <Activity className="w-8 h-8 animate-pulse" />
                         <span className="text-[10px] font-black uppercase tracking-widest">Awaiting Signals...</span>
                      </div>
                    )}
                  </div>
                  <Button variant="ghost" className="mt-10 w-full rounded-2xl text-[10px] font-black uppercase tracking-widest text-secondary hover:bg-secondary/5">View Master Log</Button>
                </div>
              </div>

              {/* Secondary Stats Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white p-12 rounded-[3rem] border border-primary/5 flex items-center gap-10">
                  <div className="w-24 h-24 rounded-full border-8 border-primary/5 flex items-center justify-center relative">
                    <ArrowUpRight className="w-8 h-8 text-secondary" />
                    <svg className="absolute inset-0 w-full h-full -rotate-90">
                       <circle cx="48" cy="48" r="44" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-secondary opacity-20" />
                       <circle cx="48" cy="48" r="44" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray="276" strokeDashoffset={276 - (2.76 * stats.accuracy)} className="text-secondary transition-all duration-1000" />
                    </svg>
                  </div>
                  <div>
                    <h5 className="text-2xl font-black text-primary mb-1">{stats.accuracy}% Resolution</h5>
                    <p className="text-xs font-black text-primary/30 uppercase tracking-widest">Intent Interaction Rate</p>
                  </div>
                </div>
                <div className="bg-white p-12 rounded-[3rem] border border-primary/5 flex items-center gap-10">
                  <div className="w-24 h-24 rounded-full border-8 border-primary/5 flex items-center justify-center relative">
                    <Activity className="w-8 h-8 text-primary" />
                    <svg className="absolute inset-0 w-full h-full -rotate-90">
                       <circle cx="48" cy="48" r="44" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-primary opacity-20" />
                       <circle cx="48" cy="48" r="44" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray="276" strokeDashoffset="10" className="text-primary" />
                    </svg>
                  </div>
                  <div>
                    <h5 className="text-2xl font-black text-primary mb-1">{stats.health}% Uptime</h5>
                    <p className="text-xs font-black text-primary/30 uppercase tracking-widest">Global Network Reliability</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        .animate-spin-slow { animation: spin 20s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
