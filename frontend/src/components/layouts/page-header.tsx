import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  actions?: ReactNode;
  className?: string;
  sidebarToggle?: ReactNode;
}

export function PageHeader({
  title,
  actions,
  className,
  sidebarToggle,
}: PageHeaderProps) {
  return (
    <div
      className={cn("flex h-14 items-center justify-between px-4", className)}
    >
      <div className="flex items-center gap-2">
        {sidebarToggle}
        <h1 className="font-bold text-lg">{title}</h1>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
