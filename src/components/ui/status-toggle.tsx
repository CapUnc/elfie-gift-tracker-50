import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { ShoppingCart, Package, Check } from "lucide-react"
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

const labelMap = {
  purchased: "Mark as purchased",
  wrapped: "Mark as wrapped"
}

const StatusToggle = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  StatusToggleProps
>(({ className, type, checked, ...props }, ref) => {
  const Icon = iconMap[type]
  const baseColor = type === 'purchased' ? 'emerald' : 'blue'
  
  return (
    <CheckboxPrimitive.Root
      ref={ref}
      checked={checked}
      className={cn(
        // Base styles - 32px visible circle with 44px hit area for accessibility
        "relative h-8 w-8 shrink-0 rounded-full transition-all duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "hover:scale-105 active:scale-95",
        // 44px minimum hit area
        "before:content-[''] before:absolute before:inset-[-6px] before:rounded-full",
        // Off state: soft outlined circle
        checked 
          ? type === 'purchased' 
            ? "bg-emerald-600 border-2 border-emerald-600 text-white shadow-md"
            : "bg-blue-600 border-2 border-blue-600 text-white shadow-md"
          : type === 'purchased'
            ? "border-2 border-emerald-300 text-emerald-600 bg-background hover:bg-emerald-50"
            : "border-2 border-blue-300 text-blue-600 bg-background hover:bg-blue-50",
        className
      )}
      title={labelMap[type]}
      {...props}
    >
      <div className="relative flex items-center justify-center w-full h-full">
        {/* Main icon */}
        <Icon 
          className={cn(
            "h-4 w-4 transition-all duration-200",
            checked ? "fill-current" : "stroke-current fill-none"
          )}
          strokeWidth={checked ? 0 : 1.5}
        />
        {/* Check overlay for on state */}
        {checked && (
          <div className="absolute -top-1 -right-1 bg-white rounded-full p-0.5">
            <Check className="h-2.5 w-2.5 text-emerald-600 stroke-[3]" />
          </div>
        )}
      </div>
    </CheckboxPrimitive.Root>
  )
})

StatusToggle.displayName = "StatusToggle"

export { StatusToggle }