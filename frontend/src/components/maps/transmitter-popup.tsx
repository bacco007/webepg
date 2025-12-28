import {
  Antenna,
  ArrowUpFromLine,
  Globe,
  MapPin,
  Radio,
  Zap,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface BaseTransmitter {
  LicenceNo: string;
  CallSign: string;
  AreaServed: string;
  SiteName: string;
  Lat: number;
  Long: number;
  AntennaHeight: number;
  LicenceArea: string;
  Frequency: number;
  Purpose: string;
  Polarity: string;
  Site: string;
  MaxERP: string;
  TransmitPower?: string;
  HoursOfOperaton?: string;
  FreqBlock?: string;
  BSL?: string;
  "Licence Area"?: string;
}

type TVTransmitter = BaseTransmitter & {
  CallSignChannel: string;
  Operator: string;
  Network: string;
  Channel: string;
};

type RadioTransmitter = BaseTransmitter & {
  Type?: "FM" | "AM" | "DAB";
};

type Transmitter = TVTransmitter | RadioTransmitter;

interface TransmitterPopupProps {
  transmitter: Transmitter;
}

export function TransmitterPopup({ transmitter }: TransmitterPopupProps) {
  const isRadio = "Type" in transmitter;
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${transmitter.Lat},${transmitter.Long}`;

  return (
    <Card className="w-80">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">
          {transmitter.CallSign || "Unknown"}
        </CardTitle>
        <CardDescription>{transmitter.SiteName}</CardDescription>
      </CardHeader>
      <CardContent className="pt-3 pb-2">
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <div className="col-span-2 mb-1 font-semibold text-muted-foreground">
            Location
          </div>
          <div className="flex items-center gap-1">
            <MapPin className="size-4" />
            Area
          </div>
          <div>{transmitter.AreaServed}</div>
          <div className="flex items-center gap-1">
            <MapPin className="size-4" />
            Site
          </div>
          <div>{transmitter.SiteName}</div>
          <div className="col-span-2 h-2" />
          <div className="flex items-center gap-1">
            <Radio className="size-4" />
            Frequency
          </div>
          <div>
            <Badge className="bg-blue-100 px-2 py-0.5 font-bold text-blue-800 text-xs">
              {transmitter.Frequency} MHz
            </Badge>
          </div>
          <div className="flex items-center gap-1">
            <Antenna className="size-4" />
            Type
          </div>
          <div>{isRadio ? transmitter.Type : "TV"}</div>
          <div className="flex items-center gap-1">
            <ArrowUpFromLine className="size-4" />
            Antenna Height
          </div>
          <div>{transmitter.AntennaHeight} m</div>
          <div className="flex items-center gap-1">
            <Zap className="size-4" />
            Power
          </div>
          <div>
            <Badge className="bg-green-100 px-2 py-0.5 font-bold text-green-800 text-xs">
              {transmitter.MaxERP || transmitter.TransmitPower || "Unknown"}
            </Badge>
          </div>
          <div className="col-span-2 h-2" />
          <div className="flex items-center gap-1 font-medium">
            <Globe className="size-4" />
            Licence Area
          </div>
          <div>{transmitter.LicenceArea || "Unknown"}</div>
          {transmitter.FreqBlock && (
            <>
              <div className="flex items-center gap-1 font-medium">
                <Radio className="size-4" />
                Frequency Block
              </div>
              <div>{transmitter.FreqBlock}</div>
            </>
          )}
        </div>
        <div className="mt-4 flex">
          <a
            aria-label="Directions"
            href={directionsUrl}
            rel="noopener noreferrer"
            target="_blank"
            title="Directions"
          >
            <Button className="w-full" size="sm" variant="outline">
              Directions
            </Button>
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
