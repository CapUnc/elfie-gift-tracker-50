import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { ShoppingCart, Package } from "lucide-react"
import { cn } from "@/lib/utils"

type StatusType = 'purchased' | 'wrapped'

interface StatusToggleProps extends Omit<React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>, 'children' | 'type'> {
  type: StatusType
  checked?: boolean
  className?: string
}

const iconMap = {
  purchased: ShoppingCart,
  wrapped: Package
}

const colorMap = {
  purchased: "data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600 data-[state=checked]:text-white data-[state=unchecked]:border-emerald-300 data-[state=unchecked]:text-emerald-600",
  wrapped: "data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 data-[state=checked]:text-white data-[state=unchecked]:border-blue-300 data-[state=unchecked]:text-blue-600"
}

const StatusToggle = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  StatusToggleProps
>(({ className, type, checked, ...props }, ref) => {
  const Icon = iconMap[type]
  
  return (
    <CheckboxPrimitive.Root
      ref={ref}
      checked={checked}
      className={cn(
        "peer h-6 w-6 shrink-0 rounded-sm border-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 hover:scale-105",
        colorMap[type],
        className
      )}
      aria-label={`Mark as ${type}`}
      {...props}
    >
      {/* Always show icon - no ghost icons */}
      <div className="flex items-center justify-center text-current">
        <Icon 
          className={cn(
            "h-4 w-4 transition-all duration-200",
            checked ? "fill-current" : "stroke-current fill-none"
          )}
          strokeWidth={checked ? 0 : 1.5}
        />
      </div>
    </CheckboxPrimitive.Root>
  )
})

StatusToggle.displayName = "StatusToggle"

export { StatusToggle }