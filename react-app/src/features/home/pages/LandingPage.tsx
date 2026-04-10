"use client";

import { Link } from "react-router-dom";
import { Headphones, MessageSquare, ArrowRight, ShieldCheck, Zap, Globe } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/lib/utils";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#14213D] flex flex-col relative overflow-hidden font-outfit">
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

      {/* Header */}
      <nav className="relative z-10 w-full px-8 py-6 flex justify-between items-center bg-white/50 backdrop-blur-md border-b border-[#14213D]/5">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="RelayPay" className="h-10 object-contain" />
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm font-bold uppercase tracking-widest text-[#14213D]/60">
          <a href="#" className="hover:text-[#2A9D8F] transition-colors">Platform</a>
          <a href="#" className="hover:text-[#2A9D8F] transition-colors">Solutions</a>
          <a href="#" className="hover:text-[#2A9D8F] transition-colors">Developer</a>
        </div>
        <Link to="/admin">
          <Button variant="outline" className="border-[#14213D]/10 hover:bg-[#14213D]/5 text-[#14213D]/80 rounded-full px-6">
            Admin
          </Button>
        </Link>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-12 md:py-20">
        <div className="text-center max-w-4xl mb-16 animate-in fade-in slide-in-from-top-10 duration-1000">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#2A9D8F]/10 border border-[#2A9D8F]/20 text-[10px] font-bold text-[#2A9D8F] mb-6 tracking-[0.2em] uppercase">
            <Zap className="w-3 h-3" />
            Adaptive Intelligence Protocol
          </div>
          <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight leading-[1.1] text-[#14213D]">
            Human-Centric <br />
            <span className="text-[#2A9D8F]">
              AI Support
            </span>
          </h1>
          <p className="text-lg md:text-xl text-[#14213D]/60 max-w-2xl mx-auto leading-relaxed">
            Secure, low-latency conversational banking. Choose your interaction mode below to begin.
          </p>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-5xl px-4 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-300">
          {/* Card 1: Voice Agent */}
          <Link to="/voice" className="group">
            <div className="relative h-full p-10 rounded-[2.5rem] bg-white border border-[#14213D]/5 hover:border-[#2A9D8F]/50 transition-all duration-500 shadow-[0_20px_50px_rgba(20,33,61,0.05)] hover:shadow-[0_20px_50px_rgba(42,157,143,0.1)] group-hover:-translate-y-2">
              <div className="mb-8 w-16 h-16 rounded-2xl bg-[#2A9D8F]/5 flex items-center justify-center text-[#2A9D8F] group-hover:bg-[#2A9D8F]/10 transition-colors duration-500">
                <Headphones className="w-8 h-8" />
              </div>
              
              <h3 className="text-2xl font-bold mb-4 text-[#14213D]">Voice Support</h3>
              <p className="text-[#14213D]/60 leading-relaxed mb-10">
                Direct audio connection to our Adaptive Voice Agent. Fast, secure, and always ready to assist with your inquiries.
              </p>
              
              <div className="flex items-center gap-2 text-xs font-bold text-[#2A9D8F] uppercase tracking-[0.3em] group-hover:translate-x-2 transition-transform">
                Initiate Session <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </Link>

          {/* Card 2: Smart Chat */}
          <Link to="/chat" className="group">
            <div className="relative h-full p-10 rounded-[2.5rem] bg-white border border-[#14213D]/5 hover:border-[#2A9D8F]/50 transition-all duration-500 shadow-[0_20px_50px_rgba(20,33,61,0.05)] hover:shadow-[0_20px_50px_rgba(42,157,143,0.1)] group-hover:-translate-y-2">
              <div className="mb-8 w-16 h-16 rounded-2xl bg-[#2A9D8F]/5 flex items-center justify-center text-[#2A9D8F] group-hover:bg-[#2A9D8F]/10 transition-colors duration-500">
                <MessageSquare className="w-8 h-8" />
              </div>
              
              <h3 className="text-2xl font-bold mb-4 text-[#14213D]">Smart Chat</h3>
              <p className="text-[#14213D]/60 leading-relaxed mb-10">
                Intelligent text support with manual keyboard override. Ideal for complex data entry or quiet environments.
              </p>
              
              <div className="flex items-center gap-2 text-xs font-bold text-[#2A9D8F] uppercase tracking-[0.3em] group-hover:translate-x-2 transition-transform">
                Open Chat <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </Link>
        </div>

        {/* Footer info */}
        <div className="mt-20 flex items-center gap-12 text-[9px] uppercase tracking-[0.4em] font-black text-[#14213D]/20">
          <div className="flex items-center gap-2"><Globe className="w-3 h-3" /> Global Network</div>
          <div className="flex items-center gap-2"><ShieldCheck className="w-3 h-3" /> Encrypted Protocol</div>
          <div className="flex items-center gap-2"><Zap className="w-3 h-3" /> Instant Response</div>
        </div>
      </main>
    </div>
  );
}
