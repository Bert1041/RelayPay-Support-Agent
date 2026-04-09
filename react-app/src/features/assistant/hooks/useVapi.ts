import { useEffect, useState, useCallback } from "react";
import { vapi } from "../vapi.sdk";
import { envConfig } from "@/config/env.config";
import {
  Message,
  MessageTypeEnum,
  TranscriptMessage,
  TranscriptMessageTypeEnum,
} from "@/shared/types/conversation.type";

export enum CallStatus {
  INACTIVE = "inactive",
  ACTIVE = "active",
  LOADING = "loading",
}

interface UseVapiOptions {
  assistantId?: string;
  assistantOverrides?: Record<string, unknown>;
}

export function useVapi(options?: UseVapiOptions) {
  const [isSpeechActive, setIsSpeechActive] = useState(false);
  const [callStatus, setCallStatus] = useState<CallStatus>(CallStatus.INACTIVE);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeTranscript, setActiveTranscript] = useState<TranscriptMessage | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onSpeechStart = () => setIsSpeechActive(true);
    const onSpeechEnd = () => setIsSpeechActive(false);

    const onCallStart = () => {
      console.log("Vapi call started");
      setCallStatus(CallStatus.ACTIVE);
      setMessages([]);
      setActiveTranscript(null);
      setError(null);
    };

    const onCallEnd = () => {
      console.log("Vapi call ended");
      setCallStatus(CallStatus.INACTIVE);
      setIsSpeechActive(false);
      setAudioLevel(0);
      setActiveTranscript(null);
    };

    const onVolumeLevel = (volume: number) => {
      setAudioLevel(volume);
    };

    const onMessage = (message: Message) => {
      if (
        message.type === MessageTypeEnum.TRANSCRIPT &&
        message.transcriptType === TranscriptMessageTypeEnum.PARTIAL
      ) {
        setActiveTranscript(message);
      } else {
        setMessages((prev) => [...prev, message]);
        setActiveTranscript(null);
      }
    };

    const onError = (e: any) => {
      console.error("Vapi error:", e);

      // Parse error for user-friendly message
      const rawMsg = e?.error?.message || e?.message || e?.errorMsg || "An unexpected error occurred.";
      const msg = typeof rawMsg === "string" ? rawMsg : JSON.stringify(rawMsg);

      // "Meeting has ended" / ejected is a normal call-end signal, not a real error
      if (msg.includes("Meeting has ended") || e?.type === "ejected") {
        setCallStatus(CallStatus.INACTIVE);
        setIsSpeechActive(false);
        setAudioLevel(0);
        return;
      }

      setCallStatus(CallStatus.INACTIVE);

      if (msg.includes("INTERNET_DISCONNECTED") || msg.includes("disconnect")) {
        setError("Network connection lost. Please check your internet and try again.");
      } else {
        setError(msg);
      }
    };

    vapi.on("speech-start", onSpeechStart);
    vapi.on("speech-end", onSpeechEnd);
    vapi.on("call-start", onCallStart);
    vapi.on("call-end", onCallEnd);
    vapi.on("volume-level", onVolumeLevel);
    vapi.on("message", onMessage);
    vapi.on("error", onError);

    return () => {
      vapi.off("speech-start", onSpeechStart);
      vapi.off("speech-end", onSpeechEnd);
      vapi.off("call-start", onCallStart);
      vapi.off("call-end", onCallEnd);
      vapi.off("volume-level", onVolumeLevel);
      vapi.off("message", onMessage);
      vapi.off("error", onError);
    };
  }, []);

  const start = useCallback(async () => {
    setError(null);
    setCallStatus(CallStatus.LOADING);
    const id = options?.assistantId ?? envConfig.vapi.assistantId;
    try {
      if (id) {
        await vapi.start(id, options?.assistantOverrides);
      } else {
        const errorMsg = "No assistant ID configured. Set VITE_VAPI_ASSISTANT_ID in .env";
        console.error(errorMsg);
        setError(errorMsg);
        setCallStatus(CallStatus.INACTIVE);
      }
    } catch (err: any) {
      console.error("Failed to start Vapi call:", err);
      setError(err?.message || "Failed to establish connection.");
      setCallStatus(CallStatus.INACTIVE);
    }
  }, [options?.assistantId, options?.assistantOverrides]);

  const stop = useCallback(() => {
    setCallStatus(CallStatus.LOADING);
    vapi.stop();
  }, []);

  const toggleCall = useCallback(() => {
    if (callStatus === CallStatus.ACTIVE) {
      stop();
    } else if (callStatus === CallStatus.INACTIVE) {
      start();
    }
  }, [callStatus, start, stop]);

  return {
    isSpeechActive,
    callStatus,
    audioLevel,
    activeTranscript,
    messages,
    error,
    start,
    stop,
    toggleCall,
  };
}
