'use client';

import Image from 'next/image';
import React, { useState } from 'react';
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
}

const decodeHtml = (html: string): string => {
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

export default function ProgramDialog({
  event,
  onOpenChange,
  trigger,
}: ProgramDialogProperties) {
  const startDate = new Date(event.start);
  const endDate = new Date(event.end);
  const [open, setOpen] = useState(false);

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-3xl p-0">
        <DialogTitle className="sr-only">
          {decodeHtml(event.title)} - Program Details
        </DialogTitle>
        <Card className="border-none">
          <CardHeader className="rounded-t-lg bg-primary text-primary-foreground">
            <CardTitle className="text-2xl font-bold">
              {decodeHtml(event.title)}
            </CardTitle>
            <CardDescription className="text-primary-foreground/80">
              {event.subtitle &&
                event.subtitle !== 'N/A' &&
                decodeHtml(event.subtitle)}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex flex-col gap-6 md:flex-row">
              <div className="shrink-0 space-y-4">
                {event.image ? (
                  <Image
                    src={event.image}
                    alt={event.title}
                    width={250}
                    height={187}
                    className="rounded-lg object-cover"
                  />
                ) : (
                  <div className="flex h-[187px] w-[250px] items-center justify-center rounded-lg bg-secondary">
                    <TvIcon className="size-16 text-secondary-foreground/30" />
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
              <ScrollArea className="h-[300px] grow md:h-auto">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 text-muted-foreground">
                    <CalendarIcon className="size-4" />
                    <span>{formatDay(startDate)}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-muted-foreground">
                    <ClockIcon className="size-4" />
                    <span>
                      {formatTime(startDate)} - {formatTime(endDate)} (
                      {getTimeDescription(startDate, endDate)})
                    </span>
                  </div>
                  {event.channel && (
                    <div className="flex items-center space-x-2 text-muted-foreground">
                      <TvIcon className="size-4" />
                      <span>{decodeHtml(event.channel_name)}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="space-y-2">
                    {event.rating && event.rating !== 'N/A' && (
                      <div className="flex items-center space-x-2">
                        <StarIcon className="size-4 text-yellow-500" />
                        <span>Rating: {event.rating}</span>
                      </div>
                    )}
                    {event.episodeNum && event.episodeNum !== 'N/A' && (
                      <div className="flex items-center space-x-2">
                        <TagIcon className="size-4" />
                        <span>Episode: {event.episodeNum}</span>
                      </div>
                    )}
                    {event.country && event.country !== 'N/A' && (
                      <div className="flex items-center space-x-2">
                        <Globe2Icon className="size-4" />
                        <span>Country: {event.country}</span>
                      </div>
                    )}
                    {event.language && event.language !== 'N/A' && (
                      <div className="flex items-center space-x-2">
                        <LanguagesIcon className="size-4" />
                        <span>Language: {event.language}</span>
                      </div>
                    )}
                  </div>
                  {event.category && event.category.length > 0 && (
                    <>
                      <Separator />
                      <div className="flex flex-wrap gap-2">
                        {event.category.map((cat, index) => (
                          <Badge key={index} variant="outline">
                            {decodeHtml(cat)}
                          </Badge>
                        ))}
                      </div>
                    </>
                  )}
                  {event.description && event.description !== 'N/A' && (
                    <>
                      <Separator />
                      <p className="text-sm text-muted-foreground">
                        {decodeHtml(event.description)}
                      </p>
                    </>
                  )}
                </div>
              </ScrollArea>
            </div>
          </CardContent>
          <CardFooter className="justify-end space-x-2 rounded-b-lg bg-muted/50">
            <Button variant="outline" onClick={() => handleOpenChange(false)}>
              Close
            </Button>
          </CardFooter>
        </Card>
      </DialogContent>
    </Dialog>
  );
}
