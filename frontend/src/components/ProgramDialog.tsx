'use client';

import Image from 'next/image';
import React, { useState, useEffect } from 'react';
import {
  CalendarIcon,
  ClockIcon,
  Globe2Icon,
  LanguagesIcon,
  StarIcon,
  TagIcon,
  TvIcon,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

// Constants
const NOT_AVAILABLE = 'N/A';

// Move these utility functions outside the component
const decodeHtml = (html: string): string => {
  if (typeof window === 'undefined') return html;
  const txt = document.createElement('textarea');
  txt.innerHTML = html;
  return txt.value;
};

const formatDay = (date: Date) => {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
};

const formatTime = (date: Date) => {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
};

const getTimeDescription = (startDate: Date, endDate: Date) => {
  const durationMs = endDate.getTime() - startDate.getTime();
  const durationMins = Math.round(durationMs / 60_000);
  return `${durationMins} minutes`;
};

interface Event {
  title: string;
  channel: string;
  channel_name: string;
  image: string;
  rating: string;
  new: boolean;
  premiere: boolean;
  previouslyShown: boolean;
  subtitle: string;
  lengthstring: string;
  episodeNum: string;
  date: string;
  country: string;
  language: string;
  category: string[];
  description: string;
  start: string;
  end: string;
}

interface ProgramDialogProperties {
  event: Event;
  onOpenChange: (open: boolean) => void;
  trigger: React.ReactNode;
  defaultOpen?: boolean;
}

// Program metadata item component for consistent styling
const MetadataItem = ({
  icon: Icon,
  children,
}: {
  icon: React.ElementType;
  children: React.ReactNode;
}) => (
  <div className="flex items-center space-x-2 text-muted-foreground">
    <Icon className="size-4 text-primary/70" />
    <span className="font-medium">{children}</span>
  </div>
);

function ProgramDialog({
  event,
  onOpenChange,
  trigger,
  defaultOpen = false,
}: ProgramDialogProperties) {
  const startDate = event.start ? new Date(event.start) : new Date();
  const endDate = event.end ? new Date(event.end) : new Date();
  const [open, setOpen] = useState(defaultOpen);
  const [mounted, setMounted] = useState(false);

  // Animation effect
  useEffect(() => {
    setMounted(true);

    // Force open the dialog on mount if defaultOpen is true
    if (defaultOpen) {
      setOpen(true);
    }
  }, [defaultOpen]);

  const handleOpenChange = React.useCallback(
    (newOpen: boolean) => {
      setOpen(newOpen);
      onOpenChange(newOpen);
    },
    [onOpenChange],
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent
        className={`max-w-3xl p-0 transition-all duration-300 ${mounted ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}
      >
        <DialogTitle className="sr-only">
          {decodeHtml(event.title)} - Program Details
        </DialogTitle>
        <Card className="shadow-lg border-none">
          <CardHeader className="bg-primary rounded-t-lg text-primary-foreground">
            <CardTitle className="font-bold text-2xl">
              {decodeHtml(event.title)}
            </CardTitle>
            {event.subtitle && event.subtitle !== NOT_AVAILABLE && (
              <CardDescription className="text-primary-foreground/80">
                {decodeHtml(event.subtitle)}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex md:flex-row flex-col gap-6">
              <div className="space-y-4 shrink-0">
                {event.image ? (
                  <Image
                    src={event.image || '/placeholder.svg'}
                    alt={event.title}
                    width={250}
                    height={187}
                    className="shadow-sm border border-border rounded-lg object-cover"
                  />
                ) : (
                  <div className="flex justify-center items-center bg-secondary/20 shadow-sm border border-border/50 rounded-lg w-[250px] h-[187px]">
                    <TvIcon className="size-24 text-secondary-foreground/50" />
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  {event.new && <Badge variant="default">New</Badge>}
                  {event.premiere && <Badge variant="default">Premiere</Badge>}
                  {event.previouslyShown && (
                    <Badge variant="secondary">Repeat</Badge>
                  )}
                </div>
              </div>
              <ScrollArea className="h-[300px] md:h-auto grow">
                <div className="space-y-4">
                  <MetadataItem icon={CalendarIcon}>
                    {formatDay(startDate)}
                  </MetadataItem>
                  <MetadataItem icon={ClockIcon}>
                    {formatTime(startDate)} - {formatTime(endDate)}
                    <span className="font-normal text-muted-foreground/80">
                      {' '}
                      ({getTimeDescription(startDate, endDate)})
                    </span>
                  </MetadataItem>
                  {event.channel && (
                    <MetadataItem icon={TvIcon}>
                      {decodeHtml(event.channel_name)}
                    </MetadataItem>
                  )}
                  <Separator />
                  <div className="space-y-2">
                    {event.rating && event.rating !== NOT_AVAILABLE && (
                      <div className="flex items-center space-x-2">
                        <StarIcon className="size-4 text-yellow-500" />
                        <span>Rating: {event.rating}</span>
                      </div>
                    )}
                    {event.episodeNum && event.episodeNum !== NOT_AVAILABLE && (
                      <div className="flex items-center space-x-2">
                        <TagIcon className="size-4" />
                        <span>Episode: {event.episodeNum}</span>
                      </div>
                    )}
                    {event.country && event.country !== NOT_AVAILABLE && (
                      <div className="flex items-center space-x-2">
                        <Globe2Icon className="size-4" />
                        <span>Country: {event.country}</span>
                      </div>
                    )}
                    {event.language && event.language !== NOT_AVAILABLE && (
                      <div className="flex items-center space-x-2">
                        <LanguagesIcon className="size-4" />
                        <span>Language: {event.language}</span>
                      </div>
                    )}
                  </div>
                  {event.category && event.category.length > 0 ? (
                    <>
                      <Separator />
                      <div className="flex flex-wrap gap-2">
                        {event.category.map((cat, index) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="bg-primary/5 border-primary/20 font-medium"
                          >
                            {decodeHtml(cat)}
                          </Badge>
                        ))}
                      </div>
                    </>
                  ) : null}
                  {event.description && event.description !== NOT_AVAILABLE && (
                    <>
                      <Separator />
                      <p className="text-foreground/80 text-sm leading-relaxed">
                        {decodeHtml(event.description)}
                      </p>
                    </>
                  )}
                </div>
              </ScrollArea>
            </div>
          </CardContent>
          <CardFooter className="justify-end space-x-2 bg-muted/50 p-4 rounded-b-lg">
            <Button
              variant="outline"
              onClick={() => handleOpenChange(false)}
              aria-label="Close dialog"
              className="hover:bg-primary/10 transition-colors"
            >
              Close
            </Button>
          </CardFooter>
        </Card>
      </DialogContent>
    </Dialog>
  );
}

export default React.memo(ProgramDialog);
