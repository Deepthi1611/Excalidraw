import * as React from "react";
import { cn } from "@/components/ui/cn";

interface FeatureCardProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  iconColorClassName: string;
  iconBgClassName: string;
  className?: string;
}

export function FeatureCard({
  icon: Icon,
  title,
  description,
  iconColorClassName,
  iconBgClassName,
  className,
}: FeatureCardProps) {
  return (
    <div
      className={cn(
        "group p-8 rounded-4xl border border-[#d6dbe5] bg-[#f7f8fb] shadow-[0_2px_0_rgba(148,163,184,0.14)]",
        "hover:shadow-[8px_10px_0_rgba(148,163,184,0.22)] transition-[box-shadow,border-color,background-color,transform]",
        "duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)] hover:border-[#c9cfdb] hover:bg-[#f9fafc]",
        className,
      )}
    >
      <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center mb-4", iconBgClassName)}>
        <Icon className={cn("w-6 h-6", iconColorClassName)} />
      </div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}
