import { View, Text, Pressable, ActivityIndicator } from "react-native";

export function ScreenLoading({ label = "Loading…" }: { label?: string }) {
  return (
    <View className="flex-1 items-center justify-center bg-background">
      <ActivityIndicator size="large" />
      <Text className="mt-3 text-sm text-muted-foreground">{label}</Text>
    </View>
  );
}

export function ScreenError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <View className="flex-1 items-center justify-center bg-background p-6">
      <Text className="mb-2 text-4xl">⚠️</Text>
      <Text className="text-center text-sm text-destructive">{message}</Text>
      {onRetry ? (
        <Pressable onPress={onRetry} className="mt-4 rounded-lg bg-primary px-5 py-2.5">
          <Text className="text-sm font-semibold text-primary-foreground">Retry</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
