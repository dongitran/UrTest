import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Send, LoaderCircle, User, MessageSquare, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { getToken } from "@/lib/keycloak";
import { toast } from "sonner";
import axios from "axios";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

export default function CommentPanel({ projectId, testSuiteId }) {
  const [comments, setComments] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [deletingIds, setDeletingIds] = useState(new Set());

  const fetchComments = async () => {
    try {
      setIsFetching(true);
      const token = getToken();
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/comment`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          params: {
            projectId,
            testSuiteId,
          },
        }
      );

      setComments(response.data.comments || []);
    } catch (error) {
      console.error("Error fetching comments:", error);
      toast.error("Failed to fetch comments");
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    if (projectId && testSuiteId) {
      fetchComments();
    }
  }, [projectId, testSuiteId]);

  const sendComment = async () => {
    if (!input.trim() || isLoading) return;

    try {
      setIsLoading(true);
      const token = getToken();
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/comment`,
        {
          projectId,
          testSuiteId,
          message: input.trim(),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status === 200) {
        setInput("");
        fetchComments();
        toast.success("Comment added successfully");
      }
    } catch (error) {
      console.error("Error sending comment:", error);
      toast.error("Failed to send comment");
    } finally {
      setIsLoading(false);
    }
  };

  const deleteComment = async (commentId) => {
    try {
      setDeletingIds((prev) => new Set(prev).add(commentId));
      const token = getToken();
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL}/api/comment/${commentId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status === 200 || response.status === 204) {
        fetchComments();
        toast.success("Comment deleted successfully");
      }
    } catch (error) {
      console.error("Error deleting comment:", error);
      toast.error("Failed to delete comment");
    } finally {
      setDeletingIds((prev) => {
        const next = new Set(prev);
        next.delete(commentId);
        return next;
      });
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendComment();
    }
  };

  const formatDateTime = (dateString) => {
    try {
      return dayjs
        .utc(dateString)
        .tz("Asia/Ho_Chi_Minh")
        .format("DD/MM/YYYY HH:mm");
    } catch (error) {
      return "Invalid date";
    }
  };

  const getInitials = (email) => {
    return email?.charAt(0).toUpperCase() || "U";
  };

  return (
    <Card className="h-full flex flex-col bg-card border-border">
      <CardContent className="flex-1 flex flex-col p-4 overflow-hidden">
        <div className="flex-1 overflow-y-auto space-y-4 mb-4 max-h-[calc(100vh-280px)]">
          {isFetching ? (
            <div className="flex justify-center items-center h-20">
              <LoaderCircle className="h-6 w-6 animate-spin text-blue-500" />
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center text-muted-foreground py-8 flex flex-col items-center gap-2">
              <MessageSquare className="h-8 w-8 text-muted-foreground/50" />
              <p>No comments yet. Be the first to comment!</p>
            </div>
          ) : (
            comments.map((comment, index) => (
              <div
                key={index}
                className="group hover:bg-secondary/80 transition-colors duration-200 p-4 rounded-lg border border-border/50 bg-secondary/60"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-300 font-medium">
                    {getInitials(comment.email)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col mb-1">
                      <span className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors">
                        {comment.email}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDateTime(comment.createdAt)}
                      </span>
                    </div>
                    <p className="text-foreground text-sm leading-relaxed break-words">
                      {comment.message}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                    onClick={() => deleteComment(comment.id)}
                    disabled={deletingIds.has(comment.id)}
                  >
                    {deletingIds.has(comment.id) ? (
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="flex gap-2 border-t border-border pt-4">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Add a comment..."
            disabled={isLoading}
            className="flex-1 bg-background border-input text-foreground placeholder:text-muted-foreground"
          />
          <Button
            onClick={sendComment}
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
