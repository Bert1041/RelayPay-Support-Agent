import { Search, Filter, Calendar, Mail, User, CheckCircle2, Clock, Video, ExternalLink, AlertTriangle } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/shared/lib/supabase";
import { Button } from "@/shared/components/ui/button";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
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
  cal_booking_uid: string | null;
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
    cal_booking_uid: "rob-tega-15min",
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
    cal_booking_uid: null,
  },
];

export const EscalationsTable = () => {
  const [escalations, setEscalations] = useState<EscalationEntry[]>(MOCK_ESCALATIONS);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

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

  const filteredEscalations = escalations.filter((e) => {
    const matchesSearch =
      (e.user_name?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      (e.reason?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      (e.call_id?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      (e.category?.toLowerCase() || "").includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" || e.status === statusFilter;
    const matchesCategory = categoryFilter === "all" || e.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  const updateStatus = async (id: string, newStatus: string) => {
    // Optimistic Update
    setEscalations(prev => prev.map(item => item.id === id ? { ...item, status: newStatus } : item));

    console.log(`Attempting to update escalation ${id} to ${newStatus}...`);

    const { error, data, status, statusText } = await supabase
      .from("escalations")
      .update({ status: newStatus })
      .eq("id", id)
      .select();

    if (error) {
      console.error("Supabase Error Update:", error.message, error.details);
      // Rollback on error
      fetchEscalations();
    } else {
      console.log(`Successfully updated ${id} in Supabase. Response:`, { status, statusText, data });
    }
  };

  const isLapsed = (item: EscalationEntry) => {
    if (!item.appointment_time || item.status === 'closed') return false;
    return new Date(item.appointment_time) < new Date();
  };

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

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36 h-10 rounded-xl border-primary/10 bg-white text-xs font-bold uppercase tracking-wider">
              <div className="flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 opacity-40 text-primary" />
                <SelectValue placeholder="Status" />
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-primary/5 shadow-2xl">
              <SelectItem value="all" className="text-xs font-bold">ALL STATUS</SelectItem>
              <SelectItem value="open" className="text-xs font-bold text-secondary">OPEN</SelectItem>
              <SelectItem value="in_progress" className="text-xs font-bold text-blue-600">IN PROGRESS</SelectItem>
              <SelectItem value="closed" className="text-xs font-bold text-green-600">CLOSED</SelectItem>
            </SelectContent>
          </Select>

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-40 h-10 rounded-xl border-primary/10 bg-white text-xs font-bold uppercase tracking-wider">
              <div className="flex items-center gap-2">
                <SelectValue placeholder="Category" />
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-primary/5 shadow-2xl">
              <SelectItem value="all" className="text-xs font-bold">ALL CATEGORIES</SelectItem>
              <SelectItem value="compliance" className="text-xs font-bold">COMPLIANCE</SelectItem>
              <SelectItem value="account" className="text-xs font-bold">ACCOUNT</SelectItem>
              <SelectItem value="dispute" className="text-xs font-bold">DISPUTE</SelectItem>
              <SelectItem value="general" className="text-xs font-bold">GENERAL</SelectItem>
              <SelectItem value="other" className="text-xs font-bold">OTHER</SelectItem>
            </SelectContent>
          </Select>
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
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-primary/40">Meeting</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-primary/40">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary/5">
              {filteredEscalations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center justify-center gap-3 text-primary/20">
                      <Search className="w-10 h-10 opacity-20" />
                      <p className="font-bold text-lg">No escalations found matching filters</p>
                      <Button 
                        variant="link" 
                        onClick={() => { setSearchQuery(""); setStatusFilter("all"); setCategoryFilter("all"); }}
                        className="text-secondary font-bold text-sm h-auto p-0"
                      >
                        Clear all filters
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredEscalations.map((item) => (
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
                  <td className="px-6 py-4 whitespace-nowrap">
                    {item.cal_booking_uid ? (
                      <a 
                        href={`https://cal.com/booking/${item.cal_booking_uid}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-secondary/5 text-secondary border border-secondary/10 hover:bg-secondary/10 transition-all font-bold text-[11px]"
                      >
                        <Video className="w-3.5 h-3.5" />
                        Meeting Link
                        <ExternalLink className="w-3 h-3 opacity-40" />
                      </a>
                    ) : (
                      <span className="text-[11px] font-bold text-primary/20 italic">No Link</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <Select
                      value={item.status || 'open'}
                      onValueChange={(val) => updateStatus(item.id, val)}
                    >
                      <SelectTrigger className={cn(
                        "h-8 border-none shadow-none rounded-full px-4 text-[10px] font-bold uppercase transition-all",
                        item.status === 'closed' 
                          ? "bg-green-100 text-green-700 hover:bg-green-200" 
                          : isLapsed(item)
                            ? "bg-amber-100 text-amber-700 hover:bg-amber-200 ring-2 ring-amber-500/20"
                            : item.status === 'in_progress'
                              ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                              : "bg-secondary/10 text-secondary hover:bg-secondary/20"
                      )}>
                        <div className="flex items-center gap-1.5 ">
                          {isLapsed(item) && <AlertTriangle className="w-3 h-3 animate-pulse" />}
                          <SelectValue placeholder="Status" />
                        </div>
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl border-primary/5 shadow-2xl">
                        <SelectItem value="open" className="text-xs font-bold">OPEN</SelectItem>
                        <SelectItem value="in_progress" className="text-xs font-bold">IN_PROGRESS</SelectItem>
                        <SelectItem value="closed" className="text-xs font-bold">CLOSED</SelectItem>
                      </SelectContent>
                    </Select>
                    {isLapsed(item) && (
                      <p className="mt-1 text-[9px] font-bold text-amber-600/60 uppercase tracking-tighter px-2">Appointment Lapsed</p>
                    )}
                  </td>
                </tr>
              )))
            }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
