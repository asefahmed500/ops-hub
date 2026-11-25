import React from "react";
import { View } from "react-native";
import { tva } from "@gluestack-ui/utils/nativewind-utils";

const vstackStyle = tva({
  base: "flex-col",
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
      true: "flex-col-reverse",
    },
  },
});

export interface VStackProps extends React.ComponentProps<typeof View> {
  className?: string;
  space?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  reversed?: boolean;
}

export const VStack = React.forwardRef<React.ElementRef<typeof View>, VStackProps>(
  ({ className, space, reversed, ...props }, ref) => (
    <View ref={ref} className={vstackStyle({ space, reversed, class: className })} {...props} />
  ),
);
VStack.displayName = "VStack";
