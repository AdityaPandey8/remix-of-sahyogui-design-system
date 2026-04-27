import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useProfileSummary } from "@/hooks/useProfileSummary";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ArrowLeft, LogOut, Loader2, Pencil, Mail, Phone, MapPin, Shield, ShieldCheck, Save, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function Profile() {
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const summary = useProfileSummary();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [details, setDetails] = useState<any>(null);

  // Form fields
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      const role = profile?.role;
      if (role === "ngo") {
        const { data } = await supabase.from("ngo_details").select("*").eq("id", user.id).maybeSingle();
        setDetails(data);
        setName(data?.ngo_name || "");
        setPhone(data?.phone || "");
        setCity(data?.city || "");
      } else if (role === "volunteer") {
        const { data } = await supabase.from("volunteer_details").select("*").eq("id", user.id).maybeSingle();
        setDetails(data);
        setName(data?.full_name || "");
        setPhone(data?.phone || "");
        setCity(data?.city || "");
      } else {
        setName(summary.displayName);
      }
    };
    load();
  }, [user, profile?.role, summary.displayName]);

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    const role = profile?.role;
    let error: any = null;
    if (role === "ngo") {
      const res = await supabase.from("ngo_details").update({ ngo_name: name, phone, city }).eq("id", user.id);
      error = res.error;
    } else if (role === "volunteer") {
      const res = await supabase.from("volunteer_details").update({ full_name: name, phone, city }).eq("id", user.id);
      error = res.error;
    }
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Profile updated");
    setEditing(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth", { replace: true });
  };

  const goBack = () => {
    const role = profile?.role || "public";
    navigate(`/dashboard/${role}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border/50 bg-background/70 backdrop-blur-xl">
        <div className="max-w-3xl mx-auto flex items-center justify-between px-4 py-3">
          <Button variant="ghost" onClick={goBack} className="gap-2 rounded-xl"><ArrowLeft className="h-4 w-4" /> Back</Button>
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Header card */}
        <div className="rounded-3xl border bg-gradient-to-br from-primary/5 to-primary/10 p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
            <div className="h-20 w-20 rounded-2xl bg-gradient-to-tr from-primary to-primary/60 flex items-center justify-center text-primary-foreground font-black text-2xl shadow-lg">
              {summary.initials}
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-2xl font-black tracking-tight">{summary.displayName}</h1>
              <p className="text-sm text-muted-foreground flex items-center justify-center sm:justify-start gap-1.5 mt-1"><Mail className="h-3.5 w-3.5" /> {summary.email}</p>
              <span className={cn(
                "inline-flex items-center gap-1.5 mt-3 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                "bg-primary/10 text-primary border border-primary/20"
              )}>
                <Shield className="h-3 w-3" /> {summary.role}
              </span>
            </div>
            {!editing ? (
              <Button onClick={() => setEditing(true)} className="rounded-xl gap-2 font-bold"><Pencil className="h-4 w-4" /> Edit Profile</Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setEditing(false)} className="rounded-xl gap-2"><X className="h-4 w-4" /> Cancel</Button>
                <Button onClick={handleSave} disabled={loading} className="rounded-xl gap-2 font-bold">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Account details */}
        <div className="rounded-3xl border bg-card p-6 space-y-4">
          <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground">Account Details</h2>

          <div className="grid sm:grid-cols-2 gap-4">
            <Field label={profile?.role === "ngo" ? "Organization Name" : "Full Name"}>
              {editing ? (
                <Input value={name} onChange={(e) => setName(e.target.value)} className="h-11 rounded-xl" />
              ) : (
                <p className="text-sm font-medium">{name || "—"}</p>
              )}
            </Field>
            <Field label="Email">
              <p className="text-sm font-medium">{summary.email}</p>
            </Field>
            <Field label="Phone">
              {editing ? (
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="h-11 rounded-xl" />
              ) : (
                <p className="text-sm font-medium flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-muted-foreground" /> {phone || "—"}</p>
              )}
            </Field>
            <Field label="City">
              {editing ? (
                <Input value={city} onChange={(e) => setCity(e.target.value)} className="h-11 rounded-xl" />
              ) : (
                <p className="text-sm font-medium flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-muted-foreground" /> {city || "—"}</p>
              )}
            </Field>
          </div>

          {/* Role-specific extras */}
          {profile?.role === "ngo" && details && (
            <div className="grid sm:grid-cols-2 gap-4 pt-4 border-t">
              <Field label="Registration No.">
                <p className="text-sm font-medium">{details.registration_number || "—"}</p>
              </Field>
              <Field label="Verification">
                <p className="text-sm font-medium flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-success" /> {details.verification_status}</p>
              </Field>
            </div>
          )}

          {profile?.role === "volunteer" && details && (
            <div className="pt-4 border-t">
              <Field label="Skills">
                <div className="flex flex-wrap gap-1.5">
                  {(details.skills || []).map((s: string) => (
                    <span key={s} className="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-tight">{s}</span>
                  ))}
                  {(!details.skills || details.skills.length === 0) && <span className="text-sm text-muted-foreground">—</span>}
                </div>
              </Field>
            </div>
          )}
        </div>

        {/* Sign out */}
        <div className="rounded-3xl border bg-card p-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-bold">Sign out</p>
            <p className="text-xs text-muted-foreground">End your session on this device.</p>
          </div>
          <Button variant="destructive" onClick={handleSignOut} className="rounded-xl gap-2 font-bold"><LogOut className="h-4 w-4" /> Sign Out</Button>
        </div>
      </main>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}