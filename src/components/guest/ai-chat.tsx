"use client";

import { useRef, useState } from "react";
import { Bot, Loader2, Send, Sparkles } from "lucide-react";
import type { Locale } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  text: string;
  section?: { slug: string; title: string } | null;
  unsure?: boolean;
}

export function AiChat({
  slug,
  locale,
  labels,
}: {
  slug: string;
  locale: Locale;
  labels: Record<string, string>;
}) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const sessionId = useRef(
    typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `s-${Date.now()}`,
  );

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const question = input.trim();
    if (!question || loading) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", text: question }]);
    setLoading(true);
    try {
      const res = await fetch(`/api/g/${slug}/ask`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question, locale, sessionId: sessionId.current }),
      });
      const data = await res.json();
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          text: data.answer ?? labels.contact_host,
          section: data.section,
          unsure: data.canAnswer === false,
        },
      ]);
    } catch {
      setMessages((m) => [...m, { role: "assistant", text: labels.contact_host, unsure: true }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-medium text-primary-foreground shadow-lg"
          aria-label={labels.ask_assistant}
        >
          <Sparkles className="h-4 w-4" />
          <span className="hidden sm:inline">{labels.ask_assistant}</span>
        </button>
      </SheetTrigger>
      <SheetContent side="bottom" className="mx-auto flex h-[80vh] max-w-2xl flex-col rounded-t-2xl">
        <SheetHeader className="text-left">
          <SheetTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" /> {labels.ask_assistant}
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 space-y-3 overflow-y-auto py-3">
          {messages.length === 0 && (
            <div className="rounded-xl bg-muted/50 p-4 text-sm text-muted-foreground">
              {labels.ask_placeholder}
            </div>
          )}
          {messages.map((m, i) => (
            <div
              key={i}
              className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}
            >
              <div
                className={cn(
                  "max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm",
                  m.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : m.unsure
                      ? "border border-warning/40 bg-warning/10"
                      : "bg-muted",
                )}
              >
                {m.text}
                {m.section && (
                  <a
                    href={`#${m.section.slug}`}
                    onClick={() => setOpen(false)}
                    className="mt-2 block text-xs font-medium text-primary underline"
                  >
                    → {m.section.title}
                  </a>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> {labels.loading}
            </div>
          )}
        </div>

        <form onSubmit={send} className="flex gap-2 border-t pt-3">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={labels.ask_placeholder}
            autoFocus
          />
          <Button type="submit" size="icon" disabled={loading}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
