import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  [
    "group/button inline-flex shrink-0 items-center justify-center gap-2.5",
    "rounded-[2rem] border-2 border-transparent bg-clip-padding",
    "text-lg font-semibold whitespace-nowrap",
    "shadow-lg drop-shadow-md",
    "transition-all duration-150 ease-out",
    "outline-none select-none",
    "human-press",
    "focus-visible:border-ring focus-visible:ring-4 focus-visible:ring-ring/40",
    "disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none",
    "aria-invalid:border-destructive aria-invalid:ring-4 aria-invalid:ring-destructive/25",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-6",
  ].join(" "),
  {
    variants: {
      variant: {
        default: [
          "text-primary-foreground",
          "bg-[image:var(--human-primary-gradient)]",
          "hover:brightness-110 hover:shadow-xl",
          "dark:text-isabel-deep-950",
        ].join(" "),
        outline: [
          "border-border/80 bg-card/80 text-foreground backdrop-blur-sm",
          "hover:border-accent hover:bg-accent/10 hover:shadow-xl",
          "dark:border-input dark:bg-card/60",
        ].join(" "),
        secondary: [
          "border-secondary bg-secondary text-secondary-foreground",
          "hover:brightness-95 hover:shadow-xl",
        ].join(" "),
        ghost: [
          "border-transparent bg-transparent shadow-none drop-shadow-none",
          "hover:bg-muted/80 hover:shadow-md",
        ].join(" "),
        destructive: [
          "border-destructive/30 bg-destructive text-white",
          "hover:bg-destructive/90 hover:shadow-xl",
        ].join(" "),
        accent: [
          "border-accent/40 bg-accent text-accent-foreground",
          "hover:brightness-105 hover:shadow-xl",
          "shadow-[var(--human-accent-glow)]",
        ].join(" "),
        link: "h-auto min-h-0 rounded-none border-0 bg-transparent p-0 text-lg font-semibold text-primary underline-offset-4 shadow-none drop-shadow-none hover:underline",
      },
      size: {
        default: "min-h-16 px-8 py-3",
        sm: "min-h-16 px-6 py-3 text-base",
        lg: "min-h-20 px-10 py-4 text-xl [&_svg:not([class*='size-'])]:size-7",
        icon: "size-16 min-h-16 min-w-16 p-0",
        "icon-sm": "size-16 min-h-16 min-w-16 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
