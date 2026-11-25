import React from "react";
import { View } from "react-native";

export interface BoxProps extends React.ComponentProps<typeof View> {
  className?: string;
}

export const Box = React.forwardRef<React.ElementRef<typeof View>, BoxProps>(
  ({ className, ...props }, ref) => <View ref={ref} className={className} {...props} />,
);
Box.displayName = "Box";
