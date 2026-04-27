import { ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { NotificationBell, type Notification } from "@/components/dashboard/NotificationBell";
import { cn } from "@/lib/utils";
import { ArrowLeft, PanelLeftClose, PanelLeft, LogOut, Settings, Languages, LayoutDashboard, ShieldAlert } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { SearchBar } from "@/components/dashboard/SearchBar";
import { useProfileSummary } from "@/hooks/useProfileSummary";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SidebarItem<T extends string> {
  id: T;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface DashboardShellProps<T extends string> {
  panelLabel: string;
  sidebarItems: SidebarItem<T>[];
  activeSection: T;
  onSectionChange: (section: T) => void;
  sidebarOpen: boolean;
  onSidebarToggle: () => void;
  notifications?: Notification[];
  crisisMode?: boolean;
  headerExtra?: ReactNode;
  children: ReactNode;
}

export function DashboardShell<T extends string>({
  panelLabel,
  sidebarItems,
  activeSection,
  onSectionChange,
  sidebarOpen,
  onSidebarToggle,
  notifications = [],
  crisisMode,
  headerExtra,
  children,
}: DashboardShellProps<T>) {
  const { t, i18n } = useTranslation();

  // Use translation for sidebar items if key exists, otherwise use label
  const translatedSidebarItems = sidebarItems.map((item) => ({
    ...item,
    displayLabel: t(item.id, item.label),
  }));

  const currentLabel = translatedSidebarItems.find((s) => s.id === activeSection)?.displayLabel ?? panelLabel;
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate("/auth");
  };

  const handleSectionClick = (id: T) => {
    onSectionChange(id);
    
    if (id === 'overview' || id === 'home') {
      if (!sidebarOpen) {
        onSidebarToggle();
      }
    } else {
      if (sidebarOpen) {
        onSidebarToggle();
      }
    }
  };

  const profileSummary = useProfileSummary();

  return (
    <div className={cn("min-h-screen bg-background flex flex-col md:flex-row relative overflow-hidden", crisisMode && "ring-2 ring-destructive ring-inset")}>
      {/* Animated Grid Background */}
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
      
      {/* Sidebar - Hidden on mobile, shown on md+ */}
      <aside
        className={cn(
          "hidden md:flex sticky top-0 h-screen border-r bg-card/30 backdrop-blur-xl transition-all duration-500 flex-col shrink-0 z-50",
          sidebarOpen ? "w-64" : "w-[68px]"
        )}
      >
        <div className="flex items-center gap-3 border-b border-border/50 px-4 h-16 shrink-0 overflow-hidden">
          <AnimatePresence mode="wait">
            {sidebarOpen ? (
              <motion.div
                key="logo-full"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex items-center gap-2.5"
              >
                <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold shadow-lg shadow-primary/20 shrink-0">
                  <ShieldAlert className="h-5 w-5" />
                </div>
                <span className="text-lg font-black tracking-tighter text-foreground uppercase">Sahyog<span className="text-primary italic">AI</span></span>
              </motion.div>
            ) : (
              <motion.div
                key="logo-short"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="mx-auto"
              >
                <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold shadow-lg shadow-primary/20">
                  <ShieldAlert className="h-5 w-5" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <nav className="flex-1 py-6 space-y-1.5 px-3 overflow-y-auto custom-scrollbar">
          {translatedSidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleSectionClick(item.id)}
              className={cn(
                "group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-300 font-bold",
                activeSection === item.id
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                  : "text-muted-foreground hover:bg-primary/10 hover:text-primary"
              )}
            >
              <item.icon className={cn("h-5 w-5 shrink-0 transition-transform duration-300 group-hover:scale-110", activeSection === item.id ? "text-primary-foreground" : "text-muted-foreground group-hover:text-primary")} />
              <AnimatePresence>
                {sidebarOpen && (
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="truncate"
                  >
                    {item.displayLabel}
                  </motion.span>
                )}
              </AnimatePresence>
              {activeSection === item.id && !sidebarOpen && (
                <div className="absolute right-0 h-5 w-1 rounded-l-full bg-primary" />
              )}
            </button>
          ))}
        </nav>

        {/* User Profile Section at Bottom */}
        <div className="p-3 border-t border-border/50 bg-card/10">
          <button
            onClick={() => navigate("/profile")}
            className={cn(
              "w-full text-left rounded-xl bg-muted/40 p-2 transition-all duration-300 hover:bg-muted/70 hover:shadow-md group",
              sidebarOpen ? "flex items-center gap-3" : "flex flex-col items-center gap-2"
            )}
            title="View profile"
          >
            <div className="relative shrink-0">
              <div className="h-9 w-9 rounded-lg bg-gradient-to-tr from-primary to-primary/60 flex items-center justify-center text-primary-foreground font-bold shadow-md">
                {profileSummary.initials}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card bg-success" />
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0 overflow-hidden">
                <p className="text-xs font-bold truncate text-foreground leading-tight">{profileSummary.displayName}</p>
                <p className="text-[10px] text-muted-foreground truncate leading-tight">{profileSummary.email}</p>
              </div>
            )}
            {sidebarOpen && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                onClick={(e) => { e.stopPropagation(); handleSignOut(); }}
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            )}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 md:pb-0 relative z-10">
        <header className="sticky top-0 z-40 border-b border-border/50 bg-background/60 backdrop-blur-xl shrink-0">
          <div className="flex h-16 items-center justify-between px-4 lg:px-8 gap-4">
            <div className="flex items-center gap-4 flex-1 overflow-hidden">
              <div className="md:hidden">
                 <Button variant="ghost" size="icon" onClick={onSidebarToggle} className="rounded-xl">
                   <LayoutDashboard className="h-5 w-5" />
                 </Button>
              </div>
              
              <div className="hidden lg:block">
                 <Breadcrumb>
                   <BreadcrumbList>
                     <BreadcrumbItem>
                       <BreadcrumbLink className="font-bold text-[10px] uppercase tracking-widest opacity-50 hover:opacity-100 transition-opacity">{panelLabel}</BreadcrumbLink>
                     </BreadcrumbItem>
                     <BreadcrumbSeparator />
                     <BreadcrumbItem>
                       <BreadcrumbPage className="font-bold text-[10px] uppercase tracking-widest text-primary">{currentLabel}</BreadcrumbPage>
                     </BreadcrumbItem>
                   </BreadcrumbList>
                 </Breadcrumb>
              </div>

              <div className="flex-1 flex justify-center max-w-sm md:max-w-md mx-auto">
                 <SearchBar />
              </div>
            </div>
            <div className="flex items-center gap-1 md:gap-3 shrink-0">
              <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/50 border border-border/50">
                 <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
                 <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Live</span>
              </div>

              <div className="hidden sm:block">
                <Select
                  value={i18n.language}
                  onValueChange={(lang) => i18n.changeLanguage(lang)}
                >
                  <SelectTrigger className="w-[70px] md:w-[90px] h-8 md:h-9 rounded-xl bg-muted/50 border-none focus:ring-1 ring-primary/20 px-2 font-bold text-xs uppercase">
                    <SelectValue placeholder="En" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-border/50 backdrop-blur-xl">
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="hi">हिंदी</SelectItem>
                    <SelectItem value="mr">मराठी</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="h-6 w-px bg-border/50 mx-1" />
              <NotificationBell notifications={notifications} />
              <div className="h-6 w-px bg-border/50 mx-1" />
              <ThemeToggle />
            </div>
          </div>

          <AnimatePresence>
            {crisisMode && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="bg-destructive text-destructive-foreground overflow-hidden shadow-2xl shadow-destructive/20 relative z-20 border-t border-white/10"
              >
                <div className="flex items-center justify-between px-8 py-3 bg-[repeating-linear-gradient(45deg,transparent,transparent_20px,rgba(255,255,255,0.05)_20px,rgba(255,255,255,0.05)_40px)]">
                  <div className="flex items-center gap-4">
                    <div className="p-1.5 rounded-lg bg-white/20 animate-bounce">
                      <ShieldAlert className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-black tracking-tight leading-none uppercase">🚨 Crisis Protocol Engaged</p>
                      <p className="text-[10px] font-medium opacity-80 mt-1">Priority AI Matching is active. High-impact incidents are prioritized.</p>
                    </div>
                  </div>
                  <Button size="sm" variant="secondary" className="h-7 text-[10px] font-black rounded-lg uppercase tracking-wider px-4">Emergency Protocol</Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </header>

        <main className="flex-1 p-4 lg:p-8 max-w-7xl mx-auto w-full overflow-x-hidden relative">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            {children}
          </motion.div>
        </main>
      </div>

      {/* Mobile Bottom Navigation - Shown only on mobile */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 h-16 bg-background/80 backdrop-blur-xl border-t border-border/50 flex items-center justify-around px-2">
        {translatedSidebarItems.slice(0, 5).map((item) => (
          <button
            key={item.id}
            onClick={() => onSectionChange(item.id)}
            className={cn(
              "flex flex-col items-center justify-center gap-1 min-w-[60px] h-full transition-all relative",
              activeSection === item.id ? "text-primary" : "text-muted-foreground"
            )}
          >
            <item.icon className={cn("h-5 w-5", activeSection === item.id && "scale-110")} />
            <span className="text-[10px] font-bold truncate max-w-[64px] uppercase tracking-tighter">{item.displayLabel}</span>
            {activeSection === item.id && (
              <motion.div layoutId="bottom-nav-active" className="absolute top-0 h-0.5 w-8 bg-primary rounded-full" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
