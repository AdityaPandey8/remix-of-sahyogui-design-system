import { useState, useMemo, useEffect } from "react";
import { type Issue, type NGO, type Volunteer, type PastCrisis, type Alert as AlertType, type Poll, type DiscussionComment, type AIWeights, polls as seedPolls, discussions as seedDiscussions, defaultAIWeights } from "@/data/mockData";
import { getIssues, getNGOs, getVolunteers, getAlerts, createIssue, updateIssueStatus, updateVolunteerStatus, getPublicUsers, updateUserStatus } from "@/lib/supabase-service";
import { supabase } from "@/integrations/supabase/client";
import { AIChatWidget } from "@/components/dashboard/AIChatWidget";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { MapDashboard } from "@/components/dashboard/MapDashboard";
import { FilterBar } from "@/components/dashboard/FilterBar";
import { AlertCard } from "@/components/dashboard/AlertCard";
import { AIPriorityCard } from "@/components/dashboard/AIPriorityCard";
import { AIInsightsPanel } from "@/components/dashboard/AIInsightsPanel";
import { AIInsightsCard } from "@/components/dashboard/AIInsightsCard";
import { ImpactLeaderboard, ResourceTracker } from "@/components/dashboard/CommunityTools";
import { QuickActionBar } from "@/components/dashboard/QuickActionBar";
import { AIAnalyticsCharts } from "@/components/dashboard/AIAnalyticsCharts";
import { IssueReportForm } from "@/components/dashboard/IssueReportForm";
import { IssueDetailDialog } from "@/components/dashboard/IssueDetailDialog";
import { NGODetailDialog } from "@/components/dashboard/NGODetailDialog";
import { VolunteerDetailDialog } from "@/components/dashboard/VolunteerDetailDialog";
import { CrisisDetailDialog } from "@/components/dashboard/CrisisDetailDialog";
import { AlertDetailDialog } from "@/components/dashboard/AlertDetailDialog";
import { TaskAssignDialog } from "@/components/dashboard/TaskAssignDialog";
import { NetworkStatusWidget } from "@/components/dashboard/NetworkStatusWidget";
import { PollManagementPanel } from "@/components/dashboard/PollManagementPanel";
import { DiscussionModerationPanel } from "@/components/dashboard/DiscussionModerationPanel";
import { CommunityInsightsPanel } from "@/components/dashboard/CommunityInsightsPanel";
import { AIWeightControls } from "@/components/dashboard/AIWeightControls";
import { TrendingMonitor } from "@/components/dashboard/TrendingMonitor";
import { AIExplanationPanel } from "@/components/dashboard/AIExplanationPanel";
import type { Notification } from "@/components/dashboard/NotificationBell";
import { StatusBadge } from "@/components/StatusBadge";
import { UrgencyBadge } from "@/components/UrgencyBadge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  BarChart3, Users, AlertTriangle, CheckCircle, Clock, Plus, Megaphone,
  ShieldAlert, Brain, Send, Flag, Activity, LayoutDashboard, FileText,
  Building2, UserCheck, Bell, History, Settings, ShieldCheck, ShieldOff, Trash2, Eye, Handshake, Sparkles, Loader2, Globe, User, Vote, MessageSquare
} from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { pastCrises as mockPastCrises } from "@/data/mockData";
import { NGODetails, VolunteerDetails, UserProfile } from "@/types/database";

type AdminSection = "overview" | "issues" | "verification" | "analytics" | "polls" | "discussions" | "insights" | "ngos" | "volunteers" | "teams" | "onboarding" | "moderation" | "invites" | "activity" | "publics" | "alerts" | "history" | "settings" | "crisis";

import { NGOVerificationPanel } from "@/components/admin/NGOVerificationPanel";
import { VolunteerManagementPanel } from "@/components/admin/VolunteerManagementPanel";
import { NGOTeamsPanel } from "@/components/admin/NGOTeamsPanel";
import { OnboardingInsightsPanel } from "@/components/admin/OnboardingInsightsPanel";
import { ModerationPanel } from "@/components/admin/ModerationPanel";
import { InviteCodesPanel } from "@/components/admin/InviteCodesPanel";
import { ActivityMonitorPanel } from "@/components/admin/ActivityMonitorPanel";
import { useCrisis, useAutoCrisis } from "@/contexts/CrisisContext";
import { CrisisCenter } from "@/components/crisis/CrisisCenter";
import { CrisisActivationDialog } from "@/components/crisis/CrisisActivationDialog";
import { NGOCrisisBanner } from "@/components/crisis/CrisisBanners";

const sidebarItems: { id: AdminSection; label: string; icon: any }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "issues", label: "Issues", icon: FileText },
  { id: "crisis", label: "Crisis Center", icon: ShieldAlert },
  { id: "verification", label: "Verification", icon: ShieldCheck },
  { id: "onboarding", label: "Onboarding", icon: Sparkles },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "polls", label: "Polls", icon: Vote },
  { id: "discussions", label: "Discussions", icon: MessageSquare },
  { id: "insights", label: "Community Insights", icon: Activity },
  { id: "ngos", label: "NGOs", icon: Building2 },
  { id: "volunteers", label: "Volunteers", icon: Users },
  { id: "teams", label: "NGO Teams", icon: Handshake },
  { id: "invites", label: "Invite Codes", icon: UserCheck },
  { id: "moderation", label: "Moderation", icon: ShieldOff },
  { id: "activity", label: "Activity", icon: Activity },
  { id: "publics", label: "Public Accounts", icon: User },
  { id: "alerts", label: "Alerts", icon: Bell },
  { id: "history", label: "History", icon: History },
  { id: "settings", label: "Settings", icon: Settings },
];

const adminNotifications: Notification[] = [
  { id: "n1", title: "NGO Pending Verification", message: "2 new NGOs have submitted their registration details.", type: "warning", time: "2m ago", read: false },
  { id: "n2", title: "Crisis Mode Available", message: "Bihar flood situation escalating.", type: "danger", time: "15m ago", read: false },
  { id: "n3", title: "NGO Performance Update", message: "CareLine Initiative resolved 5 issues today.", type: "success", time: "1h ago", read: true },
];

export default function DashboardAdmin() {
  const { t } = useTranslation();
  const [section, setSection] = useState<AdminSection>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [issueList, setIssueList] = useState<Issue[]>([]);
  const [ngoList, setNgoList] = useState<NGO[]>([]);
  const [volList, setVolList] = useState<Volunteer[]>([]);
  const [alertList, setAlertList] = useState<AlertType[]>([]);
  const [publicUsers, setPublicUsers] = useState<UserProfile[]>([]);
  const [pollList, setPollList] = useState<Poll[]>(seedPolls);
  const [commentList, setCommentList] = useState<DiscussionComment[]>(seedDiscussions);
  const [aiWeights, setAiWeights] = useState<AIWeights>(defaultAIWeights);
  const [insightIssueId, setInsightIssueId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [urgencyFilter, setUrgencyFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [reportOpen, setReportOpen] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [selectedNgo, setSelectedNgo] = useState<NGO | null>(null);
  const [selectedVol, setSelectedVol] = useState<Volunteer | null>(null);
  const [selectedCrisis, setSelectedCrisis] = useState<PastCrisis | null>(null);
  const [selectedAlert, setSelectedAlert] = useState<AlertType | null>(null);
  const [assignIssue, setAssignIssue] = useState<Issue | null>(null);
  const [broadcastMsg, setBroadcastMsg] = useState("");
  const [activationDialogOpen, setActivationDialogOpen] = useState(false);
  const { crisisMode, deactivateCrisis } = useCrisis();
  const [pendingNgos, setPendingNgos] = useState<NGODetails[]>([]);
  const [pendingVols, setPendingVols] = useState<VolunteerDetails[]>([]);
  const [globalVols, setGlobalVols] = useState<VolunteerDetails[]>([]);

  useEffect(() => {
    const fetchNgos = async () => {
      const { data } = await supabase
        .from("ngo_details")
        .select("*")
        .order("created_at", { ascending: false });
      if (data) {
        setPendingNgos(data.filter(n => n.verification_status === "pending"));
      }
    };

    const fetchVolunteerPool = async () => {
      const { data: allVols } = await supabase
        .from("volunteer_details")
        .select("*")
        .order("trust_score", { ascending: false });
      
      if (allVols) {
        setGlobalVols(allVols);
        setPendingVols(allVols.filter(v => v.verification_status === "pending"));
      }
    };

    const fetchPublics = async () => {
      const users = await getPublicUsers();
      setPublicUsers(users);
    };

    if (section === "verification") {
      fetchNgos();
      fetchVolunteerPool();
    } else if (section === "volunteers") {
      fetchVolunteerPool();
    } else if (section === "publics") {
      fetchPublics();
    }
  }, [section]);

  const handleVerifyVol = async (id: string) => {
    const { error } = await supabase
      .from("volunteer_details")
      .update({ 
        verification_status: "verified", 
        type: "verified" 
      })
      .eq("id", id);
    
    if (!error) {
      setPendingVols(prev => prev.filter(v => v.id !== id));
      setGlobalVols(prev => prev.map(v => v.id === id ? { ...v, verification_status: "verified", type: "verified" } : v));
      toast.success("Volunteer verified successfully");
    }
  };

  const handleVerifyNgo = async (id: string) => {
    const { error } = await supabase
      .from("ngo_details")
      .update({ verification_status: "verified", verified_at: new Date().toISOString() })
      .eq("id", id);
    
    if (!error) {
      setPendingNgos(prev => prev.filter(n => n.id !== id));
      toast.success("NGO verified successfully");
    } else {
      toast.error("Failed to verify NGO");
    }
  };

  const handleRejectNgo = async (id: string) => {
    const { error } = await supabase
      .from("ngo_details")
      .update({ verification_status: "rejected" })
      .eq("id", id);
    
    if (!error) {
      setPendingNgos(prev => prev.filter(n => n.id !== id));
      toast.error("NGO registration rejected");
    } else {
      toast.error("Failed to reject NGO");
    }
  };

  const handleToggleUserBlock = async (userId: string, currentBlocked: boolean) => {
    const success = await updateUserStatus(userId, !currentBlocked);
    if (success) {
      setPublicUsers(prev => prev.map(u => u.id === userId ? { ...u, blocked: !currentBlocked } : u));
      toast.success(`User ${!currentBlocked ? "blocked" : "unblocked"} successfully`);
    } else {
      toast.error("Failed to update user status");
    }
  };

  const openDarpanSearch = (darpanId: string) => {
    const url = darpanId 
      ? `https://ngodarpan.gov.in/index.php/search/index_new/1?search_text=${darpanId}&search_type=darpan_id`
      : "https://ngodarpan.gov.in/index.php/search/";
    window.open(url, "_blank");
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [issues, ngos, volunteers, alerts] = await Promise.all([
          getIssues(),
          getNGOs(),
          getVolunteers(),
          getAlerts()
        ]);
        setIssueList(issues);
        setNgoList(ngos);
        setVolList(volunteers);
        setAlertList(alerts);
      } catch (error) {
        toast.error("Failed to load admin dashboard data");
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const locations = useMemo(() => [...new Set(issueList.map(i => i.location))], [issueList]);
  const categories = useMemo(() => [...new Set(issueList.map(i => i.category))], [issueList]);

  const filtered = useMemo(() => {
    return issueList.filter((i) => {
      if (search && !i.title.toLowerCase().includes(search.toLowerCase())) return false;
      if (urgencyFilter !== "all" && i.urgency !== urgencyFilter) return false;
      if (statusFilter !== "all" && i.status !== statusFilter) return false;
      if (locationFilter !== "all" && i.location !== locationFilter) return false;
      if (categoryFilter !== "all" && i.category !== categoryFilter) return false;
      return true;
    });
  }, [issueList, search, urgencyFilter, statusFilter, locationFilter, categoryFilter]);

  const stats = useMemo(() => ({
    total: issueList.length,
    active: issueList.filter((i) => i.urgency === "High" && i.status !== "Solved").length,
    resolved: issueList.filter((i) => i.status === "Solved").length,
    avgResponse: "3h 12m",
    activeVols: volList.filter((v) => v.available && !v.blocked).length,
  }), [issueList, volList]);

  const topIssue = useMemo(() => [...issueList].sort((a, b) => b.aiPriorityScore - a.aiPriorityScore)[0], [issueList]);
  const pendingIssues = useMemo(() => issueList.filter((i) => i.status === "Pending"), [issueList]);
  const prioritySorted = useMemo(() => [...filtered].sort((a, b) => b.aiPriorityScore - a.aiPriorityScore), [filtered]);

  const handleVerify = async (id: string) => {
    const success = await updateIssueStatus(id, "Verified");
    if (success) {
      setIssueList((prev) => prev.map((i) => i.id === id ? { ...i, status: "Verified" as const } : i));
      toast.success("Issue verified");
    }
  };
  const handleReject = (id: string) => {
    setIssueList((prev) => prev.filter((i) => i.id !== id));
    toast("Issue rejected and removed");
  };
  const handleDelete = (id: string) => {
    setIssueList((prev) => prev.filter((i) => i.id !== id));
    setSelectedIssue(null);
    toast.success("Issue deleted");
  };
  const handleEscalate = async (id: string) => {
    const success = await updateIssueStatus(id, "In Progress"); // Escalate means putting it in action
    if (success) {
      setIssueList((prev) => prev.map((i) => i.id === id ? { ...i, urgency: "High" as const, aiPriorityScore: Math.min(i.aiPriorityScore + 15, 100) } : i));
      toast.warning("Issue escalated");
    }
  };
  const handleNewIssue = async (issueData: Issue) => {
    const result = await createIssue(issueData);
    if (result) {
      setIssueList((prev) => [result, ...prev]);
      toast.success("Issue added");
    }
  };
  const handleBlockNgo = (id: string) => {
    setNgoList(prev => prev.map(n => n.id === id ? { ...n, blocked: !n.blocked } : n));
    const ngo = ngoList.find(n => n.id === id);
    toast.success(`${ngo?.name} ${ngo?.blocked ? "unblocked" : "blocked"}`);
  };
  const handleBlockVol = async (id: string) => {
    const vol = volList.find(v => v.id === id);
    if (!vol) return;
    const success = await updateVolunteerStatus(id, !vol.blocked);
    if (success) {
      setVolList(prev => prev.map(v => v.id === id ? { ...v, blocked: !v.blocked } : v));
      toast.success(`${vol.name} ${vol.blocked ? "unblocked" : "blocked"}`);
    }
  };
  const handleBroadcast = () => {
    if (!broadcastMsg.trim()) return;
    toast.success("🔔 Alert broadcasted", { description: broadcastMsg });
    setBroadcastMsg("");
  };

  // Polls handlers
  const handlePollCreate = (poll: Poll) => setPollList(prev => [poll, ...prev]);
  const handlePollToggle = (id: string) => setPollList(prev => prev.map(p => p.id === id ? { ...p, active: !p.active } : p));
  const handlePollDelete = (id: string) => setPollList(prev => prev.filter(p => p.id !== id));

  // Discussion handlers
  const handleCommentDelete = (id: string) => setCommentList(prev => prev.filter(c => c.id !== id));

  // Issue priority override
  const handlePriorityOverride = (id: string, urgency: "High" | "Medium" | "Low") => {
    setIssueList(prev => prev.map(i => i.id === id ? { ...i, urgency } : i));
    toast.success(`Priority set to ${urgency}`);
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex h-[60vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }

    switch (section) {
      case "overview":
        return (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            <NetworkStatusWidget />
            
            <QuickActionBar actions={[
              { label: "Add Issue", icon: Plus, onClick: () => setReportOpen(true) },
              { label: crisisMode ? "Deactivate Crisis" : "Activate Crisis", icon: ShieldAlert, onClick: () => { if (crisisMode) { deactivateCrisis(); } else { setActivationDialogOpen(true); } }, variant: crisisMode ? "destructive" : "outline" },
            ]} />
            
            <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-5">
              <MetricCard icon={BarChart3} label={t('total_issues', 'Total Issues')} value={stats.total} trend={{ direction: "up", value: "+3" }} delay={0} />
              <MetricCard icon={AlertTriangle} label={t('active_crises', 'Active Crises')} value={stats.active} trend={{ direction: "up", value: "+1" }} delay={100} />
              <MetricCard icon={CheckCircle} label={t('resolved', 'Resolved')} value={stats.resolved} trend={{ direction: "up", value: "+2" }} delay={200} />
              <MetricCard icon={Clock} label={t('avg_response', 'Avg Response')} value={stats.avgResponse} trend={{ direction: "down", value: "-12m" }} delay={300} />
              <MetricCard icon={Users} label={t('active_volunteers', 'Active Volunteers')} value={stats.activeVols} delay={400} />
            </div>
            
            <div className="grid gap-6 lg:grid-cols-6">
              <div className="lg:col-span-2">
                {topIssue && <AIInsightsPanel issue={topIssue} />}
              </div>
              <div className="lg:col-span-2">
                <AIInsightsCard />
              </div>
              <div className="lg:col-span-2">
                {topIssue && <AIPriorityCard issue={topIssue} />}
              </div>
            </div>

            <div className="rounded-2xl border bg-card/40 backdrop-blur-md p-2 shadow-xl shadow-primary/5">
              <MapDashboard
                userRole="admin"
                issues={issueList}
                onIssueClick={setSelectedIssue}
              />
            </div>

            <div className="grid gap-6 lg:grid-cols-6 mt-8">
              <div className="lg:col-span-3">
                <ImpactLeaderboard />
              </div>
              <div className="lg:col-span-3">
                <ResourceTracker />
              </div>
            </div>

            {/* Verification quick view */}
            {pendingIssues.length > 0 && (
              <div className="pt-4">
                <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <Flag className="h-4 w-4 text-warning" /> Verification Queue ({pendingIssues.length})
                </h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  <AnimatePresence>
                    {pendingIssues.slice(0, 4).map((issue) => (
                      <motion.div 
                        key={issue.id} 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="flex items-center justify-between rounded-2xl border bg-card/50 p-4 backdrop-blur-sm transition-all hover:shadow-lg"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-bold truncate tracking-tight">{issue.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{issue.location}</p>
                        </div>
                        <div className="flex gap-1.5 shrink-0 ml-4">
                          <Button size="sm" className="h-8 rounded-lg font-bold active:scale-95 transition-all" onClick={() => handleVerify(issue.id)}>Verify</Button>
                          <Button size="sm" variant="destructive" className="h-8 rounded-lg font-bold active:scale-95 transition-all" onClick={() => handleReject(issue.id)}>Reject</Button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )}
          </motion.div>
        );

      case "verification":
        return <NGOVerificationPanel />;
      case "crisis":
        return <CrisisCenter />;
      case "onboarding":
        return <OnboardingInsightsPanel />;
      case "teams":
        return <NGOTeamsPanel />;
      case "moderation":
        return <ModerationPanel />;
      case "invites":
        return <InviteCodesPanel />;
      case "activity":
        return <ActivityMonitorPanel />;
      case "settings" + "_unused" as any:
        return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <h2 className="text-xl font-bold tracking-tight flex items-center gap-2.5">
              <ShieldCheck className="h-5 w-5 text-primary" /> Verification Command Center
            </h2>

            <Tabs defaultValue="ngos" className="w-full">
              <TabsList className="grid w-full max-w-md grid-cols-2 rounded-xl bg-muted/50 p-1">
                <TabsTrigger value="ngos" className="rounded-lg font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm">NGOs ({pendingNgos.length})</TabsTrigger>
                <TabsTrigger value="volunteers" className="rounded-lg font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm">Volunteers ({pendingVols.length})</TabsTrigger>
              </TabsList>
              
              <TabsContent value="ngos" className="mt-6">
                <div className="rounded-2xl border bg-card/40 backdrop-blur-md overflow-hidden shadow-xl shadow-primary/5">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead className="font-bold text-xs uppercase tracking-widest text-muted-foreground">NGO Details</TableHead>
                        <TableHead className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Reg & Tax Info</TableHead>
                        <TableHead className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Status</TableHead>
                        <TableHead className="text-right font-bold text-xs uppercase tracking-widest text-muted-foreground">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingNgos.length === 0 ? (
                        <TableRow><TableCell colSpan={4} className="h-32 text-center text-muted-foreground">No pending NGO requests</TableCell></TableRow>
                      ) : (
                        pendingNgos.map((ngo) => (
                          <TableRow key={ngo.id}>
                            <TableCell><p className="font-bold text-sm">{ngo.ngo_name}</p><p className="text-[10px] text-muted-foreground">{new Date(ngo.created_at).toLocaleDateString()}</p></TableCell>
                            <TableCell><p className="text-xs font-mono">REG: {ngo.registration_number}</p><p className="text-xs font-mono">PAN: {ngo.pan_tax_id}</p></TableCell>
                            <TableCell>
                               <span className={cn(
                                 "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                                 ngo.verification_status === 'pending' ? "bg-warning/10 text-warning" : "bg-success/10 text-success"
                               )}>{ngo.verification_status}</span>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button size="sm" variant="ghost" className="h-8 rounded-lg text-primary" onClick={() => openDarpanSearch(ngo.darpan_id)}>Verify on Darpan</Button>
                                <Button size="sm" className="h-8 rounded-lg font-bold" onClick={() => handleVerifyNgo(ngo.id)}>Approve</Button>
                                <Button size="sm" variant="destructive" className="h-8 rounded-lg font-bold" onClick={() => handleRejectNgo(ngo.id)}>Reject</Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              <TabsContent value="volunteers" className="mt-6">
                <div className="rounded-2xl border bg-card/40 backdrop-blur-md overflow-hidden shadow-xl shadow-primary/5">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Volunteer</TableHead>
                        <TableHead className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Skills</TableHead>
                        <TableHead className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Status</TableHead>
                        <TableHead className="text-right font-bold text-xs uppercase tracking-widest text-muted-foreground">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingVols.length === 0 ? (
                        <TableRow><TableCell colSpan={4} className="h-32 text-center text-muted-foreground">No pending volunteer requests</TableCell></TableRow>
                      ) : (
                        pendingVols.map((vol) => (
                          <TableRow key={vol.id}>
                            <TableCell><p className="font-bold text-sm">{vol.full_name}</p><p className="text-[10px] text-muted-foreground">Basic Member</p></TableCell>
                            <TableCell><div className="flex flex-wrap gap-1">{vol.skills?.map((s: string) => (<span key={s} className="px-1.5 py-0.5 rounded-md bg-primary/10 text-primary text-[10px] font-bold">{s}</span>))}</div></TableCell>

                            <TableCell>
                               <span className={cn(
                                 "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                                 vol.verification_status === 'pending' ? "bg-warning/10 text-warning" : "bg-success/10 text-success"
                               )}>{vol.verification_status}</span>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button size="sm" variant="outline" className="h-8 rounded-lg"><FileText className="h-3.5 w-3.5 mr-1.5" /> View ID</Button>
                                <Button size="sm" className="h-8 rounded-lg font-bold" onClick={() => handleVerifyVol(vol.id)}>Approve Verification</Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
            </Tabs>
          </motion.div>
        );

      case "issues":
        return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="flex items-center justify-between">
               <h2 className="text-xl font-bold tracking-tight flex items-center gap-2.5">
                  <Brain className="h-5 w-5 text-primary" /> Central Issue Repository
               </h2>
               <Button onClick={() => setReportOpen(true)} size="sm" className="gap-2 rounded-xl font-bold shadow-lg shadow-primary/10 active:scale-95 transition-all">
                  <Plus className="h-4 w-4" /> Add Manual Entry
               </Button>
            </div>

            <div className="rounded-2xl border bg-card/40 p-4 backdrop-blur-md">
              <FilterBar search={search} onSearchChange={setSearch} filters={[
                { label: "Urgency", value: urgencyFilter, onChange: setUrgencyFilter, options: [{ value: "High", label: "High" }, { value: "Medium", label: "Medium" }, { value: "Low", label: "Low" }] },
                { label: "Status", value: statusFilter, onChange: setStatusFilter, options: [{ value: "Pending", label: "Pending" }, { value: "Verified", label: "Verified" }, { value: "In Progress", label: "In Progress" }, { value: "Solved", label: "Solved" }] },
                { label: "Location", value: locationFilter, onChange: setLocationFilter, options: locations.map(l => ({ value: l, label: l })) },
                { label: "Category", value: categoryFilter, onChange: setCategoryFilter, options: categories.map(c => ({ value: c, label: c })) },
              ]} />
            </div>

            <div className="rounded-2xl border bg-card/40 backdrop-blur-md overflow-hidden shadow-xl shadow-primary/5">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="w-[60px] font-bold text-xs uppercase tracking-widest text-muted-foreground">AI Score</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Issue Details</TableHead>
                    <TableHead className="hidden sm:table-cell font-bold text-xs uppercase tracking-widest text-muted-foreground">Urgency</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Status</TableHead>
                    <TableHead className="hidden md:table-cell font-bold text-xs uppercase tracking-widest text-muted-foreground">Impacted</TableHead>
                    <TableHead className="text-right font-bold text-xs uppercase tracking-widest text-muted-foreground">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {prioritySorted.map((issue) => (
                    <TableRow key={issue.id} className="transition-colors hover:bg-primary/5 border-border/50">
                      <TableCell>
                         <div className={cn(
                           "flex h-8 w-8 items-center justify-center rounded-lg font-bold text-xs tabular-nums shadow-sm",
                           issue.aiPriorityScore > 80 ? "bg-destructive/10 text-destructive border border-destructive/20" : 
                           issue.aiPriorityScore > 50 ? "bg-warning/10 text-warning border border-warning/20" : 
                           "bg-primary/10 text-primary border border-primary/20"
                         )}>
                           {issue.aiPriorityScore}
                         </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[240px]">
                           <p className="font-bold text-sm truncate tracking-tight">{issue.title}</p>
                           <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{issue.location} · {issue.category}</p>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell"><UrgencyBadge urgency={issue.urgency} /></TableCell>
                      <TableCell><StatusBadge status={issue.status} /></TableCell>
                      <TableCell className="hidden md:table-cell tabular-nums text-xs font-semibold">{issue.affectedPeople.toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1.5">
                          <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors" onClick={() => setSelectedIssue(issue)}><Eye className="h-4 w-4" /></Button>
                          {issue.status === "Pending" && <Button size="sm" className="h-8 rounded-lg font-bold px-3 active:scale-95 transition-all" onClick={() => handleVerify(issue.id)}>Verify</Button>}
                          <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg hover:bg-warning/10 hover:text-warning transition-colors" onClick={() => handleEscalate(issue.id)}><Sparkles className="h-4 w-4" /></Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg hover:bg-destructive/10 hover:text-destructive transition-colors" onClick={() => handleDelete(issue.id)}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </motion.div>
        );


      case "analytics":
        return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <h2 className="text-xl font-bold tracking-tight flex items-center gap-2.5">
              <BarChart3 className="h-5 w-5 text-primary" /> AI Analytics Dashboard
            </h2>
            <AIAnalyticsCharts />
          </motion.div>
        );

      case "ngos":
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-bold tracking-tight flex items-center gap-2.5">
              <Building2 className="h-5 w-5 text-primary" /> NGO Management Center
            </h2>
            <div className="rounded-2xl border bg-card/40 backdrop-blur-md overflow-hidden shadow-xl shadow-primary/5">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="font-bold text-xs uppercase tracking-widest text-muted-foreground">NGO Name</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Reg Info</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Type</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Status</TableHead>
                    <TableHead className="text-right font-bold text-xs uppercase tracking-widest text-muted-foreground">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingNgos.map(ngo => (
                    <TableRow key={ngo.id} className="transition-colors hover:bg-primary/5 border-border/50">
                      <TableCell className="font-bold text-sm">{ngo.ngo_name}</TableCell>
                      <TableCell className="text-xs font-mono">REG: {ngo.registration_number}</TableCell>
                      <TableCell className="text-xs font-medium uppercase tracking-tight">{ngo.ngo_type || "Trust"}</TableCell>
                      <TableCell>
                         <span className={cn(
                           "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                           ngo.verification_status === 'verified' ? "bg-success/10 text-success" : "bg-warning/10 text-warning"
                         )}>{ngo.verification_status}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary"><Eye className="h-4 w-4" /></Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg hover:bg-destructive/10 hover:text-destructive" onClick={() => handleBlockNgo(ngo.id)}><ShieldOff className="h-4 w-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {/* Mock data for visualization if DB empty */}
                  {pendingNgos.length === 0 && ngoList.map(ngo => (
                    <TableRow key={ngo.id} className="transition-colors hover:bg-primary/5 border-border/50">
                      <TableCell className="font-bold text-sm">{ngo.name}</TableCell>
                      <TableCell className="text-xs font-mono">ID: {ngo.id}</TableCell>
                      <TableCell className="text-xs font-medium uppercase tracking-tight">NGO</TableCell>
                      <TableCell><span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-success/10 text-success">Verified</span></TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary" onClick={() => setSelectedNgo(ngo)}><Eye className="h-4 w-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        );

      case "volunteers":
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold tracking-tight flex items-center gap-2.5">
                <Users className="h-5 w-5 text-primary" /> Global Volunteer Pool
              </h2>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-success/10 text-success text-[10px] font-bold border border-success/20">
                  <Activity className="h-3 w-3" /> {globalVols.filter(v => v.availability).length} ACTIVE
                </div>
              </div>
            </div>

            <div className="grid gap-6">
              <div className="rounded-2xl border bg-card/40 backdrop-blur-md overflow-hidden shadow-xl shadow-primary/5">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Volunteer</TableHead>
                      <TableHead className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Type</TableHead>
                      <TableHead className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Skills</TableHead>
                      <TableHead className="font-bold text-xs uppercase tracking-widest text-muted-foreground text-center">Trust Score</TableHead>
                      <TableHead className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Status</TableHead>
                      <TableHead className="text-right font-bold text-xs uppercase tracking-widest text-muted-foreground">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {globalVols.map((vol) => (
                      <TableRow key={vol.id} className="transition-colors hover:bg-primary/5 border-border/50">
                        <TableCell>
                          <p className="font-bold text-sm tracking-tight">{vol.full_name}</p>
                          <p className="text-[10px] text-muted-foreground">{vol.location_text || "Remote / Global"}</p>
                        </TableCell>
                        <TableCell>
                          <div className={cn(
                            "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border",
                            vol.type === "ngo_verified" ? "bg-success/10 text-success border-success/20" :
                            vol.type === "verified" ? "bg-primary/10 text-primary border-primary/20" :
                            "bg-muted/50 text-muted-foreground border-border/50"
                          )}>
                            {vol.type === "ngo_verified" && <ShieldCheck className="h-3 w-3" />}
                            {vol.type === "verified" && <CheckCircle className="h-3 w-3" />}
                            {vol.type?.replace("_", " ").toUpperCase()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1 max-w-[200px]">
                            {vol.skills?.slice(0, 3).map((s: string) => (
                              <span key={s} className="px-1.5 py-0.5 rounded-md bg-muted/50 text-muted-foreground text-[10px] font-medium border border-border/50">{s}</span>
                            ))}
                            {vol.skills?.length > 3 && <span className="text-[10px] text-muted-foreground font-medium">+{vol.skills.length - 3}</span>}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="inline-flex items-center justify-center h-8 w-8 rounded-lg bg-primary/5 text-primary font-bold text-xs border border-primary/10">
                            {vol.trust_score}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <div className={cn("h-1.5 w-1.5 rounded-full", vol.availability ? "bg-success" : "bg-muted-foreground")} />
                            <span className="text-[10px] font-bold uppercase tracking-wider">{vol.availability ? "Available" : "Busy"}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary"><Eye className="h-4 w-4" /></Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg hover:bg-destructive/10 hover:text-destructive" onClick={() => handleBlockVol(vol.id)}><ShieldOff className="h-4 w-4" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        );

      case "publics":
        return (
          <div className="space-y-6">
             <h2 className="text-xl font-bold tracking-tight flex items-center gap-2.5">
                <User className="h-5 w-5 text-primary" /> Public User Accounts
             </h2>
             <div className="rounded-2xl border bg-card/40 backdrop-blur-md overflow-hidden shadow-xl shadow-primary/5">
                <Table>
                   <TableHeader className="bg-muted/50">
                      <TableRow>
                         <TableHead className="font-bold text-xs uppercase tracking-widest text-muted-foreground">User ID / Email</TableHead>
                         <TableHead className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Joined</TableHead>
                         <TableHead className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Status</TableHead>
                         <TableHead className="text-right font-bold text-xs uppercase tracking-widest text-muted-foreground">Actions</TableHead>
                      </TableRow>
                   </TableHeader>
                   <TableBody>
                      {publicUsers.length === 0 ? (
                        <TableRow><TableCell colSpan={4} className="h-32 text-center text-muted-foreground italic">No public accounts found</TableCell></TableRow>
                      ) : (
                        publicUsers.map((u) => (
                          <TableRow key={u.id}>
                             <TableCell>
                                <p className="font-bold text-sm">{u.email || "No Email"}</p>
                                <p className="text-[10px] text-muted-foreground font-mono">{u.id}</p>
                             </TableCell>
                             <TableCell><p className="text-xs">{new Date(u.created_at).toLocaleDateString()}</p></TableCell>
                             <TableCell>
                                <span className={cn(
                                   "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                                   u.blocked ? "bg-destructive/10 text-destructive" : "bg-success/10 text-success"
                                )}>
                                   {u.blocked ? "Blocked" : "Active"}
                                </span>
                             </TableCell>
                             <TableCell className="text-right">
                                <Button 
                                   variant="ghost" 
                                   size="sm" 
                                   className={cn("h-8 rounded-lg font-bold", u.blocked ? "text-success hover:bg-success/10" : "text-destructive hover:bg-destructive/10")}
                                   onClick={() => handleToggleUserBlock(u.id, u.blocked)}
                                >
                                   {u.blocked ? <CheckCircle className="h-4 w-4 mr-1.5" /> : <ShieldOff className="h-4 w-4 mr-1.5" />}
                                   {u.blocked ? "Unblock" : "Block User"}
                                </Button>
                             </TableCell>
                          </TableRow>
                        ))
                      )}
                   </TableBody>
                </Table>
             </div>
          </div>
        );

      case "alerts":
        return (
          <div className="space-y-6">
            <h2 className="text-base font-bold flex items-center gap-2"><Bell className="h-4 w-4 text-warning" /> Active Alerts</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {alertList.map(a => (
                <div key={a.id} className="cursor-pointer" onClick={() => setSelectedAlert(a)}>
                  <AlertCard alert={a} />
                </div>
              ))}
            </div>
          </div>
        );

      case "polls":
        return (
          <PollManagementPanel
            polls={pollList}
            issues={issueList}
            onCreate={handlePollCreate}
            onToggle={handlePollToggle}
            onDelete={handlePollDelete}
          />
        );

      case "discussions":
        return (
          <DiscussionModerationPanel
            comments={commentList}
            issues={issueList}
            onDelete={handleCommentDelete}
          />
        );

      case "insights": {
        const focused = issueList.find(i => i.id === insightIssueId) ?? issueList[0];
        return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div>
              <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" /> Community Insights & AI Tuning
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Monitor engagement, tune AI weights, override priorities.
              </p>
            </div>

            <CommunityInsightsPanel issues={issueList} polls={pollList} comments={commentList} />

            <div className="grid gap-6 lg:grid-cols-2">
              <AIWeightControls weights={aiWeights} onChange={setAiWeights} />
              <TrendingMonitor issues={issueList} polls={pollList} comments={commentList} />
            </div>

            {focused && (
              <div className="space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <h3 className="text-sm font-bold flex items-center gap-2">
                    <Brain className="h-4 w-4 text-primary" /> AI Explanation & Priority Override
                  </h3>
                  <select
                    value={focused.id}
                    onChange={(e) => setInsightIssueId(e.target.value)}
                    className="rounded-lg border bg-background px-3 py-1.5 text-xs"
                  >
                    {issueList.map(i => (
                      <option key={i.id} value={i.id}>{i.title}</option>
                    ))}
                  </select>
                </div>
                <AIExplanationPanel
                  issue={focused}
                  polls={pollList}
                  comments={commentList}
                  weights={aiWeights}
                />
                <div className="rounded-2xl border bg-card/50 p-5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Issue Priority Override</h4>
                  <div className="flex gap-2">
                    {(["High", "Medium", "Low"] as const).map(u => (
                      <Button
                        key={u}
                        size="sm"
                        variant={focused.urgency === u ? "default" : "outline"}
                        onClick={() => handlePriorityOverride(focused.id, u)}
                        className="flex-1"
                      >
                        {u}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        );
      }

      case "history":
        return (
          <div className="space-y-6">
            <h2 className="text-base font-bold flex items-center gap-2"><History className="h-4 w-4 text-primary" /> Past Crises</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {mockPastCrises.map(crisis => {
                const ngo = ngoList.find(n => n.id === crisis.resolvedByNgo);
                return (
                  <div key={crisis.id} className="rounded-xl border bg-card p-5 transition-all hover:shadow-md cursor-pointer" onClick={() => setSelectedCrisis(crisis)}>
                    <h3 className="text-sm font-semibold mb-1">{crisis.title}</h3>
                    <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{crisis.description}</p>
                    <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Building2 className="h-3 w-3" />{ngo?.name || "Unknown NGO"}</span>
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{crisis.responseTime}</span>
                      <span className="flex items-center gap-1"><Users className="h-3 w-3" />{crisis.livesImpacted.toLocaleString()} lives</span>
                      <span className="flex items-center gap-1"><Flag className="h-3 w-3" />{crisis.category}</span>
                    </div>
                    {crisis.photos.length > 0 && (
                      <p className="text-[10px] text-primary mt-2">{crisis.photos.length} photos available</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );

      case "settings":
        return (
          <div className="space-y-6">
            <h2 className="text-base font-bold flex items-center gap-2"><Settings className="h-4 w-4 text-primary" /> Settings</h2>
            {/* Broadcast */}
            <div>
              <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5"><Megaphone className="h-3.5 w-3.5 text-primary" /> Broadcast Alert</h3>
              <div className="flex gap-2">
                <Input placeholder="Type emergency broadcast message…" value={broadcastMsg} onChange={(e) => setBroadcastMsg(e.target.value)} className="h-9" />
                <Button size="sm" onClick={handleBroadcast} className="gap-1.5 shrink-0"><Send className="h-3.5 w-3.5" /> Send</Button>
              </div>
            </div>
            {/* Fraud Detection */}
            <div>
              <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5"><ShieldAlert className="h-3.5 w-3.5 text-danger" /> Fraud Detection</h3>
              <div className="rounded-xl border bg-success/5 border-success/30 p-4 text-center text-sm text-success">
                <CheckCircle className="mx-auto h-5 w-5 mb-1" /> No suspicious activity detected
              </div>
            </div>
            {/* Resource Allocation */}
            <div>
              <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5"><Activity className="h-3.5 w-3.5 text-primary" /> Resource Allocation</h3>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border bg-card p-5 text-center"><p className="text-2xl font-bold tabular-nums">{volList.filter(v => v.available && !v.blocked).length}</p><p className="text-xs text-muted-foreground">Available Volunteers</p></div>
                <div className="rounded-xl border bg-card p-5 text-center"><p className="text-2xl font-bold tabular-nums">{ngoList.filter(n => !n.blocked).length}</p><p className="text-xs text-muted-foreground">Active NGOs</p></div>
                <div className="rounded-xl border bg-warning/10 border-warning/30 p-5 text-center"><p className="text-2xl font-bold tabular-nums text-warning">2</p><p className="text-xs text-muted-foreground">Areas need more volunteers</p></div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <DashboardShell
      panelLabel="Admin Panel"
      sidebarItems={sidebarItems}
      activeSection={section}
      onSectionChange={(s) => setSection(s as AdminSection)}
      sidebarOpen={sidebarOpen}
      onSidebarToggle={() => setSidebarOpen(!sidebarOpen)}
      notifications={adminNotifications}
      
      crisisMode={crisisMode}
    >
      {renderContent()}

      {/* Dialogs */}
      <IssueReportForm open={reportOpen} onOpenChange={setReportOpen} onSubmit={handleNewIssue} />
      <IssueDetailDialog issue={selectedIssue} open={!!selectedIssue} onOpenChange={(open) => !open && setSelectedIssue(null)} showAIInsights showDelete onDelete={handleDelete} />
      <NGODetailDialog ngo={selectedNgo} open={!!selectedNgo} onOpenChange={(open) => !open && setSelectedNgo(null)} onBlock={handleBlockNgo} />
      <VolunteerDetailDialog volunteer={selectedVol} open={!!selectedVol} onOpenChange={(open) => !open && setSelectedVol(null)} onBlock={handleBlockVol} />
      <CrisisDetailDialog crisis={selectedCrisis} open={!!selectedCrisis} onOpenChange={(open) => !open && setSelectedCrisis(null)} />
      <AlertDetailDialog alert={selectedAlert} open={!!selectedAlert} onOpenChange={(open) => !open && setSelectedAlert(null)} />
      <TaskAssignDialog issue={assignIssue} open={!!assignIssue} onOpenChange={(open) => !open && setAssignIssue(null)} />
      <AIChatWidget />
    </DashboardShell>
  );
}
