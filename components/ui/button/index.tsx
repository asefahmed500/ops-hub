import React from "react";
import { Pressable, Text, View, ActivityIndicator } from "react-native";
import { createButton } from "@gluestack-ui/core/button/creator";
import { tva } from "@gluestack-ui/utils/nativewind-utils";

const buttonStyle = tva({
  base: "flex-row items-center justify-center gap-1.5 rounded-lg",
  variants: {
    variant: {
      primary: "bg-primary",
      outline: "border border-primary bg-transparent",
      ghost: "bg-transparent",
      danger: "bg-destructive",
      secondary: "bg-secondary",
    },
    size: {
      sm: "h-9 px-3",
      md: "h-11 px-4",
      lg: "h-12 px-6",
    },
  },
  defaultVariants: { variant: "primary", size: "md" },
});

const buttonTextStyle = tva({
  base: "text-sm font-medium",
  variants: {
    variant: {
      primary: "text-primary-foreground",
      outline: "text-primary",
      ghost: "text-foreground",
      danger: "text-white",
      secondary: "text-secondary-foreground",
    },
  },
  defaultVariants: { variant: "primary" },
});

type ButtonVariant = "primary" | "outline" | "ghost" | "danger" | "secondary";

interface StyledRootProps {
  className?: string;
  variant?: ButtonVariant;
}

const Root = React.forwardRef<React.ElementRef<typeof Pressable>, StyledRootProps & React.ComponentProps<typeof Pressable>>(
  ({ className, variant, ...props }, ref) => (
    <Pressable
      ref={ref}
      className={buttonStyle({ class: className, variant })}
      role="button"
      {...props}
    />
  ),
);
Root.displayName = "ButtonRoot";

interface StyledTextProps {
  className?: string;
  variant?: ButtonVariant;
}

const StyledText = React.forwardRef<React.ElementRef<typeof Text>, StyledTextProps & React.ComponentProps<typeof Text>>(
  ({ className, variant, ...props }, ref) => (
    <Text ref={ref} className={buttonTextStyle({ class: className, variant })} {...props} />
  ),
);
StyledText.displayName = "ButtonText";

const Group = React.forwardRef<React.ElementRef<typeof View>, React.ComponentProps<typeof View> & { className?: string }>(
  ({ className, ...props }, ref) => <View ref={ref} className={className} {...props} />,
);
Group.displayName = "ButtonGroup";

const Spinner = React.forwardRef<React.ElementRef<typeof ActivityIndicator>, React.ComponentProps<typeof ActivityIndicator>>(
  (props, ref) => <ActivityIndicator ref={ref} {...props} />,
);
Spinner.displayName = "ButtonSpinner";

const Icon = React.forwardRef<React.ElementRef<typeof View>, React.ComponentProps<typeof View> & { className?: string }>(
  ({ className, ...props }, ref) => <View ref={ref} className={className} {...props} />,
);
Icon.displayName = "ButtonIcon";

export const Button = createButton<React.ComponentProps<typeof Pressable>, React.ComponentProps<typeof Text>, React.ComponentProps<typeof View>, React.ComponentProps<typeof ActivityIndicator>, React.ComponentProps<typeof View>>({
  Root,
  Text: StyledText,
  Group,
  Spinner,
  Icon,
});

export const ButtonText = StyledText;
