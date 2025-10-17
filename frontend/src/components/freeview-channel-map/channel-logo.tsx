type ChannelLogoProps = {
  logoUrl?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
};

export function ChannelLogo({
  logoUrl,
  size = "md",
  className = "",
}: ChannelLogoProps) {
  const sizeClasses = {
    lg: "size-12",
    md: "size-10",
    sm: "size-8",
  };

  if (!logoUrl) {
    return null;
  }

  const getPlaceholderSize = () => {
    if (size === "sm") {
      return "32";
    }
    if (size === "lg") {
      return "48";
    }
    return "40";
  };

  return (
    <div
      className={`flex ${sizeClasses[size]} items-center justify-center rounded-md bg-muted/50 ${className}`}
    >
      <img
        alt=""
        className="max-h-full max-w-full object-contain p-1"
        loading="lazy"
        onError={(e) => {
          e.currentTarget.src = `/placeholder.svg?height=${getPlaceholderSize()}&width=${getPlaceholderSize()}`;
        }}
        src={logoUrl}
      />
    </div>
  );
}
