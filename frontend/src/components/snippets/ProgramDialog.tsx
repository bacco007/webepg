import React from 'react';
import Image from 'next/image';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Event {
  title: string;
  channel: string;
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
  start: string; // Added missing property
  end: string; // Added missing property
}

interface ProgramDialogProps {
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
  const durationMins = Math.round(durationMs / 60000);
  return `${durationMins} minutes`;
};

export default function ProgramDialog({ event, onOpenChange, trigger }: ProgramDialogProps) {
  const startDate = new Date(event.start);
  const endDate = new Date(event.end);

  return (
    <Dialog onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle>
              {decodeHtml(event.title)} {/* {event.channel && decodeHtml(event.channel)} */}
            </CardTitle>
            <CardDescription>
              {event.subtitle && event.subtitle !== 'N/A' && decodeHtml(event.subtitle || '')}
              <br /> {formatDay(startDate)}, {formatTime(startDate)} - {formatTime(endDate)} (
              {getTimeDescription(startDate, endDate)})
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-6 md:flex-row">
              {event.image && (
                <div className="shrink-0">
                  <Image
                    src={event.image}
                    alt={event.title}
                    width={200}
                    height={150}
                    className="rounded-lg object-cover"
                  />
                </div>
              )}
              <ScrollArea className="h-[300px] md:h-auto">
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {event.rating && event.rating !== 'N/A' && (
                      <Badge variant="outline">Rating: {event.rating}</Badge>
                    )}
                    {event.episodeNum && event.episodeNum !== 'N/A' && (
                      <Badge variant="secondary">Ep: {event.episodeNum}</Badge>
                    )}
                    {event.date && event.date !== 'N/A' && (
                      <Badge variant="secondary">Date: {event.date}</Badge>
                    )}
                    {event.country && event.country !== 'N/A' && (
                      <Badge variant="secondary">Country: {event.country}</Badge>
                    )}
                    {event.language && event.language !== 'N/A' && (
                      <Badge variant="secondary">Language: {event.language}</Badge>
                    )}
                    {event.new && <Badge variant="secondary">New</Badge>}
                    {event.premiere && <Badge variant="secondary">Premiere</Badge>}
                    {event.previouslyShown && <Badge variant="secondary">Repeat</Badge>}
                  </div>
                  {event.category && (
                    <div className="flex flex-wrap gap-2">
                      {event.category.map((cat, index) => (
                        <Badge key={index} variant="secondary">
                          {decodeHtml(cat)}
                        </Badge>
                      ))}
                    </div>
                  )}
                  {event.description && event.description !== 'N/A' && (
                    <p className="text-muted-foreground">{decodeHtml(event.description)}</p>
                  )}
                </div>
              </ScrollArea>
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}
