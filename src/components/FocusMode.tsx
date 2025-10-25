import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Pause, X, SkipForward, Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface FocusModeProps {
  taskText: string;
  onClose: () => void;
  onComplete: () => void;
}

const POMODORO_TIME = 25 * 60; // 25 minutes
const BREAK_TIME = 5 * 60; // 5 minutes
const LONG_BREAK_TIME = 15 * 60; // 15 minutes

const motivationalQuotes = [
  "Focus is the gateway to thinking clearly.",
  "Small progress is still progress.",
  "The secret of getting ahead is getting started.",
  "Don't watch the clock; do what it does. Keep going.",
  "The harder you work for something, the greater you'll feel when you achieve it.",
  "Success is the sum of small efforts repeated day in and day out.",
];

export const FocusMode = ({ taskText, onClose, onComplete }: FocusModeProps) => {
  const [timeLeft, setTimeLeft] = useState(POMODORO_TIME);
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [pomodoroCount, setPomodoroCount] = useState(0);
  const [currentQuote, setCurrentQuote] = useState(motivationalQuotes[0]);
  const [soundEnabled, setSoundEnabled] = useState(true);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    } else if (timeLeft === 0) {
      handleTimerComplete();
    }
  }, [isRunning, timeLeft]);

  const playSound = (frequency: number) => {
    if (!soundEnabled) return;
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = frequency;
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  };

  const handleTimerComplete = () => {
    playSound(800);
    setIsRunning(false);
    
    if (isBreak) {
      setIsBreak(false);
      setTimeLeft(POMODORO_TIME);
      toast.success("Break over! Ready for another focus session?");
      setCurrentQuote(motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)]);
    } else {
      const newCount = pomodoroCount + 1;
      setPomodoroCount(newCount);
      
      if (newCount % 4 === 0) {
        setTimeLeft(LONG_BREAK_TIME);
        toast.success("Great work! Take a longer break! 🎉");
      } else {
        setTimeLeft(BREAK_TIME);
        toast.success("Pomodoro complete! Take a short break! ☕");
      }
      
      setIsBreak(true);
      setCurrentQuote(motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)]);
    }
  };

  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const skipSession = () => {
    if (isBreak) {
      setIsBreak(false);
      setTimeLeft(POMODORO_TIME);
      toast("Skipped break");
    } else {
      handleTimerComplete();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = isBreak 
    ? ((pomodoroCount % 4 === 0 ? LONG_BREAK_TIME : BREAK_TIME) - timeLeft) / (pomodoroCount % 4 === 0 ? LONG_BREAK_TIME : BREAK_TIME) * 100
    : (POMODORO_TIME - timeLeft) / POMODORO_TIME * 100;

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-lg flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full p-8 backdrop-blur-ultra bg-gradient-to-br from-card/90 to-card/70 border-2 border-border/50 shadow-[var(--glow-primary)]">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-3 w-3 rounded-full bg-gradient-to-r from-primary to-secondary animate-pulse" />
              <h2 className="text-2xl font-bold bg-[image:var(--gradient-primary)] bg-clip-text text-transparent">
                {isBreak ? "Break Time" : "Focus Mode"}
              </h2>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="icon" onClick={() => setSoundEnabled(!soundEnabled)}>
                {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              </Button>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Task being worked on */}
          <div className="p-4 rounded-lg bg-muted/50 border border-border/50">
            <p className="text-sm text-muted-foreground mb-1">Working on:</p>
            <p className="text-lg font-semibold">{taskText}</p>
          </div>

          {/* Timer Circle */}
          <div className="relative w-64 h-64 mx-auto">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="128"
                cy="128"
                r="120"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-muted"
              />
              <circle
                cx="128"
                cy="128"
                r="120"
                stroke="url(#gradient)"
                strokeWidth="8"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 120}`}
                strokeDashoffset={`${2 * Math.PI * 120 * (1 - progress / 100)}`}
                className="transition-all duration-1000"
                strokeLinecap="round"
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="hsl(var(--primary))" />
                  <stop offset="100%" stopColor="hsl(var(--secondary))" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-6xl font-bold bg-[image:var(--gradient-primary)] bg-clip-text text-transparent">
                {formatTime(timeLeft)}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Pomodoro #{pomodoroCount + (isBreak ? 0 : 1)}
              </p>
            </div>
          </div>

          {/* Quote */}
          <div className="text-center">
            <p className="text-lg italic text-muted-foreground animate-fade-in">
              "{currentQuote}"
            </p>
          </div>

          {/* Controls */}
          <div className="flex justify-center gap-4">
            <Button
              onClick={toggleTimer}
              size="lg"
              className="bg-[image:var(--gradient-primary)] hover:opacity-90 shadow-[var(--glow-primary)] px-8"
            >
              {isRunning ? (
                <>
                  <Pause className="h-5 w-5 mr-2" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="h-5 w-5 mr-2" />
                  Start
                </>
              )}
            </Button>
            <Button onClick={skipSession} variant="outline" size="lg">
              <SkipForward className="h-5 w-5 mr-2" />
              Skip
            </Button>
            {!isBreak && (
              <Button 
                onClick={() => {
                  onComplete();
                  onClose();
                }}
                variant="secondary" 
                size="lg"
              >
                Complete Task
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};
