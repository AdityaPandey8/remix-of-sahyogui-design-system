import { useState, useMemo, useEffect } from "react";
import { type Issue, type Alert, type Poll, type DiscussionComment, polls as seedPolls, discussions as seedDiscussions } from "@/data/mockData";
import { getIssues, getAlerts, createIssue, upvoteIssue } from "@/lib/supabase-service";
import { IssueCard } from "@/components/IssueCard";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { MapDashboard } from "@/components/dashboard/MapDashboard";
import { FilterBar } from "@/components/dashboard/FilterBar";
import { AlertCard } from "@/components/dashboard/AlertCard";
import { AlertDetailDialog } from "@/components/dashboard/AlertDetailDialog";
import { IssueReportForm } from "@/components/dashboard/IssueReportForm";
import { IssueDetailDialog } from "@/components/dashboard/IssueDetailDialog";
import { SafetyGuides } from "@/components/dashboard/SafetyGuides";
import { type Notification } from "@/components/dashboard/NotificationBell";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { AIChatWidget } from "@/components/dashboard/AIChatWidget";
import { NetworkStatusWidget } from "@/components/dashboard/NetworkStatusWidget";
import { PollsSection } from "@/components/dashboard/PollsSection";
import { DiscussionsSection } from "@/components/dashboard/DiscussionsSection";
import { TrendingMonitor } from "@/components/dashboard/TrendingMonitor";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Siren, AlertTriangle, CheckCircle, Flame, User, Shield, ThumbsUp,
  LayoutDashboard, FileText, Bell, Map, UserCircle, Trash2, Award, Star, TrendingUp,
  Heart, Target, Clock, Sparkles, Loader2, Vote, MessageSquare
} from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { useCrisis } from "@/contexts/CrisisContext";
import { PublicCrisisBanner } from "@/components/crisis/CrisisBanners";
import { useAuth } from "@/hooks/useAuth";
import { useRealtimeTable } from "@/hooks/useRealtimeTable";

const publicNotifications: Notification[] = [
  { id: "n1", title: "Flood Warning", message: "Heavy rainfall expected in Bihar. Stay safe.", type: "danger", time: "5m ago", read: false },
  { id: "n2", title: "Relief Camp Open", message: "New camp at Patna — capacity 500 families.", type: "info", time: "30m ago", read: false },
  { id: "n3", title: "Issue Resolved", message: "Road debris near Mussoorie cleared successfully.", type: "success", time: "1h ago", read: true },
];

type Section = "home" | "issues" | "polls" | "discussions" | "alerts" | "map" | "profile";

const shellSidebarItems: { id: Section; label: string; icon: typeof LayoutDashboard }[] = [
  { label: "Home", id: "home", icon: LayoutDashboard },
  { label: "Issues", id: "issues", icon: FileText },
  { label: "Polls", id: "polls", icon: Vote },
  { label: "Discussions", id: "discussions", icon: MessageSquare },
  { label: "Alerts", id: "alerts", icon: Bell },
  { label: "Map", id: "map", icon: Map },
  { label: "Profile", id: "profile", icon: UserCircle },
];

// Profile achievement badges
const profileBadges = [
  { id: "pb1", name: "First Report", desc: "Filed your first report", icon: FileText, earned: true, color: "text-primary" },
  { id: "pb2", name: "10 Upvotes", desc: "Received 10 upvotes", icon: ThumbsUp, earned: true, color: "text-success" },
  { id: "pb3", name: "Emergency Reporter", desc: "Filed an emergency", icon: Siren, earned: false, color: "text-destructive" },
  { id: "pb4", name: "Community Hero", desc: "5+ resolved reports", icon: Award, earned: false, color: "text-warning" },
  { id: "pb5", name: "Trusted Voice", desc: "Trust score 9+", icon: Shield, earned: false, color: "text-primary" },
  { id: "pb6", name: "Watchdog", desc: "20+ reports filed", icon: Target, earned: false, color: "text-warning" },
];

export default function DashboardPublic() {
  const { t } = useTranslation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [section, setSection] = useState<Section>("home");
  const [issueList, setIssueList] = useState<Issue[]>([]);
  const [alertList, setAlertList] = useState<Alert[]>([]);
  const [pollList, setPollList] = useState<Poll[]>(seedPolls);
  const [commentList, setCommentList] = useState<DiscussionComment[]>(seedDiscussions);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [urgencyFilter, setUrgencyFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");
  const [reportOpen, setReportOpen] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const { crisisMode } = useCrisis();
  const { user } = useAuth();

  const reload = async () => {
    try {
      const [issues, alerts] = await Promise.all([getIssues(), getAlerts()]);
      setIssueList(issues);
      setAlertList(alerts);
    } catch (error) {
      toast.error("Failed to load data from server");
    }
  };

  useEffect(() => {
    setIsLoading(true);
    reload().finally(() => setIsLoading(false));
  }, []);

  useRealtimeTable("issues", reload);
  useRealtimeTable("alerts", reload);

  const locations = useMemo(() => [...new Set(issueList.map(i => i.location))], [issueList]);

  const filtered = useMemo(() => {
    return issueList.filter((i) => {
      if (search && !i.title.toLowerCase().includes(search.toLowerCase()) && !i.location.toLowerCase().includes(search.toLowerCase())) return false;
      if (urgencyFilter !== "all" && i.urgency !== urgencyFilter) return false;
      if (statusFilter !== "all" && i.status !== statusFilter) return false;
      if (categoryFilter !== "all" && i.category !== categoryFilter) return false;
      if (locationFilter !== "all" && i.location !== locationFilter) return false;
      return true;
    });
  }, [issueList, search, urgencyFilter, statusFilter, categoryFilter, locationFilter]);

  const stats = useMemo(() => ({
    total: issueList.length,
    resolved: issueList.filter((i) => i.status === "Solved").length,
    active: issueList.filter((i) => i.status !== "Solved").length,
    high: issueList.filter((i) => i.urgency === "High" && i.status !== "Solved").length,
  }), [issueList]);

  const myReports = useMemo(() => issueList.filter(i => i.reportedBy === "You"), [issueList]);
  const totalUpvotesReceived = useMemo(() => myReports.reduce((s, i) => s + i.upvotes, 0), [myReports]);
  const resolvedByComm = useMemo(() => issueList.filter(i => i.status === "Solved").length, [issueList]);
  const trustScore = 8.5;
  const contributionPoints = 42 + myReports.length * 10 + totalUpvotesReceived;

  const handleNewIssue = async (issueData: Issue) => {
    const result = await createIssue({ ...issueData, reporterId: user?.id ?? null });
    if (result) {
      setIssueList((prev) => [result, ...prev]);
      toast.success("Issue reported successfully!", { description: `ID: ${result.id}` });
    } else {
      toast.error("Failed to report issue");
    }
  };

  const handleEmergency = async () => {
    const emergencyIssue: Omit<Issue, 'id' | 'createdAt' | 'upvotes' | 'comments'> = {
      title: "Emergency reported at your location",
      description: "One-tap emergency report. Auto-detected location.",
      urgency: "High", status: "Pending", location: "Auto-detected: Your Area",
      category: "Disaster", images: [], reportedBy: "You", assignedNgo: null,
      responseTime: null, aiPriorityScore: 90, affectedPeople: 100,
      isAnonymous: false, isFake: false, coords: { x: 45, y: 50 },
      assignedVolunteers: [], photos: [],
    };
    
    const result = await createIssue({ ...emergencyIssue, reporterId: user?.id ?? null });
    if (result) {
      setIssueList((prev) => [result, ...prev]);
      toast.success("🚨 Emergency reported!", { description: "Help is on the way. Stay safe." });
    }
  };

  const handleUpvote = async (id: string) => {
    const success = await upvoteIssue(id);
    if (success) {
      setIssueList((prev) => prev.map((i) => i.id === id ? { ...i, upvotes: i.upvotes + 1 } : i));
      if (selectedIssue?.id === id) setSelectedIssue((prev) => prev ? { ...prev, upvotes: prev.upvotes + 1 } : null);
    }
  };

  const handleComment = (id: string, text: string) => {
    const comment = { id: `c-${Date.now()}`, author: "You", text, createdAt: new Date().toISOString() };
    setIssueList((prev) => prev.map((i) => i.id === id ? { ...i, comments: [...i.comments, comment] } : i));
    if (selectedIssue?.id === id) setSelectedIssue((prev) => prev ? { ...prev, comments: [...prev.comments, comment] } : null);
    toast.success("Comment added");
  };

  const handleDeleteReport = (id: string) => {
    setIssueList(prev => prev.filter(i => i.id !== id));
    toast.success("Report deleted");
  };

  const handlePollVote = (pollId: string, optionIndex: number) => {
    setPollList(prev => prev.map(p =>
      p.id === pollId
        ? { ...p, options: p.options.map((o, i) => i === optionIndex ? { ...o, votes: o.votes + 1 } : o) }
        : p
    ));
    toast.success("Vote recorded");
  };

  const handleAddDiscussion = (issueId: string, text: string) => {
    const newComment: DiscussionComment = {
      id: `DSC-${Date.now()}`,
      issueId,
      user: "You",
      text,
      time: new Date().toISOString(),
    };
    setCommentList(prev => [newComment, ...prev]);
    toast.success("Comment posted");
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
      case "home":
        return (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <NetworkStatusWidget />
            <PublicCrisisBanner />
            
            <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
              <MetricCard icon={AlertTriangle} label={t('total_issues', 'Total Issues')} value={stats.total} trend={{ direction: "up", value: "+3" }} delay={0} />
              <MetricCard icon={CheckCircle} label={t('resolved', 'Resolved')} value={stats.resolved} trend={{ direction: "up", value: "+1" }} delay={100} />
              <MetricCard icon={Flame} label={t('active_crises', 'Active Crises')} value={stats.high} delay={200} />
              <MetricCard icon={User} label={t('your_reports', 'Your Reports')} value={myReports.length} delay={300} />
            </div>

            {/* Trending Issues */}
            <TrendingMonitor issues={issueList} polls={pollList} comments={commentList} />

            {/* Live Alerts */}
            <div>
              <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Siren className="h-4 w-4 text-destructive animate-pulse" /> Live Regional Alerts
              </h2>
              <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
                {alertList.map((a, i) => (
                  <motion.div 
                    key={a.id} 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="min-w-[320px] shrink-0" 
                    onClick={() => setSelectedAlert(a)}
                  >
                    <AlertCard alert={a} />
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="mt-8">
               <SafetyGuides />
            </div>
          </motion.div>
        );

      case "issues":
        return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                 <h2 className="text-xl font-bold tracking-tight">Community Issues</h2>
                 <p className="text-xs text-muted-foreground mt-1">Verified reports from your local community</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => setReportOpen(true)} className="gap-2 rounded-xl font-bold shadow-lg shadow-primary/10 active:scale-95 transition-all">
                  <Plus className="h-4 w-4" /> Report Issue
                </Button>
                <Button size="sm" variant="destructive" onClick={handleEmergency} className="gap-2 rounded-xl font-bold animate-pulse hover:animate-none active:scale-95 transition-all shadow-lg shadow-destructive/20">
                  <Siren className="h-4 w-4" /> Emergency
                </Button>
              </div>
            </div>
            
            <div className="rounded-2xl border bg-card/40 p-4 backdrop-blur-md">
              <FilterBar
                search={search}
                onSearchChange={setSearch}
                filters={[
                  { label: "Urgency", value: urgencyFilter, onChange: setUrgencyFilter, options: [{ value: "High", label: "High" }, { value: "Medium", label: "Medium" }, { value: "Low", label: "Low" }] },
                  { label: "Status", value: statusFilter, onChange: setStatusFilter, options: [{ value: "Pending", label: "Pending" }, { value: "Verified", label: "Verified" }, { value: "In Progress", label: "In Progress" }, { value: "Solved", label: "Solved" }] },
                  { label: "Category", value: categoryFilter, onChange: setCategoryFilter, options: [{ value: "Health", label: "Health" }, { value: "Disaster", label: "Disaster" }, { value: "Food", label: "Food" }, { value: "Infrastructure", label: "Infra" }] },
                  { label: "Location", value: locationFilter, onChange: setLocationFilter, options: locations.map(l => ({ value: l, label: l.split(",")[0] })) },
                ]}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <AnimatePresence>
                {filtered.map((issue) => {
                  const isOwn = issue.reportedBy === "You";
                  return (
                    <motion.div 
                      key={issue.id} 
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="relative"
                    >
                      <div onClick={() => setSelectedIssue(issue)} className="cursor-pointer">
                        <IssueCard issue={issue} />
                      </div>
                      {isOwn && (
                        <Button size="icon" variant="destructive" className="absolute top-2 right-2 h-7 w-7 rounded-lg shadow-lg" onClick={() => handleDeleteReport(issue.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
              {filtered.length === 0 && (
                <div className="col-span-full py-20 text-center rounded-3xl border border-dashed border-muted-foreground/20 bg-muted/5">
                   <Target className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                   <p className="text-sm text-muted-foreground font-medium">No reports found matching your filters.</p>
                </div>
              )}
            </div>
          </motion.div>
        );


      case "alerts":
        return (
          <div className="space-y-4">
            <h2 className="text-base font-bold">Active Alerts & Notifications</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {alertList.map(a => (
                <div key={a.id} className="cursor-pointer" onClick={() => setSelectedAlert(a)}>
                  <AlertCard alert={a} />
                </div>
              ))}
            </div>
          </div>
        );

      case "map":
        return (
          <div className="space-y-4">
            <MapDashboard
              userRole="public"
              issues={issueList}
              onIssueClick={setSelectedIssue}
              onReportIssue={() => setReportOpen(true)}
            />
          </div>
        );

      case "polls":
        return <PollsSection polls={pollList} issues={issueList} onVote={handlePollVote} />;

      case "discussions":
        return <DiscussionsSection comments={commentList} issues={issueList} onAddComment={handleAddDiscussion} />;

      case "profile":
        return (
          <div className="space-y-6">
            {/* Profile Header */}
            <div className="rounded-2xl border bg-gradient-to-br from-primary/5 to-primary/10 p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-2xl shadow-lg">
                  JD
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold">Jane Doe</h2>
                    <span className="rounded-full bg-success/10 border border-success/30 px-2.5 py-0.5 text-[10px] font-bold text-success">Active Reporter</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Member since March 2025</p>
                </div>
              </div>

              {/* Trust Score Bar */}
              <div className="mt-4 rounded-xl bg-background/60 border p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold flex items-center gap-1"><Shield className="h-3.5 w-3.5 text-primary" /> Trust Score</span>
                  <span className="text-lg font-bold text-primary tabular-nums">{trustScore}/10</span>
                </div>
                <Progress value={trustScore * 10} className="h-2.5 [&>div]:bg-primary" />
                <p className="text-[10px] text-muted-foreground mt-1">Based on report accuracy, community engagement, and verification rate</p>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="rounded-xl border bg-card p-4 text-center transition-all hover:shadow-md">
                <FileText className="h-5 w-5 text-primary mx-auto mb-1" />
                <p className="text-2xl font-bold tabular-nums">{myReports.length}</p>
                <p className="text-[10px] text-muted-foreground">Issues Reported</p>
              </div>
              <div className="rounded-xl border bg-card p-4 text-center transition-all hover:shadow-md">
                <CheckCircle className="h-5 w-5 text-success mx-auto mb-1" />
                <p className="text-2xl font-bold tabular-nums">{resolvedByComm}</p>
                <p className="text-[10px] text-muted-foreground">Resolved (Community)</p>
              </div>
              <div className="rounded-xl border bg-card p-4 text-center transition-all hover:shadow-md">
                <ThumbsUp className="h-5 w-5 text-warning mx-auto mb-1" />
                <p className="text-2xl font-bold tabular-nums">{totalUpvotesReceived}</p>
                <p className="text-[10px] text-muted-foreground">Upvotes Received</p>
              </div>
              <div className="rounded-xl border bg-card p-4 text-center transition-all hover:shadow-md">
                <TrendingUp className="h-5 w-5 text-primary mx-auto mb-1" />
                <p className="text-2xl font-bold tabular-nums">#{Math.max(1, 25 - myReports.length * 3)}</p>
                <p className="text-[10px] text-muted-foreground">Community Rank</p>
              </div>
              <div className="rounded-xl border bg-card p-4 text-center transition-all hover:shadow-md">
                <Star className="h-5 w-5 text-warning mx-auto mb-1" />
                <p className="text-2xl font-bold tabular-nums">{contributionPoints}</p>
                <p className="text-[10px] text-muted-foreground">Contribution Points</p>
              </div>
              <div className="rounded-xl border bg-card p-4 text-center transition-all hover:shadow-md">
                <Siren className="h-5 w-5 text-destructive mx-auto mb-1" />
                <p className="text-2xl font-bold tabular-nums">{myReports.filter(i => i.urgency === "High").length}</p>
                <p className="text-[10px] text-muted-foreground">Emergency Reports</p>
              </div>
            </div>

            {/* Achievement Badges */}
            <div>
              <h3 className="text-sm font-bold mb-3 flex items-center gap-1.5"><Award className="h-4 w-4 text-warning" /> Achievement Badges</h3>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                {profileBadges.map(b => {
                  const Icon = b.icon;
                  return (
                    <div
                      key={b.id}
                      className={cn("flex flex-col items-center gap-1 rounded-lg border p-3 text-center transition-all", b.earned ? "hover:shadow-md" : "opacity-35")}
                      title={b.desc}
                    >
                      <Icon className={cn("h-6 w-6", b.earned ? b.color : "text-muted-foreground")} />
                      <span className="text-[10px] font-semibold leading-tight">{b.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Your Reports */}
            <div>
              <h3 className="text-sm font-bold mb-3">Your Reports ({myReports.length})</h3>
              {myReports.length === 0 ? (
                <div className="rounded-xl border bg-muted/30 p-8 text-center">
                  <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No reports filed yet.</p>
                  <Button size="sm" className="mt-3 gap-1" onClick={() => { setSection("issues"); setReportOpen(true); }}>
                    <Plus className="h-3 w-3" /> File Your First Report
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {myReports.map(issue => (
                    <div key={issue.id} className="rounded-xl border bg-card p-4 flex items-center justify-between hover:shadow-md transition-all">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-semibold truncate">{issue.title}</h4>
                          <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold",
                            issue.status === "Solved" ? "bg-success/10 text-success" :
                            issue.status === "In Progress" ? "bg-primary/10 text-primary" :
                            issue.status === "Verified" ? "bg-warning/10 text-warning" :
                            "bg-muted text-muted-foreground"
                          )}>
                            {issue.status}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                          <Clock className="h-3 w-3" /> {new Date(issue.createdAt).toLocaleDateString()}
                          <span>•</span>
                          <ThumbsUp className="h-3 w-3" /> {issue.upvotes}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setSelectedIssue(issue)}>View</Button>
                        <Button size="sm" variant="destructive" className="h-7 text-xs gap-1" onClick={() => handleDeleteReport(issue.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <DashboardShell
        panelLabel="Public Dashboard"
        sidebarItems={shellSidebarItems}
        activeSection={section}
        onSectionChange={(s) => setSection(s as Section)}
        sidebarOpen={sidebarOpen}
        onSidebarToggle={() => setSidebarOpen(p => !p)}
        notifications={publicNotifications}
        crisisMode={crisisMode}
      >
        {renderContent()}
      </DashboardShell>

      <IssueReportForm open={reportOpen} onOpenChange={setReportOpen} onSubmit={handleNewIssue} />
      <IssueDetailDialog issue={selectedIssue} open={!!selectedIssue} onOpenChange={(open) => !open && setSelectedIssue(null)} onUpvote={handleUpvote} onComment={handleComment} />
      <AlertDetailDialog alert={selectedAlert} open={!!selectedAlert} onOpenChange={(open) => !open && setSelectedAlert(null)} />
      <AIChatWidget />
    </>
  );
}
