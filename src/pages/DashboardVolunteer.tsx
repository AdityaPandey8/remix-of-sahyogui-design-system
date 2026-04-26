import { useState, useMemo, useEffect } from "react";
import { type Issue, type Alert, type NGO, type Volunteer } from "@/data/mockData";
import { getIssues, getNGOs, getVolunteers, getAlerts, createIssue, updateIssueStatus, toggleVolunteerAvailability } from "@/lib/supabase-service";
import { supabase } from "@/integrations/supabase/client";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { MapDashboard } from "@/components/dashboard/MapDashboard";
import { getLatLng } from "@/lib/map-utils";
import { FilterBar } from "@/components/dashboard/FilterBar";
import { AlertCard } from "@/components/dashboard/AlertCard";
import { AlertDetailDialog } from "@/components/dashboard/AlertDetailDialog";
import { IssueReportForm } from "@/components/dashboard/IssueReportForm";
import { IssueDetailDialog } from "@/components/dashboard/IssueDetailDialog";
import { NGODetailDialog } from "@/components/dashboard/NGODetailDialog";
import { BadgeDisplay } from "@/components/dashboard/BadgeDisplay";
import { AvailabilityToggle } from "@/components/dashboard/AvailabilityToggle";
import { ActivityLog, type Activity } from "@/components/dashboard/ActivityLog";
import { type Notification } from "@/components/dashboard/NotificationBell";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { AIChatWidget } from "@/components/dashboard/AIChatWidget";
import { AIInsightsPanel } from "@/components/dashboard/AIInsightsPanel";
import { NetworkStatusWidget } from "@/components/dashboard/NetworkStatusWidget";
import { TaskMarketplace } from "@/components/dashboard/TaskMarketplace";
import { SafetyGuides } from "@/components/dashboard/SafetyGuides";
import { useCrisis } from "@/contexts/CrisisContext";
import { VolunteerCrisisBanner } from "@/components/crisis/CrisisBanners";
import { StatusBadge } from "@/components/StatusBadge";
import { UrgencyBadge } from "@/components/UrgencyBadge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle, Clock, MapPin, Zap, Trophy,
  BarChart3, AlertTriangle, Star, Upload, User, Brain, Plus, Sparkles,
  LayoutDashboard, ClipboardList, ListTodo, Map, MessageSquare, Bell, UserCircle, Trash2,
  Send, X, Building2, Eye, ChevronDown, ChevronRight, Siren, Loader2, Globe, ShieldCheck, Heart, UserPlus, Award
} from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { calcPriorityScore } from "@/lib/ai-insights";
import { useAuth } from "@/hooks/useAuth";
import { VolunteerDetails, NGODetails, UserProfile } from "@/types/database";

const volNotifications: Notification[] = [
  { id: "n1", title: "New Task Assigned", message: "Food shortage relief task near you.", type: "warning", time: "3m ago", read: false },
  { id: "n2", title: "Emergency Alert", message: "Flood warning in Bihar — volunteers needed.", type: "danger", time: "20m ago", read: false },
  { id: "n3", title: "Task Completed", message: "Road debris clearing marked as done.", type: "success", time: "1h ago", read: true },
];

const ALL_SKILLS = ["First Aid", "Medical", "Logistics", "Driving", "Construction", "Electrical", "Counseling", "Teaching", "Communication", "Cooking", "Search & Rescue", "Navigation", "Photography", "Documentation", "Translation", "Data Entry", "Coordination", "Shelter Mgmt", "Supply Chain"];

type Section = "overview" | "tasks" | "marketplace" | "issues" | "map" | "ngos" | "messages" | "profile" | "alerts";

const shellSidebarItems: { id: Section; label: string; icon: typeof LayoutDashboard }[] = [
  { label: "Overview", id: "overview", icon: LayoutDashboard },
  { label: "Marketplace", id: "marketplace", icon: ClipboardList },
  { label: "My Tasks", id: "tasks", icon: ListTodo },
  { label: "Nearby Issues", id: "issues", icon: MapPin },
  { label: "NGOs", id: "ngos", icon: Building2 },
  { label: "Map & Navigation", id: "map", icon: Map },
  { label: "Messages", id: "messages", icon: MessageSquare },
  { label: "Profile", id: "profile", icon: UserCircle },
  { label: "Alerts", id: "alerts", icon: Bell },
];

interface Message {
  id: string;
  ngoId: string;
  ngoName: string;
  text: string;
  time: string;
  fromVolunteer: boolean;
}

interface IssueWithDistance extends Issue {
  distance: number;
}

export default function DashboardVolunteer() {
  const { t } = useTranslation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [section, setSection] = useState<Section>("overview");
  const [issueList, setIssueList] = useState<Issue[]>([]);
  const [volList, setVolList] = useState<Volunteer[]>([]);
  const [ngoList, setNgoList] = useState<NGO[]>([]);
  const [alertList, setAlertList] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [urgencyFilter, setUrgencyFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [availability, setAvailability] = useState<"Available" | "Busy" | "Offline">("Available");
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [selectedNgoId, setSelectedNgoId] = useState<string | null>(null);
  const [acceptedTasks, setAcceptedTasks] = useState<string[]>([]);
  const [completedTasks, setCompletedTasks] = useState<string[]>(["ISS-007", "ISS-010"]);
  const [reportOpen, setReportOpen] = useState(false);
  const [expandedActivity, setExpandedActivity] = useState<string | null>(null);
  const { user } = useAuth();
  
  const [volDetails, setVolDetails] = useState<VolunteerDetails | null>(null);
  const [myNgos, setMyNgos] = useState<UserProfile[]>([]);
  const [pendingJoinRequests, setPendingJoinRequests] = useState<string[]>([]);
  const { crisisMode } = useCrisis();

  useEffect(() => {
    const fetchVolData = async () => {
      if (!user) return;
      
      const { data: details } = await supabase
        .from("volunteer_details")
        .select("*")
        .eq("id", user.id)
        .single();
      if (details) setVolDetails(details);

      const { data: relations } = await supabase
        .from("ngo_volunteer_relations")
        .select("ngo_id")
        .eq("volunteer_id", user.id);
      
      if (relations) {
        const ngoIds = relations.map(r => r.ngo_id);
        const { data: ngos } = await supabase
          .from("profiles")
          .select("*")
          .in("id", ngoIds);
        if (ngos) setMyNgos(ngos);
      }

      const { data: requests } = await supabase
        .from("volunteer_join_requests")
        .select("ngo_id")
        .eq("volunteer_id", user.id)
        .eq("status", "pending");
      if (requests) setPendingJoinRequests(requests.map(r => r.ngo_id));
    };

    fetchVolData();
  }, [user]);

  const handleRequestToJoin = async (ngoId: string) => {
    if (!user) return;
    const { error } = await supabase
      .from("volunteer_join_requests")
      .insert({ volunteer_id: user.id, ngo_id: ngoId, message: "I'd like to join your team." });
    
    if (!error) {
      toast.success("Join request sent to NGO!");
      setPendingJoinRequests(prev => [...prev, ngoId]);
    } else {
      toast.error("Failed to send request.");
    }
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
        toast.error("Failed to load dashboard data");
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const currentVol = useMemo(() => volList[0] || null, [volList]);
  const [skills, setSkills] = useState<string[]>([]);

  useEffect(() => {
    if (currentVol) {
      setSkills(currentVol.skills);
      setAvailability(currentVol.available ? "Available" : "Offline");
    }
  }, [currentVol]);

  const [messages, setMessages] = useState<Message[]>([
    { id: "m1", ngoId: "NGO-001", ngoName: "HelpBridge Foundation", text: "Please bring extra water supplies to Camp B. Thank you for your efforts!", time: "2h ago", fromVolunteer: false },
    { id: "m2", ngoId: "NGO-003", ngoName: "CareLine Initiative", text: "Medical kits are ready for pickup at the central warehouse. Please collect before 5 PM.", time: "5h ago", fromVolunteer: false },
    { id: "m3", ngoId: "NGO-001", ngoName: "HelpBridge Foundation", text: "Great work on the flood relief today. We're assigning you to Camp C tomorrow.", time: "1d ago", fromVolunteer: false },
  ]);
  const [replyTexts, setReplyTexts] = useState<Record<string, string>>({});

  const [activities] = useState<Activity[]>([
    { id: "a1", action: "Completed: Road debris clearing", time: "1d ago", type: "completed" },
    { id: "a2", action: "Accepted: Food shortage relief", time: "2h ago", type: "assigned" },
    { id: "a3", action: "Emergency: Joined flood response", time: "3h ago", type: "emergency" },
    { id: "a4", action: "Updated status: In Progress", time: "4h ago", type: "update" },
    { id: "a5", action: "Completed: Stray animal rescue", time: "2d ago", type: "completed" },
    { id: "a6", action: "Accepted: Medical supply delivery", time: "3d ago", type: "assigned" },
  ]);

  const locations = useMemo(() => [...new Set(issueList.map(i => i.location))], [issueList]);

  const nearbyIssues = useMemo((): IssueWithDistance[] => {
    if (!currentVol) return [];
    return issueList.filter((i) => i.status !== "Solved")
      .map((i) => ({ ...i, distance: (Math.abs(i.coords.x - currentVol.coords.x) + Math.abs(i.coords.y - currentVol.coords.y)) * 0.15 }))
      .sort((a, b) => a.distance - b.distance);
  }, [issueList, currentVol]);

  const filtered = useMemo(() => {
    return nearbyIssues.filter((i) => {
      if (search && !i.title.toLowerCase().includes(search.toLowerCase()) && !i.location.toLowerCase().includes(search.toLowerCase())) return false;
      if (urgencyFilter !== "all" && i.urgency !== urgencyFilter) return false;
      if (locationFilter !== "all" && i.location !== locationFilter) return false;
      if (categoryFilter !== "all" && i.category !== categoryFilter) return false;
      return true;
    });
  }, [nearbyIssues, search, urgencyFilter, locationFilter, categoryFilter]);

  const bestMatch = useMemo(() => {
    if (!currentVol) return null;
    const skillKeywords: Record<string, string[]> = {
      "First Aid": ["Health", "Disaster"], "Medical": ["Health"],
      "Logistics": ["Food", "Shelter", "Infrastructure"], "Driving": ["Food", "Shelter"],
      "Construction": ["Infrastructure", "Shelter"],
    };
    return nearbyIssues.find((i) => skills.some((s) => skillKeywords[s]?.includes(i.category))) || nearbyIssues[0];
  }, [nearbyIssues, skills, currentVol]);

  const matchReason = useMemo(() => {
    if (!bestMatch || !currentVol) return "";
    const skillKeywords: Record<string, string[]> = {
      "First Aid": ["Health", "Disaster"], "Medical": ["Health"],
      "Logistics": ["Food", "Shelter", "Infrastructure"],
    };
    const matched = skills.find((s) => skillKeywords[s]?.includes(bestMatch.category));
    return matched ? `Your ${matched} skill matches this ${bestMatch.category} emergency` : "Nearest issue to your location";
  }, [bestMatch, skills, currentVol]);

  const matchScore = useMemo(() => {
    if (!bestMatch || !currentVol) return 0;
    const base = skills.some(s => ["First Aid", "Medical"].includes(s) && ["Health", "Disaster"].includes(bestMatch.category)) ? 92 : 78;
    return Math.min(100, base + Math.floor(Math.random() * 8));
  }, [bestMatch, skills, currentVol]);

  const myTasks = useMemo(() => issueList.filter((i) => acceptedTasks.includes(i.id)), [issueList, acceptedTasks]);
  const stats = useMemo(() => {
    if (!currentVol) return { assigned: 0, completed: 0, active: 0, reliability: 0, badges: 0 };
    return {
      assigned: acceptedTasks.length, completed: completedTasks.length,
      active: acceptedTasks.filter((id) => !completedTasks.includes(id)).length,
      reliability: currentVol.reliabilityScore, badges: 3,
    };
  }, [acceptedTasks, completedTasks, currentVol]);

  const connectedNgos = useMemo(() => {
    if (!currentVol) return [];
    return ngoList.filter(n => n.volunteerIds.includes(currentVol.id));
  }, [ngoList, currentVol]);

  const handleAccept = async (id: string) => {
    const success = await updateIssueStatus(id, "In Progress");
    if (success) {
      setAcceptedTasks((prev) => [...prev, id]);
      setIssueList((prev) => prev.map((i) => i.id === id ? { ...i, status: "In Progress" as const } : i));
      toast.success("Task accepted!");
    }
  };
  const handleComplete = async (id: string) => {
    const success = await updateIssueStatus(id, "Solved");
    if (success) {
      setCompletedTasks((prev) => [...prev, id]);
      setIssueList((prev) => prev.map((i) => i.id === id ? { ...i, status: "Solved" as const } : i));
      toast.success("Task marked complete! 🎉");
    }
  };
  const handleDeleteReport = (id: string) => {
    setIssueList((prev) => prev.filter((i) => i.id !== id));
    setAcceptedTasks(prev => prev.filter(t => t !== id));
    toast.success("Report deleted");
  };
  const handleEmergencyJoin = () => {
    const urgent = nearbyIssues.find((i) => i.urgency === "High" && !acceptedTasks.includes(i.id));
    if (urgent) { handleAccept(urgent.id); toast.success("🚨 Joined emergency: " + urgent.title); }
    else { toast.info("No nearby emergencies right now"); }
  };
  const handleNewIssue = async (issueData: Issue) => {
    const result = await createIssue(issueData);
    if (result) {
      setIssueList((prev) => [result, ...prev]);
      toast.success("Issue reported");
    }
  };
  const handleReply = (ngoId: string, ngoName: string) => {
    const text = replyTexts[ngoId];
    if (!text?.trim()) return;
    setMessages(prev => [...prev, { id: `m-${Date.now()}`, ngoId, ngoName, text, time: "Just now", fromVolunteer: true }]);
    setReplyTexts(prev => ({ ...prev, [ngoId]: "" }));
    toast.success("Reply sent");
  };
  const handleAddSkill = (skill: string) => {
    if (!skills.includes(skill)) { setSkills(prev => [...prev, skill]); toast.success(`Added: ${skill}`); }
  };
  const handleRemoveSkill = (skill: string) => {
    setSkills(prev => prev.filter(s => s !== skill));
    toast.info(`Removed: ${skill}`);
  };

  const handleAvailabilityChange = async (newStatus: "Available" | "Busy" | "Offline") => {
    if (!currentVol) return;
    const isAvailable = newStatus === "Available";
    const success = await toggleVolunteerAvailability(currentVol.id, isAvailable);
    if (success) {
      setAvailability(newStatus);
      toast.success(`Status updated to ${newStatus}`);
    }
  };

  const selectedNgo = selectedNgoId ? ngoList.find(n => n.id === selectedNgoId) || null : null;

  const renderContent = () => {
    if (isLoading || !currentVol) {
      return (
        <div className="flex h-[60vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }

    switch (section) {
      case "overview":
        return (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <NetworkStatusWidget />
            <VolunteerCrisisBanner onJoin={handleEmergencyJoin} />

            <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-5">
              <MetricCard icon={BarChart3} label={t('assigned', 'Assigned')} value={stats.assigned} delay={0} />
              <MetricCard icon={CheckCircle} label={t('completed', 'Completed')} value={stats.completed} trend={{ direction: "up", value: "+2" }} delay={100} />
              <MetricCard icon={AlertTriangle} label={t('active', 'Active')} value={stats.active} delay={200} />
              <MetricCard icon={Star} label={t('reliability', 'Reliability')} value={stats.reliability} delay={300} />
              <MetricCard icon={Trophy} label={t('badges', 'Badges')} value={stats.badges} delay={400} />
            </div>

            <AnimatePresence>
              {bestMatch && !acceptedTasks.includes(bestMatch.id) && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="relative overflow-hidden rounded-2xl border-2 border-primary/30 bg-primary/5 p-6 backdrop-blur-md shadow-xl shadow-primary/5 group"
                >
                  <div className="absolute top-0 right-0 p-4">
                     <div className="flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-[10px] font-bold text-primary animate-pulse">
                        <Sparkles className="h-3 w-3" /> BEST MATCH
                     </div>
                  </div>

                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20 group-hover:rotate-12 transition-transform">
                      <Brain className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold tracking-tight">{bestMatch.title}</h3>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{bestMatch.distance.toFixed(1)} km away</span>
                        <span>•</span>
                        <UrgencyBadge urgency={bestMatch.urgency} />
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground leading-relaxed mb-4 max-w-2xl">{bestMatch.description}</p>
                  
                  <div className="grid sm:grid-cols-2 gap-4 mb-6">
                    <div className="rounded-xl bg-background/50 border border-border/50 p-4">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">AI Recommendation Insight</p>
                      <p className="text-xs font-semibold text-foreground leading-snug">{matchReason}</p>
                    </div>
                    <div className="rounded-xl bg-background/50 border border-border/50 p-4">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Match Confidence</p>
                      <div className="flex items-center gap-3">
                         <Progress value={matchScore} className="h-1.5 flex-1" />
                         <span className="text-xs font-bold tabular-nums text-primary">{matchScore}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <StatusBadge status={bestMatch.status} />
                    <Button size="lg" className="px-8 rounded-xl font-bold shadow-lg shadow-primary/20 active:scale-95 transition-all" onClick={() => handleAccept(bestMatch.id)}>
                       Accept Mission
                    </Button>
                  </div>
                  
                  {/* Glass decorative overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                </motion.div>
              )}
            </AnimatePresence>

            <BadgeDisplay tasksCompleted={currentVol.tasksCompleted} reliabilityScore={currentVol.reliabilityScore} />

            {/* Recommended Tasks */}
            {nearbyIssues.length > 0 && (
              <div>
                <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <Brain className="h-4 w-4 text-primary" /> AI Recommended Tasks
                </h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {[...nearbyIssues]
                    .filter((i) => !acceptedTasks.includes(i.id))
                    .sort((a, b) => calcPriorityScore(b) - calcPriorityScore(a))
                    .slice(0, 4)
                    .map((issue) => {
                      const score = calcPriorityScore(issue);
                      return (
                        <div key={issue.id} className="rounded-xl border bg-card p-4 shadow-card hover:shadow-hover transition-shadow">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <h3 className="text-sm font-semibold leading-snug truncate">{issue.title}</h3>
                            <span className={cn(
                              "shrink-0 rounded-lg px-2 py-0.5 text-[10px] font-bold tabular-nums",
                              score >= 80 ? "bg-destructive/10 text-destructive" : score >= 50 ? "bg-warning/10 text-warning" : "bg-success/10 text-success"
                            )}>{score}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mb-3 flex items-center gap-1"><MapPin className="h-3 w-3" />{issue.location}</p>
                          <div className="flex items-center justify-between">
                            <UrgencyBadge urgency={issue.urgency} />
                            <Button size="sm" className="h-7 text-xs rounded-lg active:scale-95" onClick={() => handleAccept(issue.id)}>Accept</Button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            <div className="mt-8">
               <SafetyGuides />
            </div>
          </motion.div>
        );

      case "tasks":
        return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                 <h2 className="text-xl font-bold tracking-tight">Active Missions</h2>
                 <p className="text-xs text-muted-foreground mt-1">Missions currently assigned to you</p>
              </div>
              <span className="rounded-full bg-muted px-3 py-1 text-xs font-bold">{myTasks.length} TOTAL</span>
            </div>

            {myTasks.length === 0 && (
              <div className="py-20 text-center rounded-3xl border border-dashed border-muted-foreground/20 bg-muted/5">
                <ListTodo className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground font-medium">No active missions. Check "Nearby Issues" to contribute.</p>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <AnimatePresence>
                {myTasks.map((task) => {
                  const isComplete = completedTasks.includes(task.id);
                  const ngo = ngoList.find((n) => n.id === task.assignedNgo);
                  const isSelfReported = task.reportedBy === "You" || task.reportedBy === currentVol.name;
                  return (
                    <motion.div 
                      key={task.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={cn(
                        "group relative rounded-2xl border p-5 transition-all hover:shadow-xl", 
                        isComplete ? "bg-success/5 border-success/20 opacity-75" : "bg-card hover:shadow-primary/5"
                      )}
                    >
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="min-w-0 flex-1">
                          <h3 className="text-base font-bold leading-tight group-hover:text-primary transition-colors truncate">{task.title}</h3>
                          {ngo && <p className="text-[10px] font-bold text-muted-foreground uppercase mt-1">Coordinating NGO: {ngo.name}</p>}
                        </div>
                        <StatusBadge status={task.status} />
                      </div>
                      
                      <div className="flex items-center gap-4 mb-5 text-xs text-muted-foreground">
                         <span className="flex items-center gap-1.5 font-medium"><MapPin className="h-3.5 w-3.5" /> {task.location}</span>
                         <UrgencyBadge urgency={task.urgency} />
                      </div>

                      <div className="flex items-center gap-2 flex-wrap pt-4 border-t border-border/50">
                        {!isComplete && (
                          <>
                            <Button size="sm" className="rounded-xl font-bold shadow-sm active:scale-95" onClick={() => handleComplete(task.id)}>
                              <CheckCircle className="h-3.5 w-3.5 mr-1.5" />Mark Complete
                            </Button>
                            <Button size="sm" variant="outline" className="rounded-xl font-bold gap-1.5 active:scale-95"><Upload className="h-3.5 w-3.5" />Upload Proof</Button>
                          </>
                        )}
                        <Button size="sm" variant="outline" className="rounded-xl font-bold active:scale-95" onClick={() => setSelectedIssue(task)}>Details</Button>
                        {isSelfReported && (
                          <Button size="icon" variant="destructive" className="rounded-xl h-8 w-8 ml-auto active:scale-95" onClick={() => handleDeleteReport(task.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </motion.div>
        );

      case "marketplace":
        return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <TaskMarketplace />
          </motion.div>
        );


      case "issues":
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold">Nearby Issues</h2>
              <Button size="sm" variant="outline" className="h-8 text-xs gap-1 active:scale-95" onClick={() => setReportOpen(true)}>
                <Plus className="h-3 w-3" /> Report Issue
              </Button>
            </div>
            <FilterBar search={search} onSearchChange={setSearch} filters={[
              { label: "Urgency", value: urgencyFilter, onChange: setUrgencyFilter, options: [{ value: "High", label: "High" }, { value: "Medium", label: "Medium" }, { value: "Low", label: "Low" }] },
              { label: "Location", value: locationFilter, onChange: setLocationFilter, options: locations.map(l => ({ value: l, label: l.split(",")[0] })) },
              { label: "Category", value: categoryFilter, onChange: setCategoryFilter, options: [{ value: "Health", label: "Health" }, { value: "Disaster", label: "Disaster" }, { value: "Food", label: "Food" }, { value: "Infrastructure", label: "Infrastructure" }, { value: "Environment", label: "Environment" }, { value: "Safety", label: "Safety" }] },
            ]} />
            <div className="grid gap-3 sm:grid-cols-2">
              {filtered.slice(0, 12).map((issue) => {
                const accepted = acceptedTasks.includes(issue.id);
                const isSelfReported = issue.reportedBy === "You" || issue.reportedBy === currentVol.name;
                return (
                  <div key={issue.id} className="rounded-xl border bg-card p-4 transition-all hover:shadow-md hover:-translate-y-0.5">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="text-sm font-semibold leading-snug">{issue.title}</h3>
                      <UrgencyBadge urgency={issue.urgency} />
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                      <span className="flex items-center gap-0.5"><MapPin className="h-3 w-3" />{issue.distance.toFixed(1)} km</span>
                      <span className="flex items-center gap-0.5"><Clock className="h-3 w-3" />{issue.location}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <StatusBadge status={issue.status} />
                      <div className="flex gap-1">
                        {!accepted && <Button size="sm" className="h-7 text-xs active:scale-95" onClick={() => handleAccept(issue.id)}>Accept</Button>}
                        <Button size="sm" variant="outline" className="h-7 text-xs active:scale-95" onClick={() => setSelectedIssue(issue)}>View</Button>
                        {isSelfReported && (
                          <Button size="sm" variant="destructive" className="h-7 text-xs active:scale-95" onClick={() => handleDeleteReport(issue.id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              {filtered.length === 0 && <p className="col-span-full text-center text-sm text-muted-foreground py-8">No issues match your filters.</p>}
            </div>
          </div>
        );

      case "map":
        return (
          <div className="space-y-4">
            <MapDashboard
              userRole="volunteer"
              issues={issueList}
              userLocation={getLatLng(currentVol.coords)}
              onIssueClick={setSelectedIssue}
            />
          </div>
        );

      case "messages": {
        const grouped = messages.reduce<Record<string, Message[]>>((acc, m) => {
          if (!acc[m.ngoId]) acc[m.ngoId] = [];
          acc[m.ngoId].push(m);
          return acc;
        }, {});

        return (
          <div className="space-y-4">
            <h2 className="text-base font-bold">Messages from NGOs</h2>
            {Object.entries(grouped).map(([ngoId, msgs]) => {
              const ngoName = msgs[0].ngoName;
              return (
                <div key={ngoId} className="rounded-xl border bg-card p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-primary" />
                      <span className="text-sm font-semibold">{ngoName}</span>
                    </div>
                    <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" onClick={() => setSelectedNgoId(ngoId)}>
                      <Eye className="h-3 w-3" /> View NGO
                    </Button>
                  </div>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {msgs.map(m => (
                      <div key={m.id} className={cn("rounded-lg p-3 max-w-[85%]", m.fromVolunteer ? "ml-auto bg-primary/10 border border-primary/20" : "bg-muted/50")}>
                        <p className="text-xs">{m.text}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">{m.time}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Type a reply…"
                      value={replyTexts[ngoId] || ""}
                      onChange={e => setReplyTexts(prev => ({ ...prev, [ngoId]: e.target.value }))}
                      className="h-8 text-xs"
                      onKeyDown={e => e.key === "Enter" && handleReply(ngoId, ngoName)}
                    />
                    <Button size="sm" variant="outline" className="h-8 gap-1" onClick={() => handleReply(ngoId, ngoName)}>
                      <Send className="h-3 w-3" /> Send
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        );
      }

      case "profile":
        return (
          <div className="space-y-6">
            <div className="rounded-2xl border bg-card/40 backdrop-blur-md p-6 shadow-xl shadow-primary/5">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="relative">
                  <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center border-4 border-background shadow-xl">
                    <User className="h-12 w-12 text-primary" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-background border-2 border-primary/20 flex items-center justify-center">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                  </div>
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mb-2">
                    <h2 className="text-2xl font-bold tracking-tight">{volDetails?.full_name || "Volunteer"}</h2>
                    <div className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider",
                      volDetails?.type === "ngo_verified" ? "bg-success/10 text-success border-success/20" :
                      volDetails?.type === "verified" ? "bg-primary/10 text-primary border-primary/20" :
                      "bg-muted/50 text-muted-foreground border-border/50"
                    )}>
                      {volDetails?.type?.replace("_", " ") || "Basic"} Member
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground flex items-center justify-center sm:justify-start gap-1.5 mb-4">
                    <MapPin className="h-3.5 w-3.5" /> {volDetails?.location_text || "India, Earth"}
                  </p>
                  <div className="flex flex-wrap justify-center sm:justify-start gap-6">
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Trust Score</p>
                      <p className="text-xl font-bold text-primary">{volDetails?.trust_score || "50"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Missions</p>
                      <p className="text-xl font-bold">{volDetails?.tasks_completed || "0"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Status</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className={cn("h-2 w-2 rounded-full animate-pulse", volDetails?.availability ? "bg-success" : "bg-muted-foreground")} />
                        <span className="text-xs font-bold">{volDetails?.availability ? "Available" : "Busy"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-2xl border bg-card/40 p-6">
                <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
                  <Zap className="h-4 w-4 text-primary" /> Core Skills
                </h3>
                <div className="flex flex-wrap gap-2">
                  {volDetails?.skills?.map((skill: string) => (
                    <span key={skill} className="px-3 py-1.5 rounded-xl bg-background border border-border/50 text-xs font-bold text-foreground flex items-center gap-2">
                      <div className="h-1 w-1 rounded-full bg-primary" /> {skill}
                    </span>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl border bg-card/40 p-6">
                <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
                  <Award className="h-4 w-4 text-warning" /> Achievements
                </h3>
                <div className="flex gap-4">
                  <div className="h-12 w-12 rounded-xl bg-warning/10 flex items-center justify-center text-warning grayscale opacity-50">
                    <Trophy className="h-6 w-6" />
                  </div>
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary grayscale opacity-50">
                    <Star className="h-6 w-6" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case "ngos":
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold tracking-tight flex items-center gap-2.5">
                <Building2 className="h-5 w-5 text-primary" /> NGO Organizations
              </h2>
            </div>

            <Tabs defaultValue="my-ngos" className="w-full">
              <TabsList className="grid w-full max-w-md grid-cols-2 rounded-xl bg-muted/50 p-1">
                <TabsTrigger value="my-ngos" className="rounded-lg font-bold">My NGOs ({myNgos.length})</TabsTrigger>
                <TabsTrigger value="explore" className="rounded-lg font-bold">Explore</TabsTrigger>
              </TabsList>

              <TabsContent value="my-ngos" className="mt-6">
                 {myNgos.length === 0 ? (
                    <div className="py-20 text-center rounded-3xl border border-dashed border-muted-foreground/20 bg-muted/5">
                      <Building2 className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground font-medium italic">You are not affiliated with any NGO yet.</p>
                      <Button variant="link" onClick={() => setSection("ngos")} className="mt-2 text-primary font-bold">Explore & Join One</Button>
                    </div>
                 ) : (
                    <div className="grid gap-4 sm:grid-cols-2">
                       {myNgos.map((ngo) => (
                          <div key={ngo.id} className="rounded-2xl border bg-card/50 p-5 flex items-center justify-between group hover:shadow-xl transition-all">
                             <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center font-bold text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                                   {ngo.email?.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                   <p className="font-bold text-sm">{ngo.email}</p>
                                   <div className="flex items-center gap-1.5 mt-1">
                                      <ShieldCheck className="h-3 w-3 text-success" />
                                      <span className="text-[10px] font-bold text-success uppercase">Partnered</span>
                                   </div>
                                </div>
                             </div>
                             <Button size="sm" variant="outline" className="rounded-lg font-bold">Dashboard</Button>
                          </div>
                       ))}
                    </div>
                 )}
              </TabsContent>

              <TabsContent value="explore" className="mt-6">
                 <div className="grid gap-4 sm:grid-cols-2">
                    {ngoList.map((ngo) => (
                       <div key={ngo.id} className="rounded-2xl border bg-card/50 p-5 group hover:shadow-xl transition-all">
                          <div className="flex items-start justify-between mb-4">
                             <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center font-bold">
                                   {ngo.name?.charAt(0)}
                                </div>
                                <div>
                                   <p className="font-bold text-sm">{ngo.name}</p>
                                   <p className="text-[10px] text-muted-foreground">{ngo.location}</p>
                                </div>
                             </div>
                             <UrgencyBadge urgency="Medium" />
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2 mb-4 leading-relaxed">{ngo.focusArea} relief efforts and community support.</p>
                          <div className="flex gap-2">
                             {pendingJoinRequests.includes(ngo.id) ? (
                                <Button size="sm" disabled className="flex-1 rounded-xl font-bold bg-muted text-muted-foreground">Request Pending</Button>
                             ) : myNgos.some(mn => mn.id === ngo.id) ? (
                                <Button size="sm" disabled className="flex-1 rounded-xl font-bold bg-success/10 text-success border-success/20">Already Joined</Button>
                             ) : (
                                <Button size="sm" className="flex-1 rounded-xl font-bold shadow-lg shadow-primary/10" onClick={() => handleRequestToJoin(ngo.id)}>Request to Join</Button>
                             )}
                             <Button size="icon" variant="outline" className="h-9 w-9 rounded-xl"><Eye className="h-4 w-4" /></Button>
                          </div>
                       </div>
                    ))}
                 </div>
              </TabsContent>
            </Tabs>
          </div>
        );
      default:
        return null;
    }
  };


  return (
    <>
      <DashboardShell
        panelLabel="Volunteer Panel"
        sidebarItems={shellSidebarItems}
        activeSection={section}
        onSectionChange={(s) => setSection(s as Section)}
        sidebarOpen={sidebarOpen}
        onSidebarToggle={() => setSidebarOpen(p => !p)}
        notifications={volNotifications}
        crisisMode={crisisMode}
        headerExtra={
          <Button variant="destructive" size="sm" className="gap-1.5 animate-pulse hover:animate-none active:scale-95" onClick={handleEmergencyJoin}>
            <Zap className="h-3.5 w-3.5" /> Join Emergency
          </Button>
        }
      >
        {renderContent()}
      </DashboardShell>

      <IssueReportForm open={reportOpen} onOpenChange={setReportOpen} onSubmit={handleNewIssue} />
      <IssueDetailDialog issue={selectedIssue} open={!!selectedIssue} onOpenChange={(open) => !open && setSelectedIssue(null)} showAIInsights />
      <AlertDetailDialog alert={selectedAlert} open={!!selectedAlert} onOpenChange={(open) => !open && setSelectedAlert(null)} />
      <NGODetailDialog ngo={selectedNgo} open={!!selectedNgo} onOpenChange={(open) => !open && setSelectedNgoId(null)} />
      <AIChatWidget />
    </>
  );
}
