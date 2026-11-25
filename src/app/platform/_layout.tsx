import { Stack } from "expo-router";

export default function PlatformLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: "rgb(var(--card))" },
        headerTitleStyle: { fontWeight: "600" },
        headerTintColor: "rgb(var(--foreground))",
        contentStyle: { backgroundColor: "rgb(var(--background))" },
      }}
    >
      <Stack.Screen name="index" options={{ title: "Platform" }} />
      <Stack.Screen name="tenants" options={{ title: "Companies" }} />
    </Stack>
  );
}
