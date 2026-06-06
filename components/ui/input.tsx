import * as React from "react"
import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-12 w-full border-[3px] border-retro-charcoal bg-white px-4 py-2 text-base font-bold text-retro-charcoal ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-black placeholder:text-retro-charcoal/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-retro-charcoal focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm shadow-[4px_4px_0_0_#262626] transition-transform focus:-translate-y-1 focus:shadow-[6px_6px_0_0_#262626]",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }