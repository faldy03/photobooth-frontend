"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-white group-[.toaster]:text-retro-charcoal group-[.toaster]:border-[4px] group-[.toaster]:border-retro-charcoal group-[.toaster]:shadow-[6px_6px_0_0_#262626] group-[.toaster]:rounded-none group-[.toaster]:font-bold group-[.toaster]:p-4 group-[.toaster]:text-base group-[.toaster]:uppercase group-[.toaster]:tracking-widest font-sans",
          description: "group-[.toast]:text-retro-charcoal/70 group-[.toast]:text-sm group-[.toast]:font-bold",
          actionButton:
            "group-[.toast]:bg-retro-red group-[.toast]:text-white group-[.toast]:border-[2px] group-[.toast]:border-retro-charcoal group-[.toast]:rounded-none group-[.toast]:font-black",
          cancelButton:
            "group-[.toast]:bg-retro-cream group-[.toast]:text-retro-charcoal group-[.toast]:border-[2px] group-[.toast]:border-retro-charcoal group-[.toast]:rounded-none group-[.toast]:font-black",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }