import React from "react";
import { View } from "react-native";
import { tva } from "@gluestack-ui/utils/nativewind-utils";

const hstackStyle = tva({
  base: "flex-row items-center",
  variants: {
    space: {
      xs: "gap-1",
      sm: "gap-2",
      md: "gap-3",
      lg: "gap-4",
      xl: "gap-5",
      "2xl": "gap-6",
    },
    reversed: {
      true: "flex-row-reverse",
    },
  },
});

export interface HStackProps extends React.ComponentProps<typeof View> {
  className?: string;
  space?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  reversed?: boolean;
}

export const HStack = React.forwardRef<React.ElementRef<typeof View>, HStackProps>(
  ({ className, space, reversed, ...props }, ref) => (
    <View ref={ref} className={hstackStyle({ space, reversed, class: className })} {...props} />
  ),
);
HStack.displayName = "HStack";
