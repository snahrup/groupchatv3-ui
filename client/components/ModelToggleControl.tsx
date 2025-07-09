import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { AIModel } from "./AIModelPanel";

interface ModelToggleControlProps {
  models: AIModel[];
  conversationMessages?: Array<{ id: string; modelId: string; type: string }>;
  onToggleModel: (modelId: string) => void;
  onToggleAll: (active: boolean) => void;
  className?: string;
}

export function ModelToggleControl({
  models,
  conversationMessages = [],
  onToggleModel,
  onToggleAll,
  className,
}: ModelToggleControlProps) {
  const activeCount = models.filter(
    (model) => model.status !== "inactive",
  ).length;
  const allActive = activeCount === models.length;
  const noneActive = activeCount === 0;

  const getModelStats = (model: AIModel) => {
    // Count messages from the unified conversation for this model
    const messageCount = conversationMessages.filter(
      (msg) => msg.modelId === model.id && msg.type === "message",
    ).length;
    const avgResponseTime = "~2.3s"; // This would be calculated from actual data

    return {
      messages: messageCount,
      responseTime: avgResponseTime,
      efficiency: model.status === "active" ? "High" : "Idle",
    };
  };

  return (
    <div className={cn("glass-strong rounded-xl p-6 space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            AI Panel Control
          </h2>
          <p className="text-sm text-muted-foreground">
            Manage active AI collaborators
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Badge
            variant="outline"
            className={cn(
              "text-xs",
              activeCount > 0
                ? "bg-synapse-active/10 text-synapse-active border-synapse-active/30"
                : "bg-muted/50 text-muted-foreground",
            )}
          >
            {activeCount}/{models.length} Active
          </Badge>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onToggleAll(true)}
          disabled={allActive}
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
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
          Activate All
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onToggleAll(false)}
          disabled={noneActive}
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
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
          Deactivate All
        </Button>
      </div>

      <Separator className="bg-glass-border" />

      {/* Model Controls */}
      <div className="space-y-4">
        {models.map((model) => {
          const stats = getModelStats(model);
          const isActive = model.status !== "inactive";

          return (
            <div
              key={model.id}
              className={cn(
                "group p-4 rounded-lg border transition-all duration-300 hover:shadow-md",
                isActive
                  ? `bg-${model.color}/5 border-${model.color}/20 shadow-sm`
                  : "bg-muted/20 border-muted/30",
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <Avatar
                      className={cn(
                        "w-10 h-10 border-2 transition-all duration-300",
                        isActive ? `border-${model.color}` : "border-muted",
                      )}
                    >
                      <AvatarImage src={model.avatar} alt={model.name} />
                      <AvatarFallback
                        className={cn(
                          "text-sm font-semibold",
                          isActive
                            ? `bg-${model.color}/10 text-${model.color}`
                            : "bg-muted text-muted-foreground",
                        )}
                      >
                        {model.shortName}
                      </AvatarFallback>
                    </Avatar>

                    {/* Status indicator */}
                    <div
                      className={cn(
                        "absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-background",
                        model.status === "active" ? `bg-${model.color}` : "",
                        model.status === "thinking"
                          ? `bg-${model.color} animate-pulse`
                          : "",
                        model.status === "inactive" ? "bg-muted" : "",
                      )}
                    />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h3
                        className={cn(
                          "font-medium text-sm transition-colors",
                          isActive
                            ? "text-foreground"
                            : "text-muted-foreground",
                        )}
                      >
                        {model.name}
                      </h3>
                      <Badge
                        variant="secondary"
                        className={cn(
                          "text-xs",
                          isActive
                            ? `bg-${model.color}/10 text-${model.color} border-${model.color}/20`
                            : "",
                        )}
                      >
                        {model.status}
                      </Badge>
                    </div>

                    <div className="flex items-center space-x-4 mt-1 text-xs text-muted-foreground">
                      <span>📊 {stats.messages} msgs</span>
                      <span>⚡ {stats.responseTime}</span>
                      <span>🎯 {stats.efficiency}</span>
                    </div>
                  </div>
                </div>

                <Switch
                  checked={isActive}
                  onCheckedChange={() => onToggleModel(model.id)}
                  className="data-[state=checked]:bg-synapse-active"
                />
              </div>

              {/* Expanded stats (visible on hover) */}
              <div className="mt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="text-center p-2 rounded bg-background/50">
                    <div className="font-medium text-foreground">
                      {stats.messages}
                    </div>
                    <div className="text-muted-foreground">Messages</div>
                  </div>
                  <div className="text-center p-2 rounded bg-background/50">
                    <div className="font-medium text-foreground">
                      {stats.responseTime}
                    </div>
                    <div className="text-muted-foreground">Avg Response</div>
                  </div>
                  <div className="text-center p-2 rounded bg-background/50">
                    <div className="font-medium text-foreground">
                      {stats.efficiency}
                    </div>
                    <div className="text-muted-foreground">Status</div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Performance Overview */}
      <div className="p-4 rounded-lg bg-background/30 border border-glass-border">
        <h4 className="text-sm font-medium text-foreground mb-2">
          Panel Performance
        </h4>
        <div className="grid grid-cols-3 gap-4 text-xs">
          <div className="text-center">
            <div className="text-lg font-bold text-synapse-active">
              {activeCount}
            </div>
            <div className="text-muted-foreground">Active</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-foreground">
              {
                conversationMessages.filter((msg) => msg.type === "message")
                  .length
              }
            </div>
            <div className="text-muted-foreground">Total Messages</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-foreground">~2.1s</div>
            <div className="text-muted-foreground">Avg Response</div>
          </div>
        </div>
      </div>
    </div>
  );
}
