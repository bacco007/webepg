"use client";

import { ChevronRight, Radio, Tv } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/layouts/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

function TransmittersContent() {
  const transmitters = [
    {
      title: "Radio Transmitters",
      description: "View and manage radio transmitter information",
      icon: Radio,
      href: "/transmitters/radio",
      color: "text-blue-500",
    },
    {
      title: "Television Transmitters",
      description: "View and manage television transmitter information",
      icon: Tv,
      href: "/transmitters/television",
      color: "text-purple-500",
    },
  ];

  return (
    <div className="flex size-full flex-col">
      <PageHeader title="Transmitters" />

      <div className="flex-1 overflow-auto">
        <div className="w-full p-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {transmitters.map((transmitter) => (
              <Link href={transmitter.href} key={transmitter.href} passHref>
                <Card className="group relative overflow-hidden py-1 transition-all duration-300 hover:shadow-lg">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

                  <CardContent className="flex flex-col p-6">
                    <div className="mb-4 flex items-center gap-4">
                      <div
                        className={cn(
                          "rounded-lg bg-muted p-2",
                          transmitter.color
                        )}
                      >
                        <transmitter.icon className="size-6" />
                      </div>
                      <h3 className="font-semibold text-lg">
                        {transmitter.title}
                      </h3>
                    </div>

                    <p className="mb-4 text-muted-foreground text-sm">
                      {transmitter.description}
                    </p>

                    <div className="flex items-center text-muted-foreground text-sm">
                      <span>View Details</span>
                      <ChevronRight className="ml-auto size-4" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TransmittersPage() {
  return (
    <main className="flex h-screen flex-col overflow-hidden">
      <TransmittersContent />
    </main>
  );
}
