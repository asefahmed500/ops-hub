import { View } from "react-native";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";

/** MTO Compass mark: a compass ring with a north needle. */
export function LogoGlyph({ size = 44, color = "rgb(var(--primary))" }: { size?: number; color?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      stroke={color}
      strokeWidth={5}
      strokeLinecap="round"
    >
      <circle cx="50" cy="50" r="44" strokeWidth={5} />
      <path d="M50 22l13 28-13 28-13-28z" fill={color} stroke="none" />
      <circle cx="50" cy="50" r="4" fill={color} stroke="none" />
    </svg>
  );
}

export function LogoMark({ size = 56 }: { size?: number }) {
  return (
    <View
      className="items-center justify-center rounded-2xl border border-border bg-card"
      style={{ width: size, height: size }}
    >
      <LogoGlyph size={Math.round(size * 0.62)} />
    </View>
  );
}

export function LogoLockup({ tagline = "Your trainee journey, organised." }: { tagline?: string }) {
  return (
    <View className="items-center">
      <LogoMark size={64} />
      <Text className="font-signature mt-2 text-4xl text-foreground">
        MTO Compass
      </Text>
      <Text size="sm" className="mt-1 font-normal text-muted-foreground">
        {tagline}
      </Text>
    </View>
  );
}
