import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { setSession } from "@/lib/groupSession";
import { useToast } from "@/hooks/use-toast";

const LoginPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [groupCode, setGroupCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!name.trim() || !groupCode.trim()) {
      toast({ title: "Please fill in all fields", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      // Check if group exists
      const { data: group, error: groupError } = await supabase
        .from("groups")
        .select("*")
        .eq("group_code", groupCode.toUpperCase().trim())
        .maybeSingle();

      if (groupError) throw groupError;
      if (!group) {
        toast({ title: "Invalid group code! 😞", description: "Please check and try again.", variant: "destructive" });
        setLoading(false);
        return;
      }

      // Check if member exists
      const { data: existingMember } = await supabase
        .from("members")
        .select("*")
        .eq("group_id", group.id)
        .eq("member_name", name.trim())
        .maybeSingle();

      if (existingMember) {
        setSession({
          groupId: group.id,
          groupCode: group.group_code,
          groupName: group.group_name,
          memberName: existingMember.member_name,
          memberId: existingMember.id,
        });
        navigate("/dashboard");
      } else {
        // Add as new member
        const { data: newMember, error: memberError } = await supabase
          .from("members")
          .insert({ member_name: name.trim(), group_id: group.id })
          .select()
          .single();

        if (memberError) {
          if (memberError.code === "23505") {
            toast({ title: "Name already taken in this group!", variant: "destructive" });
          } else {
            throw memberError;
          }
          setLoading(false);
          return;
        }

        setSession({
          groupId: group.id,
          groupCode: group.group_code,
          groupName: group.group_name,
          memberName: newMember.member_name,
          memberId: newMember.id,
        });
        navigate("/dashboard");
      }
    } catch (err: any) {
      toast({ title: "Something went wrong", description: err.message, variant: "destructive" });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="w-full max-w-md shadow-xl border-0 bg-card">
          <CardHeader className="text-center">
            <CardTitle className="text-base font-body">Login</CardTitle>
            <p className="text-2xl font-display font-bold text-primary mt-2">🌸 Thrive Together</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-foreground">Your Name</label>
              <Input
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 rounded-xl"
              />
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
            <Button
              className="w-full rounded-xl py-5 font-display font-bold text-lg"
              onClick={handleLogin}
              disabled={loading}
            >
              {loading ? "Joining..." : "🚀 Enter Group"}
            </Button>
            <div className="text-center">
              <button onClick={() => navigate("/")} className="text-sm text-muted-foreground hover:text-primary">
                ← Back to home
              </button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default LoginPage;
