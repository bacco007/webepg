"use client";

import { format } from "date-fns";
import { CalendarIcon, Clock } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

type Channel = {
  id: string;
  name: string;
  icon: {
    light: string;
    dark: string;
  };
  slug: string;
  lcn: string;
  group: string;
};

type Program = {
  title: string;
  start: string;
  end: string;
  description: string;
  categories: string[];
  subtitle: string;
  episode: string;
  original_air_date: string;
  rating: string;
};

type ChannelPrograms = {
  channel: Channel;
  programs: {
    [date: string]: Program[];
  };
};

type ChannelCardProps = {
  channelData: ChannelPrograms;
  onNavigate: () => void;
  onNavigateToFullWeek: (channelSlug: string) => void;
};

const decodeHtml = (html: string): string => {
  const txt = document.createElement("textarea");
  txt.innerHTML = html;
  return txt.value;
};

export function ChannelCard({
  channelData,
  onNavigate,
  onNavigateToFullWeek,
}: ChannelCardProps) {
  return (
    <div className="flex h-full flex-col rounded-md border bg-card shadow-sm">
      {/* Channel header */}
      <div className="flex items-center justify-between px-3 py-2">
        {channelData.channel.icon &&
          channelData.channel.icon.light !== "N/A" && (
            <div className="flex h-8 items-center">
              <img
                alt={decodeHtml(channelData.channel.name)}
                className="block max-h-full max-w-[60px] object-contain dark:hidden"
                src={channelData.channel.icon.light || "/placeholder.svg"}
              />
              <img
                alt={decodeHtml(channelData.channel.name)}
                className="hidden max-h-full max-w-[60px] object-contain dark:block"
                src={channelData.channel.icon.dark || "/placeholder.svg"}
              />
            </div>
          )}
        <div className="ml-auto text-right">
          <div className="font-medium text-base">
            {decodeHtml(channelData.channel.name)}
          </div>
          {channelData.channel.lcn !== "N/A" && (
            <div className="text-muted-foreground text-xs">
              Channel {channelData.channel.lcn}
            </div>
          )}
        </div>
      </div>

      {/* Programs content - fixed height with scrolling */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-[250px]">
          <div className="w-full">
            {Object.entries(channelData.programs).map(([date, programs]) => (
              <div className="border-b last:border-b-0" key={date}>
                <button
                  className="flex w-full items-center justify-between px-3 py-1 text-left font-medium text-sm hover:bg-muted/50"
                  onClick={(e) => {
                    const content = e.currentTarget.nextElementSibling;
                    if (content) {
                      content.classList.toggle("hidden");
                    }
                  }}
                  type="button"
                >
                  <div className="flex items-center">
                    <CalendarIcon className="mr-2 size-4" />
                    {format(new Date(date), "EEEE, MMMM d, yyyy")}
                  </div>
                  <ChevronIcon className="size-4" />
                </button>
                <div className="hidden overflow-x-auto">
                  <table className="w-full min-w-full table-auto border-collapse text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="w-[100px] px-3 py-1 text-left font-medium">
                          Time
                        </th>
                        <th className="px-3 py-1 text-left font-medium">
                          Title
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {programs.map((program: Program, index: number) => (
                        <tr
                          className="border-muted/20 border-b last:border-b-0"
                          key={`${date}-${program.start}-${program.title}-${index}`}
                        >
                          <td className="px-3 py-1 text-xs">
                            {format(new Date(program.start), "h:mm a")} -{" "}
                            {format(new Date(program.end), "h:mm a")}
                          </td>
                          <td className="px-3 py-1">
                            <div className="font-medium">{program.title}</div>
                            <div className="text-muted-foreground text-xs">
                              {program.description}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Card footer */}
      <div className="mt-auto flex px-2 py-2">
        <Button
          className="mr-2 flex-1"
          onClick={onNavigate}
          size="sm"
          variant="secondary"
        >
          <Clock className="mr-1 size-3" />
          Next 24hrs
        </Button>
        <Button
          className="flex-1"
          onClick={() => onNavigateToFullWeek(channelData.channel.slug)}
          size="sm"
          variant="outline"
        >
          <CalendarIcon className="mr-1 size-3" />
          Full Week
        </Button>
      </div>
    </div>
  );
}

// Simple chevron icon component that toggles between up and down
function ChevronIcon({ className }: { className?: string }) {
  const [isUp, setIsUp] = useState(false);

  return (
    <svg
      className={className}
      fill="none"
      height="24"
      onClick={() => setIsUp(!isUp)}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
      width="24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>Toggle chevron</title>
      {isUp ? (
        <polyline points="18 15 12 9 6 15" />
      ) : (
        <polyline points="6 9 12 15 18 9" />
      )}
    </svg>
  );
}
