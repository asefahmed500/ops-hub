import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { LogoLockup } from "@/components/brand";
import { VStack } from "@/components/ui/vstack";
import { Card } from "@/components/ui/card";

interface AuthShellProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

/** Shared frame for all auth screens: centered column, brand lockup, fixed max width. */
export function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1 bg-background">
      <ScrollView contentContainerClassName="flex-grow justify-center p-6 py-12" keyboardShouldPersistTaps="handled">
        <View className="mx-auto w-full max-w-sm">
          <LogoLockup />
          <VStack space="lg" className="mt-8">
            <VStack space="xs">
              <Heading size="xl" className="text-foreground">
                {title}
              </Heading>
              {subtitle ? (
                <Text size="sm" className="font-normal text-muted-foreground">
                  {subtitle}
                </Text>
              ) : null}
            </VStack>
            <Card className="gap-4">{children}</Card>
          </VStack>
          {footer ? <View className="mt-6 items-center">{footer}</View> : null}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
