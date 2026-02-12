import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { getSession, clearSession, GroupSession } from "@/lib/groupSession";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import SharedNotepad from "@/components/features/SharedNotepad";
import TodoList from "@/components/features/TodoList";
import GroupGarden from "@/components/features/GroupGarden";
import MoodTracker from "@/components/features/MoodTracker";
import BubbleBuster from "@/components/features/BubbleBuster";
import GroupChat from "@/components/features/GroupChat";
import TimeTracker from "@/components/features/TimeTracker";
import Sketchboard from "@/components/features/Sketchboard";
import Mascot from "@/components/features/Mascot";
import { LogOut, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Member = { id: string; member_name: string; mood: string; tasks_completed: number };

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [session, setSessionState] = useState<GroupSession | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [activeFeature, setActiveFeature] = useState<string | null>(null);

  useEffect(() => {
    const s = getSession();
    if (!s) { navigate("/"); return; }
    setSessionState(s);
    fetchMembers(s.groupId);

    const channel = supabase
      .channel("members-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "members", filter: `group_id=eq.${s.groupId}` }, () => fetchMembers(s.groupId))
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [navigate]);

  const fetchMembers = async (groupId: string) => {
    const { data } = await supabase.from("members").select("*").eq("group_id", groupId);
    if (data) setMembers(data);
  };

  const handleLogout = () => {
    clearSession();
    navigate("/");
  };

  if (!session) return null;

  const features = [
    { key: "notepad", emoji: "📝", title: "Shared Notepad", color: "bg-pastel-yellow" },
    { key: "todo", emoji: "✅", title: "To-Do List", color: "bg-pastel-green" },
    { key: "garden", emoji: "🌱", title: "Group Garden", color: "bg-pastel-pink" },
    { key: "mood", emoji: "😊", title: "Mood Tracker", color: "bg-pastel-purple" },
    { key: "bubble", emoji: "🫧", title: "Bubble Buster", color: "bg-pastel-orange" },
    { key: "chat", emoji: "💬", title: "Group Chat", color: "bg-primary/10" },
    { key: "sketch", emoji: "🎨", title: "Sketchboard", color: "bg-pastel-yellow" },
  ];

  const renderFeature = () => {
    if (!activeFeature) return null;
    const props = { session, members };
    switch (activeFeature) {
      case "notepad": return <SharedNotepad {...props} />;
      case "todo": return <TodoList {...props} />;
      case "garden": return <GroupGarden {...props} />;
      case "mood": return <MoodTracker {...props} />;
      case "bubble": return <BubbleBuster />;
      case "chat": return <GroupChat {...props} />;
      case "sketch": return <Sketchboard />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-background pt-14">
      <TimeTracker />
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-6xl mx-auto p-4 md:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-display font-extrabold text-primary">
              🌸 {session.groupName}
            </h1>
            <p className="text-muted-foreground text-sm">
              Welcome, <span className="font-semibold">{session.memberName}</span>!
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              className="rounded-full text-xs font-mono"
              onClick={() => {
                navigator.clipboard.writeText(session.groupCode);
                toast({ title: "Code copied! 📋" });
              }}
            >
              <Copy className="h-3 w-3 mr-1" /> {session.groupCode}
            </Button>
            <Button size="sm" variant="ghost" onClick={handleLogout} className="rounded-full">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Members bar */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {members.map((m) => (
            <span
              key={m.id}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-card text-sm font-semibold shadow-sm border"
            >
              {m.mood} {m.member_name}
            </span>
          ))}
        </div>

        {/* Feature Grid or Active Feature */}
        {activeFeature ? (
          <div>
            <Button variant="ghost" onClick={() => setActiveFeature(null)} className="mb-4 rounded-full font-display">
              ← Back to Dashboard
            </Button>
            {renderFeature()}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {features.map((f, i) => (
              <motion.div
                key={f.key}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: i * 0.1 }}
              >
                <Card
                  className={`cursor-pointer border-0 shadow-lg hover:shadow-xl transition-all hover:scale-105 ${f.color}`}
                  onClick={() => setActiveFeature(f.key)}
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="text-3xl text-center">{f.emoji}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-center font-display font-bold text-sm">{f.title}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
      <Mascot context="dashboard" />
    </div>
  );
};

export default Dashboard;
