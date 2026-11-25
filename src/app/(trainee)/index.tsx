import { useState } from "react";
import { Modal, Pressable, ScrollView } from "react-native";
import { router } from "expo-router";
import { useMto } from "@/lib/mto";
import { ProgressBar, SectionHeader, StatCard, CheckRow } from "@/components/mto-bits";
import { ScreenLoading, ScreenError } from "@/components/screen-state";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonText } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Box } from "@/components/ui/box";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { Text } from "@/components/ui/text";
import { Heading } from "@/components/ui/heading";
import { Input, InputField } from "@/components/ui/input";

export default function TraineeHome() {
  const { me, rotations, logs, tasks, addTask, toggleTask, ready, error, refresh } = useMto();
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [due, setDue] = useState("Today");
  const [busy, setBusy] = useState(false);

  if (error) return <ScreenError message={error} onRetry={() => void refresh()} />;
  if (!ready || !me) return <ScreenLoading label="Loading your programme…" />;

  const active = rotations.find((r) => r.status === "active");
  const activeObj = active?.objectives ?? [];
  const rotationPct = activeObj.length
    ? Math.round((activeObj.filter((o) => o.done).length / activeObj.length) * 100)
    : 0;
  const month = new Date().getMonth();
  const logsThisMonth = logs.filter((l) => new Date(l.at).getMonth() === month).length;
  const pending = tasks.filter((t) => !t.done);

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="p-4 pb-16">
      <Box className="mx-auto w-full max-w-md">
        <Text size="xs" className="font-normal text-muted-foreground">
          {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "2-digit", month: "long" })} · MTO ·{" "}
          {me.dept || me.companyName}
        </Text>

        {active ? (
          <Card className="mt-3">
            <HStack space="sm" className="justify-between">
              <Text weight="medium" className="flex-1 text-foreground">
                Rotation {rotations.indexOf(active) + 1} · {active.name}
              </Text>
              <Badge  variant="success">
                Week {Math.min(rotations.indexOf(active) + 1, 8)}/{rotations.length * 2}
              </Badge>
            </HStack>
            <Text size="xs" className="mt-1 font-normal text-muted-foreground">
              {active.window} · {activeObj.length} objectives
            </Text>
            <ProgressBar value={rotationPct} className="mt-2.5" />
          </Card>
        ) : (
          <Card className="mt-3">
            <Text className="text-foreground">No active rotation right now.</Text>
          </Card>
        )}

        <HStack space="md" className="mt-3">
          <StatCard label="Logs this month" value={logsThisMonth} />
          <StatCard label="Tasks pending" value={pending.length} tone={pending.length ? "warn" : undefined} />
        </HStack>

        <SectionHeader title="Tasks" />
        <VStack space="sm">
          {tasks.map((t) => (
            <CheckRow
              key={t.id}
              done={t.done}
              label={t.title}
              sub={t.due}
              onToggle={() => void toggleTask(t.id, !t.done)}
            />
          ))}
        </VStack>

        <Button className="btn mt-3 self-start px-3" onPress={() => setAdding(true)}>
          <ButtonText>+ Add task</ButtonText>
        </Button>

        <Button onPress={() => router.push("/(trainee)/log" as never)} className="btn mt-6">
          <ButtonText>+ Add today's log</ButtonText>
        </Button>
      </Box>

      <Modal visible={adding} transparent animationType="slide" onRequestClose={() => setAdding(false)}>
        <Pressable className="flex-1 justify-end bg-black/40" onPress={() => setAdding(false)}>
          <Pressable className="rounded-t-3xl border-t border-border bg-background p-4 pb-10">
            <Box className="mx-auto mb-4 h-1 w-9 rounded-full bg-border" />
            <Heading size="md" className="text-foreground">New task</Heading>
            <Input className="mt-4">
              <InputField
                value={title}
                onChangeText={setTitle}
                placeholder="Task title (e.g. Send weekly report)"
              />
            </Input>
            <Input className="mt-2">
              <InputField value={due} onChangeText={setDue} placeholder="Due (e.g. Today, 5 PM)" />
            </Input>
            <Button
              className="btn mt-4"
              disabled={busy || !title.trim()}
              onPress={async () => {
                if (!title.trim() || busy) return;
                setBusy(true);
                try {
                  await addTask(title.trim(), due.trim() || "Today");
                  setTitle("");
                  setDue("Today");
                  setAdding(false);
                } finally {
                  setBusy(false);
                }
              }}
            >
              <ButtonText>{busy ? "Saving…" : "Add task"}</ButtonText>
            </Button>
            <Button className="btn mt-2" onPress={() => setAdding(false)}>
              <ButtonText className="text-foreground">Cancel</ButtonText>
            </Button>
          </Pressable>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}
