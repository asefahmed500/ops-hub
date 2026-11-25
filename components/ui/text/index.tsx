import React from "react";
import { Text as RNText } from "react-native";
import { tva } from "@gluestack-ui/utils/nativewind-utils";

const textStyle = tva({
  base: "text-foreground font-normal",
  variants: {
    size: {
      "2xs": "text-[10px] leading-3",
      xs: "text-xs leading-4",
      sm: "text-sm leading-5",
      md: "text-base leading-6",
      lg: "text-lg leading-7",
      xl: "text-xl leading-7",
    },
    weight: {
      regular: "font-normal", // 400 — body copy
      medium: "font-medium", // 500 — subtitles / labels
      semibold: "font-semibold", // 600 — strong emphasis
    },
  },
  defaultVariants: { size: "sm", weight: "regular" },
});

export interface TextProps extends React.ComponentProps<typeof RNText> {
  className?: string;
  size?: "2xs" | "xs" | "sm" | "md" | "lg" | "xl";
  weight?: "regular" | "medium" | "semibold";
  bold?: boolean;
  isTruncated?: boolean;
}

export const Text = React.forwardRef<React.ElementRef<typeof RNText>, TextProps>(
  ({ className, size, weight, bold, isTruncated, numberOfLines, ...props }, ref) => {
    const computedWeight = bold ? "semibold" : weight;
    return (
      <RNText
        ref={ref}
        numberOfLines={isTruncated ? (numberOfLines ?? 1) : numberOfLines}
        className={textStyle({ size, weight: computedWeight, class: className })}
        {...props}
      />
    );
  },
);
Text.displayName = "Text";
