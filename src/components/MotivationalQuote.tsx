import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

const quotes = [
  "Small steps every day lead to big results.",
  "Success is the sum of small efforts, repeated day in and day out. — Robert Collier",
  "Dream big. Start small. Act now.— Robin Sharma",
  "Plan your work and work your plan.",
  "One thing at a time, one day at a time.",
  "Slow progress is still progress.",
  "Peace begins when the to-do list ends.",
  "✅ Done feels better than perfect.",
  "Focus. Finish. Feel proud.",
  "Don't stop when you're tired. Stop when you're done.",
  "Make it happen today.",
  "Discipline is choosing between what you want now and what you want most",
  "Little things make big days.",
  "It's going to be hard, but hard does not mean impossible.",
  "Don't wait for opportunity. Create it.",
  "Sometimes we're tested not to show our weaknesses, but to discover our strengths.",
  "The key to success is to focus on goals, not obstacles.",
  "Dream bigger. Do bigger.",
  "Push yourself, because no one else is going to do it for you.",
  "Great things take time. Be patient.",
];

export const MotivationalQuote = () => {
  const [quoteIndex, setQuoteIndex] = useState(() => {
    const saved = localStorage.getItem("currentQuoteIndex");
    return saved ? parseInt(saved) : 0;
  });

  useEffect(() => {
    // Change quote every 2 hours (7200000 ms)
    const interval = setInterval(() => {
      setQuoteIndex((prev) => {
        const next = (prev + 1) % quotes.length;
        localStorage.setItem("currentQuoteIndex", next.toString());
        return next;
      });
    }, 2 * 60 * 60 * 1000); // 2 hours

    return () => clearInterval(interval);
  }, []);

  return (
    <Card className="p-6 backdrop-blur-ultra bg-gradient-to-br from-primary/10 to-secondary/10 border-2 border-primary/20 animate-fade-in">
      <div className="flex items-start gap-3">
        <Sparkles className="h-6 w-6 text-primary flex-shrink-0 mt-1 animate-pulse" />
        <div>
          <p className="text-lg font-semibold italic text-foreground leading-relaxed">
            "{quotes[quoteIndex]}"
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            New quote every 2 hours ✨
          </p>
        </div>
      </div>
    </Card>
  );
};
