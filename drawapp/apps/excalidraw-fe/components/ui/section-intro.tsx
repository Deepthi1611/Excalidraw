import * as React from "react";
import { cn } from "@/components/ui/cn";

interface SectionIntroProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  className?: string;
  titleClassName?: string;
  descriptionClassName?: string;
}

export function SectionIntro({
  title,
  description,
  className,
  titleClassName,
  descriptionClassName,
}: SectionIntroProps) {
  return (
    <div className={cn("text-center", className)}>
      <h2 className={cn("text-3xl md:text-5xl font-extrabold mb-4", titleClassName)}>{title}</h2>
      {description ? (
        <p className={cn("text-muted-foreground text-lg max-w-xl mx-auto", descriptionClassName)}>{description}</p>
      ) : null}
    </div>
  );
}
