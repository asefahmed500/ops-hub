import { useState } from "react";
import { Modal, Platform, Pressable, ScrollView, Share } from "react-native";
import { useAuth } from "@/lib/auth";
import { useMto } from "@/lib/mto";
import { api } from "@/lib/api";
import { ProgressBar, SectionHeader } from "@/components/mto-bits";
import { ScreenLoading, ScreenError } from "@/components/screen-state";
import { Button, ButtonText } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Box } from "@/components/ui/box";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { Text } from "@/components/ui/text";
import { Heading } from "@/components/ui/heading";
import { Input, InputField } from "@/components/ui/input";

export default function GrowthScreen() {
  const { token } = useAuth();
  const { goals, mentorNotes, addGoal, goalProgress, me, ready, error, refresh } = useMto();
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [exporting, setExporting] = useState(false);

  if (error) return <ScreenError message={error} onRetry={() => void refresh()} />;
  if (!ready) return <ScreenLoading label="Loading growth…" />;

  const exportCsv = async () => {
    if (!token || exporting) return;
    setExporting(true);
    try {
      const res = await api<{ filename: string; content: string }>("/reports/export", { token });
      if (Platform.OS === "web") {
        const blob = new Blob([res.content], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = res.filename;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        await Share.share({ title: res.filename, message: res.content.slice(0, 4000) });
      }
    } finally {
      setExporting(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="p-4 pb-16">
      <Box className="mx-auto w-full max-w-md">
        <Text size="xs" className="font-normal text-muted-foreground">
          Goals & feedback
        </Text>
        <Heading size="xl" className="mt-0.5 text-foreground">
          Growth
        </Heading>

        <SectionHeader title="Learning goals" actionLabel="+ Add" onAction={() => setAdding(true)} />
        <VStack space="sm">
          {goals.length === 0 ? (
            <Card>
              <Text size="sm" className="font-normal text-muted-foreground">
                No goals yet — add your first learning goal.
              </Text>
            </Card>
          ) : (
            goals.map((g) => (
              <Card key={g.id}>
                <HStack space="sm" className="justify-between">
                  <Text weight="medium" className="flex-1 text-foreground">
                    {g.title}
                  </Text>
                  <Text size="sm" className="text-muted-foreground">
                    {g.progress}%
                  </Text>
                </HStack>
                <ProgressBar value={g.progress} className="mt-2" />
                {g.progress < 100 ? (
                  <Button className="btn mt-3 self-start border border-border bg-transparent px-3" onPress={() => void goalProgress(g.id, 10)}>
                    <ButtonText>+10% progress</ButtonText>
                  </Button>
                ) : (
                  <Text size="xs" className="mt-2 text-success">
                    Completed
                  </Text>
                )}
              </Card>
            ))
          )}
        </VStack>

        <SectionHeader title="Mentor notes" />
        <VStack space="sm">
          {mentorNotes.length === 0 ? (
            <Card>
              <Text size="sm" className="font-normal text-muted-foreground">
                Notes from your supervisor will appear here.
              </Text>
            </Card>
          ) : (
            mentorNotes.map((n) => (
              <Card key={n.id}>
                <Text className="leading-5 text-foreground">“{n.text}”</Text>
                <Text size="xs" className="mt-2 font-normal text-muted-foreground">
                  {n.authorName} · {new Date(n.at).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
                </Text>
              </Card>
            ))
          )}
        </VStack>

        {me.role === "trainee" ? (
          <Button  className="btn mt-6" onPress={() => void exportCsv()} disabled={exporting}>
            <ButtonText>{exporting ? "Preparing…" : "Export my logs (CSV)"}</ButtonText>
          </Button>
        ) : null}
      </Box>

      <Modal visible={adding} transparent animationType="slide" onRequestClose={() => setAdding(false)}>
        <Pressable className="flex-1 justify-end bg-black/40" onPress={() => setAdding(false)}>
          <Pressable className="rounded-t-3xl border-t border-border bg-background p-4 pb-10">
            <Box className="mx-auto mb-4 h-1 w-9 rounded-full bg-border" />
            <Heading size="md" className="text-foreground">
              New learning goal
            </Heading>
            <Input className="mt-4">
              <InputField value={title} onChangeText={setTitle} placeholder="e.g. Presentation skills" />
            </Input>
            <Button
              onPress={async () => {
                if (!title.trim()) return;
                await addGoal(title.trim());
                setTitle("");
                setAdding(false);
              }}
              className="btn mt-4"
              disabled={!title.trim()}
            >
              <ButtonText>Add goal</ButtonText>
            </Button>
          </Pressable>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}
