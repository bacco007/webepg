/** biome-ignore-all lint/security/noDangerouslySetInnerHtml: Accepted for timeline descriptions */
"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { getProviderName } from "./provider-badge";

/**
 * Sanitizes HTML content for timeline descriptions
 * Allows safe formatting tags like <br>, <ul>, <li>, <p>, <strong>, <em>, <b>, <i>
 * Converts newlines to <br> tags
 */
function sanitizeDescriptionHtml(html: string): string {
  if (!html) {
    return "";
  }

  // Convert newlines to <br> tags
  let sanitized = html.replace(/\n/g, "<br />");

  // Allow only safe HTML tags
  const allowedTags = [
    "br",
    "p",
    "ul",
    "ol",
    "li",
    "strong",
    "em",
    "b",
    "i",
    "u",
  ];

  // Create a regex pattern for allowed tags
  const allowedTagsPattern = allowedTags.join("|");

  // Remove any tags that aren't in the allowed list
  sanitized = sanitized.replace(
    new RegExp(`<(?!/?(${allowedTagsPattern})(\\s|>))[^>]+>`, "gi"),
    ""
  );

  // Remove any script, style, or iframe tags completely (extra safety)
  // Using [\s\S] instead of . with 's' flag for compatibility
  sanitized = sanitized.replace(
    /<(script|style|iframe|object|embed|form)[^>]*>[\s\S]*?<\/\1>/gi,
    ""
  );

  return sanitized;
}

interface VerticalTimelineProps {
  children: ReactNode;
  className?: string;
}

export function VerticalTimeline({
  children,
  className,
}: VerticalTimelineProps) {
  return (
    <div className={cn("relative", className)}>
      {/* Timeline line - centered */}
      <div className="absolute top-2 left-1/2 h-[calc(100%-2rem)] w-[2px] -translate-x-1/2 bg-border" />
      {children}
    </div>
  );
}

interface TimelineItemProps {
  date: string;
  title: string;
  description?: string;
  tags?: string[];
  children?: ReactNode;
  className?: string;
  spacingMultiplier?: number; // Multiplier for spacing based on time gap (default: 1)
}

type TimelineItemPropsWithIndex = TimelineItemProps & {
  itemIndex?: number;
};

export function TimelineItem({
  date,
  title,
  description,
  tags,
  children,
  className,
  itemIndex,
  spacingMultiplier = 1,
}: TimelineItemPropsWithIndex) {
  // Alternate between left and right sides (even index = right, odd index = left)
  const isRight = itemIndex !== undefined && itemIndex % 2 === 0;

  // Base spacing values (in rem)
  // Increased base values to provide more buffer and prevent overlapping boxes
  const baseMarginBottom = 2; // 2rem base margin
  const basePaddingBottom = 3; // 3rem base padding

  // Apply spacing multiplier, with minimum of 1x to ensure some spacing
  // The spacingMultiplier already has a minimum of 1.5x from the calculation
  const adjustedMarginBottom =
    baseMarginBottom * Math.max(1, spacingMultiplier);
  const adjustedPaddingBottom =
    basePaddingBottom * Math.max(1, spacingMultiplier);

  return (
    <div
      className={cn("group relative min-h-[100px]", className)}
      data-item-index={itemIndex}
      data-timeline-item
      style={{
        marginBottom: `${adjustedMarginBottom}rem`,
        paddingBottom: `${adjustedPaddingBottom}rem`,
      }}
    >
      {/* Dot - absolutely positioned at center */}
      <div className="absolute top-0 left-1/2 z-10 flex h-8 w-8 -translate-x-1/2 items-center justify-center">
        <div className="h-3 w-3 rounded-full border-2 border-primary bg-background transition-all group-hover:scale-125 group-hover:border-primary group-hover:bg-primary" />
      </div>

      {/* Content - Left side */}
      {!isRight && (
        <div className="group absolute top-0 right-1/2 mr-8 w-1/4 cursor-pointer overflow-hidden rounded-lg border border-border/50 bg-card text-right shadow-sm transition-all hover:scale-[1.02] hover:border-primary/50 hover:shadow-lg">
          <div className="absolute inset-0 bg-linear-to-r from-primary/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
          <div className="relative p-5">
            <div className="mb-3 inline-flex items-center rounded-full bg-primary/10 px-3 py-1">
              <time className="font-semibold text-primary text-xs uppercase tracking-wide">
                {date}
              </time>
            </div>
            <h3 className="mt-3 font-bold text-foreground text-xl leading-tight tracking-tight">
              {title}
            </h3>
            {/* eslint-disable react/no-danger */}
            {description && (
              <div
                className="mt-4 text-muted-foreground text-sm leading-relaxed"
                dangerouslySetInnerHTML={{
                  __html: sanitizeDescriptionHtml(description),
                }}
              />
            )}
            {/* eslint-enable react/no-danger */}
            {tags && tags.length > 0 && (
              <div className="mt-4 flex flex-wrap justify-end gap-2">
                {tags.map((tag) => {
                  // Check if this is a provider ID and use clean name if available
                  const displayName = getProviderName(tag);
                  return (
                    <span
                      className="inline-flex items-center rounded-md bg-primary/10 px-2.5 py-0.5 font-medium text-primary text-xs ring-1 ring-primary/20 ring-inset"
                      key={tag}
                    >
                      {displayName}
                    </span>
                  );
                })}
              </div>
            )}
            {children && <div className="mt-4">{children}</div>}
          </div>
        </div>
      )}

      {/* Content - Right side */}
      {isRight && (
        <div className="group absolute top-0 left-1/2 ml-8 w-1/4 cursor-pointer overflow-hidden rounded-lg border border-border/50 bg-card text-left shadow-sm transition-all hover:scale-[1.02] hover:border-primary/50 hover:shadow-lg">
          <div className="absolute inset-0 bg-linear-to-l from-primary/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
          <div className="relative p-5">
            <div className="mb-3 inline-flex items-center rounded-full bg-primary/10 px-3 py-1">
              <time className="font-semibold text-primary text-xs uppercase tracking-wide">
                {date}
              </time>
            </div>
            <h3 className="mt-3 font-bold text-foreground text-xl leading-tight tracking-tight">
              {title}
            </h3>
            {/* eslint-disable react/no-danger */}
            {description && (
              <div
                className="mt-4 text-muted-foreground text-sm leading-relaxed"
                dangerouslySetInnerHTML={{
                  __html: sanitizeDescriptionHtml(description),
                }}
              />
            )}
            {/* eslint-enable react/no-danger */}
            {tags && tags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {tags.map((tag) => {
                  // Check if this is a provider ID and use clean name if available
                  const displayName = getProviderName(tag);
                  return (
                    <span
                      className="inline-flex items-center rounded-md bg-primary/10 px-2.5 py-0.5 font-medium text-primary text-xs ring-1 ring-primary/20 ring-inset"
                      key={tag}
                    >
                      {displayName}
                    </span>
                  );
                })}
              </div>
            )}
            {children && <div className="mt-4">{children}</div>}
          </div>
        </div>
      )}
    </div>
  );
}
