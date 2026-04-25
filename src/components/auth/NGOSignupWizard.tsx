import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SignupStepper, ChipSelect } from "./SignupStepper";
import { ArrowLeft, ArrowRight, Loader2, CheckCircle2, Upload, Building2, Mail, Lock } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const STEPS = ["Basics", "Contact", "Verification", "Operations", "Team", "Review"];
const NGO_TYPES = ["Trust", "Society", "Section 8"];
const AREAS = ["Disaster Relief", "Health", "Food Distribution", "Education"];
const RESOURCES = ["Medical Kits", "Food Supply", "Rescue Equipment", "Transport", "Shelter"];

interface Props {
  onCancel: () => void;
}

export function NGOSignupWizard({ onCancel }: Props) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // account
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // step 1
  const [ngoName, setNgoName] = useState("");
  const [regNumber, setRegNumber] = useState("");
  const [ngoType, setNgoType] = useState("Trust");
  const [estYear, setEstYear] = useState("");

  // step 2
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [website, setWebsite] = useState("");
  const [address, setAddress] = useState("");

  // step 3
  const [darpanId, setDarpanId] = useState("");
  const [panTaxId, setPanTaxId] = useState("");
  const [certName, setCertName] = useState("");

  // step 4
  const [areas, setAreas] = useState<string[]>([]);
  const [areasOther, setAreasOther] = useState("");
  const [regions, setRegions] = useState("");

  // step 5
  const [volCount, setVolCount] = useState("");
  const [resources, setResources] = useState<string[]>([]);
  const [primaryContact, setPrimaryContact] = useState("");

  const canNext = (): boolean => {
    switch (step) {
      case 1:
        return !!(ngoName && regNumber && ngoType && estYear && email && password);
      case 2:
        return !!(phone && city && state && address);
      case 3:
        return !!(darpanId && panTaxId);
      case 4:
        return areas.length > 0 || !!areasOther;
      case 5:
        return !!(primaryContact && volCount);
      default:
        return true;
    }
  };

  const next = () => {
    if (!canNext()) {
      toast.error("Please fill in the required fields");
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
    const allAreas = [...areas, ...(areasOther ? [areasOther] : [])];
    try {
      const { data: signUpData, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { role: "ngo", full_name: primaryContact } },
      });
      if (error) throw error;

      if (signUpData.user) {
        await supabase.from("ngo_details").insert({
          id: signUpData.user.id,
          ngo_name: ngoName,
          registration_number: regNumber,
          ngo_type: ngoType,
          est_year: parseInt(estYear) || null,
          phone,
          address,
          city,
          state,
          website: website || null,
          darpan_id: darpanId,
          pan_tax_id: panTaxId,
          document_url: certName || null,
          areas_of_work: allAreas,
          regions_served: regions ? regions.split(",").map((r) => r.trim()) : [],
          volunteer_count: parseInt(volCount) || 0,
          available_resources: resources,
          primary_contact: primaryContact,
          verification_status: "pending",
        } as any);
      }

      await supabase.auth.signInWithPassword({ email, password });
      toast.success("NGO registered! Pending admin verification.");
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
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
            className="space-y-5"
          >
            {step === 1 && (
              <>
                <SectionTitle icon={<Building2 className="h-4 w-4" />} title="Organization Basics" />
                <Field label="NGO Name *">
                  <Input value={ngoName} onChange={(e) => setNgoName(e.target.value)} placeholder="Legal NGO name" className="h-11 rounded-xl" />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Registration No. *">
                    <Input value={regNumber} onChange={(e) => setRegNumber(e.target.value)} className="h-11 rounded-xl" />
                  </Field>
                  <Field label="Year Established *">
                    <Input value={estYear} onChange={(e) => setEstYear(e.target.value)} placeholder="e.g. 2010" type="number" className="h-11 rounded-xl" />
                  </Field>
                </div>
                <Field label="Organization Type *">
                  <div className="grid grid-cols-3 gap-2">
                    {NGO_TYPES.map((t) => (
                      <Button key={t} type="button" variant={ngoType === t ? "default" : "outline"} onClick={() => setNgoType(t)} className="h-9 rounded-lg text-xs font-bold">
                        {t}
                      </Button>
                    ))}
                  </div>
                </Field>
                <SectionTitle icon={<Mail className="h-4 w-4" />} title="Account" />
                <Field label="Email *">
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-11 rounded-xl" />
                </Field>
                <Field label="Password *">
                  <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="h-11 rounded-xl" />
                </Field>
              </>
            )}

            {step === 2 && (
              <>
                <SectionTitle icon={<Mail className="h-4 w-4" />} title="Contact Details" />
                <Field label="Phone *">
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="h-11 rounded-xl" />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="City *">
                    <Input value={city} onChange={(e) => setCity(e.target.value)} className="h-11 rounded-xl" />
                  </Field>
                  <Field label="State *">
                    <Input value={state} onChange={(e) => setState(e.target.value)} className="h-11 rounded-xl" />
                  </Field>
                </div>
                <Field label="Office Address *">
                  <Input value={address} onChange={(e) => setAddress(e.target.value)} className="h-11 rounded-xl" />
                </Field>
                <Field label="Website (optional)">
                  <Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://" className="h-11 rounded-xl" />
                </Field>
              </>
            )}

            {step === 3 && (
              <>
                <SectionTitle icon={<Lock className="h-4 w-4" />} title="Verification Details" />
                <Field label="NGO Darpan ID *">
                  <Input value={darpanId} onChange={(e) => setDarpanId(e.target.value)} className="h-11 rounded-xl" />
                </Field>
                <Field label="PAN / Tax ID *">
                  <Input value={panTaxId} onChange={(e) => setPanTaxId(e.target.value)} className="h-11 rounded-xl" />
                </Field>
                <Field label="Registration Certificate">
                  <label className="flex items-center gap-3 h-11 px-3 rounded-xl border-2 border-dashed border-border bg-muted/20 cursor-pointer hover:border-primary/40 transition-colors">
                    <Upload className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs font-medium text-muted-foreground truncate flex-1">
                      {certName || "Click to upload PDF/image"}
                    </span>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*,.pdf"
                      onChange={(e) => setCertName(e.target.files?.[0]?.name || "")}
                    />
                  </label>
                </Field>
              </>
            )}

            {step === 4 && (
              <>
                <SectionTitle icon={<Building2 className="h-4 w-4" />} title="Operational Details" />
                <Field label="Areas of Work *">
                  <ChipSelect options={AREAS} value={areas} onChange={setAreas} />
                </Field>
                <Field label="Other (optional)">
                  <Input value={areasOther} onChange={(e) => setAreasOther(e.target.value)} placeholder="e.g. Animal Welfare" className="h-11 rounded-xl" />
                </Field>
                <Field label="Regions Served (comma separated)">
                  <Input value={regions} onChange={(e) => setRegions(e.target.value)} placeholder="Maharashtra, Gujarat" className="h-11 rounded-xl" />
                </Field>
              </>
            )}

            {step === 5 && (
              <>
                <SectionTitle icon={<Building2 className="h-4 w-4" />} title="Team & Resources" />
                <Field label="Number of Volunteers *">
                  <Input value={volCount} onChange={(e) => setVolCount(e.target.value)} type="number" className="h-11 rounded-xl" />
                </Field>
                <Field label="Available Resources">
                  <ChipSelect options={RESOURCES} value={resources} onChange={setResources} />
                </Field>
                <Field label="Primary Contact Person *">
                  <Input value={primaryContact} onChange={(e) => setPrimaryContact(e.target.value)} className="h-11 rounded-xl" />
                </Field>
              </>
            )}

            {step === 6 && (
              <>
                <SectionTitle icon={<CheckCircle2 className="h-4 w-4" />} title="Review & Submit" />
                <Review rows={[
                  ["NGO Name", ngoName],
                  ["Reg. No.", regNumber],
                  ["Type", ngoType],
                  ["Established", estYear],
                  ["Email", email],
                  ["Phone", phone],
                  ["Location", `${city}, ${state}`],
                  ["Website", website || "—"],
                  ["Darpan ID", darpanId],
                  ["PAN / Tax", panTaxId],
                  ["Certificate", certName || "—"],
                  ["Areas", [...areas, areasOther].filter(Boolean).join(", ") || "—"],
                  ["Regions", regions || "—"],
                  ["Volunteers", volCount],
                  ["Resources", resources.join(", ") || "—"],
                  ["Contact Person", primaryContact],
                ]} />
                <div className="rounded-2xl bg-warning/10 border border-warning/20 p-3 text-xs text-warning-foreground">
                  Your NGO will be marked <strong>Pending Verification</strong> until an admin approves it.
                </div>
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
          <Button type="button" onClick={next} className={cn("h-12 rounded-2xl gap-2 flex-[2] font-bold")} disabled={loading}>
            Continue <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button type="button" onClick={submit} className="h-12 rounded-2xl gap-2 flex-[2] font-bold" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            Submit Application
          </Button>
        )}
      </div>
    </div>
  );
}

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-primary/70 border-b pb-2">
      {icon} {title}
    </div>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-bold uppercase tracking-wider">{label}</Label>
      {children}
    </div>
  );
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