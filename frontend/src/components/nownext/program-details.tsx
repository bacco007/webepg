import { MoreHorizontal, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Channel, Program } from "@/lib/nownext-types";
import { formatTime, getTimeDisplay } from "@/utils/nownext";

interface ProgramDetailsProps {
  program: Program | null;
  channel: Channel;
}

function ProgramActions() {
  return (
    <div className="flex gap-2">
      <Button className="flex-1" size="lg">
        Watch Live
      </Button>
      <Button size="icon" variant="outline">
        <MoreHorizontal className="size-4" />
      </Button>
    </div>
  );
}

function ProgramDescription({ program }: { program: Program }) {
  if (!program.desc) {
    return null;
  }

  return (
    <div className="space-y-2 rounded-lg bg-muted p-4 text-sm">
      <p>{program.desc}</p>
      {program.category.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {program.category.map((cat) => (
            <span
              className="rounded-full bg-primary/10 px-2 py-0.5 text-xs"
              key={cat}
            >
              {cat}
            </span>
          ))}
        </div>
      )}
      <p className="text-muted-foreground">
        Rating: <span className="font-medium">{program.rating}</span>
      </p>
    </div>
  );
}

function ChannelSchedule({
  program,
  channel,
}: {
  program: Program;
  channel: Channel;
}) {
  const programs = [
    program,
    channel.nextProgram,
    channel.afterNextProgram,
  ].filter((p): p is Program => p !== null);

  return (
    <div className="space-y-2">
      <h4 className="font-medium">Channel Schedule</h4>
      <div className="space-y-2">
        {programs.map((p, index) => (
          <div
            className="flex items-center justify-between rounded-lg bg-muted p-3"
            key={`${p.title}-${p.start}`}
          >
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{p.title}</p>
              <p className="text-muted-foreground text-sm">
                {formatTime(p.start)} - {formatTime(p.stop)}
              </p>
            </div>
            {index === 0 && <Badge>Now</Badge>}
          </div>
        ))}
      </div>
    </div>
  );
}

export function ProgramDetails({ program, channel }: ProgramDetailsProps) {
  if (!program) {
    return null;
  }

  const timeDisplay = getTimeDisplay(program);

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h3 className="font-semibold text-xl">{program.title}</h3>
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <span>
            {formatTime(program.start)} - {formatTime(program.stop)}
          </span>
          {timeDisplay && <span>• {timeDisplay}</span>}
        </div>
      </div>

      <ProgramActions />

      <Button className="w-full" size="sm" variant="secondary">
        <Plus className="mr-2 size-4" />
        Add to Up Next
      </Button>

      <ProgramDescription program={program} />
      <ChannelSchedule channel={channel} program={program} />
    </div>
  );
}
