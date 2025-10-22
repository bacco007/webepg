"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type VerticalTimelineProps = {
  children: ReactNode;
  className?: string;
};

export function VerticalTimeline({
  children,
  className,
}: VerticalTimelineProps) {
  return (
    <div className={cn("relative space-y-8", className)}>
      {/* Timeline line */}
      <div className="absolute top-2 left-[15px] h-[calc(100%-2rem)] w-[2px] bg-border" />
      {children}
    </div>
  );
}

type TimelineItemProps = {
  date: string;
  title: string;
  description?: string;
  tags?: string[];
  children?: ReactNode;
  className?: string;
};

export function TimelineItem({
  date,
  title,
  description,
  tags,
  children,
  className,
}: TimelineItemProps) {
  return (
    <div className={cn("group relative flex gap-6", className)}>
      {/* Dot */}
      <div className="relative z-10 flex h-8 w-8 flex-shrink-0 items-center justify-center">
        <div className="h-3 w-3 rounded-full border-2 border-primary bg-background transition-all group-hover:scale-125 group-hover:border-primary group-hover:bg-primary" />
      </div>

      {/* Content */}
      <div className="flex-1 pb-8">
        <time className="font-medium text-muted-foreground text-sm">
          {date}
        </time>
        <h3 className="mt-2 font-semibold text-lg tracking-tight">{title}</h3>
        {description && (
          <p className="mt-2 text-muted-foreground text-sm leading-relaxed">
            {description}
          </p>
        )}
        {tags && tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                className="inline-flex items-center rounded-md bg-primary/10 px-2.5 py-0.5 font-medium text-primary text-xs ring-1 ring-primary/20 ring-inset"
                key={tag}
              >
                {tag}
              </span>
            ))}
          </div>
        )}
        {children && <div className="mt-4">{children}</div>}
      </div>
    </div>
  );
}
