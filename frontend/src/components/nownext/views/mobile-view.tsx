import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { ChannelData, Program } from "@/lib/nownext-types";
import { calculateProgress, formatTime, getTimeDisplay } from "@/utils/nownext";
import { ChannelDetails } from "../channel-details";

interface MobileViewProps {
  filteredChannels: ChannelData[];
}

function ChannelIconButton({ channelData }: { channelData: ChannelData }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="size-12 p-0" variant="ghost">
          {channelData.channel.icon.light !== "N/A" && (
            <img
              alt={channelData.channel.name.real}
              className="block size-full rounded-md object-contain dark:hidden"
              src={channelData.channel.icon.light || "/placeholder.svg"}
            />
          )}
          {channelData.channel.icon.dark !== "N/A" && (
            <img
              alt={channelData.channel.name.real}
              className="hidden size-full rounded-md object-contain dark:block"
              src={channelData.channel.icon.dark || "/placeholder.svg"}
            />
          )}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Channel Information</DialogTitle>
        </DialogHeader>
        <ChannelDetails channel={channelData.channel} />
      </DialogContent>
    </Dialog>
  );
}

function ProgramButton({
  channelData,
  program,
  label,
  showProgress = false,
}: {
  channelData: ChannelData;
  program: Program | null;
  label: string;
  showProgress?: boolean;
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          className="h-auto w-full justify-start p-0 text-left"
          variant="ghost"
        >
          <div className="w-full">
            <div className="font-medium text-muted-foreground text-xs">
              {label}
            </div>
            <div
              className={`truncate font-medium text-sm ${
                !program?.title || program.title === "No Program Data"
                  ? "text-muted-foreground"
                  : ""
              }`}
            >
              {program?.title || "No Program Data"}
            </div>
            {program && (
              <div className="text-muted-foreground text-xs">
                {formatTime(program.start)} - {formatTime(program.stop)} (
                {program.lengthstring})
              </div>
            )}
            {showProgress && program && (
              <div className="mt-1 h-1 w-full bg-gray-200 dark:bg-gray-700">
                <div
                  className="h-1 bg-primary"
                  style={{
                    width: `${calculateProgress(program.start, program.stop)}%`,
                  }}
                />
              </div>
            )}
          </div>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {channelData.channel.name.real} - {label}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1">
            <h3 className="font-semibold text-xl">{program?.title}</h3>
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <span>
                {program
                  ? `${formatTime(program.start)} - ${formatTime(program.stop)}`
                  : ""}
              </span>
              {program && <span>• {getTimeDisplay(program)}</span>}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function MobileChannelItem({ channelData }: { channelData: ChannelData }) {
  return (
    <div className="flex items-center gap-3 p-4">
      <ChannelIconButton channelData={channelData} />
      <div className="grid min-w-0 flex-1 grid-cols-2 gap-4">
        <ProgramButton
          channelData={channelData}
          label="Now"
          program={channelData.currentProgram}
          showProgress={true}
        />
        <ProgramButton
          channelData={channelData}
          label="Next"
          program={channelData.nextProgram}
        />
      </div>
    </div>
  );
}

export function MobileView({ filteredChannels }: MobileViewProps) {
  return (
    <div className="divide-y">
      {filteredChannels.map((channelData) => (
        <MobileChannelItem
          channelData={channelData}
          key={`${channelData.channel.id}-${channelData.channel.lcn}`}
        />
      ))}
    </div>
  );
}
