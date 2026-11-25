import React from "react";
import { Text as RNText } from "react-native";
import { tva } from "@gluestack-ui/utils/nativewind-utils";

const headingStyle = tva({
  base: "text-foreground font-semibold",
  variants: {
    size: {
      xs: "text-xs leading-4 tracking-[-0.01em]",
      sm: "text-sm leading-5 tracking-[-0.01em]",
      md: "text-base leading-6 tracking-[-0.01em]",
      lg: "text-lg leading-7 tracking-[-0.01em]",
      xl: "text-xl leading-7 tracking-[-0.02em]",
      "2xl": "text-2xl leading-8 tracking-[-0.02em]",
      "3xl": "text-3xl leading-9 tracking-[-0.02em]",
      "4xl": "text-4xl leading-10 tracking-[-0.02em]",
    },
  },
  defaultVariants: { size: "lg" },
});

export interface HeadingProps extends React.ComponentProps<typeof RNText> {
  className?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl";
  isTruncated?: boolean;
}

export const Heading = React.forwardRef<React.ElementRef<typeof RNText>, HeadingProps>(
  ({ className, size, isTruncated, numberOfLines, ...props }, ref) => (
    <RNText
      ref={ref}
      numberOfLines={isTruncated ? (numberOfLines ?? 1) : numberOfLines}
      className={headingStyle({ size, class: className })}
      {...props}
    />
  ),
);
Heading.displayName = "Heading";
