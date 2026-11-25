import { useState } from "react";
import { Pressable, ScrollView } from "react-native";
import { Modal } from "react-native";
import { useMto } from "@/lib/mto";
import { SectionHeader } from "@/components/mto-bits";
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

const TAGS = ["Marketing", "Reporting", "Dealers", "Analysis", "Finance", "Operations"];

export default function LogScreen() {
  const { logs, saveLog, deleteLog, ready, error, refresh } = useMto();
  const [text, setText] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  if (error) return <ScreenError message={error} onRetry={() => void refresh()} />;
  if (!ready) return <ScreenLoading label="Loading logs…" />;

  const open = logs.find((l) => l.id === openId) ?? null;

  const submit = async () => {
    if (!text.trim() || busy) return;
    setBusy(true);
    try {
      await saveLog(text.trim(), tags);
      setText("");
      setTags([]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-background" keyboardShouldPersistTaps="handled" contentContainerClassName="p-4 pb-16">
      <Box className="mx-auto w-full max-w-md">
        <Text size="xs" className="font-normal text-muted-foreground">
          Daily work log
        </Text>
        <Heading size="xl" className="mt-0.5 text-foreground">
          Log
        </Heading>

        <Text size="xs" weight="medium" className="mb-1.5 mt-4 text-muted-foreground">
          What did you work on?
        </Text>
        <Input className="min-h-24 items-start py-3">
          <InputField
            multiline
            textAlignVertical="top"
            value={text}
            onChangeText={setText}
            placeholder="Prepared the campaign report…"
          />
        </Input>

        <Text size="xs" weight="medium" className="mb-2 mt-4 text-muted-foreground">
          Tags
        </Text>
        <HStack className="flex-wrap gap-2">
          {TAGS.map((t) => {
            const on = tags.includes(t);
            return (
              <Pressable
                key={t}
                onPress={() => setTags((p) => (on ? p.filter((x) => x !== t) : [...p, t]))}
                className={`rounded-full px-3.5 py-2 ${on ? "bg-accent" : "bg-secondary"}`}
              >
                <Text size="xs" className={on ? "text-accent-foreground" : "text-secondary-foreground"}>
                  {t}
                </Text>
              </Pressable>
            );
          })}
        </HStack>

        <Button onPress={submit} disabled={busy || !text.trim()} className={`btn mt-5 ${busy || !text.trim() ? "opacity-60" : ""}`}>
          <ButtonText>{busy ? "Saving…" : "Save log"}</ButtonText>
        </Button>

        <SectionHeader title="Recent" />
        <VStack space="sm">
          {logs.map((l) => (
            <Pressable key={l.id} onPress={() => setOpenId(l.id)} className="active:opacity-80">
              <Card>
                <HStack space="sm" className="justify-between">
                  <Text weight="medium" className="flex-1 text-foreground" numberOfLines={2}>
                    {l.text}
                  </Text>
                  <Text size="2xs" className="font-normal text-muted-foreground">
                    {new Date(l.at).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
                  </Text>
                </HStack>
                <HStack className="mt-2 flex-wrap gap-1.5">
                  {l.tags.map((t) => (
                    <Badge key={t} size="sm" variant="success">
                      {t}
                    </Badge>
                  ))}
                </HStack>
              </Card>
            </Pressable>
          ))}
        </VStack>
      </Box>

      <Modal visible={!!open} transparent animationType="slide" onRequestClose={() => setOpenId(null)}>
        <Pressable className="flex-1 justify-end bg-black/40" onPress={() => setOpenId(null)}>
          <Pressable className="rounded-t-3xl border-t border-border bg-background p-4 pb-10">
            <Box className="mx-auto mb-4 h-1 w-9 rounded-full bg-border" />
            {open ? (
              <>
                <Heading size="md" className="text-foreground">
                  Log entry
                </Heading>
                <Text className="mt-3 leading-5 text-foreground">{open.text}</Text>
                <Text size="xs" className="mt-2 font-normal text-muted-foreground">
                  {new Date(open.at).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                </Text>
                <Button
                  
                  onPress={async () => {
                    await deleteLog(open.id);
                    setOpenId(null);
                  }}
                  className="btn mt-5 border-destructive/40"
                >
                  <ButtonText className="text-destructive">Delete log</ButtonText>
                </Button>
                <Button onPress={() => setOpenId(null)} className="btn mt-2">
                  <ButtonText>Close</ButtonText>
                </Button>
              </>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}
