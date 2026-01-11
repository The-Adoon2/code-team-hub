import React, { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, MessageSquare, Send, Bot, User, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";

(pdfjsLib as any).GlobalWorkerOptions.workerSrc = "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/legacy/build/pdf.worker.min.mjs";

interface Message {
  role: "user" | "assistant";
  content: string;
}

type ManualChunk = {
  page: number;
  text: string;
};

type Excerpt = {
  page: number;
  excerpt: string;
};

function normalizeForSearch(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

function scoreChunk(queryTerms: string[], chunk: ManualChunk) {
  const hay = normalizeForSearch(chunk.text);
  let score = 0;
  for (const t of queryTerms) {
    if (!t) continue;
    const occurrences = hay.split(t).length - 1;
    score += occurrences;
  }
  return score;
}

const GameManual: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [isIndexing, setIsIndexing] = useState(false);
  const [manualChunks, setManualChunks] = useState<ManualChunk[] | null>(null);

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    let cancelled = false;

    const buildIndex = async () => {
      try {
        setIsIndexing(true);

        const res = await fetch("/2026GameManual.pdf");
        if (!res.ok) throw new Error("Failed to load PDF");
        const data = await res.arrayBuffer();

        const loadingTask = (pdfjsLib as any).getDocument({ data });
        const pdf = await loadingTask.promise;

        const chunks: ManualChunk[] = [];
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          const page = await pdf.getPage(pageNum);
          const content = await page.getTextContent();
          const text = (content.items as any[])
            .map((it) => (typeof it.str === "string" ? it.str : ""))
            .join(" ")
            .replace(/\s+/g, " ")
            .trim();

          if (text) chunks.push({ page: pageNum, text });
        }

        if (!cancelled) setManualChunks(chunks);
      } catch (e) {
        console.error("PDF index error:", e);
        if (!cancelled) {
          setManualChunks([]);
          toast({
            title: "Manual search unavailable",
            description:
              e instanceof Error
                ? e.message
                : "Couldn't extract text from the PDF in this browser.",
            variant: "destructive",
          });
        }
      } finally {
        if (!cancelled) setIsIndexing(false);
      }
    };

    buildIndex();
    return () => {
      cancelled = true;
    };
  }, [toast]);

  const buildExcerpts = useMemo(() => {
    return (question: string): Excerpt[] => {
      if (!manualChunks?.length) return [];

      const q = normalizeForSearch(question);
      const terms = q.split(" ").filter((t) => t.length >= 3).slice(0, 12);
      if (!terms.length) return [];

      const scored = manualChunks
        .map((c) => ({ c, score: scoreChunk(terms, c) }))
        .filter((x) => x.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 6);

      return scored.map(({ c }) => ({
        page: c.page,
        excerpt: c.text.length > 1400 ? `${c.text.slice(0, 1400)}…` : c.text,
      }));
    };
  }, [manualChunks]);

  const invokeChat = async (userMessages: Message[], excerpts: Excerpt[]) => {
    const { data, error } = await supabase.functions.invoke("game-manual-chat", {
      body: { messages: userMessages, excerpts },
    });

    if (error) throw new Error(error.message);
    const content = (data as any)?.content as string | undefined;
    if (!content) throw new Error("AI returned no content");
    return content;
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: Message = { role: "user", content: input.trim() };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);

    try {
      const excerpts = buildExcerpts(userMsg.content);
      const assistantText = await invokeChat(updatedMessages, excerpts);
      setMessages((prev) => [...prev, { role: "assistant", content: assistantText }]);
    } catch (error) {
      console.error("Chat error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to get AI response",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">2026 Game Manual - REBUILT™</h2>
        <p className="text-muted-foreground">Read the official game manual and ask questions about it</p>
      </div>

      <Tabs defaultValue="manual" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="manual" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Manual
          </TabsTrigger>
          <TabsTrigger value="chat" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            AI Assistant
          </TabsTrigger>
        </TabsList>

        <TabsContent value="manual" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-frc-blue" />
                2026 FIRST Robotics Competition Game Manual
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="w-full h-[70vh] rounded-lg overflow-hidden border border-border">
                <iframe src="/2026GameManual.pdf" className="w-full h-full" title="2026 Game Manual" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="chat" className="mt-4">
          <Card className="h-[75vh] flex flex-col">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-frc-orange" />
                Game Manual AI Assistant
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {isIndexing
                  ? "Indexing the PDF for search (first load can take a bit)…"
                  : "Answers are pulled from matching pages in the PDF. If it’s not in the manual, it will say so."}
              </p>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col min-h-0">
              <ScrollArea className="flex-1 pr-4" ref={scrollAreaRef}>
                <div className="space-y-4 pb-4">
                  {messages.length === 0 && (
                    <div className="text-center py-12">
                      <Bot className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
                      <h3 className="font-semibold text-lg mb-2">Game Manual Assistant</h3>
                      <p className="text-muted-foreground text-sm max-w-md mx-auto">
                        Ask a question and I’ll answer using the most relevant sections of the PDF.
                      </p>
                      <div className="flex flex-wrap justify-center gap-2 mt-4">
                        {["How is scoring done?", "What are bumper rules?", "What is the match flow?", "What penalties exist?"]
                          .map((topic) => (
                            <Button
                              key={topic}
                              variant="outline"
                              size="sm"
                              onClick={() => setInput(topic)}
                            >
                              {topic}
                            </Button>
                          ))}
                      </div>
                    </div>
                  )}

                  {messages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      {message.role === "assistant" && (
                        <div className="w-8 h-8 rounded-full bg-frc-orange/20 flex items-center justify-center shrink-0">
                          <Bot className="w-4 h-4 text-frc-orange" />
                        </div>
                      )}
                      <div
                        className={`max-w-[80%] rounded-lg px-4 py-3 ${
                          message.role === "user" ? "bg-frc-blue text-white" : "bg-muted"
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      </div>
                      {message.role === "user" && (
                        <div className="w-8 h-8 rounded-full bg-frc-blue/20 flex items-center justify-center shrink-0">
                          <User className="w-4 h-4 text-frc-blue" />
                        </div>
                      )}
                    </div>
                  ))}

                  {isLoading && (
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-frc-orange/20 flex items-center justify-center shrink-0">
                        <Bot className="w-4 h-4 text-frc-orange" />
                      </div>
                      <div className="bg-muted rounded-lg px-4 py-3">
                        <Loader2 className="w-4 h-4 animate-spin" />
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>

              <div className="flex gap-2 pt-4 border-t border-border mt-auto">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Ask about the game manual…"
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button onClick={handleSend} disabled={isLoading || !input.trim()}>
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GameManual;
