import * as React from "react"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "pkp-badge inline-flex items-center text-xs transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "pkp-badge-confirmed",
        secondary: "pkp-badge-active",
        destructive: "pkp-badge-overdue",
        outline: "bg-white border-[var(--pkp-border)] text-foreground",
        pending: "pkp-badge-pending",
        confirmed: "pkp-badge-confirmed",
        active: "pkp-badge-active",
        overdue: "pkp-badge-overdue",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant,
  ...props
}) {
  return (<div className={cn(badgeVariants({ variant }), className)} {...props} />);
}

export { Badge, badgeVariants }
