import { ScrollView, Pressable, Switch } from "react-native";
import { router } from "expo-router";
import { useAuth } from "@/lib/auth";
import { useMto } from "@/lib/mto";
import { Avatar } from "@/components/avatar";
import { SectionHeader } from "@/components/mto-bits";
import { ScreenLoading } from "@/components/screen-state";
import { ConfirmModal } from "@/components/confirm-modal";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonText } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Box } from "@/components/ui/box";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { Text } from "@/components/ui/text";
import { Heading } from "@/components/ui/heading";
import { useState } from "react";

export default function MeScreen() {
  const { user, signOut } = useAuth();
  const { me, programme, updateProgramme, ready, refresh } = useMto();
  const [confirmOut, setConfirmOut] = useState(false);

  if (!ready || !me) return <ScreenLoading label="Loading profile…" />;
  const lang = programme.language;

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="p-4 pb-16">
      <Box className="mx-auto w-full max-w-md">
        <Text size="xs" className="font-normal text-muted-foreground">
          Profile
        </Text>
        <Heading size="xl" className="mt-0.5 text-foreground">
          Me
        </Heading>

        <Card className="mt-4">
          <HStack space="md">
            <Avatar name={me.name} size={46} />
            <VStack space="xs" className="flex-1">
              <HStack space="sm" className="items-center">
                <Text weight="medium" className="flex-1 text-foreground" numberOfLines={1}>
                  {me.name}
                </Text>
                <Badge size="sm" variant="success">
                  {me.role === "hr" ? "HR" : "MTO"}
                </Badge>
              </HStack>
              <Text size="xs" className="font-normal text-muted-foreground">
                {me.role === "hr" ? "Programme admin" : `MTO${me.dept ? ` · ${me.dept}` : ""}`} ·{" "}
                {me.companyName}
              </Text>
              <Text size="xs" className="font-normal text-muted-foreground" numberOfLines={1}>
                {me.email}
              </Text>
            </VStack>
          </HStack>
        </Card>

        <SectionHeader title="Preferences" />
        <Card className="overflow-hidden p-0">
          <HStack space="md" className="justify-between border-b border-border p-3.5">
            <Text className="text-foreground">বাংলা language</Text>
            <Switch
              value={lang === "bn"}
              onValueChange={(v) => {
                if (me.role === "hr") void updateProgramme({ language: v ? "bn" : "en" });
                else void refresh();
              }}
              trackColor={{ false: "rgb(var(--border))", true: "rgb(var(--primary))" }}
            />
          </HStack>
          {me.role === "trainee" ? (
            <HStack space="md" className="justify-between border-b border-border p-3.5">
              <VStack space="xs" className="flex-1 pr-3">
                <Text className="text-foreground">Export my data</Text>
                <Text size="2xs" className="font-normal text-muted-foreground">
                  CSV export lives in the Growth tab.
                </Text>
              </VStack>
              <Pressable onPress={() => router.push("/(trainee)/growth" as never)} hitSlop={8} className="self-center">
                <Text size="sm" className="text-primary">
                  Open
                </Text>
              </Pressable>
            </HStack>
          ) : null}
        </Card>

        <Button  onPress={() => setConfirmOut(true)} className="btn mt-6">
          <ButtonText className="text-foreground">Sign out</ButtonText>
        </Button>

        <Text size="2xs" className="mt-6 text-center font-normal text-muted-foreground">
          MTO Compass v1.0.0
        </Text>
      </Box>

      <ConfirmModal
        visible={confirmOut}
        title="Sign out?"
        message="You can sign back in anytime."
        confirmLabel="Sign out"
        onConfirm={async () => {
          setConfirmOut(false);
          await signOut();
        }}
        onCancel={() => setConfirmOut(false)}
      />
      {user ? null : null}
    </ScrollView>
  );
}
