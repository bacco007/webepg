import { Loader2 } from "lucide-react";
import type React from "react";

import { cn } from "@/lib/utils";

interface LoadingSpinnerProperties {
  size?: number;
  className?: string;
  text?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProperties> = ({
  size = 48,
  className = "",
  text = "Loading...",
}) => {
  return (
    <div
      className={cn(
        "fixed inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-xs",
        className
      )}
    >
      <div aria-live="polite" className="flex flex-col items-center space-y-4">
        <Loader2
          aria-hidden="true"
          className="animate-spin text-primary"
          size={size}
        />
        <p className="font-semibold text-primary text-xl">{text}</p>
        <span className="sr-only">Loading, please wait...</span>
      </div>
    </div>
  );
};
export default LoadingSpinner;
