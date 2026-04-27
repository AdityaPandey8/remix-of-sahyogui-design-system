import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Copy, Mail, Plus, Power, QrCode, Send, Sparkles, Ticket } from "lucide-react";
import { cn } from "@/lib/utils";

interface InviteRow {
  id: string;
  code: string;
  active: boolean;
  created_at: string;
}

function generateCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 8; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export function InviteCodeManager() {
  const { user } = useAuth();
  const [rows, setRows] = useState<InviteRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [sendOpen, setSendOpen] = useState(false);
  const [sendCode, setSendCode] = useState<string>("");
  const [recipientEmail, setRecipientEmail] = useState("");

  const inviteLink = (code: string) =>
    `${window.location.origin}/auth?mode=signup&role=volunteer&invite=${code}`;

  const load = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("ngo_invite_codes")
      .select("id, code, active, created_at")
      .eq("ngo_id", user.id)
      .order("created_at", { ascending: false });
    setRows((data as InviteRow[]) || []);
  };

  useEffect(() => {
    load();
  }, [user]);

  const handleGenerate = async () => {
    if (!user) return;
    setLoading(true);
    const code = generateCode();
    const { error } = await supabase
      .from("ngo_invite_codes")
      .insert({ ngo_id: user.id, code, active: true });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`Invite code ${code} generated`);
    load();
  };

  const handleToggle = async (row: InviteRow) => {
    const { error } = await supabase
      .from("ngo_invite_codes")
      .update({ active: !row.active })
      .eq("id", row.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(row.active ? "Code deactivated" : "Code reactivated");
    load();
  };

  const copy = async (text: string, label = "Copied") => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(label);
    } catch {
      toast.error("Copy failed");
    }
  };

  const openSend = (code: string) => {
    setSendCode(code);
    setRecipientEmail("");
    setSendOpen(true);
  };

  const sendInvite = () => {
    if (!recipientEmail) return toast.error("Enter recipient email");
    const link = inviteLink(sendCode);
    const subject = encodeURIComponent("Join us on SahyogAI as a volunteer");
    const body = encodeURIComponent(
      `Hi,\n\nYou've been invited to join our NGO on SahyogAI as a verified volunteer.\n\nUse this invite code: ${sendCode}\nOr sign up directly: ${link}\n\nSee you on the platform!`
    );
    window.location.href = `mailto:${recipientEmail}?subject=${subject}&body=${body}`;
    toast.success("Email draft opened");
    setSendOpen(false);
  };

  const active = rows.filter((r) => r.active);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border bg-gradient-to-br from-primary/5 to-primary/10 p-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/15 flex items-center justify-center">
            <Ticket className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-black uppercase tracking-widest">Invite Codes</p>
            <p className="text-xs text-muted-foreground">{active.length} active · {rows.length} total</p>
          </div>
        </div>
        <Button onClick={handleGenerate} disabled={loading} className="rounded-xl font-bold gap-2">
          <Plus className="h-4 w-4" /> Generate Code
        </Button>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
          <Sparkles className="h-6 w-6 mx-auto mb-2 opacity-40" />
          No invite codes yet. Generate one to start onboarding pre-verified volunteers.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {rows.map((r) => (
            <div
              key={r.id}
              className={cn(
                "rounded-2xl border p-4 bg-card/60 backdrop-blur-md transition-all",
                r.active ? "shadow-md" : "opacity-60"
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-lg font-black tracking-[0.2em] text-primary">{r.code}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {new Date(r.created_at).toLocaleDateString()} · {r.active ? "Active" : "Inactive"}
                  </p>
                </div>
                <span
                  className={cn(
                    "px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tight",
                    r.active ? "bg-success/10 text-success border border-success/30" : "bg-muted text-muted-foreground"
                  )}
                >
                  {r.active ? "Live" : "Off"}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                <Button size="sm" variant="outline" className="h-8 rounded-lg gap-1.5 text-xs" onClick={() => copy(r.code, "Code copied")}>
                  <Copy className="h-3 w-3" /> Code
                </Button>
                <Button size="sm" variant="outline" className="h-8 rounded-lg gap-1.5 text-xs" onClick={() => copy(inviteLink(r.code), "Link copied")}>
                  <QrCode className="h-3 w-3" /> Link
                </Button>
                <Button size="sm" className="h-8 rounded-lg gap-1.5 text-xs font-bold" onClick={() => openSend(r.code)}>
                  <Mail className="h-3 w-3" /> Send
                </Button>
                <Button
                  size="sm"
                  variant={r.active ? "ghost" : "outline"}
                  className={cn("h-8 rounded-lg gap-1.5 text-xs", r.active && "text-destructive hover:bg-destructive/10")}
                  onClick={() => handleToggle(r)}
                >
                  <Power className="h-3 w-3" /> {r.active ? "Disable" : "Enable"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={sendOpen} onOpenChange={setSendOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Send className="h-5 w-5 text-primary" /> Send invite</DialogTitle>
            <DialogDescription>We'll open a pre-filled email draft on your device.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider">Code</Label>
              <p className="font-mono text-lg font-black tracking-widest text-primary">{sendCode}</p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider">Volunteer Email</Label>
              <Input value={recipientEmail} onChange={(e) => setRecipientEmail(e.target.value)} placeholder="volunteer@example.com" className="h-11 rounded-xl" />
            </div>
            <div className="rounded-xl bg-muted/40 p-3 text-[11px] text-muted-foreground break-all">
              {inviteLink(sendCode)}
            </div>
            <div className="flex gap-2 pt-1">
              <Button variant="outline" className="flex-1 h-11 rounded-xl" onClick={() => copy(inviteLink(sendCode), "Link copied")}>
                <Copy className="h-4 w-4 mr-2" /> Copy Link
              </Button>
              <Button className="flex-1 h-11 rounded-xl font-bold" onClick={sendInvite}>
                <Send className="h-4 w-4 mr-2" /> Open Email
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}