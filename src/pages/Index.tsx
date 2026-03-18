import { useState, useEffect } from "react";
import BuddyHeader from "@/components/BuddyHeader";
import BuddyRobot from "@/components/BuddyRobot";
import BuddyChat from "@/components/BuddyChat";
import BuddyControlBar from "@/components/BuddyControlBar";

const Index = () => {
  const [isTalking, setIsTalking] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsTalking(true);
      setTimeout(() => setIsTalking(false), 2000);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-[100dvh] w-full flex flex-col buddy-gradient-bg overflow-hidden safe-area-inset">
      <BuddyHeader />
      <BuddyRobot isTalking={isTalking} />
      <BuddyChat />
      <BuddyControlBar />
    </div>
  );
};

export default Index;