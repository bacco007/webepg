import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { SKELETON_IDS, TICKER_CONSTANTS } from "@/lib/ticker-constants";

const TickerSkeleton = () => {
  return (
    <div className="bg-background w-full">
      <div className="mx-auto px-4 py-8 container">
        <div className="relative w-full overflow-hidden">
          <div className="flex gap-3">
            {SKELETON_IDS.map((id) => (
              <div 
                className="flex-shrink-0 h-20" 
                key={id}
                style={{ width: `${TICKER_CONSTANTS.CARD_WIDTH}px` }}
              >
                <Card className="flex flex-row items-center gap-3 p-3 h-full">
                  <Skeleton className="rounded size-10" />
                  <div className="flex-1 space-y-2">
                    <div className="flex justify-between">
                      <Skeleton className="w-20 h-3" />
                      <Skeleton className="w-16 h-3" />
                    </div>
                    <Skeleton className="w-full h-4" />
                    <Skeleton className="w-full h-1" />
                    <div className="flex items-center gap-1">
                      <Skeleton className="rounded size-3" />
                      <Skeleton className="w-12 h-3" />
                    </div>
                  </div>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TickerSkeleton; 