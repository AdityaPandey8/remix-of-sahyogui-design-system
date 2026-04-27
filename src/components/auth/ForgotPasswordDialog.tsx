import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Mail, KeyRound } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultEmail?: string;
}

export function ForgotPasswordDialog({ open, onOpenChange, defaultEmail }: Props) {
  const [email, setEmail] = useState(defaultEmail || "");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Enter your email");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setSent(true);
    toast.success("Check your email for the reset link");
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) setSent(false); }}>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><KeyRound className="h-5 w-5 text-primary" /> Reset your password</DialogTitle>
          <DialogDescription>We'll email you a secure link to set a new password.</DialogDescription>
        </DialogHeader>

        {sent ? (
          <div className="rounded-xl bg-success/10 border border-success/30 p-4 text-sm text-success">
            ✅ A reset link was sent to <strong>{email}</strong>. The link is valid for a short time.
          </div>
        ) : (
          <form onSubmit={handleSend} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-11 pl-9 rounded-xl" placeholder="you@example.com" required />
              </div>
            </div>
            <Button type="submit" className="w-full h-11 rounded-xl font-bold" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Send Reset Link
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}