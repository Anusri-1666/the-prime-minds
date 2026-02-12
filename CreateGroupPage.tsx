import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { setSession, generateGroupCode } from "@/lib/groupSession";
import { useToast } from "@/hooks/use-toast";
import { Copy, Check } from "lucide-react";

const CreateGroupPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [groupName, setGroupName] = useState("");
  const [creatorName, setCreatorName] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!groupName.trim() || !creatorName.trim()) {
      toast({ title: "Please fill in all fields", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      let code = generateGroupCode();
      // Ensure unique
      let attempts = 0;
      while (attempts < 5) {
        const { data: existing } = await supabase
          .from("groups")
          .select("id")
          .eq("group_code", code)
          .maybeSingle();
        if (!existing) break;
        code = generateGroupCode();
        attempts++;
      }

      const { data: group, error: groupError } = await supabase
        .from("groups")
        .insert({ group_name: groupName.trim(), group_code: code, created_by: creatorName.trim() })
        .select()
        .single();

      if (groupError) throw groupError;

      // Create initial note for the group
      await supabase.from("notes").insert({ group_id: group.id, content: "" });

      // Add creator as member
      const { data: member, error: memberError } = await supabase
        .from("members")
        .insert({ member_name: creatorName.trim(), group_id: group.id })
        .select()
        .single();

      if (memberError) throw memberError;

      setGeneratedCode(code);
      setSession({
        groupId: group.id,
        groupCode: code,
        groupName: group.group_name,
        memberName: member.member_name,
        memberId: member.id,
      });
    } catch (err: any) {
      toast({ title: "Error creating group", description: err.message, variant: "destructive" });
    }
    setLoading(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedCode);
    setCopied(true);
    toast({ title: "Code copied! 📋" });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
        <Card className="w-full max-w-md shadow-xl border-0 bg-card">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-display font-bold text-primary">✨ Create Group</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!generatedCode ? (
              <>
                <div>
                  <label className="text-sm font-semibold text-foreground">Your Name</label>
                  <Input
                    placeholder="Enter your name"
                    value={creatorName}
                    onChange={(e) => setCreatorName(e.target.value)}
                    className="mt-1 rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-foreground">Group Name</label>
                  <Input
                    placeholder="e.g. Study Squad 📚"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    className="mt-1 rounded-xl"
                  />
                </div>
                <Button
                  className="w-full rounded-xl py-5 font-display font-bold text-lg"
                  onClick={handleCreate}
                  disabled={loading}
                >
                  {loading ? "Creating..." : "🎉 Generate Group Code"}
                </Button>
              </>
            ) : (
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center space-y-4">
                <p className="text-muted-foreground">Your group code is:</p>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-4xl font-mono font-extrabold tracking-[0.3em] text-primary">
                    {generatedCode}
                  </span>
                  <Button size="icon" variant="ghost" onClick={handleCopy} className="rounded-full">
                    {copied ? <Check className="h-5 w-5 text-accent-foreground" /> : <Copy className="h-5 w-5" />}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">Share this code with your team!</p>
                <Button
                  className="w-full rounded-xl py-5 font-display font-bold text-lg"
                  onClick={() => navigate("/dashboard")}
                >
                  🚀 Go to Dashboard
                </Button>
              </motion.div>
            )}
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

export default CreateGroupPage;
