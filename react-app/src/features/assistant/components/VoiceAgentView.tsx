import { useState, useEffect, useRef } from "react";
import { useVapi, CallStatus } from "../hooks/useVapi";
import { VoicePoweredOrb } from "@/shared/components/ui/voice-powered-orb";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/lib/utils";
import { CallHistoryPanel } from "./CallHistoryPanel";
import {
  Mic,
  MicOff,
  Loader2,
  Phone,
  PhoneOff,
  History,
  AlertTriangle,
  MessageSquare,
  Activity,
} from "lucide-react";
import {
  MessageTypeEnum,
  MessageRoleEnum,
  type TranscriptMessage,
} from "@/shared/types/conversation.type";

const ASSISTANT_OPTIONS = {
  assistantOverrides: {
    // Transcriber: Deepgram Nova-3 with keyword boosting
    transcriber: {
      provider: "deepgram",
      model: "nova-3",
      language: "en",
      smartFormat: true,
      keywords: ["RelayPay:3", "Tega:2"],
      keyterm: ["relay pay", "account number", "transaction ID"],
      endpointing: 500,
    },

    // Smart background noise removal
    backgroundSpeechDenoisingPlan: {
      smartDenoisingPlan: { enabled: true },
    },

    // Wait for user to finish speaking before replying
    startSpeakingPlan: {
      waitSeconds: 0.4,
    },

    // Reduce accidental interruptions
    stopSpeakingPlan: {
      numWords: 2,
      voiceSeconds: 0.3,
      backoffSeconds: 1.0,
    },

    // Voice: Snappy speaking rate (Required fields added to avoid 400)
    voice: {
      provider: "vapi",
      voiceId: "Emma",
      speed: 1.0,
    },

    // Automatic Hang-up configuration
    endCallPhrases: ["goodbye", "bye bye", "have a great day", "farewell", "take care"],
    endCallMessage: "Thank you for calling RelayPay. Have a great day!",
  },
};

export default function VoiceAgentView() {
  const {
    isSpeechActive,
    callStatus,
    audioLevel,
    activeTranscript,
    messages,
    error,
    toggleCall,
  } = useVapi(ASSISTANT_OPTIONS);

  const [voiceDetected, setVoiceDetected] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const isActive = callStatus === CallStatus.ACTIVE;
  const isLoading = callStatus === CallStatus.LOADING;
  const isInactive = callStatus === CallStatus.INACTIVE;

  // Filter only transcript messages for display
  const transcripts = messages.filter(
    (m): m is TranscriptMessage => m.type === MessageTypeEnum.TRANSCRIPT
  );

  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new transcription
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth"
      });
    }
  }, [transcripts, activeTranscript]);

  return (
    <div className={cn(
      "relative w-full min-h-screen bg-[#F8F9FA] text-[#14213D] flex flex-col items-center transition-all duration-500 overflow-hidden",
      isActive && "md:pl-80"
    )}>
      
      {/* Background Fintech Grid Texture (Subtle) */}
      <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>
      
      {/* Top Header / Logo (RelayPay Branded) */}
      <div className="w-full flex items-center justify-between px-6 md:px-12 py-8 z-20">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="RelayPay" className="h-8 md:h-12 object-contain" />
        </div>
        
        <button
          onClick={() => setIsHistoryOpen(true)}
          className="flex items-center gap-3 px-5 py-2.5 rounded-full border border-primary/10 bg-white shadow-lg hover:bg-muted transition-all group"
        >
          <History className="w-4 h-4 text-secondary group-hover:scale-110 transition-transform shadow-[0_0_10px_rgba(42,157,143,0.3)]" />
          <span className="text-body-sm font-bold text-primary/80">Session Logs</span>
        </button>
      </div>

      <CallHistoryPanel isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 w-full max-w-5xl px-6 md:px-12 flex flex-col items-center justify-center z-10">
        {/* Connection Status Label */}
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="flex items-center gap-2 mb-2 bg-primary/5 border border-primary/10 px-4 py-1.5 rounded-full">
            <div className={cn(
              "w-2 h-2 rounded-full",
              isActive ? "bg-secondary animate-pulse shadow-[0_0_10px_rgba(42,157,143,0.5)]" : (isLoading ? "bg-secondary/40" : "bg-neutral-300")
            )} />
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary/60">
              {isActive ? "Secure Connection Active" : (isLoading ? "Connecting Signal..." : "Agent Standby")}
            </p>
          </div>
          <h1 className="text-heading-lg font-bold tracking-tight text-primary">Advanced Voice Support</h1>
        </div>

        {/* Branded Voice Powered Orb */}
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <div className="relative">
            <div className={cn(
              "w-72 h-72 md:w-[450px] md:h-[450px] transition-all duration-1000",
              isActive && isSpeechActive && "scale-105",
              isActive && !isSpeechActive && "scale-100 opacity-90",
              isLoading && "scale-95 opacity-50 grayscale"
            )}>
              <VoicePoweredOrb
                enableVoiceControl={isActive && !isSpeechActive}
                hue={180} // Consistent RelayPay Teal Blue Accent
                voiceSensitivity={1.8}
                maxRotationSpeed={isActive ? 1.5 + audioLevel * 2 : 0.4}
                maxHoverIntensity={isActive ? 0.6 + audioLevel * 0.5 : 0.1}
                onVoiceDetected={setVoiceDetected}
                className="rounded-full overflow-hidden"
              />
            </div>
            
            {/* Audio level pulsing rings */}
            {isActive && (
              <div
                className="absolute inset-0 rounded-full border-4 border-secondary/20 pointer-events-none transition-all duration-150"
                style={{
                  transform: `scale(${1 + audioLevel * 0.25})`,
                  opacity: 0.1 + audioLevel * 0.4,
                }}
              />
            )}

            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-center whitespace-nowrap">
              <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-secondary">
                {isActive ? (isSpeechActive ? "Agent Transmitting" : "Awaiting User Input") : "Idle Standby"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Live Transcript Sidebar (Off-White Branding) */}
      {isActive && (
        <div className="fixed top-0 left-0 h-full w-full max-w-xs bg-white border-r border-primary/5 z-30 shadow-2xl animate-in slide-in-from-left duration-700">
          <div className="flex flex-col h-full p-8">
            <div className="flex items-center gap-3 mb-10 pb-6 border-b border-primary/5">
              <div className="p-2 rounded-xl bg-secondary/10 text-secondary">
                <MessageSquare className="w-5 h-5 shadow-[0_0_15px_rgba(42,157,143,0.3)]" />
              </div>
              <h2 className="text-heading-sm text-primary font-bold tracking-tight">Active Transcript</h2>
            </div>

            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto space-y-6 pr-2 custom-scrollbar scroll-smooth"
            >
              {transcripts.length === 0 && !activeTranscript ? (
                <div className="h-full flex flex-col items-center justify-center text-primary/20 gap-4">
                  <Activity className="w-8 h-8 animate-pulse opacity-20" />
                  <p className="text-body-sm font-semibold tracking-widest uppercase opacity-30">Awaiting Signal...</p>
                </div>
              ) : (
                <>
                  {transcripts.map((msg, i) => (
                    <div
                      key={i}
                      className="group transition-all animate-in fade-in slide-in-from-bottom-2 duration-300"
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <span className={cn(
                          "text-[9px] font-bold uppercase tracking-[0.2em] px-2 py-0.5 rounded-sm",
                          msg.role === MessageRoleEnum.USER
                            ? "bg-secondary/10 text-secondary"
                            : "bg-primary/5 text-primary/60"
                        )}>
                          {msg.role === MessageRoleEnum.USER ? "Customer" : "Support"}
                        </span>
                        <div className="h-px flex-1 bg-primary/5" />
                      </div>
                      <p className={cn(
                        "text-body-sm leading-relaxed",
                        msg.role === MessageRoleEnum.USER
                          ? "text-primary font-medium"
                          : "text-primary/70"
                      )}>
                        {msg.transcript}
                      </p>
                    </div>
                  ))}
                  {activeTranscript && (
                    <div className="opacity-40 transition-opacity">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-[9px] font-bold uppercase tracking-[0.2em] px-2 py-0.5 rounded-sm bg-primary/5 text-primary/50">
                          {activeTranscript.role === MessageRoleEnum.USER ? "Customer" : "Support"}
                        </span>
                        <div className="h-px flex-1 bg-primary/5" />
                      </div>
                      <p className="text-body-sm text-primary/60 leading-relaxed italic">
                        {activeTranscript.transcript}
                        <span className="animate-pulse ml-1 inline-block w-1.5 h-3.5 bg-secondary/50 rounded-full" />
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Branded Controls Area */}
      <div className="w-full max-w-3xl px-6 pb-20 flex flex-col items-center gap-10">
        {error && (
          <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-red-500/10 border border-red-500/20 backdrop-blur-xl rounded-2xl p-5 flex items-center gap-4 shadow-2xl">
              <div className="p-2 bg-red-500/20 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <p className="text-body-sm text-red-700 font-semibold tracking-tight">
                {error}
              </p>
            </div>
          </div>
        )}

        <div className="flex flex-col items-center gap-6">
          <Button
            onClick={toggleCall}
            disabled={isLoading}
            size="lg"
            className={cn(
              "px-14 py-8 rounded-full text-body-lg font-bold transition-all duration-500 shadow-2xl active:scale-95 group relative overflow-hidden",
              isActive 
                ? "bg-white border border-primary/10 text-primary hover:bg-muted" 
                : "bg-primary text-white hover:bg-primary/95"
            )}
          >
            {isActive && (
              <div className="absolute inset-0 bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            )}
            {isLoading ? (
              <>
                <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                <span>Establishing Secure Line...</span>
              </>
            ) : isActive ? (
              <>
                <PhoneOff className="w-6 h-6 mr-3 text-red-500" />
                <span>Disconnect session</span>
              </>
            ) : (
              <>
                <Phone className="w-6 h-6 mr-3" />
                <span>Initialise Support Agent</span>
              </>
            )}
          </Button>

          {isActive && (
            <div className="flex items-center gap-4 px-6 py-2 rounded-full border border-primary/10 bg-white shadow-xl transition-all duration-700">
              <div className={cn(
                "p-2 rounded-full transition-colors",
                voiceDetected ? "bg-secondary/20" : "bg-neutral-100"
              )}>
                {voiceDetected ? (
                  <Mic className="w-4 h-4 text-secondary animate-pulse" />
                ) : (
                  <MicOff className="w-4 h-4 text-primary/30" />
                )}
              </div>
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary/40">
                {voiceDetected ? "Incoming Voice Stream" : "Awaiting user audio"}
              </span>
            </div>
          )}
        </div>

        {isInactive && (
          <p className="text-[11px] text-primary/40 text-center max-w-sm leading-relaxed uppercase tracking-widest font-semibold">
            Secure cross-border payment support.
            Powered by RelayPay Adaptive Intelligence.
          </p>
        )}
      </div>
    </div>
  );
}
