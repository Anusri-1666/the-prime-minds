import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { getSession } from "@/lib/groupSession";
import Mascot from "@/components/features/Mascot";

const Index = () => {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<"title" | "revealed">("title");

  useEffect(() => {
    const session = getSession();
    if (session) {
      navigate("/dashboard");
      return;
    }
    const timer = setTimeout(() => setPhase("revealed"), 2000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background overflow-hidden relative flex flex-col items-center justify-center">
      {/* Floating decorative elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {["🌸", "🌱", "✨", "🌿", "💫", "🍃"].map((emoji, i) => (
          <motion.span
            key={i}
            className="absolute text-2xl md:text-4xl"
            style={{
              left: `${15 + i * 14}%`,
              top: `${10 + (i % 3) * 25}%`,
            }}
            animate={{ y: [0, -15, 0], rotate: [0, 10, -10, 0] }}
            transition={{ duration: 3 + i * 0.5, repeat: Infinity, ease: "easeInOut" }}
          >
            {emoji}
          </motion.span>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {phase === "title" && (
          <motion.div
            key="title"
            className="flex flex-col items-center gap-4"
            initial={{ scale: 0.3, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <h1 className="text-4xl md:text-6xl font-display font-extrabold text-primary text-center">
              🌸 Thrive Together
            </h1>
          </motion.div>
        )}

        {phase === "revealed" && (
          <motion.div
            key="revealed"
            className="flex flex-col items-center gap-8 px-4"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="text-center">
              <h1 className="text-4xl md:text-6xl font-display font-extrabold text-primary mb-4">
                🌸 Thrive Together
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground font-body">
                Learn and Grow as a Team 🌱
              </p>
            </div>

            <motion.div
              className="flex flex-col sm:flex-row gap-4 mt-4"
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              <Button
                size="lg"
                className="rounded-full px-8 py-6 text-lg font-display font-bold shadow-lg hover:shadow-xl transition-all hover:scale-105"
                onClick={() => navigate("/join")}
              >
                🤝 Join Group
              </Button>
              <Button
                size="lg"
                variant="secondary"
                className="rounded-full px-8 py-6 text-lg font-display font-bold shadow-lg hover:shadow-xl transition-all hover:scale-105"
                onClick={() => navigate("/create")}
              >
                ✨ Create Group
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="mt-8"
            >
              <p className="text-sm text-muted-foreground">
                Already have a group?{" "}
                <button
                  onClick={() => navigate("/login")}
                  className="text-primary font-semibold underline-offset-4 hover:underline"
                >
                  Login here
                </button>
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <Mascot context="landing" />
    </div>
  );
};

export default Index;
