import { useState, useRef, useEffect } from "react";
import {
  MessageSquare,
  X,
  Send,
  Loader2,
  HelpCircle,
  ArrowRight,
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
import { Streamdown } from "streamdown";
import { useAuth } from "@/_core/hooks/useAuth";

export interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

export function FloatingAIAssistant() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: `Limitless Junction Track ready. I'm here to help track all your agents in this single hub and prevent financial loss. How can I assist today?`,
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
      console.error("Assistant Error:", error);
      toast.error("Assistant unavailable", {
        description: error.message,
      });
      setIsLoading(false);
    },
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
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
    "Verify float levels",
    "View active alerts",
    "Recent transaction summary",
    "Check system status",
  ];

  return (
    <div className="fixed bottom-6 right-6 z-[999] print:hidden">
      {/* Chat Window */}
      {isOpen && (
        <Card 
          className="absolute bottom-20 right-0 w-[400px] shadow-[0_20px_50px_rgba(0,0,0,0.3)] border-none ring-1 ring-gray-200 dark:ring-slate-800 animate-in slide-in-from-bottom-5 fade-in duration-300 rounded-[2rem] overflow-hidden bg-white dark:bg-slate-950 flex flex-col"
          style={{ height: 'min(700px, calc(100vh - 120px))' }}
        >
          {/* Header */}
          <div className="p-6 bg-blue-600 text-white flex items-center justify-between shrink-0 shadow-lg">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-md shadow-inner">
                <HelpCircle className="h-6 w-6 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-[15px] font-bold tracking-tight">Limitless Junction</span>
                <span className="text-[10px] text-white/70 font-bold uppercase tracking-[0.1em]">All your agents. One hub.</span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/10 rounded-xl h-9 w-9 transition-all active:scale-90"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Messages Area */}
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth custom-scrollbar"
            style={{ scrollbarWidth: 'thin' }}
          >
            {messages.map((msg, i) => (
              <div
                key={i}
                className={cn(
                  "flex flex-col max-w-[88%] space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-300",
                  msg.role === "user"
                    ? "ml-auto items-end"
                    : "mr-auto items-start"
                )}
              >
                <div
                  className={cn(
                    "p-4 rounded-2xl text-sm font-medium leading-relaxed shadow-sm",
                    msg.role === "user"
                      ? "bg-blue-600 text-white rounded-tr-none"
                      : "bg-gray-100 dark:bg-slate-900 text-gray-800 dark:text-gray-200 rounded-tl-none border border-gray-200 dark:border-slate-800"
                  )}
                >
                  {msg.role === "assistant" ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none break-words">
                      <Streamdown>{msg.content}</Streamdown>
                    </div>
                  ) : (
                    <span className="break-words">{msg.content}</span>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex flex-col max-w-[85%] items-start animate-in fade-in">
                <div className="p-3 bg-gray-50/80 dark:bg-slate-900/80 text-gray-400 rounded-xl rounded-tl-none border border-gray-200 dark:border-slate-800 flex items-center gap-2 shadow-sm">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Processing Request...</span>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Controls */}
          <div className="flex flex-col bg-gray-50/50 dark:bg-slate-900/50 border-t border-gray-100 dark:border-slate-800">
            {/* Suggested Prompts (Scrollable list if many) */}
            {messages.length < 3 && !isLoading && (
              <div className="px-4 py-3 flex flex-wrap gap-2 overflow-x-auto">
                {suggestedPrompts.map(prompt => (
                  <button
                    key={prompt}
                    onClick={() => setInput(prompt)}
                    className="whitespace-nowrap px-3 py-1.5 rounded-full border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-[10px] font-semibold text-gray-600 hover:bg-gray-50 hover:text-blue-600 transition-all active:scale-95 shadow-sm"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}

            {/* Input Area */}
            <div className="p-4 pt-2 pb-5">
              <div className="relative group">
                <textarea
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Query system data..."
                  className="w-full bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-2xl p-4 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 resize-none min-h-[56px] max-h-[140px] transition-all font-medium text-gray-700 dark:text-gray-200 ring-offset-background placeholder:text-gray-400 group-hover:border-gray-300 dark:group-hover:border-slate-700"
                />
                <Button
                  size="icon"
                  className={cn(
                    "absolute bottom-3 right-3 h-8 w-8 rounded-xl bg-blue-600 text-white shadow-lg transition-all active:scale-90",
                    !input.trim() && "opacity-40 grayscale pointer-events-none"
                  )}
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                >
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-[8px] text-gray-400 mt-2 text-center font-bold tracking-[0.05em] uppercase opacity-60">
                Limitless Money Junction Group
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "h-14 w-14 rounded-full flex items-center justify-center text-white shadow-xl transition-all duration-300 hover:scale-105 active:scale-95",
          isOpen
            ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900"
            : "bg-blue-600"
        )}
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <div className="relative">
            <MessageSquare className="h-6 w-6" />
            <div className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-red-500 border-2 border-white shadow-sm" />
          </div>
        )}
      </button>
    </div>
  );
}
