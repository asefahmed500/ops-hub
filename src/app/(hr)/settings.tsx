import { useEffect, useState } from "react";
import { Platform, Pressable, ScrollView, Share, Switch } from "react-native";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { useMto } from "@/lib/mto";
import { ConfirmModal } from "@/components/confirm-modal";
import { ScreenLoading } from "@/components/screen-state";
import { Button, ButtonText } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { Text } from "@/components/ui/text";
import { Heading } from "@/components/ui/heading";
import { Box } from "@/components/ui/box";

export default function HrSettingsScreen() {
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const { token, user, signOut } = useAuth();
  const { me, programme, updateProgramme, ready } = useMto();
  const [confirmOut, setConfirmOut] = useState(false);

  useEffect(() => {
    if (!token) return;
    api<{ inviteCode: string }>("/auth/tenants/me", { token })
      .then((r) => setInviteCode(r.inviteCode))
      .catch(() => setInviteCode(null));
  }, [token]);

  if (!ready || !me) return <ScreenLoading label="Loading settings…" />;

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="p-4 pb-16">
      <Box className="mx-auto w-full max-w-md">
        <Text size="xs" className="font-normal text-muted-foreground">
          Admin
        </Text>
        <Heading size="xl" className="mt-0.5 text-foreground">
          Settings
        </Heading>

        <Card className="mt-4">
          <HStack space="sm" className="justify-between">
            <Text className="text-muted-foreground">Company</Text>
            <Text weight="medium" className="text-foreground">
              {me.companyName}
            </Text>
          </HStack>
        </Card>

        <Card className="mt-3">
          <HStack space="sm" className="justify-between">
            <Text className="text-foreground">Invite code</Text>
            <Pressable hitSlop={8}>
              <Box className="rounded-full bg-accent px-3 py-1">
                <Text size="sm" className="text-accent-foreground">
                  {programme ? inviteCode : "—"}
                </Text>
              </Box>
            </Pressable>
          </HStack>
        </Card>

        <Card className="mt-3 overflow-hidden p-0">
          <HStack space="md" className="justify-between border-b border-border p-3.5">
            <Text className="text-foreground">Supervisors can view logs</Text>
            <Switch
              value={programme.supervisorsViewLogs}
              onValueChange={(v) => void updateProgramme({ supervisorsViewLogs: v })}
              trackColor={{ false: "rgb(var(--border))", true: "rgb(var(--primary))" }}
            />
          </HStack>
          <HStack space="md" className="justify-between p-3.5">
            <Text className="text-foreground">Trainees can export data</Text>
            <Switch
              value={programme.traineesExport}
              onValueChange={(v) => void updateProgramme({ traineesExport: v })}
              trackColor={{ false: "rgb(var(--border))", true: "rgb(var(--primary))" }}
            />
          </HStack>
        </Card>

        <Card className="mt-3">
          <Text weight="medium" className="text-foreground">
            Programme
          </Text>
          <HStack space="xs" className="mt-3 rounded-xl bg-secondary p-1">
            {[6, 12, 18].map((m) => (
              <Pressable key={m} onPress={() => void updateProgramme({ lengthMonths: m })} className="flex-1 rounded-lg py-2">
                <Box className={programme.lengthMonths === m ? "rounded-lg bg-card shadow-sm" : ""}>
                  <Text size="sm" className={`py-0.5 text-center ${programme.lengthMonths === m ? "text-foreground" : "text-muted-foreground"}`}>
                    {m} mo
                  </Text>
                </Box>
              </Pressable>
            ))}
          </HStack>
          <HStack space="xs" className="mt-2 rounded-xl bg-secondary p-1">
            {(["en", "bn"] as const).map((l) => (
              <Pressable key={l} onPress={() => void updateProgramme({ language: l })} className="flex-1 rounded-lg py-2">
                <Box className={programme.language === l ? "rounded-lg bg-card shadow-sm" : ""}>
                  <Text size="sm" className={`py-0.5 text-center ${programme.language === l ? "text-foreground" : "text-muted-foreground"}`}>
                    {l === "en" ? "English" : "বাংলা"}
                  </Text>
                </Box>
              </Pressable>
            ))}
          </HStack>
          <Text size="xs" className="mt-2 font-normal text-muted-foreground">
            Programme length and language apply to the whole workspace.
          </Text>
        </Card>

        <Button
          
          className="btn mt-5"
          onPress={async () => {
            const code = inviteCode;
            if (!code) return;
            if (Platform.OS === "web") await navigator.clipboard?.writeText(code);
            else await Share.share({ message: `Join the MTO programme with code: ${code}` });
          }}
        >
          <ButtonText>Share invite code</ButtonText>
        </Button>

        <Button  onPress={() => setConfirmOut(true)} className="btn mt-2">
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
