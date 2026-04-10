import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Loader2, Send, User, MessageSquare } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Streamdown } from "streamdown";

export type Message = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type AIChatBoxProps = {
  messages: Message[];
  onSendMessage: (content: string) => void;
  isLoading?: boolean;
  placeholder?: string;
  className?: string;
  height?: string | number;
  emptyStateMessage?: string;
  suggestedPrompts?: string[];
};

export function AIChatBox({
  messages,
  onSendMessage,
  isLoading = false,
  placeholder = "Message support...",
  className,
  height = "560px",
  emptyStateMessage = "How can we help you today?",
  suggestedPrompts,
}: AIChatBoxProps) {
  const [input, setInput] = useState("");
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputAreaRef = useRef<HTMLFormElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const displayMessages = messages.filter(msg => msg.role !== "system");
  const [minHeightForLastMessage, setMinHeightForLastMessage] = useState(0);

  useEffect(() => {
    if (containerRef.current && inputAreaRef.current) {
      const containerHeight = containerRef.current.offsetHeight;
      const inputHeight = inputAreaRef.current.offsetHeight;
      const scrollAreaHeight = containerHeight - inputHeight;
      const calculatedHeight = scrollAreaHeight - 32 - 56;
      setMinHeightForLastMessage(Math.max(0, calculatedHeight));
    }
  }, []);

  const scrollToBottom = () => {
    const viewport = scrollAreaRef.current?.querySelector(
      "[data-radix-scroll-area-viewport]"
    ) as HTMLDivElement;

    if (viewport) {
      requestAnimationFrame(() => {
        viewport.scrollTo({
          top: viewport.scrollHeight,
          behavior: "smooth",
        });
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedInput = input.trim();
    if (!trimmedInput || isLoading) return;

    onSendMessage(trimmedInput);
    setInput("");
    scrollToBottom();
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "flex flex-col bg-white dark:bg-slate-950 text-gray-900 dark:text-gray-100 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm overflow-hidden",
        className
      )}
      style={{ height }}
    >
      <div ref={scrollAreaRef} className="flex-1 overflow-hidden">
        {displayMessages.length === 0 ? (
          <div className="flex h-full flex-col p-6">
            <div className="flex flex-1 flex-col items-center justify-center gap-5 text-gray-400">
              <div className="flex flex-col items-center gap-3">
                <MessageSquare className="size-10 opacity-20" />
                <p className="text-sm font-medium">{emptyStateMessage}</p>
              </div>

              {suggestedPrompts && suggestedPrompts.length > 0 && (
                <div className="flex max-w-2xl flex-wrap justify-center gap-2">
                  {suggestedPrompts.map((prompt, index) => (
                    <button
                      key={index}
                      onClick={() => onSendMessage(prompt)}
                      disabled={isLoading}
                      className="rounded-lg border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-1.5 text-xs font-medium transition-colors hover:bg-gray-50 hover:text-blue-600 disabled:opacity-50"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <ScrollArea className="h-full">
            <div className="flex flex-col space-y-4 p-5">
              {displayMessages.map((message, index) => {
                const isLastMessage = index === displayMessages.length - 1;
                const shouldApplyMinHeight = isLastMessage && !isLoading && minHeightForLastMessage > 0;

                return (
                  <div
                    key={index}
                    className={cn(
                      "flex gap-3",
                      message.role === "user" ? "justify-end items-start" : "justify-start items-start"
                    )}
                    style={shouldApplyMinHeight ? { minHeight: `${minHeightForLastMessage}px` } : undefined}
                  >
                    {message.role === "assistant" && (
                      <div className="size-8 shrink-0 mt-0.5 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                        <MessageSquare className="size-4 text-blue-600" />
                      </div>
                    )}

                    <div
                      className={cn(
                        "max-w-[85%] rounded-xl px-4 py-2.5 shadow-sm text-sm leading-relaxed",
                        message.role === "user"
                          ? "bg-blue-600 text-white rounded-tr-none"
                          : "bg-gray-100 dark:bg-slate-900 text-gray-800 dark:text-gray-200 rounded-tl-none border border-gray-200 dark:border-slate-800"
                      )}
                    >
                      {message.role === "assistant" ? (
                        <div className="prose prose-sm dark:prose-invert max-w-none">
                          <Streamdown>{message.content}</Streamdown>
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap">{message.content}</p>
                      )}
                    </div>

                    {message.role === "user" && (
                      <div className="size-8 shrink-0 mt-0.5 rounded-lg bg-gray-100 dark:bg-slate-800 flex items-center justify-center">
                        <User className="size-4 text-gray-500" />
                      </div>
                    )}
                  </div>
                );
              })}

              {isLoading && (
                <div className="flex items-start gap-3" style={minHeightForLastMessage > 0 ? { minHeight: `${minHeightForLastMessage}px` } : undefined}>
                  <div className="size-8 shrink-0 mt-0.5 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                    <MessageSquare className="size-4 text-blue-600" />
                  </div>
                  <div className="rounded-xl bg-gray-100 dark:bg-slate-900 px-4 py-2.5 border border-gray-200 dark:border-slate-800">
                    <Loader2 className="size-4 animate-spin text-gray-400" />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        )}
      </div>

      <form
        ref={inputAreaRef}
        onSubmit={handleSubmit}
        className="flex gap-2 p-4 border-t border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50 items-end"
      >
        <Textarea
          ref={textareaRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1 max-h-32 resize-none min-h-[40px] rounded-lg border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm"
          rows={1}
        />
        <Button
          type="submit"
          size="icon"
          disabled={!input.trim() || isLoading}
          className="shrink-0 h-10 w-10 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm"
        >
          {isLoading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Send className="size-4" />
          )}
        </Button>
      </form>
    </div>
  );
}
