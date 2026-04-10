import { useState } from "react";
import { ShieldAlert, Lock, ArrowRight, Zap } from "lucide-react";
import { Button } from "@/shared/components/ui/button";

interface AdminLoginProps {
  onSuccess: () => void;
}

export const AdminLogin = ({ onSuccess }: AdminLoginProps) => {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(false);

    // Simulate system verification delay
    setTimeout(() => {
      if (password === "relaypay") {
        sessionStorage.setItem("relaypay_admin_auth", "true");
        onSuccess();
      } else {
        setError(true);
        setIsLoading(false);
      }
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#F8F9FA] overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[30%] h-[30%] bg-secondary/5 rounded-full blur-[100px]" />
      
      <div className="w-full max-w-md p-8 animate-in fade-in zoom-in-95 duration-500">
        <div className="bg-white/70 backdrop-blur-2xl p-12 rounded-[3.5rem] border border-white shadow-[0_32px_80px_-16px_rgba(20,33,61,0.1)] relative">
          
          {/* Header */}
          <div className="flex flex-col items-center text-center mb-12">
            <div className="w-20 h-20 rounded-3xl bg-primary flex items-center justify-center text-white mb-8 shadow-2xl shadow-primary/20 rotate-3 hover:rotate-0 transition-transform duration-500">
              <Zap className="w-10 h-10" />
            </div>
            <h1 className="text-3xl font-black text-primary tracking-tighter mb-2">Restricted Access</h1>
            <p className="text-[10px] uppercase font-black tracking-[0.3em] text-primary/30">RelayPay Intelligence Core</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <div className="relative group">
                <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-primary/20 group-focus-within:text-secondary transition-colors">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="System Access Key"
                  className="w-full bg-primary/5 border-none h-16 pl-14 pr-6 rounded-2xl text-primary font-bold placeholder:text-primary/20 focus:ring-2 focus:ring-secondary/20 transition-all"
                  autoFocus
                />
              </div>
              {error && (
                <div className="flex items-center gap-2 px-4 py-3 bg-red-50 text-red-600 rounded-xl animate-in slide-in-from-top-2 duration-300">
                  <ShieldAlert className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Entry Denied — Invalid Sequence</span>
                </div>
              )}
            </div>

            <Button 
              type="submit" 
              disabled={isLoading}
              className="w-full h-16 rounded-2xl bg-primary hover:bg-primary/95 text-white font-black uppercase tracking-[0.2em] text-xs transition-all active:scale-95 flex items-center justify-center gap-2 shadow-xl shadow-primary/20"
            >
              {isLoading ? "Verifying..." : "Initialize Session"}
              {!isLoading && <ArrowRight className="w-4 h-4" />}
            </Button>
          </form>

          <p className="mt-12 text-center text-[9px] font-black text-primary/20 uppercase tracking-[0.4em]">
            Authorization Required for Node A1
          </p>
        </div>
      </div>
    </div>
  );
};
