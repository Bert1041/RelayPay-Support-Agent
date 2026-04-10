import { Search, Filter, MoreHorizontal } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/shared/lib/supabase";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/lib/utils";

interface LogEntry {
  id: string;
  created_at: string;
  type: "info" | "error" | "warning" | "success";
  event: string;
  assistant_id: string;
  details: string;
}

// Mock data for immediate preview
const MOCK_LOGS: LogEntry[] = [
  {
    id: "1",
    created_at: new Date().toISOString(),
    type: "success",
    event: "Call Started",
    assistant_id: "relay-agent-01",
    details: "Voice connection established with customer 3124.",
  },
  {
    id: "2",
    created_at: new Date(Date.now() - 3600000).toISOString(),
    type: "info",
    event: "Transcription Received",
    assistant_id: "relay-agent-01",
    details: 'User: "I want to check my balance"',
  },
  {
    id: "3",
    created_at: new Date(Date.now() - 7200000).toISOString(),
    type: "error",
    event: "API Timeout",
    assistant_id: "relay-agent-01",
    details: "Failed to fetch transaction history from core banking.",
  },
];

export const LogsTable = () => {
  const [logs, setLogs] = useState<LogEntry[]>(MOCK_LOGS);
  const [, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchLogs = async () => {
    setLoading(true);
    // This will work once Supabase is configured
    try {
      const { data } = await supabase
        .from("agent_logs")
        .select("*")
        .order("created_at", { ascending: false });

      if (data && data.length > 0) {
        setLogs(data as LogEntry[]);
      }
    } catch (err) {
      console.warn("Supabase fetch failed, showing mock data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Attempt real fetch if possible, otherwise stay with mock
    const hasConfig = import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY;
    if (hasConfig) {
      fetchLogs();
    }
  }, []);

  const filteredLogs = logs.filter(
    (log) =>
      (log.event?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      (log.details?.toLowerCase() || "").includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-primary">System Logs</h2>
          <p className="text-primary/40 text-sm font-medium">Monitoring real-time agent interactions.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/30" />
            <input
              type="text"
              placeholder="Search logs..."
              className="pl-10 pr-4 py-2 rounded-xl border border-primary/10 bg-[#F8F9FA] focus:outline-none focus:ring-2 focus:ring-secondary/20 transition-all text-sm w-64"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="ghost" className="rounded-xl border border-primary/5 hover:bg-primary/5">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-primary/5 shadow-sm overflow-hidden transition-all duration-500">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-primary/[0.02] border-b border-primary/5">
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-primary/40">Timestamp</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-primary/40">Event</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-primary/40">Assistant</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-primary/40">Details</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-primary/40">Type</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary/5">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-primary/[0.01] transition-colors group">
                  <td className="px-6 py-4">
                    <span className="text-base font-medium text-primary/80 whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString()}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-base font-bold text-primary">{log.event}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-bold py-1.5 px-3 rounded-lg bg-primary/5 text-primary/60">
                      {log.assistant_id}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-base text-primary/60 max-w-md truncate">{log.details}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold",
                      log.type === 'success' && "bg-secondary/10 text-secondary",
                      log.type === 'error' && "bg-red-100 text-red-600",
                      log.type === 'warning' && "bg-yellow-100 text-yellow-700",
                      log.type === 'info' && "bg-blue-100 text-blue-600",
                    )}>
                      <div className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        log.type === 'success' && "bg-secondary",
                        log.type === 'error' && "bg-red-600",
                        log.type === 'warning' && "bg-yellow-600",
                        log.type === 'info' && "bg-blue-600",
                      )} />
                      {log.type.toUpperCase()}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreHorizontal className="w-4 h-4 text-primary/40" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredLogs.length === 0 && (
          <div className="py-20 flex flex-col items-center justify-center text-primary/20 gap-4">
            <Search className="w-12 h-12 opacity-10" />
            <p className="text-sm font-bold uppercase tracking-widest opacity-30">No matching logs found</p>
          </div>
        )}

        <div className="px-6 py-4 bg-primary/[0.02] border-t border-primary/5 flex items-center justify-between">
          <p className="text-[10px] font-bold text-primary/30 uppercase tracking-widest">
            Showing {filteredLogs.length} of {logs.length} entries
          </p>
          <div className="flex gap-2">
            <Button disabled variant="ghost" size="sm" className="text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-xl">Previous</Button>
            <Button disabled variant="ghost" size="sm" className="text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-xl">Next</Button>
          </div>
        </div>
      </div>
    </div>
  );
};
