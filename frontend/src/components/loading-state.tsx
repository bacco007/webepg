import type React from "react";
import LoadingSpinner from "./loading-spinner";

interface LoadingStateProps {
  text?: string;
  size?: number;
  className?: string;
  children?: React.ReactNode;
  fullscreen?: boolean;
}

const LoadingState: React.FC<LoadingStateProps> = ({
  text = "Loading...",
  size = 48,
  className = "",
  children,
  fullscreen = true,
}) => (
  <div
    aria-live="polite"
    className={
      fullscreen
        ? `fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-xs ${className}`
        : `flex h-full w-full flex-col items-center justify-center ${className}`
    }
  >
    <LoadingSpinner className="static bg-transparent" size={size} text={text} />
    {children && <div className="mt-4">{children}</div>}
  </div>
);

export default LoadingState;
