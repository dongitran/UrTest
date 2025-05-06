import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Send, LoaderCircle } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { getToken } from "@/lib/keycloak";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { useSearchParams } from "next/navigation";

export default function ChatPanel() {
  const searchParams = useSearchParams();
  const testSuiteId = searchParams.get("testSuiteId");

  const getChatKey = () => `chat_messages_${testSuiteId || "new"}`;

  const [messages, setMessages] = useState(() => {
    if (typeof window !== "undefined") {
      const savedMessages = sessionStorage.getItem(getChatKey());
      return savedMessages ? JSON.parse(savedMessages) : [];
    }
    return [];
  });

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showProcessingMessage, setShowProcessingMessage] = useState(false);
  const [processingMessage, setProcessingMessage] = useState("");
  const messagesEndRef = useRef(null);

  const processingMessages = [
    "Analyzing your request...",
    "Gathering information...",
    "Processing data...",
    "Preparing response...",
    "Checking information...",
    "Fetching data...",
    "UrTest is thinking...",
    "Reviewing context...",
    "Analyzing question...",
    "Finding the best answer...",
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, processingMessage]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem(getChatKey(), JSON.stringify(messages));
    }
  }, [messages, testSuiteId]);

  useEffect(() => {
    let interval;
    let messageIndex = 0;

    if (showProcessingMessage) {
      setProcessingMessage(processingMessages[messageIndex]);
      messageIndex = 1;

      interval = setInterval(() => {
        setProcessingMessage(
          processingMessages[messageIndex % processingMessages.length]
        );
        messageIndex++;
      }, 1500);
    } else {
      setProcessingMessage("");
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [showProcessingMessage]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setShowProcessingMessage(true);

    try {
      const token = getToken();
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/ai/chat`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messages: [userMessage],
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to get AI response");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let aiMessage = { role: "assistant", content: "" };
      setMessages((prev) => [...prev, aiMessage]);
      let firstContentReceived = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") {
              break;
            }
            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                if (!firstContentReceived) {
                  firstContentReceived = true;
                  setShowProcessingMessage(false);
                }

                aiMessage.content += parsed.content;
                setMessages((prev) => {
                  const newMessages = [...prev];
                  newMessages[newMessages.length - 1] = { ...aiMessage };
                  return newMessages;
                });
              }
            } catch (e) {
              console.error("Failed to parse SSE data:", e);
            }
          }
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message to AI");
    } finally {
      setIsLoading(false);
      setShowProcessingMessage(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <Card className="h-full flex flex-col bg-card border-border">
      <CardContent className="flex-1 flex flex-col p-4 overflow-hidden">
        <div className="flex-1 overflow-y-auto space-y-4 mb-4 max-h-[calc(100vh-280px)]">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`p-3 rounded-lg ${
                message.role === "user"
                  ? "bg-blue-100/50 dark:bg-blue-900/30 text-foreground ml-auto max-w-[80%]"
                  : "bg-secondary/50 text-foreground mr-auto max-w-[80%]"
              }`}
            >
              <div className="font-semibold text-sm mb-1 text-foreground">
                {message.role === "user" ? "You" : "UrTest"}
              </div>
              <div className="whitespace-pre-wrap text-foreground prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown
                  components={{
                    p: ({ children }) => (
                      <p className="mb-2 text-foreground">{children}</p>
                    ),
                    strong: ({ children }) => (
                      <strong className="font-semibold text-foreground">
                        {children}
                      </strong>
                    ),
                    em: ({ children }) => (
                      <em className="italic text-foreground">{children}</em>
                    ),
                    code: ({ children }) => (
                      <code className="bg-secondary/50 px-1 rounded text-sm text-foreground font-mono">
                        {children}
                      </code>
                    ),
                    h1: ({ children }) => (
                      <h1 className="text-xl font-bold mb-2 text-foreground">
                        {children}
                      </h1>
                    ),
                    h2: ({ children }) => (
                      <h2 className="text-lg font-bold mb-2 text-foreground">
                        {children}
                      </h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="text-md font-bold mb-2 text-foreground">
                        {children}
                      </h3>
                    ),
                    ul: ({ children }) => (
                      <ul className="list-disc pl-5 mb-2 text-foreground">
                        {children}
                      </ul>
                    ),
                    ol: ({ children }) => (
                      <ol className="list-decimal pl-5 mb-2 text-foreground">
                        {children}
                      </ol>
                    ),
                    li: ({ children }) => (
                      <li className="mb-1 text-foreground">{children}</li>
                    ),
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              </div>
            </div>
          ))}

          {showProcessingMessage && processingMessage && (
            <div className="p-3 rounded-lg bg-secondary/30 text-foreground/80 mr-auto max-w-[80%] animate-pulse">
              <div className="font-semibold text-sm mb-1 text-foreground/80 flex items-center gap-2">
                <LoaderCircle className="h-4 w-4 animate-spin" />
                UrTest
              </div>
              <div className="text-sm italic">{processingMessage}</div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
        <div className="flex gap-2 border-t border-border pt-4">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about your test case..."
            disabled={isLoading}
            className="flex-1 bg-background border-input text-foreground placeholder:text-muted-foreground"
          />
          <Button
            onClick={sendMessage}
            disabled={isLoading || !input.trim()}
            size="sm"
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {isLoading ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
