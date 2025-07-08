import { useEffect, useState, useMemo } from "react";
import { cn } from "@/lib/utils";

interface SynapseConnection {
  id: string;
  fromModel: string;
  toModel: string;
  intensity: number;
  active: boolean;
}

interface SynapseAnimationProps {
  models: Array<{
    id: string;
    isActive: boolean;
    position: { x: number; y: number };
  }>;
  connections: SynapseConnection[];
  className?: string;
}

export function SynapseAnimation({
  models,
  connections,
  className,
}: SynapseAnimationProps) {
  const [animatedConnections, setAnimatedConnections] = useState<
    SynapseConnection[]
  >([]);

  // Calculate connection paths
  const connectionPaths = useMemo(() => {
    return connections
      .map((connection) => {
        const fromModel = models.find((m) => m.id === connection.fromModel);
        const toModel = models.find((m) => m.id === connection.toModel);

        if (!fromModel || !toModel) return null;

        const dx = toModel.position.x - fromModel.position.x;
        const dy = toModel.position.y - fromModel.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Create a curved path
        const midX = (fromModel.position.x + toModel.position.x) / 2;
        const midY = (fromModel.position.y + toModel.position.y) / 2;
        const curvature = distance * 0.2;
        const perpX = (-dy / distance) * curvature;
        const perpY = (dx / distance) * curvature;

        return {
          ...connection,
          fromPos: fromModel.position,
          toPos: toModel.position,
          controlX: midX + perpX,
          controlY: midY + perpY,
          distance,
        };
      })
      .filter(Boolean);
  }, [models, connections]);

  // Animate connections based on AI activity
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimatedConnections((prev) =>
        connectionPaths.map((conn) => ({
          ...conn,
          intensity: conn.active ? Math.random() * 0.5 + 0.5 : 0.2,
          active:
            models.find((m) => m.id === conn.fromModel)?.isActive &&
            models.find((m) => m.id === conn.toModel)?.isActive,
        })),
      );
    }, 2000);

    return () => clearInterval(interval);
  }, [connectionPaths, models]);

  const SynapseParticle = ({
    path,
    delay = 0,
  }: {
    path: any;
    delay?: number;
  }) => {
    const [position, setPosition] = useState(0);

    useEffect(() => {
      if (!path.active) return;

      const animate = () => {
        setPosition((prev) => (prev + 0.02) % 1);
      };

      const interval = setInterval(animate, 50);
      return () => clearInterval(interval);
    }, [path.active]);

    if (!path.active) return null;

    // Calculate position along the curve
    const t = position;
    const x =
      Math.pow(1 - t, 2) * path.fromPos.x +
      2 * (1 - t) * t * path.controlX +
      Math.pow(t, 2) * path.toPos.x;
    const y =
      Math.pow(1 - t, 2) * path.fromPos.y +
      2 * (1 - t) * t * path.controlY +
      Math.pow(t, 2) * path.toPos.y;

    return (
      <div
        className={cn(
          "absolute w-2 h-2 rounded-full bg-synapse-active shadow-lg",
          "animate-glow transition-all duration-300",
        )}
        style={{
          left: x,
          top: y,
          boxShadow: `0 0 ${10 + path.intensity * 20}px hsl(var(--synapse-active))`,
          opacity: path.intensity,
        }}
      />
    );
  };

  return (
    <div
      className={cn(
        "absolute inset-0 pointer-events-none overflow-hidden",
        className,
      )}
    >
      <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 1 }}>
        {connectionPaths.map((path, index) => {
          if (!path) return null;

          const pathData = `M ${path.fromPos.x} ${path.fromPos.y} Q ${path.controlX} ${path.controlY} ${path.toPos.x} ${path.toPos.y}`;

          return (
            <g key={path.id}>
              {/* Base connection line */}
              <path
                d={pathData}
                stroke="hsl(var(--synapse-idle))"
                strokeWidth="1"
                fill="none"
                opacity={path.active ? 0.3 : 0.1}
                className="transition-all duration-500"
              />

              {/* Active connection line */}
              {path.active && (
                <path
                  d={pathData}
                  stroke="hsl(var(--synapse-active))"
                  strokeWidth="2"
                  fill="none"
                  opacity={path.intensity}
                  className="synapse-line"
                  style={{
                    filter: `drop-shadow(0 0 ${5 + path.intensity * 10}px hsl(var(--synapse-active)))`,
                  }}
                />
              )}
            </g>
          );
        })}
      </svg>

      {/* Animated particles */}
      <div className="absolute inset-0" style={{ zIndex: 2 }}>
        {connectionPaths.map(
          (path, index) =>
            path &&
            path.active && (
              <div key={`particles-${path.id}`}>
                <SynapseParticle path={path} delay={0} />
                <SynapseParticle path={path} delay={1000} />
                <SynapseParticle path={path} delay={2000} />
              </div>
            ),
        )}
      </div>

      {/* Network pulse effect */}
      <div className="absolute inset-0 opacity-30">
        {models
          .filter((m) => m.isActive)
          .map((model, index) => (
            <div
              key={`pulse-${model.id}`}
              className="absolute w-32 h-32 rounded-full border border-synapse-active/20 animate-ping"
              style={{
                left: model.position.x - 64,
                top: model.position.y - 64,
                animationDelay: `${index * 0.5}s`,
                animationDuration: "3s",
              }}
            />
          ))}
      </div>
    </div>
  );
}
