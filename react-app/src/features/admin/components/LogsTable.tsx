import { Search, MessageSquare, Brain, AlertCircle, Clock, RefreshCw, Layers, ChevronRight, X, User } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/shared/lib/supabase";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/lib/utils";
import { ScrollArea } from "@/shared/components/ui/scroll-area";

interface ConversationLog {
  id: string;
  created_at: string;
  call_id: string;
  turn: number;
  role: "assistant" | "user";
  content: string;
  intent: string | null;
  rag_chunks_used: number | null;
  escalation_triggered: boolean;
}

interface ConversationSession {
  call_id: string;
  turns: ConversationLog[];
  start_time: string;
  last_activity: string;
  total_turns: number;
  has_escalation: boolean;
  primary_intent: string | null;
}

const MOCK_LOGS: ConversationLog[] = [
  { id: "l1", created_at: new Date(Date.now() - 60000).toISOString(), call_id: "call_abc", turn: 1, role: "user", content: "I need to check my international transfer status.", intent: "check_transfer", rag_chunks_used: 0, escalation_triggered: false },
  { id: "l2", created_at: new Date(Date.now() - 55000).toISOString(), call_id: "call_abc", turn: 2, role: "assistant", content: "I can certainly help with that. Are you referring to the $500 transfer to London?", intent: "confirm_transfer", rag_chunks_used: 2, escalation_triggered: false },
  { id: "l3", created_at: new Date(Date.now() - 50000).toISOString(), call_id: "call_abc", turn: 3, role: "user", content: "Actually, it was a $1,200 transfer to Singapore. It's urgent!", intent: "correction", rag_chunks_used: 1, escalation_triggered: true },
  { id: "l4", created_at: new Date(Date.now() - 120000).toISOString(), call_id: "call_xyz", turn: 1, role: "user", content: "How do I change my PIN?", intent: "change_pin", rag_chunks_used: 0, escalation_triggered: false },
  { id: "l5", created_at: new Date(Date.now() - 110000).toISOString(), call_id: "call_xyz", turn: 2, role: "assistant", content: "You can change your PIN under 'Security Settings' in the Mobile App.", intent: "security_instructions", rag_chunks_used: 1, escalation_triggered: false },
];

export const LogsTable = ({ onTitleClick }: { onTitleClick?: () => void }) => {
  const [logs, setLogs] = useState<ConversationLog[]>(MOCK_LOGS);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSession, setSelectedSession] = useState<ConversationSession | null>(null);
  const transcriptScrollRef = useRef<HTMLDivElement>(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("conversation_log")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) throw error;
      if (data && data.length > 0) {
        setLogs(data as ConversationLog[]);
      }
    } catch (err) {
      console.warn("Using mock conversation sessions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const hasConfig = import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY;
    if (hasConfig) fetchLogs();
  }, []);

  const scrollToTranscriptTop = () => {
    transcriptScrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Group logs into sessions
  const sessions: ConversationSession[] = logs.reduce((acc: ConversationSession[], log) => {
    const session = acc.find(s => s.call_id === log.call_id);
    if (session) {
      session.turns.push(log);
      session.total_turns += 1;
      session.last_activity = log.created_at;
      if (log.escalation_triggered) session.has_escalation = true;
      if (log.turn === session.total_turns) session.primary_intent = log.intent;
    } else {
      acc.push({
        call_id: log.call_id,
        turns: [log],
        start_time: log.created_at,
        last_activity: log.created_at,
        total_turns: 1,
        has_escalation: log.escalation_triggered,
        primary_intent: log.intent
      });
    }
    return acc;
  }, []);

  const sortedSessions = sessions.sort((a, b) => 
    new Date(b.last_activity).getTime() - new Date(a.last_activity).getTime()
  );

  const filteredSessions = sortedSessions.filter(session => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      session.call_id.toLowerCase().includes(query) ||
      session.primary_intent?.toLowerCase().includes(query) ||
      session.turns.some(t => t.content.toLowerCase().includes(query))
    );
  });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div 
          onClick={onTitleClick}
          className="cursor-pointer group select-none"
        >
          <h2 className="text-2xl font-bold text-primary group-hover:text-secondary group-active:scale-[0.98] transition-all">
            Conversation Logs
          </h2>
          <p className="text-primary/40 text-sm font-medium">Session-first analysis of intelligence interactions.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/30" />
            <input
              type="text"
              placeholder="Search conversations..."
              className="pl-10 pr-4 py-2 rounded-xl border border-primary/10 bg-white focus:outline-none focus:ring-2 focus:ring-secondary/20 transition-all text-sm w-72 shadow-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button 
            variant="outline" 
            onClick={fetchLogs}
            disabled={loading}
            className="rounded-xl border-primary/10 hover:bg-primary/5 shadow-sm"
          >
            <RefreshCw className={cn("w-4 h-4 mr-2", loading && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-primary/5 shadow-xl shadow-primary/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-primary/[0.02] border-b border-primary/5">
                <th className="px-8 py-5 text-xs font-bold uppercase tracking-widest text-primary/30">Session ID</th>
                <th className="px-8 py-5 text-xs font-bold uppercase tracking-widest text-primary/30 text-center">Turns</th>
                <th className="px-8 py-5 text-xs font-bold uppercase tracking-widest text-primary/30">Latest Intent</th>
                <th className="px-8 py-5 text-xs font-bold uppercase tracking-widest text-primary/30">Status</th>
                <th className="px-8 py-5 text-xs font-bold uppercase tracking-widest text-primary/30 text-right">Last Activity</th>
                <th className="px-8 py-5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary/5">
              {filteredSessions.map((session) => (
                <tr 
                  key={session.call_id} 
                  onClick={() => setSelectedSession(session)}
                  className="hover:bg-primary/[0.01] cursor-pointer transition-colors group"
                >
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-primary/5 text-primary rounded-xl">
                        <MessageSquare className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-bold text-primary font-mono">{session.call_id.substring(0, 12)}...</span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <span className="text-xs font-black text-primary/40 bg-primary/5 px-2.5 py-1 rounded-lg">
                       {session.total_turns.toString().padStart(2, '0')}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    {session.primary_intent ? (
                      <span className="text-[10px] font-bold bg-secondary/10 text-secondary px-2.5 py-1 rounded-lg border border-secondary/20 uppercase tracking-widest">
                        {session.primary_intent.replace(/_/g, " ")}
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-primary/20 uppercase italic">General Inquiry</span>
                    )}
                  </td>
                  <td className="px-8 py-6">
                    {session.has_escalation && (
                      <div className="flex items-center gap-1.5 text-amber-600 animate-pulse">
                        <AlertCircle className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Escalated</span>
                      </div>
                    )}
                  </td>
                  <td className="px-8 py-6 text-right">
                    <span className="text-sm font-medium text-primary/40 whitespace-nowrap">
                      {new Date(session.last_activity).toLocaleTimeString()}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <Button variant="ghost" size="icon" className="text-primary/20 group-hover:text-primary transition-all">
                      <ChevronRight className="w-5 h-5" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredSessions.length === 0 && (
          <div className="py-24 flex flex-col items-center justify-center text-primary/10 gap-6">
            <MessageSquare className="w-16 h-16 opacity-10" />
            <div className="text-center">
              <p className="text-base font-bold text-primary/30 mb-1 italic">No sessions found</p>
              <p className="text-xs font-bold uppercase tracking-[0.2em] opacity-20">Try broadening your parameters</p>
            </div>
          </div>
        )}

        <div className="px-8 py-6 bg-primary/[0.02] border-t border-primary/5 flex items-center justify-between">
          <p className="text-[10px] font-bold text-primary/20 uppercase tracking-[0.2em]">
             Cluster Signal: <span className="text-primary/40">Active Phase</span> — {filteredSessions.length} Sessions
          </p>
          <div className="flex gap-4">
             <Button disabled variant="ghost" size="sm" className="text-[10px] font-bold uppercase tracking-widest text-primary/40 hover:text-primary transition-all">Previous</Button>
             <div className="w-px h-10 bg-primary/5" />
             <Button disabled variant="ghost" size="sm" className="text-[10px] font-bold uppercase tracking-widest text-primary/40 hover:text-primary transition-all">Next</Button>
          </div>
        </div>
      </div>

      {/* Transcript Drawer */}
      {selectedSession && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div className="absolute inset-0 bg-primary/10 backdrop-blur-sm animate-in fade-in" onClick={() => setSelectedSession(null)} />
          <div className="relative w-full max-w-2xl bg-[#F8F9FA] h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-500 rounded-l-[3rem] border-l border-white/50">
            {/* Drawer Header */}
            <div className="p-10 border-b border-primary/5 flex items-center justify-between">
              <div>
                <div 
                  onClick={scrollToTranscriptTop}
                  className="flex items-center gap-3 mb-2 cursor-pointer group select-none"
                >
                  <h3 className="text-2xl font-bold text-primary tracking-tight group-hover:text-secondary group-active:scale-[0.98] transition-all">Transcript</h3>
                  <div className="px-2.5 py-1 bg-primary text-white text-[10px] font-bold rounded-lg uppercase tracking-widest">SESSION ID: {selectedSession.call_id.substring(0, 8)}</div>
                </div>
                <div className="flex items-center gap-4 text-xs font-bold text-primary/40 uppercase tracking-widest">
                  <div className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {new Date(selectedSession.start_time).toLocaleTimeString()}</div>
                  <div className="w-1 h-1 rounded-full bg-primary/10" />
                  <div className="flex items-center gap-1.5"><MessageSquare className="w-3.5 h-3.5" /> {selectedSession.total_turns} Turns</div>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setSelectedSession(null)}
                className="w-12 h-12 rounded-2xl bg-white border border-primary/5 hover:bg-primary/5 text-primary/40 hover:text-primary transition-all shadow-sm"
              >
                <X className="w-6 h-6" />
              </Button>
            </div>

            {/* Transcript Area */}
            <div 
              ref={transcriptScrollRef}
              className="flex-1 px-10 py-12 overflow-y-auto scroll-smooth"
            >
              <div className="space-y-8 max-w-lg mx-auto pb-20">
                {selectedSession.turns.map((turn) => (
                  <div 
                    key={turn.id} 
                    className={cn(
                      "flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-2",
                      turn.role === 'user' ? "items-start" : "items-end"
                    )}
                  >
                    <div className={cn(
                      "group relative px-6 py-4 rounded-[1.75rem] shadow-sm max-w-[90%] transition-all hover:shadow-md",
                      turn.role === 'user' 
                        ? "bg-white border border-primary/5 text-primary/80 rounded-tl-none" 
                        : "bg-primary text-white rounded-tr-none shadow-lg shadow-primary/10"
                    )}>
                      <p className="text-sm font-medium leading-relaxed italic">
                        "{turn.content}"
                      </p>
                      
                      {/* Intelligence Overlay */}
                      <div className={cn(
                        "mt-4 flex flex-wrap gap-2 pt-3 border-t",
                        turn.role === 'user' ? "border-primary/5" : "border-white/10"
                      )}>
                        {turn.intent && (
                          <div className={cn(
                             "px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest",
                             turn.role === 'user' ? "bg-secondary/10 text-secondary" : "bg-white/10 text-white"
                          )}>
                             {turn.intent.replace(/_/g, " ")}
                          </div>
                        )}
                        {turn.rag_chunks_used !== null && turn.rag_chunks_used > 0 && (
                           <div className={cn(
                             "flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border",
                             turn.role === 'user' ? "border-primary/5 text-primary/30" : "border-white/10 text-white/40"
                           )}>
                             <Layers className="w-2.5 h-2.5" />
                             {turn.rag_chunks_used} VECTOR UNITS
                           </div>
                        )}
                      </div>

                      {turn.escalation_triggered && (
                        <div className="absolute -top-3 -left-3 p-1.5 bg-amber-500 text-white rounded-full shadow-lg animate-bounce">
                           <AlertCircle className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 px-2">
                      <div className={cn(
                        "p-1 rounded-md",
                        turn.role === 'user' ? "bg-secondary/10 text-secondary" : "bg-primary/10 text-primary"
                      )}>
                        {turn.role === 'user' ? <User className="w-2.5 h-2.5" /> : <Brain className="w-2.5 h-2.5" />}
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-primary/20">{turn.role}</span>
                      <span className="text-[9px] font-bold text-primary/10 font-mono">#{turn.turn}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Drawer Footer */}
            <div className="p-10 bg-white/50 border-t border-primary/5 flex items-center justify-between gap-4">
               <div className="flex -space-x-2">
                 {[1,2,3].map(i => (
                   <div key={i} className="w-8 h-8 rounded-full border-2 border-[#F8F9FA] bg-primary/5 flex items-center justify-center text-[10px] font-bold text-primary/20">A{i}</div>
                 ))}
               </div>
               <p className="text-[10px] font-black uppercase tracking-widest text-primary/20 flex-1 px-4">RelayPay Intelligence Audit — System Secure</p>
               <Button variant="ghost" className="text-[10px] font-black uppercase tracking-widest text-secondary hover:text-secondary/80">Export Logs</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
