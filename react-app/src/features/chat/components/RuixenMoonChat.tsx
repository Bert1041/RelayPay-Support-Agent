"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Textarea } from "@/shared/components/ui/textarea";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/lib/utils";
import {
  ArrowUpIcon,
  Mic,
  MicOff,
  PhoneOff,
  Keyboard,
  Clock,
  Loader2,
  LayoutDashboard,
  Zap,
  XCircle,
  Activity,
  ShieldCheck,
  SignalHigh,
  CalendarDays,
} from "lucide-react";
import { useVapi, CallStatus } from "@/features/assistant/hooks/useVapi";
import { vapi } from "@/features/assistant/vapi.sdk";
import { MessageRoleEnum, MessageTypeEnum, TranscriptMessageTypeEnum } from "@/shared/types/conversation.type";
import { VoicePoweredOrb } from "@/shared/components/ui/voice-powered-orb";
import { Link } from "react-router-dom";
import CalendarAppointmentBooking from "./CalendarAppointmentBooking";

// SYNCED PERFORMANCE OPTIONS
const ASSISTANT_OPTIONS = {
  assistantOverrides: {
    transcriber: {
      provider: "deepgram",
      model: "nova-3",
      language: "en",
      smartFormat: true,
      keywords: ["RelayPay:3", "Tega:2"],
      keyterm: ["relay pay", "account number", "transaction ID"],
      endpointing: 500,
    },
    backgroundSpeechDenoisingPlan: { smartDenoisingPlan: { enabled: true } },
    startSpeakingPlan: { waitSeconds: 0.4 },
    stopSpeakingPlan: { numWords: 2, voiceSeconds: 0.3, backoffSeconds: 1.0 },
    voice: { provider: "vapi", voiceId: "Emma", speed: 1.0 },
    endCallPhrases: ["goodbye", "bye bye", "have a great day", "farewell", "take care"],
    endCallMessage: "Thank you for calling RelayPay. Have a great day!",
  },
};

interface AutoResizeProps {
  minHeight: number;
  maxHeight?: number;
}

function useAutoResizeTextarea({ minHeight, maxHeight }: AutoResizeProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = useCallback(
    (reset?: boolean) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      if (reset) {
        textarea.style.height = `${minHeight}px`;
        return;
      }

      textarea.style.height = `${minHeight}px`;
      const newHeight = Math.max(
        minHeight,
        Math.min(textarea.scrollHeight, maxHeight ?? Infinity)
      );
      textarea.style.height = `${newHeight}px`;
    },
    [minHeight, maxHeight]
  );

  return { textareaRef, adjustHeight };
}

export default function RuixenMoonChat() {
  const [message, setMessage] = useState("");
  const { 
    callStatus, 
    toggleCall, 
    activeTranscript, 
    messages, 
    clearMessages,
    addMessage,
    isSpeechActive 
  } = useVapi(ASSISTANT_OPTIONS);

  const [showCalendar, setShowCalendar] = useState(false);
  const [sessionTime, setSessionTime] = useState(0);
  const [lastTriggeredIndex, setLastTriggeredIndex] = useState(-1);

  const { textareaRef, adjustHeight } = useAutoResizeTextarea({
    minHeight: 56,
    maxHeight: 200,
  });

  const scrollRef = useRef<HTMLDivElement>(null);

  const isActive = callStatus === CallStatus.ACTIVE;
  const isLoading = callStatus === CallStatus.LOADING;
  const isInactive = callStatus === CallStatus.INACTIVE;

  // Session Timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive) {
      interval = setInterval(() => {
        setSessionTime(prev => prev + 1);
      }, 1000);
    } else {
      setSessionTime(0);
    }
    return () => clearInterval(interval);
  }, [isActive]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Auto-reset chat session when call ends
  useEffect(() => {
    if (isInactive) {
      clearMessages();
      setMessage("");
      setShowCalendar(false);
      adjustHeight(true);
    }
  }, [isInactive, clearMessages, adjustHeight]);

  const isDetailsCaptured = useCallback(() => {
    // Robust detection for email patterns in any message turn
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
    return messages.some(m => {
      const text = (m.type === MessageTypeEnum.TRANSCRIPT) ? m.transcript : (m as any).content;
      return emailRegex.test(text || "");
    });
  }, [messages]);

  // Handle Session Termination
  const handleStopCall = () => {
    toggleCall();
    setLastTriggeredIndex(-1);
    setShowCalendar(false);
  };

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth"
      });
    }
  }, [messages, activeTranscript]);

  // Robust Intent Detection: Show calendar when callback/schedule/time is mentioned
  useEffect(() => {
    const keywords = ["callback", "schedule", "appointment", "call you back", "booking", "pick a time", "preferred time"];
    
    // Check finished messages (Turn-based suppression)
    if (messages.length > 0) {
      const lastIndex = messages.length - 1;
      const lastMessage = messages[lastIndex];
      
      if (lastMessage.role === MessageRoleEnum.ASSISTANT && lastIndex > lastTriggeredIndex) {
        const text = (lastMessage.type === MessageTypeEnum.TRANSCRIPT) ? lastMessage.transcript : (lastMessage as any).content;
        const lowerText = text?.toLowerCase() || "";
        
        // Don't pop if the USER just confirmed a schedule in the previous turn
        const prevUserMessage = messages[lastIndex - 1];
        const userJustScheduled = prevUserMessage?.role === MessageRoleEnum.USER && 
                                (prevUserMessage as any).content?.toLowerCase().includes("schedule the callback");

        const detailsCompleted = isDetailsCaptured();

        if (keywords.some(k => lowerText.includes(k)) && !showCalendar && !userJustScheduled && detailsCompleted) {
          setShowCalendar(true);
          setLastTriggeredIndex(lastIndex);
        }
      }
    }

    // Check active transcript (Instant reaction)
    if (activeTranscript && activeTranscript.role === MessageRoleEnum.ASSISTANT && messages.length > lastTriggeredIndex) {
      const lowerText = activeTranscript.transcript?.toLowerCase() || "";
      const detailsCompleted = isDetailsCaptured();

      if (keywords.some(k => lowerText.includes(k)) && !showCalendar && detailsCompleted) {
        // Only trigger if this specific text hasn't been "sent" to a finalized message yet
        setShowCalendar(true);
        // We don't set lastTriggeredIndex here because the message index hasn't updated yet
      }
    }
  }, [messages, activeTranscript, showCalendar, lastTriggeredIndex, isDetailsCaptured]);

  const handleSend = () => {
    if (!message.trim()) return;

    if (isActive) {
      vapi.send({
        type: MessageTypeEnum.ADD_MESSAGE,
        message: {
          role: MessageRoleEnum.USER,
          content: message,
        },
      });

      addMessage({
        type: MessageTypeEnum.TRANSCRIPT,
        role: MessageRoleEnum.USER,
        transcriptType: TranscriptMessageTypeEnum.FINAL,
        transcript: message
      });
    }

    setMessage("");
    adjustHeight(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCalendarConfirm = (date: Date, time: string) => {
    const dateStr = date.toLocaleDateString('en-US', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });
    const finalMessage = `I'd like to schedule the callback protocol for ${dateStr} at ${time}.`;
    
    if (isActive) {
      vapi.send({
        type: MessageTypeEnum.ADD_MESSAGE,
        message: {
          role: MessageRoleEnum.USER,
          content: finalMessage,
        },
      });

      addMessage({
        type: MessageTypeEnum.TRANSCRIPT,
        role: MessageRoleEnum.USER,
        transcriptType: TranscriptMessageTypeEnum.FINAL,
        transcript: finalMessage
      });
    }
    
    setShowCalendar(false);
  };

  return (
    <div className="relative w-full h-screen bg-[#F8F9FA] text-[#14213D] flex flex-col overflow-hidden font-outfit">
      
      {/* Background - Discrete Fintech Grid */}
      <div className="absolute inset-0 z-0 opacity-[0.02] pointer-events-none">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1.2"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* --- FLUID ORB --- */}
      <div 
        className={cn(
          "absolute transition-all duration-1000 cubic-bezier(0.23, 1, 0.32, 1)",
          isActive 
            ? "z-30 top-6 left-12 w-16 h-16" 
            : "z-10 top-[35%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 md:w-[420px] md:h-[420px] pointer-events-none"
        )}
      >
        <div className="relative w-full h-full">
           <VoicePoweredOrb 
            enableVoiceControl={isActive} 
            hue={isActive ? 180 : 210}
            voiceSensitivity={1.4}
            className="rounded-full shadow-[0_10px_40px_rgba(20,33,61,0.08)]"
          />
          {isActive && (
            <div className="absolute inset-0 border-2 border-[#2A9D8F]/10 rounded-full animate-ping pointer-events-none" style={{ animationDuration: '4s' }} />
          )}
        </div>
      </div>

      {/* --- STANDBY HERO (Restored visibility logic) --- */}
      {!isActive && !isLoading && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center px-8 text-center animate-in fade-in duration-1000 pointer-events-none">
           <h1 className="text-5xl md:text-7xl font-bold mb-8 tracking-tight text-[#14213D]">
            Intelligence <span className="text-[#2A9D8F] font-medium">Protocol</span>
           </h1>
          <Button
            onClick={toggleCall}
            size="lg"
            className="rounded-full px-16 py-10 text-base font-bold uppercase tracking-[0.2em] bg-[#14213D] text-white hover:scale-105 transition-all duration-500 shadow-2xl active:scale-95 group pointer-events-auto"
          >
            <Mic className="w-6 h-6 mr-4 group-hover:scale-110 transition-transform opacity-70" />
            Connect Agent
          </Button>
        </div>
      )}

      {/* Header - Global Spanning */}
      <nav className="relative z-[60] w-full px-12 py-5 flex justify-between items-center bg-white/30 backdrop-blur-md border-b border-[#14213D]/5">
        <div className="flex items-center gap-6 min-w-[240px]">
           <div className={cn("transition-all duration-1000", isActive ? "w-20" : "w-0")} />
           {isActive ? (
             <div className="flex flex-col animate-in fade-in slide-in-from-left-4 text-left">
                <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#14213D]/60 whitespace-nowrap">RelayPay AI</span>
                <span className="text-[8px] font-semibold text-[#2A9D8F] uppercase tracking-[0.1em] flex items-center gap-1">
                  <Zap className="w-2.5 h-2.5 fill-current" /> Nova-3 Protocol
                </span>
             </div>
           ) : (
             <img src="/logo.png" alt="RelayPay" className="h-7 object-contain" />
           )}
        </div>

        <div className="flex items-center gap-6 pointer-events-auto">
          <Link to="/">
            <Button variant="ghost" size="sm" className="text-[#14213D]/60 hover:text-[#2A9D8F] uppercase text-[9px] font-semibold tracking-[0.2em]">
              <LayoutDashboard className="w-3.5 h-3.5 mr-2" /> Portal
            </Button>
          </Link>
          {isActive && <div className="h-4 w-px bg-[#14213D]/10 mx-2" />}
          {isActive && <img src="/logo.png" alt="RelayPay" className="h-7 object-contain" />}
        </div>
      </nav>

      <main className="flex-1 flex overflow-hidden">
        
        {/* --- CONVERSATION MODE (MAIN PANEL) --- */}
        <div className={cn(
          "relative z-[10] flex-1 flex flex-col items-center overflow-hidden transition-all duration-1000",
          isActive ? "opacity-100" : "opacity-0 pointer-events-none"
        )}>
          <div 
            ref={scrollRef}
            className="w-full h-full overflow-y-auto px-10 md:px-20 custom-scrollbar scroll-smooth pb-48 pt-24 items-center flex flex-col"
          >
            <div className="w-full max-w-3xl space-y-12">
              {messages.map((msg, i) => {
                const isUser = msg.role === MessageRoleEnum.USER;
                const text = (msg.type === MessageTypeEnum.TRANSCRIPT) ? msg.transcript : (msg as any).content;
                if (!text || text.trim() === "") return null;

                return (
                  <div 
                    key={i} 
                    className={cn(
                      "flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500",
                      isUser ? "items-end text-right" : "items-start text-left"
                    )}
                  >
                    <div className="flex items-center gap-2 mb-2 px-3">
                      <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#14213D]/40">
                        {isUser ? "Authenticated User" : "RelayPay Assistant"}
                      </span>
                    </div>
                    <div 
                      className={cn(
                        "max-w-[85%] p-7 rounded-[2rem] text-[15px] font-medium leading-relaxed transition-all shadow-md",
                        isUser 
                          ? "bg-white text-[#14213D] border border-[#14213D]/5" 
                          : "bg-[#2A9D8F] text-white shadow-lg shadow-[#2A9D8F]/20"
                      )}
                      style={isUser ? { borderBottomRightRadius: '0.4rem' } : { borderBottomLeftRadius: '0.4rem' }}
                    >
                      {text}
                    </div>
                  </div>
                );
              })}

              {activeTranscript && (
                <div className={cn(
                   "flex flex-col animate-pulse",
                   activeTranscript.role === MessageRoleEnum.USER ? "items-end" : "items-start"
                )}>
                  <div className="max-w-[75%] p-7 rounded-[2rem] bg-[#14213D]/5 border border-[#14213D]/10 text-[#14213D] text-[14px] font-semibold italic">
                    {activeTranscript.transcript}...
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* --- LIVE SESSION PANEL (SIDE VIEW) --- */}
        <div className={cn(
          "w-96 border-l border-[#14213D]/5 bg-white transition-all duration-1000 overflow-hidden flex flex-col",
          isActive ? "mr-0 opacity-100" : "-mr-96 opacity-0"
        )}>
          <div className="p-8 space-y-10 flex-1 overflow-y-auto custom-scrollbar">
            
            <div className="space-y-4">
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#14213D]/50 border-b border-[#14213D]/5 pb-2 block w-full">Session Monitor</span>
              <div className="bg-[#F8F9FA] rounded-2xl p-6 border border-[#14213D]/5 space-y-6">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#2A9D8F]/10 rounded-lg">
                      <Clock className="w-4 h-4 text-[#2A9D8F]" />
                    </div>
                    <span className="text-xs font-bold text-[#14213D]/80 uppercase tracking-widest">Live Duration</span>
                  </div>
                  <span className="text-xl font-bold font-mono tracking-tight text-[#14213D]">{formatTime(sessionTime)}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/10 rounded-lg">
                      <Activity className="w-4 h-4 text-blue-500" />
                    </div>
                    <span className="text-xs font-bold text-[#14213D]/60 uppercase tracking-widest">AI Load</span>
                  </div>
                  <span className="text-xs font-black text-[#14213D]">0.4ms</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#14213D]/30">Live Intelligence</span>
              <div className="space-y-3">
                 <div className="flex items-center justify-between p-4 px-5 bg-white border border-[#14213D]/5 rounded-xl shadow-sm">
                   <div className="flex items-center gap-3">
                     <ShieldCheck className="w-4 h-4 text-[#2A9D8F]" />
                     <span className="text-[11px] font-bold text-[#14213D]/80">Authenticated Stream</span>
                   </div>
                   <div className="w-2 h-2 rounded-full bg-[#2A9D8F] animate-pulse" />
                 </div>
                 <div className="flex items-center justify-between p-4 px-5 bg-white border border-[#14213D]/5 rounded-xl shadow-sm">
                   <div className="flex items-center gap-3">
                     <SignalHigh className="w-4 h-4 text-[#2A9D8F]" />
                     <span className="text-[11px] font-bold text-[#14213D]/80">Deepgram Nova-3</span>
                   </div>
                   <span className="text-[9px] font-black text-[#2A9D8F]">CONNECTED</span>
                 </div>
              </div>
            </div>

            <div className="pt-20 text-center space-y-6">
               <div className="flex flex-col items-center justify-center p-8 bg-[#F8F9FA] rounded-3xl border border-dashed border-[#14213D]/10">
                  <p className="text-[10px] font-bold text-[#14213D]/30 uppercase tracking-[0.2em] leading-relaxed">
                    AI AGENT MONITORING SESSION<br/>SECURE PROTOCOL ACTIVE
                  </p>
               </div>
            </div>

          </div>
        </div>

      </main>

      {/* --- REFINED SEAMLESS INPUT BAR (Centered relative to chat) --- */}
      <div className={cn(
        "fixed bottom-12 z-[70] w-full max-w-3xl px-6 transition-all duration-1000 delay-500",
        isActive ? "left-1/2 -translate-x-[calc(50%+192px)]" : "left-1/2 -translate-x-1/2",
        isActive ? "translate-y-0 opacity-100 scale-100" : "translate-y-16 opacity-0 scale-95 pointer-events-none"
      )}>
        <div className="bg-white rounded-[3.5rem] shadow-[0_40px_100px_rgba(20,33,61,0.2)] border border-[#14213D]/5 overflow-hidden ring-1 ring-black/[0.04]">
          
          <div className="relative flex items-center p-3 px-8 gap-5">
            {/* HIGH-VISIBILITY END CALL */}
             <Button
               onClick={handleStopCall}
               className="w-14 h-14 rounded-full flex items-center justify-center bg-red-500 text-white shadow-lg shadow-red-500/30 hover:bg-red-600 transition-all group scale-90"
               title="End Session"
            >
              <PhoneOff className="w-6 h-6 group-hover:rotate-12 transition-transform" />
            </Button>

            <div className="h-8 w-px bg-[#14213D]/5" />

            <Button
               onClick={() => setShowCalendar(true)}
               variant="ghost"
               className={cn(
                 "w-12 h-12 rounded-full flex items-center justify-center transition-all",
                 showCalendar ? "bg-[#2A9D8F]/10 text-[#2A9D8F]" : "hover:bg-neutral-50 text-[#14213D]/20"
               )}
               title="Manual Calendar Override"
            >
              <CalendarDays className="w-5 h-5" />
            </Button>

            <Button
               onClick={toggleCall}
               variant="ghost"
               className={cn(
                 "w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300",
                 isSpeechActive ? "bg-red-50 text-red-500 scale-110" : "hover:bg-neutral-50 text-[#14213D]/20"
               )}
            >
              {isSpeechActive ? <Mic className="w-5 h-5 animate-pulse" /> : <MicOff className="w-5 h-5" />}
            </Button>

            <Textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                adjustHeight();
              }}
              onKeyDown={handleKeyDown}
              placeholder="Inject manual protocol override..."
              className={cn(
                "flex-1 py-4 resize-none border-none bg-transparent text-[#14213D] text-sm font-normal",
                "focus-visible:ring-0 focus-visible:ring-offset-0",
                "placeholder:text-[#14213D]/10 min-h-[52px]"
              )}
              style={{ overflow: "hidden" }}
            />
            
            <Button
              onClick={handleSend}
              disabled={!message.trim()}
              className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500 shadow-xl",
                message.trim() 
                  ? "bg-[#14213D] text-white hover:bg-black shadow-[#14213D]/30 scale-105" 
                  : "bg-neutral-50 text-neutral-200"
              )}
            >
              <ArrowUpIcon className="w-5 h-5" />
            </Button>
          </div>
          
          {/* High-Contrast Feedback Bar */}
          <div className="px-10 py-2 bg-[#F8F9FA] border-t border-[#14213D]/5 flex justify-between items-center bg-gradient-to-r from-white to-[#F8F9FA]">
              <div className="flex items-center gap-3">
                <div className={cn("w-2 h-2 rounded-full", isSpeechActive ? "bg-red-500 animate-pulse" : "bg-[#2A9D8F]")} />
                <span className="text-[9px] font-bold text-[#14213D]/60 uppercase tracking-[0.3em]">
                  {isSpeechActive ? "Voice Stream Active" : "Synchronized Protocol v3.0"}
                </span>
              </div>
              <span className="text-[7px] font-black uppercase tracking-[0.5em] text-[#14213D]/10">Authenticated Link</span>
          </div>
        </div>
      </div>

      {/* --- SMART CALENDAR OVERLAY --- */}
      <div className={cn(
        "fixed inset-0 z-[100] flex items-center justify-center p-6 transition-all duration-700",
        showCalendar ? "bg-[#14213D]/40 backdrop-blur-md opacity-100" : "opacity-0 pointer-events-none"
      )}>
        <div className={cn(
          "w-full max-w-2xl transform transition-all duration-700",
          showCalendar ? "translate-y-0 scale-100" : "translate-y-12 scale-95"
        )}>
          <CalendarAppointmentBooking 
            onConfirm={handleCalendarConfirm}
            onCancel={() => setShowCalendar(false)}
          />
        </div>
      </div>

    </div>
  );
}
