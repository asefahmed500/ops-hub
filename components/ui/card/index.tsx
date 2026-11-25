import React from "react";
import { View } from "react-native";

export const Card = React.forwardRef<React.ElementRef<typeof View>, React.ComponentProps<typeof View> & { className?: string }>(
  ({ className, ...props }, ref) => (
    <View ref={ref} className={`rounded-2xl border border-border bg-card p-4 ${className || ""}`} {...props} />
  ),
);
Card.displayName = "Card";

export const CardHeader = React.forwardRef<React.ElementRef<typeof View>, React.ComponentProps<typeof View> & { className?: string }>(
  ({ className, ...props }, ref) => (
    <View ref={ref} className={`pb-3 ${className || ""}`} {...props} />
  ),
);
CardHeader.displayName = "CardHeader";

export const CardBody = React.forwardRef<React.ElementRef<typeof View>, React.ComponentProps<typeof View> & { className?: string }>(
  ({ className, ...props }, ref) => (
    <View ref={ref} className={`${className || ""}`} {...props} />
  ),
);
CardBody.displayName = "CardBody";

export const CardFooter = React.forwardRef<React.ElementRef<typeof View>, React.ComponentProps<typeof View> & { className?: string }>(
  ({ className, ...props }, ref) => (
    <View ref={ref} className={`pt-3 border-t border-border flex-row items-center justify-between ${className || ""}`} {...props} />
  ),
);
CardFooter.displayName = "CardFooter";
