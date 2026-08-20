import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap transition-colors focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-none [&_svg]:size-3 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        brand: "border-transparent bg-brand text-brand-foreground",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        outline: "border-border bg-surface text-foreground",
        muted: "border-transparent bg-muted text-muted-foreground",
        // Semantic: soft tinted background with darker text, per design system.
        success: "border-transparent bg-success-soft text-success-strong",
        warning: "border-transparent bg-warning-soft text-warning-strong",
        error: "border-transparent bg-error-soft text-error-strong",
        info: "border-transparent bg-info-soft text-info-strong",
        // Subtle brand tint — used for CRM stages that are "in motion".
        accent: "border-transparent bg-primary-100 text-primary-800",
        destructive: "border-transparent bg-error-soft text-error-strong",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const Badge = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof badgeVariants>
>(({ className, variant, ...props }, ref) => (
  <div
    ref={ref}
    data-slot="badge"
    className={cn(badgeVariants({ variant }), className)}
    {...props}
  />
))
Badge.displayName = "Badge"

export { Badge, badgeVariants }
