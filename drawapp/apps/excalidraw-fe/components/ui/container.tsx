import * as React from "react";
import { cn } from "@/components/ui/cn";

type ContainerSize = "sm" | "md" | "lg" | "xl";

const sizeClasses: Record<ContainerSize, string> = {
  sm: "max-w-md",
  md: "max-w-3xl",
  lg: "max-w-5xl",
  xl: "max-w-6xl",
};

interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: ContainerSize;
}

export function Container({ size = "xl", className, ...props }: ContainerProps) {
  return <div className={cn("mx-auto w-full", sizeClasses[size], className)} {...props} />;
}
