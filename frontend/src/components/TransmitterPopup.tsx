import React from 'react';
import { Antenna, ArrowUpFromLine, MapPin, Radio, Zap } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';

interface Transmitter {
  AreaServed: string;
  CallSignChannel: string;
  CallSign: string;
  Operator: string;
  Network: string;
  Purpose: string;
  Channel: string;
  Frequency: number;
  Polarity: string;
  SiteName: string;
  Site: string;
  ACMASiteID: number;
  Lat: number;
  Long: number;
  AntennaHeight: number;
  MaxERP: string;
  LicenceArea: string;
  LicenceNo: string;
  OnAirDate: string;
}

export function TransmitterPopup({
  transmitter,
}: {
  transmitter: Transmitter;
}) {
  return (
    <Card className="w-[350px] shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="text-2xl font-bold">
          {transmitter.CallSignChannel}
        </CardTitle>
        <Badge variant="secondary" className="mt-2">
          {transmitter.Network}
        </Badge>
      </CardHeader>
      <CardContent>
        <Table>
          <TableBody>
            <TableRow>
              <TableCell className="flex items-center font-medium">
                <MapPin className="mr-2 size-4" />
                Area Served
              </TableCell>
              <TableCell>{transmitter.AreaServed}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="flex items-center font-medium">
                <Radio className="mr-2 size-4" />
                Frequency
              </TableCell>
              <TableCell>{transmitter.Frequency} MHz</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="flex items-center font-medium">
                <Antenna className="mr-2 size-4" />
                Channel
              </TableCell>
              <TableCell>{transmitter.Channel}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="flex items-center font-medium">
                <MapPin className="mr-2 size-4" />
                Site
              </TableCell>
              <TableCell>{transmitter.SiteName}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="flex items-center font-medium">
                <ArrowUpFromLine className="mr-2 size-4" />
                Antenna Height
              </TableCell>
              <TableCell>{transmitter.AntennaHeight} m</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="flex items-center font-medium">
                <Zap className="mr-2 size-4" />
                Max ERP
              </TableCell>
              <TableCell>{transmitter.MaxERP}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
