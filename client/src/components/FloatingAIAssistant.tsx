import { useState, useRef, useEffect } from "react";
import {
  MessageSquareShare,
  X,
  Send,
  Loader2,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  Search,
  History as HistoryIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

export function FloatingAIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hello! I'm your Agent Banking AI Assistant. I can help you analyze transactions, monitor float levels, and detect suspicious patterns. How can I assist you today?",
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  const chatMutation = trpc.ai.chat.useMutation({
    onSuccess: response => {
      setMessages(prev => [...prev, { role: "assistant", content: response }]);
      setIsLoading(false);
    },
    onError: error => {
      console.error("AI Error:", error);
      toast.error("AI Assistant unavailable", {
        description: error.message,
      });
      setIsLoading(false);
    },
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    chatMutation.mutate({ messages: newMessages });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const suggestedPrompts = [
    "Check for recent fraud attempts",
    "Analyze float liquidity risks",
    "Show flagged transactions",
    "Summarize yesterday's report",
  ];

  return (
    <div className="fixed bottom-8 right-8 z-[100] flex flex-col items-end gap-4 print:hidden">
      {/* Chat Window */}
      {isOpen && (
        <Card className="w-[420px] h-[600px] flex flex-col shadow-2xl border-slate-200 dark:border-slate-800 animate-in slide-in-from-bottom-5 fade-in duration-300 rounded-[2.5rem] overflow-hidden bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl">
          {/* Header */}
          <div className="p-6 premium-gradient text-white flex items-center justify-between shadow-lg relative">
            <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
              <Sparkles className="h-full w-full opacity-10 animate-pulse" />
            </div>
            <div className="flex items-center gap-3 relative z-10">
              <div className="h-10 w-10 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md border border-white/30 shadow-white-sm">
                <ShieldAlert className="h-5 w-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-black uppercase tracking-widest leading-none">
                  AI Agent
                </span>
                <span className="text-[10px] text-white/70 font-semibold uppercase tracking-tighter mt-1">
                  Fraud & Risk Watcher Active
                </span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20 rounded-full h-8 w-8 transition-all relative z-10"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Messages Area */}
          <ScrollArea ref={scrollRef} className="flex-1 p-6 space-y-6">
            <div className="space-y-6">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex flex-col max-w-[85%] space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-300",
                    msg.role === "user"
                      ? "ml-auto items-end"
                      : "mr-auto items-start"
                  )}
                >
                  <div
                    className={cn(
                      "p-4 rounded-3xl text-sm font-medium leading-relaxed shadow-sm",
                      msg.role === "user"
                        ? "bg-primary text-white rounded-tr-none shadow-primary-sm"
                        : "bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200 rounded-tl-none border border-slate-200/50 dark:border-slate-800"
                    )}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex flex-col max-w-[85%] items-start animate-fade-in">
                  <div className="p-4 rounded-3xl bg-slate-100 dark:bg-slate-900 text-slate-400 rounded-tl-none border border-slate-200/50 dark:border-slate-800 flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-xs font-bold uppercase tracking-widest">
                      Analyzing patterns...
                    </span>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Suggested Prompts (only if fewer than 3 messages) */}
          {messages.length < 4 && !isLoading && (
            <div className="px-6 pb-4 flex flex-wrap gap-2">
              {suggestedPrompts.map(prompt => (
                <button
                  key={prompt}
                  onClick={() => {
                    setInput(prompt);
                  }}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-[10px] font-bold text-slate-500 uppercase tracking-tight hover:bg-primary/10 hover:text-primary hover:border-primary/20 transition-all active:scale-95"
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}

          {/* Input Area */}
          <div className="p-6 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800">
            <div className="relative group">
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Ask about fraud, float, or reconciliation..."
                className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none min-h-[60px] max-h-[120px] transition-all shadow-inner font-medium text-slate-700 dark:text-slate-200"
              />
              <Button
                size="icon"
                className={cn(
                  "absolute bottom-3 right-3 h-8 w-8 rounded-xl premium-gradient text-white shadow-lg transition-all active:scale-90",
                  !input.trim() && "opacity-50 grayscale pointer-events-none"
                )}
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
              >
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-[10px] text-slate-400 mt-3 text-center font-bold tracking-tight uppercase opacity-50">
              AgentTrack Intelligence &bull; Ethical Shield V2.0
            </p>
          </div>
        </Card>
      )}

      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "h-16 w-16 rounded-[2rem] flex items-center justify-center text-white shadow-2xl transition-all duration-500 active:scale-95 hover:scale-110",
          isOpen
            ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 rotate-90"
            : "premium-gradient"
        )}
        style={{
          boxShadow: isOpen
            ? "0 20px 40px rgba(0,0,0,0.3)"
            : "0 10px 30px rgba(var(--primary-rgb),0.4)",
        }}
      >
        {isOpen ? (
          <X className="h-7 w-7" />
        ) : (
          <div className="relative">
            <MessageSquareShare className="h-7 w-7 animate-pulse" />
            <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-rose-500 border-2 border-white shadow-rose-sm" />
          </div>
        )}
      </button>
    </div>
  );
}
