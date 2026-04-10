import { useSearchParams } from "react-router-dom";
import { Sidebar } from "../components/Sidebar";
import { LogsTable } from "../components/LogsTable";
import { EscalationsTable } from "../components/EscalationsTable";
import { HealthMonitor } from "../components/HealthMonitor";
import { KnowledgeBaseView } from "../components/KnowledgeBaseView";
import { KeywordsManager } from "../components/KeywordsManager";
import { cn } from "@/shared/lib/utils";
import { 
  Activity, 
  AlertTriangle, 
  ShieldCheck, 
  Users 
} from "lucide-react";

export default function AdminPage() {
  const [searchParams] = useSearchParams();
  const currentTab = searchParams.get("tab") || "logs";

  const stats = [
    { label: "Active Sessions", value: "24", icon: Activity, trend: "+12%" },
    { label: "Escalations", value: "08", icon: AlertTriangle, trend: "-2%" },
    { label: "System Health", value: "99.9%", icon: ShieldCheck, trend: "Stable" },
    { label: "Total Users", value: "1.2k", icon: Users, trend: "+5%" },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-[#F8F9FA]">
      <Sidebar />
      
      <main className="flex-1 p-8 md:p-12 overflow-y-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-bold text-primary tracking-tight mb-2">Admin Control Center</h1>
            <p className="text-primary/60 font-semibold text-lg">RelayPay Adaptive Intelligence Interface</p>
          </div>
          
          <div className="flex items-center gap-4 bg-white p-2 rounded-2xl shadow-sm border border-primary/5">
            <div className="px-4 py-2 bg-secondary/10 text-secondary rounded-xl font-bold flex items-center gap-2">
              <Activity className="w-4 h-4" />
              <span className="text-sm uppercase tracking-wider">Live System Monitoring</span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-white p-6 rounded-3xl border border-primary/5 shadow-sm hover:shadow-md transition-all group">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-2xl bg-primary/5 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                  <stat.icon className="w-5 h-5" />
                </div>
                <span className={cn(
                  "text-xs font-bold px-2 py-1 rounded-lg",
                  stat.trend.startsWith('+') ? "bg-green-100 text-green-600" : "bg-primary/5 text-primary/40"
                )}>
                  {stat.trend}
                </span>
              </div>
              <h3 className="text-3xl font-bold text-primary mb-1">{stat.value}</h3>
              <p className="text-sm font-bold text-primary/50 uppercase tracking-widest">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Dynamic Content Area */}
        <div className="bg-white/50 backdrop-blur-sm rounded-[2rem] border border-primary/5 p-8 transition-all duration-700 animate-in fade-in slide-in-from-bottom-4">
          {currentTab === "logs" && <LogsTable />}
          {currentTab === "escalations" && <EscalationsTable />}
          {currentTab === "health" && <HealthMonitor />}
          {currentTab === "kb" && <KnowledgeBaseView />}
          {currentTab === "keywords" && <KeywordsManager />}
          {currentTab === "dashboard" && (
             <div className="py-20 flex flex-col items-center justify-center text-primary/20 gap-4">
              <h2 className="text-2xl font-bold text-primary/40">Dashboard Overview</h2>
              <p className="text-sm font-bold uppercase tracking-widest opacity-30">Main metrics visualization coming soon</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
