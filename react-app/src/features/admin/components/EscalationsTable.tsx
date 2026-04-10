import { Search, Filter, MoreHorizontal, Calendar, Mail, User, CheckCircle2, Clock } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/shared/lib/supabase";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/lib/utils";

interface EscalationEntry {
  id: string;
  created_at: string;
  call_id: string;
  user_name: string | null;
  user_email: string | null;
  category: string | null;
  reason: string | null;
  call_booked: boolean | null;
  appointment_time: string | null;
  notification_sent: boolean | null;
  status: string | null;
}

// Mock data based on provided schema
const MOCK_ESCALATIONS: EscalationEntry[] = [
  {
    id: "uuid-1",
    created_at: new Date().toISOString(),
    call_id: "vapi-call-998",
    user_name: "John Doe",
    user_email: "john@example.com",
    category: "Technical",
    reason: "Account sync failed multiple times",
    call_booked: true,
    appointment_time: new Date(Date.now() + 86400000).toISOString(),
    notification_sent: true,
    status: "open",
  },
  {
    id: "uuid-2",
    created_at: new Date(Date.now() - 3600000).toISOString(),
    call_id: "vapi-call-997",
    user_name: "Alice Smith",
    user_email: "alice@company.com",
    category: "Billing",
    reason: "Dispute over international transfer fee",
    call_booked: false,
    appointment_time: null,
    notification_sent: false,
    status: "pending",
  },
];

export const EscalationsTable = () => {
  const [escalations, setEscalations] = useState<EscalationEntry[]>(MOCK_ESCALATIONS);
  const [, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchEscalations = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from("escalations")
        .select("*")
        .order("created_at", { ascending: false });

      if (data && data.length > 0) {
        setEscalations(data as EscalationEntry[]);
      }
    } catch (err) {
      console.warn("Supabase fetch failed, showing mock data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const hasConfig = import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY;
    if (hasConfig) {
      fetchEscalations();
    }
  }, []);

  const filteredEscalations = escalations.filter(
    (e) =>
      (e.user_name?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      (e.reason?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      (e.call_id?.toLowerCase() || "").includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-primary">Escalations</h2>
          <p className="text-primary/40 text-sm font-medium">Manage and resolve high-priority support triggers.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/30" />
            <input
              type="text"
              placeholder="Search escalations..."
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
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-primary/[0.02] border-b border-primary/5">
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-primary/40">Timestamp</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-primary/40">User Details</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-primary/40">Category / Reason</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-primary/40">Appointment</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-primary/40">Status</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary/5">
              {filteredEscalations.map((item) => (
                <tr key={item.id} className="hover:bg-primary/[0.01] transition-colors group text-sm">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="font-bold text-base text-primary">{new Date(item.created_at).toLocaleDateString()}</span>
                      <span className="text-xs text-primary/40">{new Date(item.created_at).toLocaleTimeString()}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <User className="w-3 h-3 text-secondary" />
                        <span className="font-bold text-primary">{item.user_name || 'Anonymous'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-primary/50">
                        <Mail className="w-3 h-3" />
                        <span>{item.user_email || 'No email provided'}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-bold uppercase text-secondary/70 tracking-tight">{item.category || 'Uncategorized'}</span>
                      <p className="text-primary/70 line-clamp-1">{item.reason || 'No reason provided'}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {item.call_booked ? (
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-secondary">
                          <CheckCircle2 className="w-4 h-4" />
                          <span className="font-bold text-[11px]">BOOKED</span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-primary/50">
                          <Calendar className="w-3 h-3" />
                          <span>{item.appointment_time ? new Date(item.appointment_time).toLocaleString() : 'TBD'}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-primary/30">
                        <Clock className="w-4 h-4" />
                        <span className="text-[11px] font-bold">NOT BOOKED</span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase",
                      item.status === 'open' && "bg-secondary/10 text-secondary border border-secondary/20",
                      item.status === 'resolved' && "bg-green-100 text-green-700 border border-green-200",
                      item.status === 'pending' && "bg-amber-100 text-amber-700 border border-amber-200",
                    )}>
                      {item.status}
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
      </div>
    </div>
  );
};
