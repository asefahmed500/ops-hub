import { useMemo, useState } from "react";
import { FlatList, Modal, Pressable } from "react-native";
import { useMto } from "@/lib/mto";
import { useAuth } from "@/lib/auth";
import { ProgressBar, StatCard } from "@/components/mto-bits";
import { ScreenLoading, ScreenError } from "@/components/screen-state";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonText } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, InputField } from "@/components/ui/input";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { Text } from "@/components/ui/text";
import { Heading } from "@/components/ui/heading";
import { Box } from "@/components/ui/box";
import { Avatar } from "@/components/avatar";

function initials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function TraineesScreen() {
  const { trainees, ready, error, refresh, sendReminder, createReview } = useMto();
  const { me, programme } = useMto();
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [newReview, setNewReview] = useState(false);
  const [rTrainee, setRTrainee] = useState<string | null>(null);
  const [rKind, setRKind] = useState("evaluation");
  const [rDue, setRDue] = useState("Due Fri");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return trainees;
    return trainees.filter((t) => t.name.toLowerCase().includes(query) || t.dept.toLowerCase().includes(query));
  }, [trainees, q]);

  if (error) return <ScreenError message={error} onRetry={() => void refresh()} />;
  if (!ready) return <ScreenLoading label="Loading trainees…" />;

  const open = trainees.find((t) => t.id === openId) ?? null;

  return (
    <Box className="flex-1 bg-background">
      <VStack space="sm" className="border-b border-border px-4 py-3">
        <Text size="xs" className="font-normal text-muted-foreground">
          {activeCount(trainees)} active
        </Text>
        <Input>
          <InputField value={q} onChangeText={setQ} placeholder="Search trainee or department" />
        </Input>
      </VStack>

      {error ? null : null}
      <FlatList
        data={filtered}
        keyExtractor={(t) => t.id}
        contentContainerClassName="p-4 gap-2.5 pb-16"
        renderItem={({ item: t }) => (
          <Pressable onPress={() => setOpenId(t.id)} className="active:opacity-80">
            <Card>
              <HStack space="md" className="justify-between">
                <HStack space="md" className="flex-1">
                  <Avatar name={t.name} size={38} />
                  <VStack space="xs" className="flex-1">
                    <Text weight="medium" className="text-foreground">
                      {t.name}
                    </Text>
                    <Text size="xs" className="font-normal text-muted-foreground">
                      {t.dept} · Wk {t.week}
                    </Text>
                  </VStack>
                </HStack>
                <Badge size="sm" variant={t.progress < 30 ? "warning" : "success"}>
                  {t.progress}%
                </Badge>
              </HStack>
              <ProgressBar value={t.progress} className="mt-2.5" />
            </Card>
          </Pressable>
        )}
        ListEmptyComponent={
          <Box className="items-center py-16">
            <Text size="sm" className="font-normal text-muted-foreground">
              No trainees yet — share the invite code from Settings.
            </Text>
          </Box>
        }
      />

      <Pressable
        onPress={() => setNewReview(true)}
        className="absolute bottom-6 right-5 h-14 w-14 items-center justify-center rounded-full bg-primary shadow-lg active:opacity-90"
      >
        <Text className="text-2xl text-primary-foreground">+</Text>
      </Pressable>

      {/* Trainee detail sheet */}
      <Modal visible={!!open} transparent animationType="slide" onRequestClose={() => setOpenId(null)}>
        <Pressable className="flex-1 justify-end bg-black/40" onPress={() => setOpenId(null)}>
          <Pressable className="rounded-t-3xl border-t border-border bg-background p-4 pb-10">
            <Box className="mx-auto mb-4 h-1 w-9 rounded-full bg-border" />
            {open ? (
              <>
                <HStack space="md">
                  <Avatar name={open.name} size={46} />
                  <VStack space="xs" className="flex-1">
                    <Heading size="md" className="text-foreground">
                      {open.name}
                    </Heading>
                    <Text size="xs" className="font-normal text-muted-foreground">
                      {open.dept} · Wk {open.week} · {open.email}
                    </Text>
                  </VStack>
                </HStack>
                <Card className="mt-4">
                  <HStack space="sm" className="justify-between">
                    <Text className="text-foreground">Overall progress</Text>
                    <Text weight="medium" className="text-foreground">
                      {open.progress}%
                    </Text>
                  </HStack>
                  <ProgressBar value={open.progress} className="mt-2" />
                </Card>
                <Button
                  onPress={async () => {
                    await sendReminder(open.id);
                    setNotice(`Reminder sent to ${open.name.split(" ")[0]}`);
                    setOpenId(null);
                  }}
                  className="btn mt-4"
                >
                  <ButtonText>Send reminder</ButtonText>
                </Button>
                <Button  onPress={() => setOpenId(null)} className="btn mt-2">
                  <ButtonText className="text-foreground">Close</ButtonText>
                </Button>
              </>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>

      {/* New review sheet */}
      <Modal visible={newReview} transparent animationType="slide" onRequestClose={() => setNewReview(false)}>
        <Pressable className="flex-1 justify-end bg-black/40" onPress={() => setNewReview(false)}>
          <Pressable className="rounded-t-3xl border-t border-border bg-background p-4 pb-10">
            <Box className="mx-auto mb-4 h-1 w-9 rounded-full bg-border" />
            <Heading size="md" className="text-foreground">
              New review
            </Heading>
            <VStack space="sm" className="mt-4">
              <Input>
                <InputField placeholder="Search handled below" value={rTrainee ?? ""} onChangeText={setRTrainee} />
              </Input>
              <HStack className="flex-wrap gap-2">
                {trainees.slice(0, 8).map((t) => (
                  <Pressable
                    key={t.id}
                    onPress={() => setRTrainee(t.id)}
                    className={`rounded-full px-3 py-1.5 ${rTrainee === t.id ? "bg-primary" : "bg-secondary"}`}
                  >
                    <Text size="xs" className={rTrainee === t.id ? "text-primary-foreground" : "text-secondary-foreground"}>
                      {t.name}
                    </Text>
                  </Pressable>
                ))}
              </HStack>
              <Input>
                <InputField value={rKind} onChangeText={setRKind} placeholder="Review kind (e.g. mid-term)" />
              </Input>
              <Input>
                <InputField value={rDue} onChangeText={setRDue} placeholder="Due (e.g. Due Fri)" />
              </Input>
              <Button
                onPress={async () => {
                  if (!rTrainee || busy) return;
                  setBusy(true);
                  try {
                    await createReview(rTrainee, trainees.find((t) => t.id === rTrainee)?.dept ?? "General", rKind, rDue);
                    setNewReview(false);
                    setRTrainee(null);
                  } finally {
                    setBusy(false);
                  }
                }}
                className="btn mt-2"
                disabled={!rTrainee || busy}
              >
                <ButtonText>{busy ? "Creating…" : "Create review"}</ButtonText>
              </Button>
            </VStack>
          </Pressable>
        </Pressable>
      </Modal>

      <ConfirmNotice notice={notice} onClose={() => setNotice(null)} />
      {me.role === "hr" && programme ? null : null}
    </Box>
  );
}

function activeCount(trainees: { active: boolean }[]): number {
  return trainees.filter((t) => t.active).length;
}

function ConfirmNotice({ notice, onClose }: { notice: string | null; onClose: () => void }) {
  return (
    <Modal visible={!!notice} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable className="flex-1 items-center justify-center bg-black/40 p-6" onPress={onClose}>
        <Box className="w-full max-w-xs rounded-xl border border-border bg-card p-4">
          <Text className="text-center text-foreground">{notice}</Text>
        </Box>
      </Pressable>
    </Modal>
  );
}
