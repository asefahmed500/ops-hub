import React from "react";
import { View, Text } from "react-native";
import { tva } from "@gluestack-ui/utils/nativewind-utils";

const badgeStyle = tva({
  base: "flex-row items-center justify-center rounded-full px-2.5 py-0.5",
  variants: {
    variant: {
      default: "bg-secondary",
      success: "bg-success/15",
      warning: "bg-amber/15",
      destructive: "bg-destructive/15",
      info: "bg-primary/15",
      outline: "border border-border bg-transparent",
    },
    size: {
      sm: "px-2 py-0.5",
      md: "px-2.5 py-0.5",
      lg: "px-3 py-1",
    },
  },
  defaultVariants: { variant: "default", size: "md" },
});

const badgeTextStyle = tva({
  base: "text-xs font-medium",
  variants: {
    variant: {
      default: "text-secondary-foreground",
      success: "text-success",
      warning: "text-amber",
      destructive: "text-destructive",
      info: "text-primary",
      outline: "text-foreground",
    },
  },
  defaultVariants: { variant: "default" },
});

export interface BadgeProps extends React.ComponentProps<typeof View> {
  className?: string;
  variant?: "default" | "success" | "warning" | "destructive" | "info" | "outline";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
}

/** Wraps primitive children in styled Text — RN Views cannot contain raw text nodes. */
function wrapPrimitiveChildren(node: React.ReactNode, variant?: BadgeProps["variant"]): React.ReactNode {
  if (typeof node === "string" || typeof node === "number") {
    return <Text className={badgeTextStyle({ variant })}>{node}</Text>;
  }
  if (Array.isArray(node)) {
    return node.map((child, i) => (
      <React.Fragment key={i}>{wrapPrimitiveChildren(child, variant)}</React.Fragment>
    ));
  }
  return node;
}

export const Badge = React.forwardRef<React.ElementRef<typeof View>, BadgeProps>(
  ({ className, variant, size, children, ...props }, ref) => {
    return (
      <View ref={ref} className={badgeStyle({ variant, size, class: className })} {...props}>
        {wrapPrimitiveChildren(children, variant)}
      </View>
    );
  },
);
Badge.displayName = "Badge";

export const BadgeText = React.forwardRef<React.ElementRef<typeof Text>, React.ComponentProps<typeof Text> & { className?: string }>(
  ({ className, ...props }, ref) => (
    <Text ref={ref} className={`text-xs font-medium ${className || ""}`} {...props} />
  ),
);
BadgeText.displayName = "BadgeText";
