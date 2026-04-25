import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { 
  LucideIcon, Shield, Building2, Heart, Globe, Loader2, ArrowLeft, 
  CheckCircle2, User, Mail, Lock, LogIn, UserPlus, Sparkles, ShieldCheck
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ThemeToggle";
import { motion, AnimatePresence } from "framer-motion";
import type { AppRole } from "@/hooks/useAuth";
import { NGOSignupWizard } from "@/components/auth/NGOSignupWizard";
import { VolunteerSignupWizard } from "@/components/auth/VolunteerSignupWizard";

const roles: { key: AppRole; label: string; icon: LucideIcon; desc: string; color: string }[] = [
  { key: "admin", label: "Admin", icon: Shield, desc: "Oversee the platform", color: "text-primary bg-primary/10 border-primary/20" },
  { key: "ngo", label: "NGO", icon: Building2, desc: "Coordinate relief", color: "text-success bg-success/10 border-success/20" },
  { key: "volunteer", label: "Volunteer", icon: Heart, desc: "Help on the ground", color: "text-warning bg-warning/10 border-warning/20" },
  { key: "public", label: "Public", icon: Globe, desc: "Report & stay informed", color: "text-destructive bg-destructive/10 border-destructive/20" },
];

const NGO_AREAS = ["Disaster Relief", "Health", "Food Distribution", "Education"];
const VOL_SKILLS = ["First Aid", "Medical Support", "Rescue Operations", "Food Distribution", "Logistics", "General Volunteer"];

export default function Auth() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Steps: 1 = Mode, 2 = Role, 3 = Form
  const [step, setStep] = useState(1);
  const [mode, setMode] = useState<"login" | "signup" | null>(
    (searchParams.get("mode") as "login" | "signup") || null
  );
  const [selectedRole, setSelectedRole] = useState<AppRole | null>(
    (searchParams.get("role") as AppRole) || null
  );

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  
  // NGO specific fields
  const [ngoName, setNgoName] = useState("");
  const [regNumber, setRegNumber] = useState("");
  const [estYear, setEstYear] = useState("");
  const [ngoType, setNgoType] = useState("Trust");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [address, setAddress] = useState("");
  const [darpanId, setDarpanId] = useState("");
  const [panTaxId, setPanTaxId] = useState("");
  const [areasOfWork, setAreasOfWork] = useState<string[]>([]);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Volunteer specific fields
  const [volPhone, setVolPhone] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [experience, setExperience] = useState("");
  const [loading, setLoading] = useState(false);

  // Auto-advance if params are present
  useEffect(() => {
    if (mode && !selectedRole) setStep(2);
    if (mode && selectedRole) setStep(3);
  }, []);

  // Redirect if already logged in
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user && (event === "SIGNED_IN" || event === "INITIAL_SESSION")) {
          const { data } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", session.user.id)
            .single();
          const role = data?.role || (session.user.user_metadata?.role as string) || "public";
          navigate(`/dashboard/${role}`, { replace: true });
        }
      }
    );
    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleModeSelect = (m: "login" | "signup") => {
    setMode(m);
    setStep(2);
  };

  const handleRoleSelect = (role: AppRole) => {
    setSelectedRole(role);
    setStep(3);
  };

  const handleBack = () => {
    if (step === 3) setStep(2);
    else if (step === 2) setStep(1);
    else navigate("/");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }
    
    setLoading(true);

    if (mode === "signup") {
      const { data: signUpData, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { 
            role: selectedRole,
            full_name: fullName
          },
        },
      });

      if (error) {
        toast.error(error.message);
        setLoading(false);
        return;
      }

      if (signUpData.user) {
        if (selectedRole === "ngo") {
          await supabase.from("ngo_details").insert({
            id: signUpData.user.id,
            ngo_name: ngoName,
            registration_number: regNumber,
            darpan_id: darpanId,
            pan_tax_id: panTaxId,
            verification_status: "pending"
          });
        } else if (selectedRole === "volunteer") {
          await supabase.from("volunteer_details").insert({
            id: signUpData.user.id,
            full_name: fullName,
            skills: skills,
            type: "basic",
            verification_status: "pending"
          });
        }
      }
      
      const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
      if (loginError) {
        toast.success("Account created! Please check your email.");
        setLoading(false);
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        toast.error(error.message);
        setLoading(false);
      }
    }
  };

  const currentRoleInfo = roles.find(r => r.key === selectedRole);

  if (step === 3 && !selectedRole) {
    setStep(2);
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center">
      {/* Top Bar */}
      <div className="w-full flex items-center justify-between p-4 sm:p-6 lg:px-12 max-w-7xl">
        <Button variant="ghost" onClick={handleBack} className="rounded-2xl gap-2 font-bold group">
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" /> Back
        </Button>
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-bold text-xl shadow-lg shadow-primary/20">S</div>
          <ThemeToggle />
        </div>
      </div>

      <div className="flex-1 w-full max-w-[600px] px-6 py-12 flex flex-col justify-center">
        {/* Step Indicator */}
        <div className="flex justify-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div 
              key={s} 
              className={cn(
                "h-1.5 rounded-full transition-all duration-500",
                step === s ? "w-8 bg-primary" : s < step ? "w-4 bg-primary/40" : "w-4 bg-muted"
              )}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* STEP 1: Mode Selection */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="text-center space-y-2">
                <h1 className="text-4xl font-bold tracking-tight">Get Started</h1>
                <p className="text-muted-foreground text-lg">Join the SahyogAI network today</p>
              </div>
              <div className="grid gap-4">
                <Button 
                  onClick={() => handleModeSelect("login")}
                  className="h-20 rounded-[2rem] text-xl font-bold gap-4 transition-all hover:scale-[1.02] shadow-xl shadow-primary/10"
                >
                  <LogIn className="h-6 w-6" /> Login to Account
                </Button>
                <Button 
                  onClick={() => handleModeSelect("signup")}
                  variant="outline"
                  className="h-20 rounded-[2rem] text-xl font-bold gap-4 transition-all hover:scale-[1.02] border-2"
                >
                  <UserPlus className="h-6 w-6 text-primary" /> Create New Account
                </Button>
              </div>
            </motion.div>
          )}

          {/* STEP 2: Role Selection */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Select your role</h1>
                <p className="text-muted-foreground">Choose how you want to use the platform</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {roles.map((role) => (
                  <button
                    key={role.key}
                    onClick={() => handleRoleSelect(role.key)}
                    className={cn(
                      "group relative flex flex-col p-6 rounded-[2rem] border-2 bg-card text-left transition-all hover:shadow-2xl hover:-translate-y-1",
                      selectedRole === role.key ? "border-primary ring-4 ring-primary/10 shadow-xl" : "border-border hover:border-primary/40"
                    )}
                  >
                    <div className={cn("p-3 w-fit rounded-2xl mb-4 transition-transform group-hover:scale-110 shadow-sm", role.color)}>
                      <role.icon className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-bold text-foreground mb-1">{role.label}</h3>
                    <p className="text-sm text-muted-foreground leading-snug">{role.desc}</p>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* STEP 3: Auth Form */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">
                  {mode === "login" ? "Welcome Back" : "Register with SahyogAI"}
                </h1>
                {currentRoleInfo && (
                  <div className={cn(
                    "inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[10px] font-bold uppercase tracking-widest",
                    currentRoleInfo.color
                  )}>
                    {mode || 'Access'} as {currentRoleInfo.label}
                  </div>
                )}
              </div>

              {/* Multi-step wizards for NGO / Volunteer signup */}
              {mode === "signup" && selectedRole === "ngo" && (
                <NGOSignupWizard onCancel={() => setStep(2)} />
              )}
              {mode === "signup" && selectedRole === "volunteer" && (
                <VolunteerSignupWizard onCancel={() => setStep(2)} />
              )}

              {/* Default form for login + admin/public signup */}
              {!(mode === "signup" && (selectedRole === "ngo" || selectedRole === "volunteer")) && (
              <div className="bg-card border border-border/50 rounded-[2.5rem] p-6 sm:p-8 shadow-2xl shadow-primary/5 max-h-[70vh] overflow-y-auto">
                <form onSubmit={handleSubmit} className="space-y-6">
                  
                  {/* Basic Credentials */}
                  <div className="space-y-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60 border-b pb-2">Account Credentials</p>
                    {mode === "signup" && (
                      <div className="space-y-2">
                        <Label htmlFor="fullName" className="text-xs font-bold uppercase tracking-wider ml-1">Full Name</Label>
                        <div className="relative">
                          <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="fullName"
                            placeholder="Your legal name"
                            value={fullName}
                            onChange={e => setFullName(e.target.value)}
                            className="h-12 pl-12 rounded-2xl border-2 bg-muted/20 focus:bg-background transition-all"
                            required
                          />
                        </div>
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider ml-1">Email Address</Label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="admin@org.com"
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                          className="h-12 pl-12 rounded-2xl border-2 bg-muted/20 focus:bg-background transition-all"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-xs font-bold uppercase tracking-wider ml-1">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="password"
                          type="password"
                          placeholder="••••••••"
                          value={password}
                          onChange={e => setPassword(e.target.value)}
                          className="h-12 pl-12 rounded-2xl border-2 bg-muted/20 focus:bg-background transition-all"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* NGO Signup Details */}
                  {mode === "signup" && selectedRole === "ngo" && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <div className="space-y-4">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60 border-b pb-2">Organization Details</p>
                        <div className="grid gap-4">
                          <Input placeholder="Legal NGO Name" value={ngoName} onChange={e => setNgoName(e.target.value)} className="h-11 rounded-xl" required />
                          <div className="grid grid-cols-2 gap-4">
                             <Input placeholder="Reg No." value={regNumber} onChange={e => setRegNumber(e.target.value)} className="h-11 rounded-xl" required />
                             <Input placeholder="Est. Year" value={estYear} onChange={e => setEstYear(e.target.value)} className="h-11 rounded-xl" required />
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                             {["Trust", "Society", "Section 8"].map(t => (
                               <Button key={t} type="button" variant={ngoType === t ? "default" : "outline"} onClick={() => setNgoType(t)} className="h-9 rounded-lg text-[10px] font-bold uppercase tracking-wider px-0">{t}</Button>
                             ))}
                          </div>
                          <Input placeholder="Phone (Official)" value={phone} onChange={e => setPhone(e.target.value)} className="h-11 rounded-xl" required />
                          <Input placeholder="Office Address" value={address} onChange={e => setAddress(e.target.value)} className="h-11 rounded-xl" required />
                          <div className="grid grid-cols-2 gap-4">
                            <Input placeholder="NGO Darpan ID" value={darpanId} onChange={e => setDarpanId(e.target.value)} className="h-11 rounded-xl" required />
                            <Input placeholder="PAN / Tax ID" value={panTaxId} onChange={e => setPanTaxId(e.target.value)} className="h-11 rounded-xl" required />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60 border-b pb-2">Areas of Work</p>
                        <div className="flex flex-wrap gap-2">
                           {NGO_AREAS.map(area => (
                             <button
                               key={area}
                               type="button"
                               onClick={() => setAreasOfWork(prev => prev.includes(area) ? prev.filter(a => a !== area) : [...prev, area])}
                               className={cn(
                                 "px-3 py-1.5 rounded-full text-[10px] font-bold border transition-all uppercase tracking-tight",
                                 areasOfWork.includes(area) ? "bg-primary border-primary text-white" : "bg-muted/50 border-border text-muted-foreground hover:border-primary/40"
                               )}
                             >
                               {area}
                             </button>
                           ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Volunteer Signup Details */}
                  {mode === "signup" && selectedRole === "volunteer" && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <div className="space-y-4">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60 border-b pb-2">Volunteer Info</p>
                        <div className="grid gap-4">
                          <Input placeholder="Phone Number" value={volPhone} onChange={e => setVolPhone(e.target.value)} className="h-11 rounded-xl" required />
                          <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase tracking-wider ml-1">Core Skill Set</Label>
                            <div className="flex flex-wrap gap-2">
                               {VOL_SKILLS.map(skill => (
                                 <button
                                   key={skill}
                                   type="button"
                                   onClick={() => setSkills(prev => prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill])}
                                   className={cn(
                                     "px-3 py-1.5 rounded-full text-[10px] font-bold border transition-all uppercase tracking-tight",
                                     skills.includes(skill) ? "bg-primary border-primary text-white" : "bg-muted/50 border-border text-muted-foreground hover:border-primary/40"
                                   )}
                                 >
                                   {skill}
                                 </button>
                               ))}
                            </div>
                          </div>
                          <textarea 
                             className="w-full min-h-[80px] rounded-xl border-2 bg-muted/20 p-3 text-xs focus:ring-1 focus:ring-primary/20 transition-all outline-none" 
                             placeholder="Previous experience or certifications (Optional)"
                             value={experience}
                             onChange={e => setExperience(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Shared Agreement & Submit */}
                  <div className="space-y-4 pt-4 border-t">
                    {mode === "signup" && (
                      <div className="flex items-start gap-3 px-1">
                        <input 
                           type="checkbox" 
                           id="terms" 
                           checked={agreedToTerms} 
                           onChange={e => setAgreedToTerms(e.target.checked)}
                           className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" 
                        />
                        <label htmlFor="terms" className="text-[10px] leading-relaxed text-muted-foreground font-medium">
                           I agree to SahyogAI's <span className="text-foreground font-bold underline">Terms of Service</span> and acknowledge the <span className="text-foreground font-bold underline">Safety Disclaimer</span>.
                        </label>
                      </div>
                    )}

                    <Button 
                      type="submit" 
                      className="w-full h-14 rounded-2xl font-bold text-lg shadow-xl shadow-primary/20 transition-all hover:scale-[1.01] active:scale-[0.99]" 
                      disabled={loading || (mode === 'signup' && !agreedToTerms)}
                    >
                      {loading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : (mode === "login" ? "Sign In" : "Join the Network")}
                    </Button>
                  </div>
                </form>
              </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
        
        <p className="mt-12 text-center text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-bold">
          Empowering Communities with AI Response
        </p>
      </div>
    </div>
  );
}
