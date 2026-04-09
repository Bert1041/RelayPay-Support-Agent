import { useState, useEffect } from "react";
import { Phone, PhoneOutgoing, Clock, X, FileText, Loader2, MonitorSmartphone } from "lucide-react";
import { cn } from "@/shared/lib/utils";


interface VapiCall {
  id: string;
  type: string;
  createdAt: string;
  startedAt?: string;
  endedAt?: string;
  transcript?: string;
  summary?: string;
}

interface CallHistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CallHistoryPanel({ isOpen, onClose }: CallHistoryPanelProps) {
  const [calls, setCalls] = useState<VapiCall[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchCalls();
    }
  }, [isOpen]);

  const fetchCalls = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const assistantId = import.meta.env.VITE_VAPI_ASSISTANT_ID;
      const apiKey = import.meta.env.VITE_VAPI_PRIVATE_API_KEY;

      if (!assistantId) {
        throw new Error("Assistant ID is missing. Add VITE_VAPI_ASSISTANT_ID to .env");
      }
      if (!apiKey) {
        throw new Error("Private API key is missing. Add VITE_VAPI_PRIVATE_API_KEY to .env");
      }

      const url = new URL("https://api.vapi.ai/call");
      url.searchParams.append("assistantId", assistantId);

      const res = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch calls: ${res.statusText}`);
      }

      const data = await res.json();
      
      // Vapi returns an array of calls. We will optionally filter or sort them.
      // Sort by newest first:
      const sorted = (Array.isArray(data) ? data : []).sort((a, b) => {
        const timeA = new Date(a.createdAt || a.startedAt).getTime();
        const timeB = new Date(b.createdAt || b.startedAt).getTime();
        return timeB - timeA;
      });

      setCalls(sorted);
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateDuration = (start?: string, end?: string) => {
    if (!start) return "0:00 min";
    if (!end) return "Active";
    const ms = new Date(end).getTime() - new Date(start).getTime();
    if (isNaN(ms) || ms < 0) return "0:00 min";
    const min = Math.floor(ms / 60000);
    const sec = Math.floor((ms % 60000) / 1000);
    return `${min}:${sec.toString().padStart(2, "0")} min`;
  };

  const getCallIcon = (type: string) => {
    if (type === "webCall") return <MonitorSmartphone className="w-4 h-4" />;
    if (type === "outboundPhoneCall") return <PhoneOutgoing className="w-4 h-4" />;
    return <Phone className="w-4 h-4" />;
  };

  const getDisplayType = (type: string) => {
    if (type === "webCall") return "Web Call";
    if (type === "outboundPhoneCall") return "Outbound";
    if (type === "inboundPhoneCall") return "Inbound";
    return type;
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "Invalid Date";
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
    }).format(date);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300",
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      {/* Sliding Panel (Off-White Branding) */}
      <div
        className={cn(
          "fixed top-0 right-0 h-full w-full max-w-md bg-white border-l border-primary/5 shadow-2xl z-50 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex flex-col h-full p-8">
          <div className="flex items-center justify-between mb-10 pb-6 border-b border-primary/5">
            <h2 className="text-heading-sm text-primary font-bold flex items-center gap-3">
              <Clock className="w-5 h-5 text-secondary shadow-[0_0_10px_rgba(42,157,143,0.3)]" />
              Session History
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-muted text-primary/40 hover:text-primary transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-6 pr-2 custom-scrollbar">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 text-primary/30 gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-secondary" />
                <p className="font-bold tracking-widest uppercase text-[10px]">Loading Records...</p>
              </div>
            ) : error ? (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-red-500 text-body-sm text-center font-semibold shadow-xl">
                {error}
              </div>
            ) : calls.length === 0 ? (
              <div className="text-center text-primary/20 py-20 italic font-medium uppercase tracking-widest text-[11px]">
                No session data detected.
              </div>
            ) : (
              calls.map((call) => (
                <div
                  key={call.id}
                  className="bg-primary/[0.02] border border-primary/5 rounded-xl p-5 hover:bg-primary/[0.04] hover:border-secondary/30 transition-all shadow-sm group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-lg bg-primary/5 text-primary/60 group-hover:text-secondary transition-colors">
                        {getCallIcon(call.type)}
                      </div>
                      <div>
                        <p className="text-body-sm font-bold text-primary">
                          {getDisplayType(call.type)}
                        </p>
                        <p className="text-caption font-bold uppercase tracking-widest text-primary/40">
                          {formatDate(call.startedAt || call.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="text-[10px] font-bold text-primary/70 bg-primary/5 px-2.5 py-1 rounded-md border border-primary/10 uppercase tracking-widest">
                      {calculateDuration(call.startedAt, call.endedAt)}
                    </div>
                  </div>

                  {(call.summary || call.transcript) && (
                    <div className="bg-primary/5 rounded-lg p-4 mt-4 border border-primary/5 max-h-32 overflow-y-auto">
                      <p className="text-body-sm text-primary/70 flex items-start gap-3">
                        <FileText className="w-4 h-4 mt-1 shrink-0 text-primary/20" />
                        <span className="leading-relaxed font-medium">
                          {call.summary || (
                            <span className="italic opacity-60">
                              {call.transcript}
                            </span>
                          )}
                        </span>
                      </p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}
