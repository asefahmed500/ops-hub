import "../../global.css";
import { useEffect } from "react";
import { View } from "react-native";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AuthProvider, useAuth } from "@/lib/auth";
import { MtoProvider } from "@/lib/mto";
import { ScreenLoading } from "@/components/screen-state";

const AUTH_SEGMENTS = new Set(["sign-in", "sign-up", "join", "forgot-password"]);

/** Where each account type lands after sign-in. */
function homeFor(role?: string): string {
  if (role === "platform_admin") return "/platform";
  if (role === "hr") return "/(hr)";
  return "/(trainee)";
}

function AuthGate({ children }: { children: React.ReactNode }) {
  const { ready, token, user } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const onWelcome = segments[0] === "welcome";
  const inAuthGroup = AUTH_SEGMENTS.has(segments[0] ?? "");
  const target = homeFor(user?.role);

  useEffect(() => {
    // The welcome splash routes on its own once the session check settles.
    if (!ready || onWelcome) return;
    if (!token && !inAuthGroup) {
      router.replace("/sign-in");
    } else if (token && inAuthGroup) {
      router.replace(target as never);
    } else if (
      token &&
      ((user?.role === "platform_admin" && segments[0] !== "platform") ||
        (user?.role === "trainee" && segments[0] !== "(trainee)" && !inAuthGroup) ||
        (user?.role === "hr" && segments[0] !== "(hr)" && !inAuthGroup))
    ) {
      router.replace(target as never);
    }
  }, [ready, token, inAuthGroup, onWelcome, user, target, segments, router]);

  // Screens render their own loading states while the session restores.
  if (!ready && !onWelcome && !inAuthGroup) {
    return (
      <View className="flex-1 bg-background">
        <ScreenLoading label="Loading MTO Compass…" />
      </View>
    );
  }
  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <MtoProvider>
        <AuthGate>
          <StatusBar style="auto" />
          <Stack
            screenOptions={{
              headerShown: false,
              headerStyle: { backgroundColor: "rgb(var(--card))" },
              headerTitleStyle: { fontWeight: "600" },
              headerTintColor: "rgb(var(--foreground))",
              contentStyle: { backgroundColor: "rgb(var(--background))" },
            }}
          >
            <Stack.Screen name="welcome" />
            <Stack.Screen name="sign-in" />
            <Stack.Screen name="sign-up" />
            <Stack.Screen name="join" />
            <Stack.Screen name="forgot-password" />
            <Stack.Screen name="(trainee)" />
            <Stack.Screen name="(hr)" />
            <Stack.Screen name="platform" options={{ headerShown: false }} />
          </Stack>
        </AuthGate>
      </MtoProvider>
    </AuthProvider>
  );
}
