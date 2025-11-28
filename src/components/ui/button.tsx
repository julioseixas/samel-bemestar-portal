import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-base font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-5 [&_svg]:shrink-0 active:scale-[0.98] tap-highlight-none",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary-hover shadow-soft active:shadow-none",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-soft active:shadow-none",
        outline: "border-2 border-primary bg-card text-primary hover:bg-accent active:bg-accent/80",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 active:bg-secondary/60",
        ghost: "hover:bg-accent hover:text-accent-foreground active:bg-accent/80",
        link: "text-primary underline-offset-4 hover:underline",
        success: "bg-success text-success-foreground hover:bg-success/90 shadow-soft active:shadow-none",
        warning: "bg-warning text-warning-foreground hover:bg-warning/90 shadow-soft active:shadow-none",
      },
      size: {
        default: "h-12 min-h-[44px] px-6 py-3 xs:min-h-[48px] sm:h-12",
        sm: "h-10 min-h-[40px] rounded-md px-4 xs:min-h-[44px] sm:h-10",
        lg: "h-14 min-h-[48px] rounded-lg px-8 text-lg xs:min-h-[52px] sm:h-14",
        xl: "h-16 min-h-[52px] rounded-xl px-10 text-xl xs:min-h-[56px] sm:h-16",
        icon: "h-12 w-12 min-h-[44px] min-w-[44px] xs:min-h-[48px] xs:min-w-[48px] sm:h-12 sm:w-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
