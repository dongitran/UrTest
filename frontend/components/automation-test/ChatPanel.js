import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Send, LoaderCircle } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { getToken } from "@/lib/keycloak";
import { toast } from "sonner";
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

  const formatMessage = (content) => {
    const formattedContent = content
      .split("```")
      .map((part, index) => {
        if (index % 2 === 1) {
          return `<div style="background-color: rgba(0,0,0,0.1); padding: 8px; border-radius: 4px; overflow-x: auto; max-width: 100%; font-family: monospace; white-space: pre; margin: 8px 0;">${part}</div>`;
        }

        const withInlineCode = part.replace(
          /`([^`]+)`/g,
          '<code style="background-color: rgba(0,0,0,0.1); padding: 2px 4px; border-radius: 3px; font-family: monospace; white-space: pre;">${1}</code>'
        );

        return withInlineCode
          .split("\n")
          .map((line) => {
            const leadingSpaces = line.match(/^(\s*)/)[1].length;
            if (leadingSpaces > 0) {
              const spaces = "&nbsp;".repeat(leadingSpaces);

              return spaces + line.substring(leadingSpaces);
            }
            return line;
          })
          .join("<br>");
      })
      .join("");

    return formattedContent;
  };

  return (
    <Card className="h-full flex flex-col bg-card border-border">
      <CardContent
        className="flex-1 flex flex-col p-4 overflow-hidden"
        style={{ width: "100%" }}
      >
        <div
          className="flex-1 overflow-y-auto mb-4"
          style={{
            maxHeight: "calc(100vh - 280px)",
            width: "100%",
            overflowX: "hidden",
          }}
        >
          <div className="space-y-4" style={{ width: "100%" }}>
            {messages.map((message, index) => (
              <div
                key={index}
                style={{
                  marginTop: "16px",
                  maxWidth: "100%",
                  width: "100%",
                }}
              >
                <div
                  style={{
                    padding: "12px",
                    borderRadius: "8px",
                    maxWidth: "80%",
                    marginLeft: message.role === "user" ? "auto" : "0",
                    marginRight: message.role === "assistant" ? "auto" : "0",
                    backgroundColor:
                      message.role === "user"
                        ? "rgba(59, 130, 246, 0.1)"
                        : "rgba(107, 114, 128, 0.1)",
                    overflowWrap: "break-word",
                    wordBreak: "break-word",
                  }}
                >
                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: "0.875rem",
                      marginBottom: "4px",
                    }}
                  >
                    {message.role === "user" ? "You" : "UrTest"}
                  </div>
                  <div
                    style={{
                      width: "100%",
                      maxWidth: "100%",
                      overflowX: "auto",
                      fontSize: "0.75rem",
                    }}
                    dangerouslySetInnerHTML={{
                      __html: formatMessage(message.content),
                    }}
                  />
                </div>
              </div>
            ))}

            {showProcessingMessage && processingMessage && (
              <div
                style={{
                  padding: "12px",
                  borderRadius: "8px",
                  backgroundColor: "rgba(107, 114, 128, 0.1)",
                  marginRight: "auto",
                  maxWidth: "80%",
                  marginTop: "16px",
                  animation: "pulse 2s infinite",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    fontWeight: 600,
                    fontSize: "0.875rem",
                    marginBottom: "4px",
                  }}
                >
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  UrTest
                </div>
                <div className="text-sm italic">{processingMessage}</div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
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
