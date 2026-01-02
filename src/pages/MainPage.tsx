import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

import LibraryBackground from "@/components/LibraryBackground";
import LandingOverlay from "@/components/LandingOverlay";
import IntroMessage from "@/components/IntroMessage";

type AppState = "landing" | "intro";

const MainPage = () => {
  const navigate = useNavigate();
  const [appState, setAppState] = useState<AppState>("landing");

  return (
    <div className="min-h-screen overflow-hidden">
      <LibraryBackground />

      <AnimatePresence>
        {appState === "landing" && (
          <LandingOverlay onStart={() => setAppState("intro")} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {appState === "intro" && (
          <IntroMessage
            onComplete={() => {
              navigate("/journal"); // ⭐ 여기로만 이동
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default MainPage;