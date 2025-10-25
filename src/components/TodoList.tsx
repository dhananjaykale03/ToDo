import { useState, useEffect, useRef } from "react";
import { Plus, Trash2, Check, Sparkles, Volume2, VolumeX, Edit2, Save, X, GripVertical, Target, TrendingUp, CheckCircle2, ListTodo, Moon, Sun, Search, Calendar, StickyNote, Timer, Clock, Bell } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { FocusMode } from "./FocusMode";
import { MotivationalQuote } from "./MotivationalQuote";




interface Todo {
  id: string;
  text: string;
  description?: string;
  completed: boolean;
  createdAt: number;
  priority: "high" | "medium" | "low";
  dueDate?: string;
  dueTime?: string; // time for alarm
  focusTime?: number; // minutes spent in focus mode
}

type FilterType = "all" | "active" | "completed";

const priorityColors = {
  high: "bg-red-500/20 border-red-500/50 text-red-600 dark:text-red-400",
  medium: "bg-yellow-500/20 border-yellow-500/50 text-yellow-600 dark:text-yellow-400",
  low: "bg-green-500/20 border-green-500/50 text-green-600 dark:text-green-400",
};

const priorityGlow = {
  high: "shadow-[0_0_20px_rgba(239,68,68,0.4)]",
  medium: "shadow-[0_0_20px_rgba(234,179,8,0.4)]",
  low: "shadow-[0_0_20px_rgba(34,197,94,0.4)]",
};



export const TodoList = () => {
  const { theme, setTheme } = useTheme();
  
  // Core task state
  const [todos, setTodos] = useState<Todo[]>(() => {
    const saved = localStorage.getItem("todos");
    return saved ? JSON.parse(saved) : [];
  });
  
  // UI state
  const [newTodo, setNewTodo] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [confetti, setConfetti] = useState<Array<{ id: string; x: number; y: number; color: string; delay: number }>>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [shakeInput, setShakeInput] = useState(false);
  const [newPriority, setNewPriority] = useState<"high" | "medium" | "low">("medium");
  const [newDescription, setNewDescription] = useState("");
  const [newDueDate, setNewDueDate] = useState("");
  const [newDueTime, setNewDueTime] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedTodo, setExpandedTodo] = useState<string | null>(null);
  const [focusTask, setFocusTask] = useState<Todo | null>(null);
  const [showAISuggestions, setShowAISuggestions] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [showDailyReflection, setShowDailyReflection] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Check for overdue tasks and trigger alarms
  useEffect(() => {
    const checkOverdueTasks = () => {
      const now = new Date();
      
      todos.forEach(todo => {
        if (!todo.completed && todo.dueDate && todo.dueTime) {
          const [hours, minutes] = todo.dueTime.split(':').map(Number);
          const dueDateTime = new Date(todo.dueDate);
          dueDateTime.setHours(hours, minutes, 0, 0);
          
          // Check if task is past due time
          if (now >= dueDateTime) {
            // Try to vibrate (works when user has interacted with page)
            if ('vibrate' in navigator) {
              try {
                navigator.vibrate([500, 200, 500, 200, 500]);
              } catch (e) {
                console.log('Vibration failed:', e);
              }
            }
            
            playAlarmSound();
            toast.error(`🔔 Task Overdue: "${todo.text}" was due at ${todo.dueTime}`, {
              duration: 8000,
              action: {
                label: 'Mark Done',
                onClick: () => {
                  // Vibrate on user interaction
                  if ('vibrate' in navigator) {
                    navigator.vibrate(200);
                  }
                  toggleTodo(todo.id);
                }
              }
            });
          }
        }
      });
    };

    // Check immediately on mount
    checkOverdueTasks();
    
    // Check every minute
    const interval = setInterval(checkOverdueTasks, 60 * 1000);
    
    return () => clearInterval(interval);
  }, [todos]);

  // Persist todos
  useEffect(() => {
    localStorage.setItem("todos", JSON.stringify(todos));
  }, [todos]);

  const playAlarmSound = () => {
    if (!soundEnabled) return;
    
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Create a more attention-grabbing alarm sound
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
      }, i * 400);
    }
  };

  const playSound = (type: "complete" | "add" | "delete") => {
    if (!soundEnabled) return;
    
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    if (type === "complete") {
      oscillator.frequency.value = 800;
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } else if (type === "add") {
      oscillator.frequency.value = 600;
      gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);
    } else if (type === "delete") {
      oscillator.frequency.value = 200;
      gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);
    }
  };

  const addTodo = () => {
    if (!newTodo.trim()) {
      setShakeInput(true);
      setTimeout(() => setShakeInput(false), 500);
      return;
    }
    
    const todo: Todo = {
      id: Date.now().toString(),
      text: newTodo,
      description: newDescription.trim() || undefined,
      completed: false,
      createdAt: Date.now(),
      priority: newPriority,
      dueDate: newDueDate || undefined,
      dueTime: newDueTime || undefined,
    };
    
    setTodos([todo, ...todos]);
    setNewTodo("");
    setNewDescription("");
    setNewDueDate("");
    setNewDueTime("");
    playSound("add");
    toast.success("Task created! ✨", { duration: 2000 });
  };

  const toggleTodo = (id: string) => {
    setTodos(todos.map(todo => {
      if (todo.id === id && !todo.completed) {
        triggerConfetti();
        playSound("complete");
        toast.success(`Amazing! Task completed 🎉`, { duration: 2000 });
      }
      return todo.id === id ? { ...todo, completed: !todo.completed } : todo;
    }));
  };

  const deleteTodo = (id: string) => {
    setTodos(todos.filter(todo => todo.id !== id));
    playSound("delete");
    toast("Task removed", { duration: 2000 });
  };
  

  const clearCompleted = () => {
    const completedCount = todos.filter(t => t.completed).length;
    if (completedCount === 0) {
      toast("No completed tasks to clear", { duration: 2000 });
      return;
    }
    setTodos(todos.filter(todo => !todo.completed));
    toast.success(`Cleared ${completedCount} completed task${completedCount > 1 ? 's' : ''}`, { duration: 2000 });
  };

  const startEdit = (id: string, text: string) => {
    setEditingId(id);
    setEditText(text);
  };

  const saveEdit = () => {
    if (!editText.trim()) return;
    setTodos(todos.map(todo => 
      todo.id === editingId ? { ...todo, text: editText } : todo
    ));
    setEditingId(null);
    toast.success("Task updated!", { duration: 2000 });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText("");
  };

  const triggerConfetti = () => {
    const colors = ["hsl(280, 80%, 60%)", "hsl(320, 75%, 65%)", "hsl(200, 85%, 60%)", "hsl(150, 70%, 50%)", "hsl(45, 90%, 55%)"];
    const newConfetti = Array.from({ length: 50 }, (_, i) => ({
      id: Date.now() + i.toString(),
      x: Math.random() * 100,
      y: Math.random() * -20,
      color: colors[Math.floor(Math.random() * colors.length)],
      delay: Math.random() * 0.5,
    }));
    
    setConfetti(newConfetti);
    setTimeout(() => setConfetti([]), 2000);
  };

  const handleDragStart = (id: string) => {
    setDraggedItem(id);
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    if (draggedItem === id) return;

    const draggedIndex = todos.findIndex(t => t.id === draggedItem);
    const targetIndex = todos.findIndex(t => t.id === id);
    
    const newTodos = [...todos];
    const [removed] = newTodos.splice(draggedIndex, 1);
    newTodos.splice(targetIndex, 0, removed);
    
    setTodos(newTodos);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  const filteredTodos = todos.filter(todo => {
    // Filter by completion status
    if (filter === "active" && todo.completed) return false;
    if (filter === "completed" && !todo.completed) return false;

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      return (
        todo.text.toLowerCase().includes(query) ||
        todo.description?.toLowerCase().includes(query)
      );
    }

    return true;
  });

  const progress = todos.length > 0
    ? (todos.filter(t => t.completed).length / todos.length) * 100
    : 0;

  const stats = {
    total: todos.length,
    completed: todos.filter(t => t.completed).length,
    active: todos.filter(t => !t.completed).length,
    highPriority: todos.filter(t => !t.completed && t.priority === "high").length,
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[image:var(--gradient-bg)] p-4 sm:p-8">
      {/* Animated background orbs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-20 top-20 h-64 w-64 rounded-full bg-primary/20 blur-3xl animate-orb-float" style={{ animationDelay: "0s" }} />
        <div className="absolute right-10 top-40 h-80 w-80 rounded-full bg-secondary/20 blur-3xl animate-orb-float" style={{ animationDelay: "2s" }} />
        <div className="absolute bottom-20 left-1/3 h-72 w-72 rounded-full bg-accent/20 blur-3xl animate-orb-float" style={{ animationDelay: "4s" }} />
      </div>

      {/* Confetti animation */}
      {confetti.map(c => (
        <div
          key={c.id}
          className="absolute h-3 w-3 animate-confetti rounded-sm"
          style={{
            left: `${c.x}%`,
            top: `${c.y}%`,
            backgroundColor: c.color,
            animationDelay: `${c.delay}s`,
          }}
        />
      ))}

      {focusTask && (
        <FocusMode
          taskText={focusTask.text}
          onClose={() => setFocusTask(null)}
          onComplete={() => {
            toggleTodo(focusTask.id);
            setFocusTask(null);
          }}
        />
      )}

      <div className="relative mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-3 animate-fade-in">
          <h1 className="text-6xl sm:text-7xl font-extrabold bg-gradient-to-r from-primary via-secondary to-accent bg-[length:200%_auto] animate-text-shimmer bg-clip-text text-transparent drop-shadow-2xl">
              SHRA-LAX
          </h1>
          <p className="text-xl sm:text-2xl font-semibold bg-[image:var(--gradient-accent)] bg-clip-text text-transparent animate-float">
              One Step Closer 🎯. Every Day. ✨
          </p>
        </div>

        {/* Theme and Sound toggles */}
        <div className="flex justify-end items-center gap-2 animate-slide-in-right">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="backdrop-blur-xl bg-card/60 border-border/50"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="backdrop-blur-xl bg-card/60 border-border/50"
          >
            {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </Button>
        </div>

        {/* Motivational Quote */}
        <MotivationalQuote />

        {/* Search Bar */}
        <Card className="p-4 backdrop-blur-ultra bg-card/70 border-border/50 shadow-[var(--glow-accent)] animate-bounce-in">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks... 🔍"
              className="pl-10 bg-background/60 border-border/50 focus-visible:ring-primary text-base h-12"
            />
          </div>
        </Card>

        {/* Statistics */}
        {todos.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 animate-bounce-in">
            <Card className="p-5 backdrop-blur-ultra bg-gradient-to-br from-card/80 to-card/60 border-border/50 hover:shadow-[var(--glow-primary)] hover:scale-105 transition-all duration-300">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <ListTodo className="h-5 w-5 text-primary" />
                </div>
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total</span>
              </div>
              <p className="text-3xl font-extrabold bg-[image:var(--gradient-primary)] bg-clip-text text-transparent">{stats.total}</p>
            </Card>
            <Card className="p-5 backdrop-blur-ultra bg-gradient-to-br from-card/80 to-card/60 border-border/50 hover:shadow-[var(--glow-success)] hover:scale-105 transition-all duration-300">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                </div>
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Done</span>
              </div>
              <p className="text-3xl font-extrabold text-green-500">{stats.completed}</p>
            </Card>
            <Card className="p-5 backdrop-blur-ultra bg-gradient-to-br from-card/80 to-card/60 border-border/50 hover:shadow-[var(--glow-secondary)] hover:scale-105 transition-all duration-300">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 rounded-lg bg-secondary/10">
                  <TrendingUp className="h-5 w-5 text-secondary" />
                </div>
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Active</span>
              </div>
              <p className="text-3xl font-extrabold text-secondary">{stats.active}</p>
            </Card>
            <Card className="p-5 backdrop-blur-ultra bg-gradient-to-br from-card/80 to-card/60 border-border/50 hover:shadow-[0_0_20px_rgba(239,68,68,0.5)] hover:scale-105 transition-all duration-300">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 rounded-lg bg-red-500/10">
                  <Target className="h-5 w-5 text-red-500" />
                </div>
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Urgent</span>
              </div>
              <p className="text-3xl font-extrabold text-red-500">{stats.highPriority}</p>
            </Card>
          </div>
        )}

        {/* Progress bar */}
        {todos.length > 0 && (
          <Card className="p-4 backdrop-blur-xl bg-card/60 border-border/50 shadow-[var(--glow-primary)] animate-fade-in overflow-hidden relative">
            <div className="relative z-10 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Progress
                </span>
                <span className="font-semibold bg-[image:var(--gradient-primary)] bg-clip-text text-transparent">
                  {Math.round(progress)}%
                </span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden relative">
                <div
                  className="h-full bg-[image:var(--gradient-primary)] transition-all duration-500 ease-out rounded-full relative overflow-hidden"
                  style={{ width: `${progress}%` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Add todo */}
        <Card className={cn(
          "p-6 backdrop-blur-ultra bg-gradient-to-br from-card/90 to-card/70 border-2 border-border/50 shadow-[var(--glow-primary)] animate-bounce-in",
          shakeInput && "animate-shake"
        )}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              addTodo();
            }}
            className="space-y-4"
          >
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={newTodo}
                onChange={(e) => setNewTodo(e.target.value)}
                placeholder="What's your next big move? 🚀"
                className="flex-1 bg-background/60 border-border/50 focus-visible:ring-primary text-base h-12 font-medium"
              />
              <Button
                type="submit"
                size="lg"
                className="bg-[image:var(--gradient-primary)] hover:opacity-90 transition-all shadow-[var(--glow-primary)] hover:shadow-[var(--glow-secondary)] animate-pulse-glow px-6"
              >
                <Plus className="h-6 w-6" />
              </Button>
            </div>
            
            <Textarea
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Add details (optional)..."
              className="bg-background/60 border-border/50 focus-visible:ring-primary resize-none"
              rows={2}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Due Date
                </label>
                <Input
                  type="date"
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(e.target.value)}
                  className="bg-background/60 border-border/50 text-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Alarm Time
                </label>
                <Input
                  type="time"
                  value={newDueTime}
                  onChange={(e) => setNewDueTime(e.target.value)}
                  className="bg-background/60 border-border/50 text-sm"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              {(["low", "medium", "high"] as const).map((priority) => (
                <Button
                  key={priority}
                  type="button"
                  variant={newPriority === priority ? "default" : "outline"}
                  size="sm"
                  onClick={() => setNewPriority(priority)}
                  className={cn(
                    "capitalize flex-1 transition-all font-semibold",
                    newPriority === priority
                      ? cn(priorityColors[priority], priorityGlow[priority])
                      : "hover:bg-muted"
                  )}
                >
                  {priority}
                </Button>
              ))}
            </div>
          </form>
        </Card>

        {/* Filters and clear completed */}
        <div className="flex justify-between items-center gap-3 animate-fade-in flex-wrap">
          <div className="flex gap-2">
            {(["all", "active", "completed"] as FilterType[]).map((f) => (
              <Button
                key={f}
                onClick={() => setFilter(f)}
                variant={filter === f ? "default" : "outline"}
                size="sm"
                className={cn(
                  "capitalize transition-all font-semibold",
                  filter === f
                    ? "bg-[image:var(--gradient-primary)] shadow-[var(--glow-primary)] animate-pop"
                    : "hover:bg-muted backdrop-blur-ultra bg-card/60"
                )}
              >
                {f}
              </Button>
            ))}
          </div>
          {todos.some(t => t.completed) && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearCompleted}
              className="hover:bg-destructive/10 hover:text-destructive backdrop-blur-ultra bg-card/60 animate-slide-in-left font-semibold"
            >
              <Sparkles className="h-4 w-4 mr-1" />
              Clear Completed
            </Button>
          )}
        </div>

        {/* Todo list */}
        <div className="space-y-3">
          {filteredTodos.map((todo, index) => (
            <Card
              key={todo.id}
              draggable
              onDragStart={() => handleDragStart(todo.id)}
              onDragOver={(e) => handleDragOver(e, todo.id)}
              onDragEnd={handleDragEnd}
              className={cn(
                "group p-4 backdrop-blur-xl bg-card/60 border-border/50 transition-all duration-300 cursor-move",
                "hover:shadow-[var(--glow-secondary)] hover:scale-[1.02]",
                draggedItem === todo.id && "opacity-50 scale-95",
                !todo.completed && priorityGlow[todo.priority],
                "animate-slide-in-up"
              )}
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className="flex items-center gap-3">
                <GripVertical className="h-4 w-4 text-muted-foreground/50 flex-shrink-0" />
                
                <button
                  onClick={() => toggleTodo(todo.id)}
                  className={cn(
                    "flex-shrink-0 h-6 w-6 rounded-full border-2 transition-all duration-300",
                    todo.completed
                      ? "bg-[image:var(--gradient-primary)] border-primary shadow-[var(--glow-success)] animate-check-bounce"
                      : "border-muted-foreground/50 hover:border-primary hover:scale-110"
                  )}
                >
                  {todo.completed && (
                    <Check className="h-full w-full p-1 text-primary-foreground" />
                  )}
                </button>

                {editingId === todo.id ? (
                  <div className="flex-1 flex gap-2">
                    <Input
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="flex-1 h-8 text-sm"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveEdit();
                        if (e.key === "Escape") cancelEdit();
                      }}
                    />
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={saveEdit}>
                      <Save className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={cancelEdit}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="flex-1 flex flex-col gap-2">
                      <div className="flex items-start gap-2">
                        <span
                          className={cn(
                            "text-base font-medium transition-all duration-300 flex-1 cursor-pointer",
                            todo.completed
                              ? "line-through text-muted-foreground"
                              : "text-foreground"
                          )}
                          onClick={() => setExpandedTodo(expandedTodo === todo.id ? null : todo.id)}
                        >
                          {todo.text}
                        </span>
                        <div className="flex gap-1 flex-shrink-0">
                          {!todo.completed && (
                            <span className={cn(
                              "text-xs px-2 py-0.5 rounded-full border capitalize font-semibold",
                              priorityColors[todo.priority]
                            )}>
                              {todo.priority}
                            </span>
                          )}
                        </div>
                      </div>
                      {expandedTodo === todo.id && (
                        <div className="space-y-2 pl-2 border-l-2 border-primary/30 animate-fade-in">
                          {todo.description && (
                            <div className="flex items-start gap-2 text-sm text-muted-foreground">
                              <StickyNote className="h-4 w-4 mt-0.5 flex-shrink-0" />
                              <p>{todo.description}</p>
                            </div>
                          )}
                          {todo.dueDate && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Calendar className="h-4 w-4 flex-shrink-0" />
                              <span>Due: {new Date(todo.dueDate).toLocaleDateString()}</span>
                            </div>
                          )}
                          {todo.dueTime && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Bell className="h-4 w-4 flex-shrink-0" />
                              <span>Alarm: {todo.dueTime}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!todo.completed && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setFocusTask(todo)}
                          className="hover:text-secondary h-8 w-8"
                          title="Start Focus Mode"
                        >
                          <Timer className="h-4 w-4" />
                        </Button>
                      )}
                      {(todo.description || todo.dueDate || todo.dueTime) && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setExpandedTodo(expandedTodo === todo.id ? null : todo.id)}
                          className="hover:text-accent h-8 w-8"
                        >
                          <StickyNote className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => startEdit(todo.id, todo.text)}
                        className="hover:text-primary h-8 w-8"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteTodo(todo.id)}
                        className="hover:text-destructive h-8 w-8"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </Card>
          ))}

          {filteredTodos.length === 0 && (
            <Card className="p-16 text-center backdrop-blur-ultra bg-gradient-to-br from-card/80 to-card/60 border-2 border-border/50 animate-fade-in">
              <div className="relative mb-6">
                <Sparkles className="h-20 w-20 mx-auto text-primary/60 animate-float" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-24 w-24 rounded-full bg-primary/20 blur-3xl animate-pulse-glow" />
                </div>
              </div>
              <p className="text-xl font-semibold bg-[image:var(--gradient-accent)] bg-clip-text text-transparent mb-2">
                {filter === "completed" 
                  ? "No completed tasks yet" 
                  : filter === "active"
                  ? "All done! Amazing work!"
                  : searchQuery
                  ? "No tasks match your search"
                  : "Turn Plans Into Progress."}
              </p>
              <p className="text-sm text-muted-foreground">
                {filter === "completed" 
                  ? "Start checking off tasks to see them here 💪" 
                  : filter === "active"
                  ? "You're a productivity superstar! 🎉"
                  : searchQuery
                  ? "Try a different search term"
                  : "Create your first task and let's get started! ✨"}
              </p>
            </Card>
          )}
        </div>

        {/* Stats footer */}
        {todos.length > 0 && (
          <div className="text-center text-sm text-muted-foreground animate-fade-in">
            {stats.active} task{stats.active !== 1 ? 's' : ''} remaining • {stats.completed} completed
          </div>
        )}

        {/* Made by footer */}
        <div className="text-center py-6 animate-fade-in">
          <p className="text-sm text-muted-foreground">
            Made With 💗 by Dhananjay kale
          </p>
        </div>
      </div>
    </div>
  );
};
