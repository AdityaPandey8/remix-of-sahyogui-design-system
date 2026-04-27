import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SignupStepper, ChipSelect } from "./SignupStepper";
import { ArrowLeft, ArrowRight, Loader2, CheckCircle2, MapPin, User as UserIcon, Heart, Mail, Lock, Building2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { mockInviteCodes } from "@/data/mockData";
import { cn } from "@/lib/utils";

const STEPS = ["Basics", "Location", "Skills", "Experience", "NGO Link", "Review"];
const SKILLS = ["First Aid", "Medical Support", "Rescue Operations", "Logistics", "Food Distribution", "General Volunteer"];

type AffMode = "independent" | "request" | "invite";

export function VolunteerSignupWizard({ onCancel }: { onCancel: () => void }) {
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");

  const [city, setCity] = useState("");
  const [location, setLocation] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  const [skills, setSkills] = useState<string[]>([]);
  const [skillsOther, setSkillsOther] = useState("");

  const [experience, setExperience] = useState("");
  const [certifications, setCertifications] = useState("");

  const [affMode, setAffMode] = useState<AffMode>("independent");
  const [ngoOptions, setNgoOptions] = useState<{ id: string; ngo_name: string }[]>([]);
  const [selectedNgoId, setSelectedNgoId] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [inviteValid, setInviteValid] = useState<null | { ngoId: string; ngoName: string }>(null);

  // Pre-fill invite code from URL (?invite=CODE) and auto-verify
  useEffect(() => {
    const urlInvite = searchParams.get("invite");
    if (urlInvite) {
      setInviteCode(urlInvite.toUpperCase());
      setAffMode("invite");
    }
  }, [searchParams]);

  useEffect(() => {
    if (affMode !== "request") return;
    supabase
      .from("ngo_details")
      .select("id, ngo_name")
      .eq("verification_status", "verified")
      .then(({ data }) => {
        if (data && data.length) setNgoOptions(data);
      });
  }, [affMode]);

  const verifyInvite = async () => {
    if (!inviteCode.trim()) return;
    // Try DB first
    const { data } = await supabase
      .from("ngo_invite_codes")
      .select("ngo_id, active")
      .eq("code", inviteCode.trim().toUpperCase())
      .maybeSingle();
    if (data?.active) {
      const { data: ngo } = await supabase
        .from("ngo_details")
        .select("ngo_name")
        .eq("id", data.ngo_id)
        .maybeSingle();
      setInviteValid({ ngoId: data.ngo_id, ngoName: ngo?.ngo_name || "Verified NGO" });
      toast.success(`Invite valid: ${ngo?.ngo_name || "NGO"}`);
      return;
    }
    // Mock fallback
    const mock = mockInviteCodes.find((c) => c.code === inviteCode.trim().toUpperCase() && c.active);
    if (mock) {
      setInviteValid({ ngoId: mock.ngoId, ngoName: mock.ngoName });
      toast.success(`Invite valid: ${mock.ngoName} (demo)`);
    } else {
      setInviteValid(null);
      toast.error("Invalid or inactive invite code");
    }
  };

  const useGPS = () => {
    // Simulated GPS
    const lat = 28.6139 + (Math.random() - 0.5) * 0.5;
    const lng = 77.209 + (Math.random() - 0.5) * 0.5;
    setCoords({ lat: parseFloat(lat.toFixed(4)), lng: parseFloat(lng.toFixed(4)) });
    setLocation(`Lat ${lat.toFixed(4)}, Lng ${lng.toFixed(4)}`);
    toast.success("Location detected (simulated)");
  };

  const canNext = (): boolean => {
    switch (step) {
      case 1:
        return !!(fullName && email && password && phone);
      case 2:
        return !!city;
      case 3:
        return skills.length > 0 || !!skillsOther;
      case 4:
        return true;
      case 5:
        if (affMode === "request") return !!selectedNgoId;
        if (affMode === "invite") return !!inviteValid;
        return true;
      default:
        return true;
    }
  };

  const next = () => {
    if (!canNext()) {
      toast.error("Please complete the required fields");
      return;
    }
    setStep((s) => Math.min(STEPS.length, s + 1));
  };
  const back = () => {
    if (step === 1) onCancel();
    else setStep((s) => s - 1);
  };

  const submit = async () => {
    setLoading(true);
    const allSkills = [...skills, ...(skillsOther ? [skillsOther] : [])];
    try {
      const { data: signUpData, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { role: "volunteer", full_name: fullName } },
      });
      if (error) throw error;

      const userId = signUpData.user?.id;
      const ngoVerified = affMode === "invite" && !!inviteValid;

      if (userId) {
        await supabase.from("volunteer_details").insert({
          id: userId,
          full_name: fullName,
          phone,
          city,
          location_text: location || city,
          latitude: coords?.lat ?? null,
          longitude: coords?.lng ?? null,
          skills: allSkills,
          experience: experience || null,
          certifications: certifications || null,
          invite_code_used: ngoVerified ? inviteCode.trim().toUpperCase() : null,
          type: ngoVerified ? "ngo_verified" : "basic",
          verification_status: ngoVerified ? "verified" : "pending",
        } as any);

        if (ngoVerified && inviteValid) {
          await supabase.from("ngo_volunteer_relations").insert({
            ngo_id: inviteValid.ngoId,
            volunteer_id: userId,
          } as any);
        } else if (affMode === "request" && selectedNgoId) {
          await supabase.from("volunteer_join_requests").insert({
            volunteer_id: userId,
            ngo_id: selectedNgoId,
            status: "pending",
            message: "Joining via signup wizard",
          } as any);
        }
      }

      await supabase.auth.signInWithPassword({ email, password });
      toast.success(ngoVerified ? "Welcome! You're NGO Verified." : "Account created!");
    } catch (err: any) {
      toast.error(err?.message || "Signup failed");
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <SignupStepper current={step} total={STEPS.length} labels={STEPS} />

      <div className="bg-card border border-border/50 rounded-[2rem] p-6 sm:p-8 shadow-2xl shadow-primary/5 max-h-[60vh] overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }} className="space-y-5">
            {step === 1 && (
              <>
                <Section icon={<UserIcon className="h-4 w-4" />} title="Basic Details" />
                <Field label="Full Name *"><Input value={fullName} onChange={(e) => setFullName(e.target.value)} className="h-11 rounded-xl" /></Field>
                <Field label="Email *"><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-11 rounded-xl" /></Field>
                <Field label="Password *"><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="h-11 rounded-xl" /></Field>
                <Field label="Phone Number *"><Input value={phone} onChange={(e) => setPhone(e.target.value)} className="h-11 rounded-xl" /></Field>
              </>
            )}

            {step === 2 && (
              <>
                <Section icon={<MapPin className="h-4 w-4" />} title="Your Location" />
                <Field label="City *"><Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. Mumbai" className="h-11 rounded-xl" /></Field>
                <Field label="Current Location">
                  <div className="flex gap-2">
                    <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Address or coordinates" className="h-11 rounded-xl flex-1" />
                    <Button type="button" variant="outline" onClick={useGPS} className="h-11 rounded-xl gap-2"><MapPin className="h-4 w-4" /> GPS</Button>
                  </div>
                </Field>
                {coords && (
                  <div className="text-xs text-muted-foreground">📍 Lat {coords.lat}, Lng {coords.lng}</div>
                )}
              </>
            )}

            {step === 3 && (
              <>
                <Section icon={<Sparkles className="h-4 w-4" />} title="Skills" />
                <Field label="Select your skills *">
                  <ChipSelect options={SKILLS} value={skills} onChange={setSkills} />
                </Field>
                <Field label="Other (optional)">
                  <Input value={skillsOther} onChange={(e) => setSkillsOther(e.target.value)} placeholder="e.g. Drone Pilot" className="h-11 rounded-xl" />
                </Field>
              </>
            )}

            {step === 4 && (
              <>
                <Section icon={<Heart className="h-4 w-4" />} title="Experience (optional)" />
                <Field label="Previous Volunteering">
                  <textarea value={experience} onChange={(e) => setExperience(e.target.value)} className="w-full min-h-[80px] rounded-xl border-2 bg-muted/20 p-3 text-xs outline-none focus:bg-background" placeholder="Briefly describe your past volunteer work" />
                </Field>
                <Field label="Certifications">
                  <Input value={certifications} onChange={(e) => setCertifications(e.target.value)} placeholder="CPR, First Aid Cert, etc." className="h-11 rounded-xl" />
                </Field>
              </>
            )}

            {step === 5 && (
              <>
                <Section icon={<Building2 className="h-4 w-4" />} title="NGO Affiliation" />
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { k: "independent", label: "Independent" },
                    { k: "request", label: "Request NGO" },
                    { k: "invite", label: "Invite Code" },
                  ].map((o) => (
                    <Button key={o.k} type="button" variant={affMode === o.k ? "default" : "outline"} onClick={() => setAffMode(o.k as AffMode)} className="h-10 rounded-xl text-xs font-bold">{o.label}</Button>
                  ))}
                </div>

                {affMode === "independent" && (
                  <div className="rounded-2xl bg-muted/30 p-3 text-xs text-muted-foreground">
                    You'll join as a <strong>Basic</strong> volunteer and can affiliate with NGOs later.
                  </div>
                )}

                {affMode === "request" && (
                  <Field label="Pick an NGO to request joining">
                    <select value={selectedNgoId} onChange={(e) => setSelectedNgoId(e.target.value)} className="w-full h-11 rounded-xl border-2 bg-muted/20 px-3 text-sm">
                      <option value="">Select an NGO…</option>
                      {ngoOptions.map((n) => <option key={n.id} value={n.id}>{n.ngo_name}</option>)}
                    </select>
                    {ngoOptions.length === 0 && <p className="text-[10px] text-muted-foreground mt-1">No verified NGOs found yet.</p>}
                  </Field>
                )}

                {affMode === "invite" && (
                  <Field label="Enter invite code">
                    <div className="flex gap-2">
                      <Input value={inviteCode} onChange={(e) => { setInviteCode(e.target.value); setInviteValid(null); }} placeholder="e.g. HELP2026" className="h-11 rounded-xl flex-1 uppercase" />
                      <Button type="button" onClick={verifyInvite} className="h-11 rounded-xl">Verify</Button>
                    </div>
                    {inviteValid && (
                      <div className="mt-2 rounded-xl bg-success/10 border border-success/30 p-2 text-xs text-success font-medium flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" /> Linked to {inviteValid.ngoName} — you'll be NGO Verified.
                      </div>
                    )}
                  </Field>
                )}
              </>
            )}

            {step === 6 && (
              <>
                <Section icon={<CheckCircle2 className="h-4 w-4" />} title="Review" />
                <Review rows={[
                  ["Name", fullName],
                  ["Email", email],
                  ["Phone", phone],
                  ["City", city],
                  ["Location", location || "—"],
                  ["Skills", [...skills, skillsOther].filter(Boolean).join(", ") || "—"],
                  ["Experience", experience || "—"],
                  ["Certifications", certifications || "—"],
                  ["Affiliation", affMode === "invite" && inviteValid ? `Invite — ${inviteValid.ngoName}` : affMode === "request" ? "Request to join NGO" : "Independent"],
                  ["Status", affMode === "invite" && inviteValid ? "NGO Verified" : "Basic"],
                ]} />
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={back} className="h-12 rounded-2xl gap-2 flex-1" disabled={loading}>
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        {step < STEPS.length ? (
          <Button type="button" onClick={next} className={cn("h-12 rounded-2xl gap-2 flex-[2] font-bold")} disabled={loading}>Continue <ArrowRight className="h-4 w-4" /></Button>
        ) : (
          <Button type="button" onClick={submit} className="h-12 rounded-2xl gap-2 flex-[2] font-bold" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />} Join SahyogAI
          </Button>
        )}
      </div>
    </div>
  );
}

function Section({ icon, title }: { icon: React.ReactNode; title: string }) {
  return <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-primary/70 border-b pb-2">{icon} {title}</div>;
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label className="text-xs font-bold uppercase tracking-wider">{label}</Label>{children}</div>;
}
function Review({ rows }: { rows: [string, string][] }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-muted/20 divide-y divide-border/40">
      {rows.map(([k, v]) => (
        <div key={k} className="flex items-start justify-between gap-3 px-3 py-2 text-xs">
          <span className="font-bold uppercase tracking-wider text-muted-foreground">{k}</span>
          <span className="text-right text-foreground font-medium break-words max-w-[60%]">{v || "—"}</span>
        </div>
      ))}
    </div>
  );
}