import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { AIModel } from "./AIModelPanel";

interface ExportToolsProps {
  models: AIModel[];
  sessionData: {
    startTime: Date;
    messageCount: number;
    duration: string;
  };
  onExport: (format: string, options: any) => void;
  onSaveConversation: () => void;
  onLoadConversation: () => void;
  onClearAll: () => void;
  className?: string;
}

export function ExportTools({
  models,
  sessionData,
  onExport,
  onSaveConversation,
  onLoadConversation,
  onClearAll,
  className,
}: ExportToolsProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (format: string, options = {}) => {
    setIsExporting(true);
    try {
      await onExport(format, options);
    } finally {
      setIsExporting(false);
    }
  };

  const getTotalMessages = () => {
    return models.reduce((total, model) => total + model.messages.length, 0);
  };

  const getActiveModels = () => {
    return models.filter((model) => model.status !== "inactive").length;
  };

  return (
    <div className={cn("glass-strong rounded-xl p-6 space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Session Manager
          </h2>
          <p className="text-sm text-muted-foreground">
            Export, save, and manage conversations
          </p>
        </div>

        <Badge
          variant="outline"
          className="bg-synapse-active/10 text-synapse-active border-synapse-active/30"
        >
          {sessionData.duration}
        </Badge>
      </div>

      {/* Session Stats */}
      <div className="grid grid-cols-3 gap-4 p-4 rounded-lg bg-background/30 border border-glass-border">
        <div className="text-center">
          <div className="text-lg font-bold text-foreground">
            {getTotalMessages()}
          </div>
          <div className="text-xs text-muted-foreground">Messages</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-foreground">
            {getActiveModels()}
          </div>
          <div className="text-xs text-muted-foreground">Active AIs</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-foreground">
            {sessionData.messageCount}
          </div>
          <div className="text-xs text-muted-foreground">User Inputs</div>
        </div>
      </div>

      {/* Export Options */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-foreground">Export Options</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {/* Export Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="glass border-glass-border justify-between"
                disabled={isExporting || getTotalMessages() === 0}
              >
                <div className="flex items-center space-x-2">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2z"
                    />
                  </svg>
                  <span>Export</span>
                </div>
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="glass-strong border-glass-border">
              <DropdownMenuItem
                onClick={() => handleExport("markdown")}
                className="cursor-pointer"
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Markdown Report
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleExport("json")}
                className="cursor-pointer"
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                  />
                </svg>
                JSON Data
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleExport("pdf")}
                className="cursor-pointer"
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
                PDF Report
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => handleExport("csv", { includeMetadata: true })}
                className="cursor-pointer"
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"
                  />
                </svg>
                CSV (with metadata)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Share Button */}
          <Button
            variant="outline"
            className="glass border-glass-border"
            disabled={getTotalMessages() === 0}
            onClick={() => {
              // Copy share link to clipboard
              navigator.clipboard.writeText(
                `${window.location.origin}/shared/${Date.now()}`,
              );
            }}
          >
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"
              />
            </svg>
            Share
          </Button>
        </div>
      </div>

      {/* Conversation Management */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-foreground">
          Conversation Management
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onSaveConversation}
            className="glass border-glass-border"
            disabled={getTotalMessages() === 0}
          >
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
              />
            </svg>
            Save
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onLoadConversation}
            className="glass border-glass-border"
          >
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
              />
            </svg>
            Load
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onClearAll}
            className="glass border-glass-border text-destructive hover:text-destructive"
            disabled={getTotalMessages() === 0}
          >
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
            Clear
          </Button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-foreground">Recent Activity</h3>
        <div className="space-y-2 max-h-32 overflow-y-auto">
          {models
            .filter((model) => model.messages.length > 0)
            .slice(0, 3)
            .map((model) => {
              const lastMessage = model.messages[model.messages.length - 1];
              return (
                <div
                  key={model.id}
                  className="flex items-center space-x-2 p-2 rounded-lg bg-background/20 text-xs"
                >
                  <div className={`w-2 h-2 rounded-full bg-${model.color}`} />
                  <span className="font-medium">{model.name}</span>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-muted-foreground flex-1 truncate">
                    {lastMessage.content.substring(0, 50)}...
                  </span>
                  <span className="text-muted-foreground">
                    {lastMessage.timestamp.toLocaleTimeString()}
                  </span>
                </div>
              );
            })}
        </div>
      </div>

      {/* Status */}
      {isExporting && (
        <div className="p-3 rounded-lg bg-synapse-active/10 border border-synapse-active/20 text-synapse-active text-sm text-center">
          <div className="flex items-center justify-center space-x-2">
            <div className="w-4 h-4 border-2 border-synapse-active/30 border-t-synapse-active rounded-full animate-spin" />
            <span>Exporting conversation...</span>
          </div>
        </div>
      )}
    </div>
  );
}
