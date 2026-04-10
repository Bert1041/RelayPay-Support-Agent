import { LayoutDashboard, FileText, LogOut, ChevronLeft, ChevronRight, AlertTriangle, ShieldCheck, Database, Volume2 } from "lucide-react";
import { useState } from "react";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/components/ui/button";

interface SidebarProps {
  className?: string;
}

export const Sidebar = ({ className }: SidebarProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/admin" },
    { icon: FileText, label: "Log Tables", href: "/admin?tab=logs" },
    { icon: ShieldCheck, label: "System Health", href: "/admin?tab=health" },
    { icon: Database, label: "Knowledge Base", href: "/admin?tab=kb" },
    { icon: AlertTriangle, label: "Escalations", href: "/admin?tab=escalations" },
    { icon: Volume2, label: "Keywords", href: "/admin?tab=keywords" },
  ];

  return (
    <div
      className={cn(
        "relative flex flex-col h-screen bg-white border-r border-primary/5 transition-all duration-300 z-50",
        isCollapsed ? "w-20" : "w-64",
        className
      )}
    >
      {/* Sidebar Header */}
      <div className={cn(
        "flex items-center p-6 mb-4",
        isCollapsed ? "justify-center" : "justify-between"
      )}>
        {!isCollapsed ? (
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="RelayPay Logo" className="w-10 h-10 object-contain" />
            <span className="text-primary font-bold tracking-tight text-lg">RelayPay</span>
          </div>
        ) : (
          <img src="/logo.png" alt="RelayPay Logo" className="w-8 h-8 object-contain" />
        )}
        {!isCollapsed && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="ml-auto text-primary/40 hover:text-primary"
          >
            <ChevronLeft />
          </Button>
        )}
      </div>

      {/* Toggle button for collapsed state (floating or bottom) */}
      {isCollapsed && (
        <div className="flex justify-center mb-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-primary/40 hover:text-primary"
          >
            <ChevronRight />
          </Button>
        </div>
      )}

      {/* Navigation Items */}
      <nav className="flex-1 px-4 space-y-2">
        {menuItems.map((item) => (
          <a
            key={item.label}
            href={item.href}
            className={cn(
              "flex items-center gap-4 px-4 py-3 rounded-xl transition-all group",
              "hover:bg-primary/5 text-primary/60 hover:text-primary",
              isCollapsed && "justify-center"
            )}
          >
            <item.icon className={cn("w-5 h-5 transition-transform group-hover:scale-110")} />
            {!isCollapsed && <span className="text-base font-bold">{item.label}</span>}
          </a>
        ))}
      </nav>

      {/* Footer / Logout */}
      <div className="p-4 border-t border-primary/5">
        <Button
          variant="ghost"
          className={cn(
            "w-full flex items-center justify-start gap-4 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 hover:text-red-600 transition-all",
            isCollapsed && "justify-center"
          )}
          onClick={() => window.location.href = '/'}
        >
          <LogOut className="w-5 h-5" />
          {!isCollapsed && <span className="text-base font-bold">Exit Admin</span>}
        </Button>
      </div>
    </div>
  );
};
