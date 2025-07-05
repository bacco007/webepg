"use client";

import { Calendar, Clock, Info, Tag, Tv } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  differenceInMinutes,
  formatDate,
  parseISODate,
} from "@/lib/date-utils";
import type { Program } from "./types";

interface ProgramDetailsProps {
  program: Program;
}

export function ProgramDetails({ program }: ProgramDetailsProps) {
  // Parse times
  const startTime = parseISODate(program.start_time);
  const endTime = parseISODate(program.end_time);

  // Format date and calculate duration
  const formattedDate = formatDate(startTime, "EEEE, do MMMM yyyy");
  const duration = `${formatDate(startTime, "HH:mm")} - ${formatDate(endTime, "HH:mm")}`;
  const durationMinutes = Math.round(differenceInMinutes(endTime, startTime));

  // Check if program is new or premiere
  const isPremiere =
    program.premiere ||
    program.categories?.some((cat) => cat.toLowerCase().includes("premiere"));
  const isNew =
    program.new ||
    program.categories?.some((cat) => cat.toLowerCase().includes("new"));

  // Check if subtitle is valid
  const hasValidSubtitle = program.subtitle && program.subtitle !== "N/A";

  return (
    <div className="space-y-4 p-4">
      {/* Program header */}
      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          {isPremiere && (
            <Badge className="bg-[hsl(var(--program-premiere))] text-white">
              PREMIERE
            </Badge>
          )}
          {isNew && !isPremiere && (
            <Badge className="bg-[hsl(var(--program-new))] text-white">
              NEW
            </Badge>
          )}
          {program.rating && program.rating !== "N/A" && (
            <Badge className="font-bold" variant="outline">
              {program.rating}
            </Badge>
          )}
        </div>

        {hasValidSubtitle && (
          <p className="text-muted-foreground">{program.subtitle}</p>
        )}
      </div>

      {/* Program details */}
      <Card className="space-y-3 p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            <span>{formattedDate}</span>
          </div>

          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            <span>
              {duration} ({durationMinutes} min)
            </span>
          </div>

          {program.categories && program.categories.length > 0 && (
            <div className="col-span-full flex items-center gap-2">
              <Tag className="h-4 w-4 text-primary" />
              <div className="flex flex-wrap gap-1">
                {program.categories.map((category) => (
                  <Badge
                    className="font-normal"
                    key={category}
                    variant="secondary"
                  >
                    {category}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Program description */}
      {program.description && program.description !== "N/A" && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-primary" />
            <h3 className="font-medium">Description</h3>
          </div>
          <p className="text-sm">{program.description}</p>
        </div>
      )}

      {/* Channel info if available */}
      {program.channel && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Tv className="h-4 w-4 text-primary" />
            <h3 className="font-medium">Channel</h3>
          </div>
          <p className="text-sm">{program.channel}</p>
        </div>
      )}
    </div>
  );
}
