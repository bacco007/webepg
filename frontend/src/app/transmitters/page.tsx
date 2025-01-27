import TransmitterMap from '@/components/TransmitterMap';

export default function TransmittersPage() {
  return (
    <div className="flex size-full flex-col">
      <div className="flex items-center justify-between border-b p-2">
        <h1 className="text-xl font-bold">DVB-T Transmitter Sites</h1>
        <div className="flex items-center space-x-2"></div>
      </div>
      <TransmitterMap />
    </div>
  );
}
