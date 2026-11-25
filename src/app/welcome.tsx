import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable } from "react-native";
import { router } from "expo-router";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useAuth } from "@/lib/auth";
import { LogoGlyph } from "@/components/brand";
import { Box } from "@/components/ui/box";
import { VStack } from "@/components/ui/vstack";
import { Text } from "@/components/ui/text";
import { Heading } from "@/components/ui/heading";

const REVEAL_MS = 2600;

export default function WelcomeScreen() {
  const { ready, token, user } = useAuth();
  const [revealDone, setRevealDone] = useState(false);
  const advanced = useRef(false);

  const ringOpacity = useSharedValue(0);
  const ringScale = useSharedValue(0.82);
  const markOpacity = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const textTranslate = useSharedValue(14);

  useEffect(() => {
    ringOpacity.value = withTiming(1, { duration: 500 });
    ringScale.value = withSpring(1, { damping: 13, stiffness: 140 });
    markOpacity.value = withDelay(650, withSpring(1, { damping: 15, stiffness: 160 }));
    textOpacity.value = withDelay(1100, withTiming(1, { duration: 420 }));
    textTranslate.value = withDelay(1100, withSpring(0, { damping: 16, stiffness: 160 }));
  }, [ringOpacity, ringScale, markOpacity, textOpacity, textTranslate]);

  const advance = () => {
    if (advanced.current || !ready) return;
    advanced.current = true;
    if (!token) router.replace("/sign-in");
    else if (user?.role === "platform_admin") router.replace("/platform" as never);
    else if (user?.role === "hr") router.replace("/(hr)" as never);
    else router.replace("/(trainee)" as never);
  };

  useEffect(() => {
    const t = setTimeout(() => setRevealDone(true), REVEAL_MS);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (revealDone) advance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revealDone, ready]);

  const ringStyle = useAnimatedStyle(() => ({
    opacity: ringOpacity.value,
    transform: [{ scale: ringScale.value }],
  }));
  const markStyle = useAnimatedStyle(() => ({ opacity: markOpacity.value }));
  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ translateY: textTranslate.value }],
  }));

  return (
    <Pressable className="flex-1 bg-background" onPress={() => setRevealDone(true)} accessibilityLabel="MTO Compass — tap to continue">
      <Box className="flex-1 items-center justify-center p-8">
        <Box className="h-28 w-28 items-center justify-center">
          <Animated.View style={ringStyle} className="absolute inset-0 items-center justify-center">
            <LogoGlyph size={110} />
          </Animated.View>
          <Animated.View style={markStyle} className="items-center justify-center">
            <Box className="h-6 w-6 rotate-45 rounded-sm bg-primary" />
          </Animated.View>
        </Box>

        <Animated.View style={textStyle}>
          <VStack space="xs" className="mt-7 items-center">
            <Text className="font-signature text-5xl text-foreground">
              MTO Compass
            </Text>
            <Text size="sm" className="font-normal text-muted-foreground">
              Your trainee journey, organised.
            </Text>
          </VStack>
        </Animated.View>
      </Box>

      <VStack space="md" className="items-center pb-16">
        {revealDone && !ready ? (
          <>
            <Text size="xs" className="font-normal text-muted-foreground">
              Preparing your programme…
            </Text>
            <ActivityIndicator size="small" className="mt-2" />
          </>
        ) : (
          <Text size="xs" className="font-normal text-muted-foreground">
            Tap anywhere to continue
          </Text>
        )}
      </VStack>
    </Pressable>
  );
}
