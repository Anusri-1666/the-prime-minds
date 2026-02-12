import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { setSession } from "@/lib/groupSession";
import { useToast } from "@/hooks/use-toast";

const JoinGroupPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [groupCode, setGroupCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleJoin = async () => {
    if (!name.trim() || !groupCode.trim()) {
      toast({ title: "Please fill in all fields", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { data: group } = await supabase
        .from("groups")
        .select("*")
        .eq("group_code", groupCode.toUpperCase().trim())
        .maybeSingle();

      if (!group) {
        toast({ title: "Invalid group code! 😞", variant: "destructive" });
        setLoading(false);
        return;
      }

      // Check duplicate
      const { data: existing } = await supabase
        .from("members")
        .select("*")
        .eq("group_id", group.id)
        .eq("member_name", name.trim())
        .maybeSingle();

      if (existing) {
        toast({ title: "Name already taken!", description: "Choose a different name.", variant: "destructive" });
        setLoading(false);
        return;
      }

      const { data: member, error } = await supabase
        .from("members")
        .insert({ member_name: name.trim(), group_id: group.id })
        .select()
        .single();

      if (error) throw error;

      setSession({
        groupId: group.id,
        groupCode: group.group_code,
        groupName: group.group_name,
        memberName: member.member_name,
        memberId: member.id,
      });

      toast({ title: `Welcome to ${group.group_name}! 🎉` });
      navigate("/dashboard");
    } catch (err: any) {
      toast({ title: "Error joining group", description: err.message, variant: "destructive" });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
        <Card className="w-full max-w-md shadow-xl border-0 bg-card">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-display font-bold text-primary">🤝 Join Group</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-foreground">Your Name</label>
              <Input placeholder="Enter your name" value={name} onChange={(e) => setName(e.target.value)} className="mt-1 rounded-xl" />
            </div>
            <div>
              <label className="text-sm font-semibold text-foreground">Group Code</label>
              <Input
                placeholder="e.g. THR123"
                value={groupCode}
                onChange={(e) => setGroupCode(e.target.value.toUpperCase())}
                className="mt-1 rounded-xl font-mono tracking-widest"
                maxLength={8}
              />
            </div>
            <Button className="w-full rounded-xl py-5 font-display font-bold text-lg" onClick={handleJoin} disabled={loading}>
              {loading ? "Joining..." : "🚀 Join Group"}
            </Button>
            <div className="text-center">
              <button onClick={() => navigate("/")} className="text-sm text-muted-foreground hover:text-primary">← Back to home</button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default JoinGroupPage;
