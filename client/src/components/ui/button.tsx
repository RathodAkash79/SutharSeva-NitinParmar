import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-sm whitespace-nowrap rounded-full text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-50 transition [&_svg]:size-4 [&_svg]:shrink-0 min-h-11 px-lg py-sm",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-white hover:bg-primary-dark active:bg-primary-dark shadow-md hover:shadow-lg",
        destructive:
          "bg-danger text-white hover:bg-danger-dark active:bg-danger-dark shadow-md hover:shadow-lg",
        secondary:
          "bg-surface text-secondary border border-border hover:border-primary hover:bg-background",
        success:
          "bg-success text-white hover:bg-success-dark active:bg-success-dark shadow-md hover:shadow-lg",
        outline:
          "border-2 border-primary text-primary hover:bg-primary hover:text-white active:bg-primary-dark",
        ghost: 
          "text-primary hover:bg-background rounded-lg",
      },
      size: {
        default: "min-h-11 px-lg py-sm text-base",
        sm: "min-h-9 px-md py-xs text-xs rounded-lg",
        lg: "min-h-12 px-xl py-md text-lg rounded-full",
        icon: "h-10 w-10 rounded-full p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  },
)
Button.displayName = "Button"

export { Button, buttonVariants }
