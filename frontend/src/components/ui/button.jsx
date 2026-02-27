import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "pkp-btn pkp-focus-ring inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-semibold disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "pkp-btn-primary",
        destructive: "pkp-btn-danger",
        outline: "pkp-btn-ghost",
        secondary: "pkp-btn-secondary",
        ghost: "pkp-btn-ghost",
        link: "shadow-none border-0 bg-transparent text-[var(--pkp-blue)] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-12 px-5 py-2",
        sm: "h-10 px-4 text-xs",
        lg: "h-14 px-8 text-base",
        icon: "h-12 w-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"
  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props} />
  );
})
Button.displayName = "Button"

export { Button, buttonVariants }
