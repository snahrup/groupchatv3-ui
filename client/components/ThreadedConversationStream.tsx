import { useState, useEffect, useRef } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ThreadedMessage {
  id: string;
  parentId?: string; // For threading
  modelId: string;
  modelName: string;
  modelColor: "gpt4" | "claude" | "gemini" | "user";
  content: string;
  type: "message" | "thinking" | "interruption" | "reaction" | "sub-response";
  timestamp: Date;
  isComplete: boolean;
  isTyping?: boolean;
  referencesTo?: string[];
  confidence?: number;
  reasoning?: string;
  isApproved?: boolean; // For sub-responses
  replies?: ThreadedMessage[]; // Child messages
  depth?: number; // Threading depth
}

interface ThreadedConversationStreamProps {
  messages: ThreadedMessage[];
  activeModels: string[];
  isProcessing: boolean;
  onApproveSubResponse: (messageId: string) => void;
  onRejectSubResponse: (messageId: string) => void;
  className?: string;
}

const ModelAvatar = ({
  modelId,
  modelColor,
  modelName,
  status = "idle",
  size = "default",
}: {
  modelId: string;
  modelColor: string;
  modelName: string;
  status?: "idle" | "thinking" | "speaking" | "interrupted";
  size?: "xs" | "sm" | "default";
}) => {
  const sizeClasses = {
    xs: "w-4 h-4",
    sm: "w-6 h-6",
    default: "w-8 h-8",
  }[size];

  return (
    <div className="relative">
      <Avatar
        className={cn(
          sizeClasses,
          "border-2 transition-all duration-300",
          status === "speaking"
            ? `border-${modelColor} ring-2 ring-${modelColor}/30 animate-pulse`
            : "",
          status === "thinking"
            ? `border-${modelColor} ring-2 ring-${modelColor}/50 animate-thinking-pulse`
            : "",
          status === "interrupted"
            ? "border-destructive ring-2 ring-destructive/30"
            : "",
          "border-muted",
        )}
      >
        <AvatarImage src={`/api/placeholder/40/40`} alt={modelName} />
        <AvatarFallback
          className={cn(
            "text-xs font-semibold",
            `bg-${modelColor}/10 text-${modelColor}`,
          )}
        >
          {modelId.toUpperCase().slice(0, 2)}
        </AvatarFallback>
      </Avatar>

      {/* Floating status indicator */}
      {status === "thinking" && (
        <div className="absolute -top-2 -right-2">
          <div className="flex space-x-1">
            <div
              className={`w-1 h-1 rounded-full bg-${modelColor} animate-bounce`}
            />
            <div
              className={`w-1 h-1 rounded-full bg-${modelColor} animate-bounce`}
              style={{ animationDelay: "0.1s" }}
            />
            <div
              className={`w-1 h-1 rounded-full bg-${modelColor} animate-bounce`}
              style={{ animationDelay: "0.2s" }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

const TypingBubble = ({
  message,
  depth = 0,
}: {
  message: ThreadedMessage;
  depth?: number;
}) => {
  const [dots, setDots] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className={cn(
        "flex items-start space-x-2 animate-slide-in-right",
        depth > 0 ? "ml-8 border-l-2 border-glass-border pl-4" : "",
      )}
      style={{ marginLeft: depth * 32 }}
    >
      <ModelAvatar
        modelId={message.modelId}
        modelColor={message.modelColor}
        modelName={message.modelName}
        status="thinking"
        size={depth > 0 ? "sm" : "default"}
      />
      <div
        className={cn(
          "flex-1 p-3 rounded-2xl transition-all duration-300 animate-thinking-pulse",
          `bg-${message.modelColor}/5 border border-${message.modelColor}/20`,
        )}
      >
        <div className="flex items-center space-x-2 mb-1">
          <span
            className={cn("text-xs font-medium", `text-${message.modelColor}`)}
          >
            {message.modelName}
          </span>
          <div className="flex space-x-1">
            <div
              className={`w-1 h-1 rounded-full bg-${message.modelColor} animate-ping`}
            />
            <div
              className={`w-1 h-1 rounded-full bg-${message.modelColor} animate-ping`}
              style={{ animationDelay: "0.3s" }}
            />
            <div
              className={`w-1 h-1 rounded-full bg-${message.modelColor} animate-ping`}
              style={{ animationDelay: "0.6s" }}
            />
          </div>
        </div>
        <div className="text-xs text-muted-foreground italic">
          💭 {message.reasoning || `Thinking${dots}`}
        </div>
      </div>
    </div>
  );
};

const MessageBubble = ({
  message,
  onApproveSubResponse,
  onRejectSubResponse,
  depth = 0,
  showApprovalButtons = false,
}: {
  message: ThreadedMessage;
  onApproveSubResponse: (messageId: string) => void;
  onRejectSubResponse: (messageId: string) => void;
  depth?: number;
  showApprovalButtons?: boolean;
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showFullReasoning, setShowFullReasoning] = useState(false);

  const isSubResponse = message.type === "sub-response";
  const isUser = message.modelColor === "user";

  return (
    <div className="space-y-2">
      <div
        className={cn(
          "group flex items-start space-x-2 transition-all duration-300",
          isSubResponse ? "animate-slide-in-right" : "animate-slide-in-left",
          depth > 0 ? "border-l-2 border-glass-border pl-4" : "",
          isSubResponse && !message.isApproved ? "opacity-75" : "",
        )}
        style={{ marginLeft: depth * 32 }}
      >
        <ModelAvatar
          modelId={message.modelId}
          modelColor={message.modelColor}
          modelName={message.modelName}
          status={message.isTyping ? "speaking" : "idle"}
          size={depth > 0 ? "sm" : "default"}
        />

        <div className="flex-1 space-y-2">
          <div
            className={cn(
              "relative p-3 rounded-2xl transition-all duration-300 hover:shadow-md group-hover:scale-[1.02]",
              isUser
                ? "bg-background border border-border ml-8"
                : `bg-${message.modelColor}/5 border border-${message.modelColor}/20`,
              message.type === "interruption"
                ? "border-l-4 border-l-destructive shadow-lg"
                : "",
              !message.isComplete ? "animate-pulse" : "",
              isSubResponse && !message.isApproved
                ? "ring-2 ring-yellow-400/50 bg-yellow-50/50"
                : "",
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <span
                  className={cn(
                    "font-medium text-sm",
                    isUser ? "text-foreground" : `text-${message.modelColor}`,
                  )}
                >
                  {message.modelName}
                </span>

                {message.type === "interruption" && (
                  <Badge
                    variant="destructive"
                    className="text-xs animate-bounce"
                  >
                    interrupted!
                  </Badge>
                )}

                {isSubResponse && !message.isApproved && (
                  <Badge
                    variant="outline"
                    className="text-xs border-yellow-400 text-yellow-600"
                  >
                    pending approval
                  </Badge>
                )}

                {message.confidence && (
                  <Badge variant="secondary" className="text-xs">
                    {Math.round(message.confidence * 100)}% confident
                  </Badge>
                )}

                <span className="text-xs text-muted-foreground">
                  {message.timestamp.toLocaleTimeString()}
                </span>
              </div>

              {/* Approval buttons for sub-responses */}
              {showApprovalButtons && isSubResponse && !message.isApproved && (
                <div className="flex space-x-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-6 px-2 text-xs bg-green-50 hover:bg-green-100 border-green-200"
                    onClick={() => onApproveSubResponse(message.id)}
                  >
                    ✓ Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-6 px-2 text-xs bg-red-50 hover:bg-red-100 border-red-200"
                    onClick={() => onRejectSubResponse(message.id)}
                  >
                    ✕ Reject
                  </Button>
                </div>
              )}
            </div>

            {/* Message Content */}
            <div className="text-sm leading-relaxed">
              {message.content}
              {message.isTyping && (
                <span className="inline-block w-2 h-4 bg-current animate-blink ml-1" />
              )}
            </div>

            {/* Reference connections */}
            {message.referencesTo && message.referencesTo.length > 0 && (
              <div className="flex items-center space-x-2 mt-2 text-xs text-muted-foreground">
                <svg
                  className="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.102m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                  />
                </svg>
                <span>Replying to previous message</span>
              </div>
            )}

            {/* Reasoning toggle */}
            {message.reasoning && message.type === "message" && (
              <button
                className="mt-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setShowFullReasoning(!showFullReasoning)}
              >
                💭 {showFullReasoning ? "Hide" : "Show"} reasoning process
              </button>
            )}
          </div>

          {/* Expanded reasoning */}
          {showFullReasoning && message.reasoning && (
            <div className="ml-4 p-3 text-xs text-muted-foreground bg-background/50 rounded-lg border-l-2 border-synapse-idle animate-slide-in-right">
              {message.reasoning}
            </div>
          )}
        </div>
      </div>

      {/* Nested replies */}
      {message.replies && message.replies.length > 0 && isExpanded && (
        <div className="space-y-2">
          {message.replies.map((reply) => (
            <MessageBubble
              key={reply.id}
              message={reply}
              onApproveSubResponse={onApproveSubResponse}
              onRejectSubResponse={onRejectSubResponse}
              depth={depth + 1}
              showApprovalButtons={reply.type === "sub-response"}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export function ThreadedConversationStream({
  messages,
  activeModels,
  isProcessing,
  onApproveSubResponse,
  onRejectSubResponse,
  className,
}: ThreadedConversationStreamProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [typingMessages, setTypingMessages] = useState<ThreadedMessage[]>([]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingMessages]);

  // Build message tree
  const buildMessageTree = (messages: ThreadedMessage[]): ThreadedMessage[] => {
    const messageMap = new Map<string, ThreadedMessage>();
    const rootMessages: ThreadedMessage[] = [];

    // Create a map of all messages
    messages.forEach((msg) => {
      messageMap.set(msg.id, { ...msg, replies: [] });
    });

    // Build the tree structure
    messages.forEach((msg) => {
      const messageWithReplies = messageMap.get(msg.id)!;

      if (msg.parentId) {
        const parent = messageMap.get(msg.parentId);
        if (parent) {
          parent.replies!.push(messageWithReplies);
        }
      } else {
        rootMessages.push(messageWithReplies);
      }
    });

    return rootMessages;
  };

  const messageTree = buildMessageTree([...messages, ...typingMessages]);

  return (
    <div className={cn("glass-strong rounded-xl overflow-hidden", className)}>
      {/* Header */}
      <div className="p-4 border-b border-glass-border bg-background/30">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-foreground">
              Threaded AI Collaboration
            </h3>
            <p className="text-sm text-muted-foreground">
              Natural conversation flow with sub-threads and approval system
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Badge
              variant="outline"
              className="bg-synapse-active/10 text-synapse-active border-synapse-active/30"
            >
              <div className="w-2 h-2 bg-synapse-active rounded-full mr-2 animate-pulse" />
              {activeModels.length} AIs active
            </Badge>
          </div>
        </div>
      </div>

      {/* Conversation Stream */}
      <div className="h-96 overflow-y-auto p-4 space-y-4">
        {messageTree.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 mx-auto bg-synapse-idle/20 rounded-full flex items-center justify-center animate-float">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>
              <p>Start a conversation to see natural AI collaboration</p>
              <p className="text-xs">
                AIs will respond, create sub-threads, and build on each other's
                ideas
              </p>
            </div>
          </div>
        ) : (
          messageTree.map((message) => {
            return (
              <div key={message.id}>
                {message.type === "thinking" ? (
                  <TypingBubble message={message} depth={message.depth || 0} />
                ) : (
                  <MessageBubble
                    message={message}
                    onApproveSubResponse={onApproveSubResponse}
                    onRejectSubResponse={onRejectSubResponse}
                    depth={message.depth || 0}
                    showApprovalButtons={true}
                  />
                )}
              </div>
            );
          })
        )}

        {/* Processing indicator */}
        {isProcessing && (
          <div className="flex items-center justify-center py-4">
            <div className="flex items-center space-x-2 text-synapse-active">
              <div className="w-2 h-2 bg-synapse-active rounded-full animate-bounce" />
              <div
                className="w-2 h-2 bg-synapse-active rounded-full animate-bounce"
                style={{ animationDelay: "0.1s" }}
              />
              <div
                className="w-2 h-2 bg-synapse-active rounded-full animate-bounce"
                style={{ animationDelay: "0.2s" }}
              />
              <span className="text-sm font-medium ml-2">
                Natural conversation flowing...
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Stats */}
      <div className="p-4 border-t border-glass-border bg-background/30">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            💡 Sub-responses appear below messages • Approve to promote to main
            thread
          </span>
          <div className="flex space-x-4">
            <span>
              {messages.filter((m) => m.type === "message").length} main
              messages
            </span>
            <span>
              {messages.filter((m) => m.type === "sub-response").length}{" "}
              sub-responses
            </span>
            <span>{messages.filter((m) => m.isApproved).length} approved</span>
          </div>
        </div>
      </div>
    </div>
  );
}
