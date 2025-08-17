import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"

import { cn } from "@/lib/utils"

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> & {
    current?: number;
    total?: number;
    hideOnZero?: boolean;
    label?: string;
  }
>(({ className, value, current, total, hideOnZero = true, label, ...props }, ref) => {
  // Calculate progress from current/total if provided
  const progress = current !== undefined && total !== undefined 
    ? total > 0 ? (current / total) * 100 : 0
    : value || 0;

  // Hide progress bar if total is 0 and hideOnZero is true
  if (hideOnZero && total !== undefined && total === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-3 w-full">
      <ProgressPrimitive.Root
        ref={ref}
        className={cn(
          "relative h-1 flex-1 overflow-hidden rounded-full bg-muted",
          className
        )}
        {...props}
      >
        <ProgressPrimitive.Indicator
          className="h-full w-full flex-1 bg-primary transition-all rounded-full"
          style={{ transform: `translateX(-${100 - progress}%)` }}
        />
      </ProgressPrimitive.Root>
      
      {/* Label showing current/total */}
      {current !== undefined && total !== undefined && (
        <span className="text-sm text-muted-foreground min-w-0 flex-shrink-0">
          {current} of {total}
        </span>
      )}
      
      {/* Custom label */}
      {label && (
        <span className="text-sm text-muted-foreground min-w-0 flex-shrink-0">
          {label}
        </span>
      )}
    </div>
  );
})
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }
