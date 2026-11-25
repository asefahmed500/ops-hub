import { Pressable } from "react-native";
import { router } from "expo-router";
import { AuthShell } from "@/components/auth-shell";
import { Text } from "@/components/ui/text";
import { Card } from "@/components/ui/card";
import { Button, ButtonText } from "@/components/ui/button";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { Box } from "@/components/ui/box";
import { ShieldCheckIcon } from "@/components/ui/icon";

const STEPS = [
  "Contact your HR admin — they manage the programme.",
  "HR resets your password from the workspace settings.",
  "Sign in with the new password.",
];

export default function ForgotPasswordScreen() {
  return (
    <AuthShell
      title="Reset password"
      subtitle="Password resets are handled by your HR admin"
      footer={
        <Pressable onPress={() => router.replace("/sign-in")} hitSlop={8}>
          <Text size="sm" className="text-primary">
            Back to sign in
          </Text>
        </Pressable>
      }
    >
      <Card className="p-4">
        <HStack space="md">
          <Box className="h-9 w-9 items-center justify-center rounded-lg bg-accent">
            <ShieldCheckIcon size={18} color="rgb(var(--accent-foreground))" strokeWidth={1.8} />
          </Box>
          <Text size="sm" className="flex-1 text-foreground">
            How to get back in
          </Text>
        </HStack>
        <VStack space="sm" className="mt-3">
          {STEPS.map((step, i) => (
            <HStack key={i} space="sm" className="items-start">
              <Box className="h-5 w-5 items-center justify-center rounded-full bg-secondary">
                <Text size="2xs" className="text-secondary-foreground">
                  {i + 1}
                </Text>
              </Box>
              <Text size="sm" className="flex-1 font-normal leading-5 text-muted-foreground">
                {step}
              </Text>
            </HStack>
          ))}
        </VStack>
      </Card>

      <Button onPress={() => router.replace("/sign-in")} className="btn border border-border bg-transparent active:bg-secondary/60">
        <ButtonText className="text-foreground">Back to sign in</ButtonText>
      </Button>
    </AuthShell>
  );
}
