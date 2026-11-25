import { View } from "react-native";
import { Text } from "@/components/ui/text";

function initials(name?: string): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function Avatar({
  name,
  size = 36,
  className = "",
}: {
  name?: string | null;
  size?: number;
  className?: string;
}) {
  return (
    <View
      className={`items-center justify-center rounded-full border border-primary/20 bg-primary/10 ${className}`}
      style={{ width: size, height: size }}
    >
      <Text
        weight="semibold"
        className="text-primary"
        style={{ fontSize: Math.max(10, Math.round(size * 0.36)) }}
      >
        {initials(name ?? undefined)}
      </Text>
    </View>
  );
}
