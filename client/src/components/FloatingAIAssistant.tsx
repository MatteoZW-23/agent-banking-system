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
      content: `Sovereign Finance Operations Support ready. I can analyze transactions, track float levels, and summarize regional performance. How can I assist with your current session?`,
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
      const viewport = scrollRef.current.querySelector(
        "[data-radix-scroll-area-viewport]"
      ) as HTMLDivElement;
      if (viewport) {
        viewport.scrollTo({
          top: viewport.scrollHeight,
          behavior: "smooth",
        });
      }
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
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end gap-3 print:hidden">
      {/* Chat Window */}
      {isOpen && (
        <Card className="w-[380px] h-[580px] flex flex-col shadow-2xl border-gray-200 dark:border-slate-800 animate-in slide-in-from-bottom-5 fade-in duration-300 rounded-2xl overflow-hidden bg-white dark:bg-slate-950">
          {/* Header */}
          <div className="p-5 bg-blue-600 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-white/20 flex items-center justify-center backdrop-blur-md">
                <HelpCircle className="h-5 w-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold tracking-tight">Sovereign Assistant</span>
                <span className="text-[10px] text-white/70 font-medium uppercase tracking-wide">Security Operations Intel</span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/10 rounded-lg h-8 w-8 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Messages Area */}
          <ScrollArea ref={scrollRef} className="flex-1 p-5">
            <div className="space-y-4">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex flex-col max-w-[85%] space-y-1.5 animate-in fade-in slide-in-from-bottom-1 duration-300",
                    msg.role === "user"
                      ? "ml-auto items-end"
                      : "mr-auto items-start"
                  )}
                >
                  <div
                    className={cn(
                      "p-3.5 rounded-2xl text-sm font-medium leading-relaxed",
                      msg.role === "user"
                        ? "bg-blue-600 text-white rounded-tr-none"
                        : "bg-gray-100 dark:bg-slate-900 text-gray-800 dark:text-gray-200 rounded-tl-none border border-gray-200 dark:border-slate-800"
                    )}
                  >
                    {msg.role === "assistant" ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <Streamdown>{msg.content}</Streamdown>
                      </div>
                    ) : (
                      msg.content
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex flex-col max-w-[85%] items-start animate-in fade-in">
                  <div className="p-3 bg-gray-50 dark:bg-slate-900 text-gray-400 rounded-xl rounded-tl-none border border-gray-100 dark:border-slate-800 flex items-center gap-2">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Processing...</span>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Suggested Prompts */}
          {messages.length < 3 && !isLoading && (
            <div className="px-5 pb-3 flex flex-wrap gap-2">
              {suggestedPrompts.map(prompt => (
                <button
                  key={prompt}
                  onClick={() => setInput(prompt)}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-[10px] font-semibold text-gray-600 hover:bg-gray-50 hover:text-blue-600 transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}

          {/* Input Area */}
          <div className="p-5 bg-gray-50/50 dark:bg-slate-900/50 border-t border-gray-100 dark:border-slate-800">
            <div className="relative">
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Ask a question..."
                className="w-full bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl p-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 resize-none min-h-[54px] max-h-[120px] transition-all font-medium text-gray-700 dark:text-gray-200"
              />
              <Button
                size="icon"
                className={cn(
                  "absolute bottom-2 right-2 h-7 w-7 rounded-lg bg-blue-600 text-white shadow-sm transition-all",
                  !input.trim() && "opacity-50 pointer-events-none"
                )}
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
              >
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
            <p className="text-[9px] text-gray-400 mt-3 text-center font-bold tracking-tight uppercase">
              Sovereign Finance Network Support
            </p>
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
