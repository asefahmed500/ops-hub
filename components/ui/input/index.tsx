import React from "react";
import { View, TextInput } from "react-native";
import { createInput } from "@gluestack-ui/core/input/creator";
import { tva } from "@gluestack-ui/utils/nativewind-utils";

const inputRootStyle = tva({
  base: "flex-row items-center rounded-lg border border-input bg-card px-3",
  variants: {
    size: {
      sm: "h-9",
      md: "h-11",
      lg: "h-12",
    },
  },
  defaultVariants: { size: "md" },
});

const inputFieldStyle = tva({
  base: "flex-1 text-base text-foreground",
});

interface StyledRootProps {
  className?: string;
}

const Root = React.forwardRef<React.ElementRef<typeof View>, StyledRootProps & React.ComponentProps<typeof View>>(
  ({ className, ...props }, ref) => <View ref={ref} className={inputRootStyle({ class: className })} {...props} />,
);
Root.displayName = "InputRoot";

const Slot = React.forwardRef<React.ElementRef<typeof View>, React.ComponentProps<typeof View> & { className?: string }>(
  ({ className, ...props }, ref) => <View ref={ref} className={className} {...props} />,
);
Slot.displayName = "InputSlot";

const Field = React.forwardRef<React.ElementRef<typeof TextInput>, React.ComponentProps<typeof TextInput> & { className?: string }>(
  ({ className, ...props }, ref) => (
    <TextInput
      ref={ref}
      className={inputFieldStyle({ class: className })}
      placeholderTextColor="rgb(161 161 170)"
      {...props}
    />
  ),
);
Field.displayName = "InputField";

const Icon = React.forwardRef<React.ElementRef<typeof View>, React.ComponentProps<typeof View> & { className?: string }>(
  ({ className, ...props }, ref) => <View ref={ref} className={className} {...props} />,
);
Icon.displayName = "InputIcon";

export const Input = createInput<React.ComponentProps<typeof View>, React.ComponentProps<typeof View>, React.ComponentProps<typeof View>, React.ComponentProps<typeof TextInput>>({
  Root,
  Icon,
  Slot,
  Input: Field,
});

export const InputField = Field;
export const InputSlot = Slot;
export const InputIcon = Icon;
